package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Role;
import com.kyntus.kqualite.domain.Technicien;
import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ExternalTicDTO;
import com.kyntus.kqualite.repository.PartenaireRepository;
import com.kyntus.kqualite.repository.TechnicienRepository;
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
    private final TechnicienRepository technicienRepository; // 🛡️ JDID
    private final PasswordEncoder passwordEncoder;

    private static final String EXTERNAL_API_URL = "https://kyntus.fr/loadListeTICCQ.php";

    @Transactional
    public void syncPartnersFromExternalApi() {
        log.info("🚀 Démarrage de la synchronisation des partenaires et techniciens...");
        RestTemplate restTemplate = new RestTemplate();

        try {
            ResponseEntity<List<ExternalTicDTO>> response = restTemplate.exchange(
                    EXTERNAL_API_URL, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<ExternalTicDTO>>() {}
            );

            List<ExternalTicDTO> tics = response.getBody();
            if (tics == null || tics.isEmpty()) return;

            Map<String, List<ExternalTicDTO>> ticsByEntreprise = tics.stream()
                    .filter(t -> t.getEntreprise() != null && !t.getEntreprise().trim().isEmpty())
                    .collect(Collectors.groupingBy(t -> t.getEntreprise().trim()));

            for (Map.Entry<String, List<ExternalTicDTO>> entry : ticsByEntreprise.entrySet()) {
                String nomEntreprise = entry.getKey();
                List<ExternalTicDTO> techniciens = entry.getValue();

                boolean hasActif = techniciens.stream().anyMatch(t -> t.getEtat() != null && t.getEtat().trim().equalsIgnoreCase("ACTIF"));
                if (!hasActif) continue;

                String cleanName = nomEntreprise.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                String refContrat = "AUTO-" + cleanName;

                // A. Création Partenaire
                Partenaire partenaire = partenaireRepository.findByReferenceContrat(refContrat)
                        .orElseGet(() -> partenaireRepository.save(Partenaire.builder().nomEntreprise(nomEntreprise).referenceContrat(refContrat).build()));

                // B. Création Utilisateur
                String email = "admin@" + cleanName.toLowerCase() + ".kyntus.com";
                if (utilisateurRepository.findByEmail(email).isEmpty()) {
                    utilisateurRepository.save(Utilisateur.builder()
                            .email(email).motDePasse(passwordEncoder.encode(cleanName.toLowerCase() + "2026!")).role(Role.PARTENAIRE)
                            .actif(true).mustChangePassword(true).partenaire(partenaire)
                            .permissions(Arrays.asList("READ_DASHBOARD", "READ_ERREURS", "CREATE_CONTESTATION")).build());
                }

                // C. 🛡️ L'FIX HWA HNA: Sauvegarde dyal les Techniciens (KYN)
                for (ExternalTicDTO tic : techniciens) {
                    if (tic.getIdTecnow() != null && !tic.getIdTecnow().isEmpty()) {
                        if (technicienRepository.findByMatricule(tic.getIdTecnow()).isEmpty()) {
                            technicienRepository.save(Technicien.builder()
                                    .matricule(tic.getIdTecnow())
                                    .nomComplet(tic.getNomTechnicien() != null ? tic.getNomTechnicien() : "Inconnu")
                                    .partenaire(partenaire)
                                    .build());
                        }
                    }
                }
            }
            log.info("✅ Synchronisation terminée avec succès !");
        } catch (Exception e) { log.error("❌ Erreur lors de la synchronisation : {}", e.getMessage()); }
    }
}