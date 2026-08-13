package com.kyntus.kqualite.config;

import com.kyntus.kqualite.domain.*;
import com.kyntus.kqualite.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final PartenaireRepository partenaireRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TechnicienRepository technicienRepository;
    private final DossierRepository dossierRepository;
    private final RegleQualiteRepository regleQualiteRepository;
    private final ErreurRepository erreurRepository;
    private final ResultatCQRepository resultatCQRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        Partenaire partenaire;

        // 1. Création dyal Partenaire w Data l9dima (Ila makantch)
        if (partenaireRepository.count() == 0) {
            partenaire = Partenaire.builder()
                    .nomEntreprise("ASTR Telecom")
                    .referenceContrat("CONTRAT-ASTR-001")
                    .build();
            partenaireRepository.save(partenaire);

            Technicien technicien = Technicien.builder().matricule("TECH-0482").nomComplet("Mohamed Benali").agence("Oujda Centre").partenaire(partenaire).build();
            technicienRepository.save(technicien);

            Dossier dossier = Dossier.builder().referenceID("EPS-0018290642").dateIntervention(LocalDateTime.now().minusDays(3)).typePrestation("Installation Fibre").technicien(technicien).build();
            dossierRepository.save(dossier);

            RegleQualite regle = RegleQualite.builder().codeRegle("REG-PHOTO-PTO").description("Photo PTO non conforme").penaliteUnitaire(120.0).objectifSeuil(95.0).build();
            regleQualiteRepository.save(regle);

            Erreur erreur = Erreur.builder().dateDetection(LocalDateTime.now()).impactEstime(120.0).statut(StatutErreur.NOUVEAU).echeanceContestation(LocalDateTime.now().plusDays(2)).dossier(dossier).regleQualite(regle).build();
            erreurRepository.save(erreur);

            ResultatCQ resultat = ResultatCQ.builder().periodeMois("2026-08").scoreActuel(92.6).objectifGlobal(95.0).partenaire(partenaire).build();
            Penalite penalite = Penalite.builder().periodeMois("2026-08").montantTotal(7316.0).statut(StatutPenalite.ESTIMEE).resultatCQ(resultat).build();
            resultat.setPenalite(penalite);
            resultatCQRepository.save(resultat);

            System.out.println("✅ Données de base (Partenaire, Dossiers, Erreurs) insérées avec succès !");
        } else {
            // Ila kan l'Partenaire deja kayn, njbdouh bach n-ls9ouh m3a l'Utilisateur
            partenaire = partenaireRepository.findAll().get(0);
        }

        // 2. 🛡️ L'FIX HWA HNA: Création dyal les Utilisateurs (Ila makanoch)
        if (utilisateurRepository.count() == 0) {

            // Compte Partenaire
            Utilisateur userPartenaire = Utilisateur.builder()
                    .email("partenaire@astr.com")
                    .motDePasse(passwordEncoder.encode("password123"))
                    .role(Role.PARTENAIRE)
                    .actif(true)
                    .partenaire(partenaire)
                    .permissions(Arrays.asList("READ_DASHBOARD", "READ_ERREURS", "CREATE_CONTESTATION"))
                    .build();
            utilisateurRepository.save(userPartenaire);

            // Compte Admin Kyntus
            Utilisateur userAdmin = Utilisateur.builder()
                    .email("admin@kyntus.com")
                    .motDePasse(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .actif(true)
                    .permissions(Arrays.asList("READ_GLOBAL_KPI", "MANAGE_USERS", "MANAGE_ROLES"))
                    .build();
            utilisateurRepository.save(userAdmin);

            // Compte Pilote
            Utilisateur userPilote = Utilisateur.builder()
                    .email("pilote@kyntus.com")
                    .motDePasse(passwordEncoder.encode("pilote123"))
                    .role(Role.PILOTE)
                    .actif(true)
                    .permissions(Arrays.asList("READ_CONTESTATIONS", "TRAITER_CONTESTATION"))
                    .build();
            utilisateurRepository.save(userPilote);

            System.out.println("✅ Comptes Utilisateurs (Admin, Pilote, Partenaire) créés avec succès !");
        }
    }
}