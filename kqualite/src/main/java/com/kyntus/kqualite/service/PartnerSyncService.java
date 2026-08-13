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
import java.util.Set;
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

            // 1. Extraire les noms d'entreprises uniques (Ignorer les vides)
            Set<String> entreprisesUniques = tics.stream()
                    .map(ExternalTicDTO::getEntreprise)
                    .filter(e -> e != null && !e.trim().isEmpty())
                    .map(String::trim)
                    .collect(Collectors.toSet());

            log.info("🔍 {} entreprises uniques trouvées dans l'API.", entreprisesUniques.size());

            // 2. Boucler 3la les entreprises w n-creyiw l'Partenaire w l'Utilisateur ila makanoch
            for (String nomEntreprise : entreprisesUniques) {

                // A. Création du Partenaire
                Partenaire partenaire = partenaireRepository.findByNomEntrepriseIgnoreCase(nomEntreprise)
                        .orElseGet(() -> {
                            log.info("✨ Nouveau partenaire détecté : {}", nomEntreprise);
                            Partenaire p = Partenaire.builder()
                                    .nomEntreprise(nomEntreprise)
                                    .referenceContrat("AUTO-" + nomEntreprise.replaceAll("\\s+", "").toUpperCase())
                                    .build();
                            return partenaireRepository.save(p);
                        });

                // B. Création du Compte Utilisateur (Admin du partenaire)
                // Format dyal l'email: admin@<nom_entreprise_sans_espace>.kyntus.com
                String cleanName = nomEntreprise.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                String email = "admin@" + cleanName + ".kyntus.com";

                if (utilisateurRepository.findByEmail(email).isEmpty()) {
                    log.info("👤 Création du compte pour le partenaire : {}", email);

                    // Mot de passe par défaut: NomEntreprise2026!
                    String defaultPassword = cleanName + "2026!";

                    Utilisateur user = Utilisateur.builder()
                            .email(email)
                            .motDePasse(passwordEncoder.encode(defaultPassword))
                            .role(Role.PARTENAIRE)
                            .actif(true)
                            .mustChangePassword(true) // 🛡️ FORCER LE CHANGEMENT DE MOT DE PASSE
                            .partenaire(partenaire)
                            .permissions(Arrays.asList("READ_DASHBOARD", "READ_ERREURS", "CREATE_CONTESTATION"))
                            .build();

                    utilisateurRepository.save(user);
                }
            }

            log.info("✅ Synchronisation terminée avec succès !");

        } catch (Exception e) {
            log.error("❌ Erreur lors de la synchronisation : {}", e.getMessage());
        }
    }
}