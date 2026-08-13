package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.AuthRequestDTO;
import com.kyntus.kqualite.dto.AuthResponseDTO;
import com.kyntus.kqualite.repository.UtilisateurRepository;
import com.kyntus.kqualite.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(@RequestBody AuthRequestDTO request) {

        // 1. Verification dyal l'Email w l'Mot de passe
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Njbdou l'utilisateur mn DB
        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 3. N-génériw l'Token
        String jwtToken = jwtService.generateToken(user);

        // 4. N-wjdou l'réponse
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
}