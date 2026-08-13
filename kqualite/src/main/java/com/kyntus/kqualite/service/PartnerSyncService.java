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

            Set<String> entreprisesUniques = tics.stream()
                    .map(ExternalTicDTO::getEntreprise)
                    .filter(e -> e != null && !e.trim().isEmpty())
                    .map(String::trim)
                    .collect(Collectors.toSet());

            log.info("🔍 {} entreprises trouvées dans l'API. Traitement en cours...", entreprisesUniques.size());

            for (String nomEntreprise : entreprisesUniques) {

                // 🛡️ L'FIX HWA HNA: Kan-n9iw l'nom mn ay symbole awla espace bach n-creyiw ID Unique w N9i
                String cleanName = nomEntreprise.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                String refContrat = "AUTO-" + cleanName;

                // Kan-9elbou b l'Reference Contrat machi b l'Nom, bach n-tfadaw les doublons
                Partenaire partenaire = partenaireRepository.findByReferenceContrat(refContrat)
                        .orElseGet(() -> {
                            log.info("✨ Nouveau partenaire détecté : {}", nomEntreprise);
                            Partenaire p = Partenaire.builder()
                                    .nomEntreprise(nomEntreprise)
                                    .referenceContrat(refContrat)
                                    .build();
                            return partenaireRepository.save(p);
                        });

                // Création du Compte Utilisateur
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

            log.info("✅ Synchronisation terminée avec succès !");

        } catch (Exception e) {
            log.error("❌ Erreur lors de la synchronisation : {}", e.getMessage());
        }
    }
}