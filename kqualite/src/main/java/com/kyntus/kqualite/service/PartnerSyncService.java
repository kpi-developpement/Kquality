package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Role;
import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ExternalTicDTO;
import com.kyntus.kqualite.repository.PartenaireRepository;
import com.kyntus.kqualite.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerSyncService {

    private final PartenaireRepository partenaireRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String EXTERNAL_API_URL = "https://kyntus.fr/loadListeTICCQ.php";

    @Transactional
    public void syncPartnersFromExternalApi() {
        log.info("🚀 Démarrage de la synchronisation des partenaires depuis l'API externe...");
        RestTemplate restTemplate = new RestTemplate();

        try {
            ResponseEntity<List<ExternalTicDTO>> response = restTemplate.exchange(
                    EXTERNAL_API_URL,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ExternalTicDTO>>() {}
            );

            List<ExternalTicDTO> tics = response.getBody();
            if (tics == null || tics.isEmpty()) {
                log.warn("⚠️ L'API externe n'a retourné aucune donnée.");
                return;
            }

            // 1. Groupement des techniciens par Entreprise
            Map<String, List<ExternalTicDTO>> ticsByEntreprise = tics.stream()
                    .filter(t -> t.getEntreprise() != null && !t.getEntreprise().trim().isEmpty())
                    .collect(Collectors.groupingBy(t -> t.getEntreprise().trim()));

            log.info("🔍 {} entreprises trouvées dans l'API. Filtrage des entreprises ACTIVES...", ticsByEntreprise.size());

            int countActifs = 0;

            // 2. Boucler 3la les entreprises
            for (Map.Entry<String, List<ExternalTicDTO>> entry : ticsByEntreprise.entrySet()) {
                String nomEntreprise = entry.getKey();
                List<ExternalTicDTO> techniciens = entry.getValue();

                // 🛡️ L'FIX HWA HNA: Vérifier si au moins un technicien est ACTIF
                boolean hasActif = techniciens.stream()
                        .anyMatch(t -> t.getEtat() != null && t.getEtat().trim().equalsIgnoreCase("ACTIF"));

                // Ila makayn 7ta technicien ACTIF, kan-skippiw had l'entreprise
                if (!hasActif) {
                    continue;
                }

                countActifs++;

                // A. Création du Partenaire (Unique b l'Reference Contrat)
                String cleanName = nomEntreprise.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                String refContrat = "AUTO-" + cleanName;

                Partenaire partenaire = partenaireRepository.findByReferenceContrat(refContrat)
                        .orElseGet(() -> {
                            log.info("✨ Nouveau partenaire ACTIF détecté : {}", nomEntreprise);
                            Partenaire p = Partenaire.builder()
                                    .nomEntreprise(nomEntreprise)
                                    .referenceContrat(refContrat)
                                    .build();
                            return partenaireRepository.save(p);
                        });

                // B. Création du Compte Utilisateur
                String email = "admin@" + cleanName.toLowerCase() + ".kyntus.com";

                if (utilisateurRepository.findByEmail(email).isEmpty()) {
                    log.info("👤 Création du compte pour le partenaire : {}", email);

                    String defaultPassword = cleanName.toLowerCase() + "2026!";

                    Utilisateur user = Utilisateur.builder()
                            .email(email)
                            .motDePasse(passwordEncoder.encode(defaultPassword))
                            .role(Role.PARTENAIRE)
                            .actif(true)
                            .mustChangePassword(true) // Forcer le changement de mot de passe
                            .partenaire(partenaire)
                            .permissions(Arrays.asList("READ_DASHBOARD", "READ_ERREURS", "CREATE_CONTESTATION"))
                            .build();

                    utilisateurRepository.save(user);
                }
            }

            log.info("✅ Synchronisation terminée avec succès ! {} partenaires ACTIFS traités.", countActifs);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la synchronisation : {}", e.getMessage());
        }
    }
}