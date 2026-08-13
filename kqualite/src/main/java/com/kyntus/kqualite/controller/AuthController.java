package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.AuthRequestDTO;
import com.kyntus.kqualite.dto.AuthResponseDTO;
import com.kyntus.kqualite.repository.UtilisateurRepository;
import com.kyntus.kqualite.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(@RequestBody AuthRequestDTO request) {

        // 1. Nettoyage dyal les inputs (T7iyd les espaces zaydin)
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";

        log.info("Tentative de connexion pour l'email: '{}'", email);

        // 2. Njbdou l'utilisateur mn DB manuellement
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("Utilisateur non trouvé f DB: {}", email);
                    return new RuntimeException("Identifiants incorrects (Email introuvable)");
                });

        // 3. Comparaison manuelle dyal l'Mot de passe b BCrypt
        if (!passwordEncoder.matches(password, user.getMotDePasse())) {
            log.error("Mot de passe incorrect pour: {}", email);
            throw new RuntimeException("Identifiants incorrects (Mot de passe erroné)");
        }

        // 4. Vérification wach l'compte m-activé
        if (!user.getActif()) {
            log.error("Compte désactivé pour: {}", email);
            throw new RuntimeException("Ce compte a été désactivé");
        }

        // 5. N-génériw l'Token
        String jwtToken = jwtService.generateToken(user);
        log.info("Connexion réussie pour: {}", email);

        // 6. N-wjdou l'réponse
        AuthResponseDTO response = AuthResponseDTO.builder()
                .token(jwtToken)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .permissions(user.getPermissions())
                .partenaireId(user.getPartenaire() != null ? user.getPartenaire().getId() : null)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Connexion réussie"));
    }

    // 🛠️ API dyal l'Audit: Bach t-testi wach l'Base de données fiha l'comptes awla la
    @GetMapping("/test-db")
    public ResponseEntity<String> testDb() {
        long count = utilisateurRepository.count();
        return ResponseEntity.ok("Nombre d'utilisateurs dans la base de données : " + count);
    }
}