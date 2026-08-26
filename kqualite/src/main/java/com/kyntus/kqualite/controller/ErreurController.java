package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.ErreurResponseDTO;
import com.kyntus.kqualite.service.ErreurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/erreurs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ErreurController {

    private final ErreurService erreurService;

    // 🛡️ L'FIX HWA HNA: Ajout de month et year
    @GetMapping("/partenaire/{partenaireId}")
    public ResponseEntity<ApiResponse<List<ErreurResponseDTO>>> getErreursByPartenaire(
            @PathVariable Long partenaireId,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {

        List<ErreurResponseDTO> erreurs = erreurService.getErreursByPartenaire(partenaireId, month, year);
        return ResponseEntity.ok(ApiResponse.success(erreurs, "Liste des erreurs récupérée avec succès"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ErreurResponseDTO>> getErreurById(@PathVariable Long id) {
        ErreurResponseDTO erreur = erreurService.getErreurById(id);
        return ResponseEntity.ok(ApiResponse.success(erreur, "Détail de l'erreur récupéré"));
    }
}