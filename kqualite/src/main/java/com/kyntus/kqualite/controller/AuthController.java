package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.AuthRequestDTO;
import com.kyntus.kqualite.dto.AuthResponseDTO;
import com.kyntus.kqualite.dto.ChangePasswordRequestDTO;
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

        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";

        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Identifiants incorrects (Email introuvable)"));

        if (!passwordEncoder.matches(password, user.getMotDePasse())) {
            throw new RuntimeException("Identifiants incorrects (Mot de passe erroné)");
        }

        if (!user.getActif()) {
            throw new RuntimeException("Ce compte a été désactivé");
        }

        String jwtToken = jwtService.generateToken(user);

        AuthResponseDTO response = AuthResponseDTO.builder()
                .token(jwtToken)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .permissions(user.getPermissions())
                .partenaireId(user.getPartenaire() != null ? user.getPartenaire().getId() : null)
                .mustChangePassword(user.getMustChangePassword()) // 🛡️ Siftnaha l'Frontend
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Connexion réussie"));
    }

    // 🛡️ API JDIDA: Changement de mot de passe
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("Authorization") String token,
            @RequestBody ChangePasswordRequestDTO request) {

        String jwt = token.substring(7);
        String email = jwtService.extractUsername(jwt);

        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getMotDePasse())) {
            throw new RuntimeException("L'ancien mot de passe est incorrect");
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false); // 🛡️ 7iydna l'obligation
        utilisateurRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(null, "Mot de passe modifié avec succès"));
    }

    @GetMapping("/test-db")
    public ResponseEntity<String> testDb() {
        long count = utilisateurRepository.count();
        return ResponseEntity.ok("Nombre d'utilisateurs dans la base de données : " + count);
    }
}