package com.kyntus.kqualite.config;

import com.kyntus.kqualite.domain.*;
import com.kyntus.kqualite.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final PartenaireRepository partenaireRepository;
    private final UtilisateurRepository utilisateurRepository; // <-- JDID
    private final TechnicienRepository technicienRepository;
    private final DossierRepository dossierRepository;
    private final RegleQualiteRepository regleQualiteRepository;
    private final ErreurRepository erreurRepository;
    private final ResultatCQRepository resultatCQRepository;

    @Override
    public void run(String... args) throws Exception {
        // N-checkiw wach la base de données khawya
        if (partenaireRepository.count() == 0) {

            // 1. Création dyal Partenaire
            Partenaire partenaire = Partenaire.builder()
                    .nomEntreprise("ASTR Telecom")
                    .referenceContrat("CONTRAT-ASTR-001")
                    .build();
            partenaireRepository.save(partenaire);

            // --- JDID : Création dyal Utilisateur li ghay-dir l'contestation ---
            Utilisateur utilisateur = Utilisateur.builder()
                    .email("contact@astr.com")
                    .motDePasse("password123")
                    .role(Role.RESPONSABLE_PARTENAIRE)
                    .actif(true)
                    .partenaire(partenaire)
                    .build();
            utilisateurRepository.save(utilisateur);

            // 2. Création dyal Technicien
            Technicien technicien = Technicien.builder()
                    .matricule("TECH-0482")
                    .nomComplet("Mohamed Benali")
                    .agence("Oujda Centre")
                    .partenaire(partenaire)
                    .build();
            technicienRepository.save(technicien);

            // 3. Création dyal Dossier
            Dossier dossier = Dossier.builder()
                    .referenceID("EPS-0018290642")
                    .dateIntervention(LocalDateTime.now().minusDays(3))
                    .typePrestation("Installation Fibre")
                    .technicien(technicien)
                    .build();
            dossierRepository.save(dossier);

            // 4. Création dyal Règle Qualité
            RegleQualite regle = RegleQualite.builder()
                    .codeRegle("REG-PHOTO-PTO")
                    .description("Photo PTO non conforme")
                    .penaliteUnitaire(120.0)
                    .objectifSeuil(95.0)
                    .build();
            regleQualiteRepository.save(regle);

            // 5. Création dyal Erreur
            Erreur erreur = Erreur.builder()
                    .dateDetection(LocalDateTime.now())
                    .impactEstime(120.0)
                    .statut(StatutErreur.NOUVEAU)
                    .echeanceContestation(LocalDateTime.now().plusDays(2))
                    .dossier(dossier)
                    .regleQualite(regle)
                    .build();
            erreurRepository.save(erreur);

            // 6. Création dyal Résultat CQ w Pénalité
            ResultatCQ resultat = ResultatCQ.builder()
                    .periodeMois("2026-08")
                    .scoreActuel(92.6)
                    .objectifGlobal(95.0)
                    .partenaire(partenaire)
                    .build();

            Penalite penalite = Penalite.builder()
                    .periodeMois("2026-08")
                    .montantTotal(7316.0)
                    .statut(StatutPenalite.ESTIMEE)
                    .resultatCQ(resultat)
                    .build();

            resultat.setPenalite(penalite);
            resultatCQRepository.save(resultat);

            System.out.println("✅ Data insérée avec succès ! (Utilisateur ID = " + utilisateur.getId() + ")");
        }
    }
}