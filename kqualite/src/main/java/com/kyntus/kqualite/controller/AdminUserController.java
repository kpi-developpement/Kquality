package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.PartenaireDTO;
import com.kyntus.kqualite.dto.UtilisateurDTO;
import com.kyntus.kqualite.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminUserController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UtilisateurDTO>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(utilisateurService.getAllUsers(), "Utilisateurs récupérés"));
    }

    @GetMapping("/partenaires")
    public ResponseEntity<ApiResponse<List<PartenaireDTO>>> getPartenaires() {
        return ResponseEntity.ok(ApiResponse.success(utilisateurService.getAllPartenaires(), "Partenaires récupérés"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createUser(@RequestBody UtilisateurDTO dto) {
        utilisateurService.createUser(dto);
        return ResponseEntity.ok(ApiResponse.success(null, "Utilisateur créé avec succès"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> updateUser(@PathVariable Long id, @RequestBody UtilisateurDTO dto) {
        utilisateurService.updateUser(id, dto);
        return ResponseEntity.ok(ApiResponse.success(null, "Utilisateur mis à jour avec succès"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        utilisateurService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Utilisateur supprimé"));
    }
}