package com.kyntus.kqualite.config;

import com.kyntus.kqualite.domain.*;
import com.kyntus.kqualite.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

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

        // 1. Gérer le Partenaire (Création ou Récupération)
        Partenaire partenaire = partenaireRepository.findByReferenceContrat("CONTRAT-ASTR-001")
                .orElseGet(() -> {
                    Partenaire p = Partenaire.builder()
                            .nomEntreprise("ASTR Telecom")
                            .referenceContrat("CONTRAT-ASTR-001")
                            .build();
                    return partenaireRepository.save(p);
                });

        // 2. Gérer les fausses données (Dossiers, Erreurs...)
        if (technicienRepository.count() == 0) {
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
        }

        // 3. 🛡️ THE GRANDMASTER FIX: Forcer la création ou la MISE À JOUR des mots de passe
        createOrUpdateUser("partenaire@astr.com", "password123", Role.PARTENAIRE, partenaire, Arrays.asList("READ_DASHBOARD", "READ_ERREURS", "CREATE_CONTESTATION"));
        createOrUpdateUser("admin@kyntus.com", "admin123", Role.ADMIN, null, Arrays.asList("READ_GLOBAL_KPI", "MANAGE_USERS", "MANAGE_ROLES"));
        createOrUpdateUser("pilote@kyntus.com", "pilote123", Role.PILOTE, null, Arrays.asList("READ_CONTESTATIONS", "TRAITER_CONTESTATION"));

        System.out.println("✅ DataSeeder a terminé son exécution. Les comptes sont prêts et les mots de passe sont hachés !");
    }

    // Fonction d'aide bach t-creyi wla t-mettri à jour l'utilisateur
    private void createOrUpdateUser(String email, String password, Role role, Partenaire partenaire, List<String> permissions) {
        Utilisateur user = utilisateurRepository.findByEmail(email).orElse(new Utilisateur());

        user.setEmail(email);
        // Hna kan-forciw l'Hachage dyal l'mot de passe dima!
        user.setMotDePasse(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActif(true);
        user.setPartenaire(partenaire);
        user.setPermissions(permissions);

        utilisateurRepository.save(user);
    }
}