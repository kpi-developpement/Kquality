package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.ContestationRequestDTO;
import com.kyntus.kqualite.dto.ContestationResponseDTO;
import com.kyntus.kqualite.dto.TraitementRequestDTO;
import com.kyntus.kqualite.service.ContestationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contestations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ContestationController {

    private final ContestationService contestationService;

    @PostMapping("/deposer")
    public ResponseEntity<ApiResponse<Void>> deposerContestation(
            @RequestHeader(value = "X-Utilisateur-Id", defaultValue = "1") Long utilisateurId,
            @Valid @RequestBody ContestationRequestDTO request) {
        contestationService.deposerContestation(utilisateurId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Contestation déposée avec succès"));
    }

    @GetMapping("/en-attente")
    public ResponseEntity<ApiResponse<List<ContestationResponseDTO>>> getContestationsEnAttente() {
        List<ContestationResponseDTO> liste = contestationService.getContestationsEnAttente();
        return ResponseEntity.ok(ApiResponse.success(liste, "Contestations récupérées"));
    }

    // 🛡️ JDID: Endpoint pour le compteur du Dashboard
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countContestations(
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        long count = contestationService.countContestationsByMonthAndYear(month, year);
        return ResponseEntity.ok(ApiResponse.success(count, "Nombre de contestations récupéré"));
    }

    @PostMapping("/{id}/traiter")
    public ResponseEntity<ApiResponse<Void>> traiterContestation(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "99") Long adminId,
            @RequestBody TraitementRequestDTO request) {
        contestationService.traiterContestation(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.success(null, "Contestation traitée avec succès"));
    }
}