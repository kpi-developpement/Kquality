package com.kyntus.kqualite.config;

import com.kyntus.kqualite.domain.*;
import com.kyntus.kqualite.repository.*;
import com.kyntus.kqualite.service.PartnerSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final PartnerSyncService partnerSyncService; // 🛡️ L'FIX HWA HNA

    @Override
    public void run(String... args) throws Exception {

        // 1. N-lanciou l'Synchronisation mn l'API Kyntus (Ghat-creyi les partenaires w les comptes)
        partnerSyncService.syncPartnersFromExternalApi();

        // 2. N-garantiw anaho l'Admin w l'Pilote dima kaynin
        createOrUpdateUser("admin@kyntus.com", "admin123", Role.ADMIN, Arrays.asList("READ_GLOBAL_KPI", "MANAGE_USERS", "MANAGE_ROLES"));
        createOrUpdateUser("pilote@kyntus.com", "pilote123", Role.PILOTE, Arrays.asList("READ_CONTESTATIONS", "TRAITER_CONTESTATION"));

        System.out.println("✅ DataSeeder a terminé son exécution.");
    }

    private void createOrUpdateUser(String email, String password, Role role, List<String> permissions) {
        Utilisateur user = utilisateurRepository.findByEmail(email).orElse(new Utilisateur());
        user.setEmail(email);
        user.setMotDePasse(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActif(true);
        user.setMustChangePassword(false); // Admin w Pilote ma-m7tajinch y-beddlou
        user.setPermissions(permissions);
        utilisateurRepository.save(user);
    }
}