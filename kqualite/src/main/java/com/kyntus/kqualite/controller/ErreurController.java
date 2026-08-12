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

    @GetMapping("/partenaire/{partenaireId}")
    public ResponseEntity<ApiResponse<List<ErreurResponseDTO>>> getErreursByPartenaire(
            @PathVariable Long partenaireId) {

        List<ErreurResponseDTO> erreurs = erreurService.getErreursByPartenaire(partenaireId);
        return ResponseEntity.ok(ApiResponse.success(erreurs, "Liste des erreurs récupérée avec succès"));
    }
}