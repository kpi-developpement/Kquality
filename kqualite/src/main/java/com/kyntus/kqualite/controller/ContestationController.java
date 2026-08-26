package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.ContestationResponseDTO;
import com.kyntus.kqualite.dto.TraitementRequestDTO;
import com.kyntus.kqualite.service.ContestationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contestations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ContestationController {

    private final ContestationService contestationService;

    // 🛡️ L'FIX HWA HNA: On utilise consumes = MULTIPART_FORM_DATA_VALUE
    @PostMapping(value = "/deposer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> deposerContestation(
            @RequestHeader(value = "X-Utilisateur-Id", defaultValue = "1") Long utilisateurId,
            @RequestParam("erreurId") Long erreurId,
            @RequestParam("motif") String motif,
            @RequestParam(value = "commentaire", required = false) String commentaire,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        contestationService.deposerContestation(utilisateurId, erreurId, motif, commentaire, file);
        return ResponseEntity.ok(ApiResponse.success(null, "Contestation déposée avec succès"));
    }

    @GetMapping("/toutes")
    public ResponseEntity<ApiResponse<List<ContestationResponseDTO>>> getAllContestations() {
        List<ContestationResponseDTO> liste = contestationService.getAllContestations();
        return ResponseEntity.ok(ApiResponse.success(liste, "Toutes les contestations récupérées"));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countContestations(
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        long count = contestationService.countContestationsByMonthAndYear(month, year);
        return ResponseEntity.ok(ApiResponse.success(count, "Nombre de contestations récupéré"));
    }

    @PostMapping("/{type}/{id}/traiter")
    public ResponseEntity<ApiResponse<Void>> traiterContestation(
            @PathVariable String type,
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "99") Long adminId,
            @RequestBody TraitementRequestDTO request) {
        contestationService.traiterContestation(type, id, request, adminId);
        return ResponseEntity.ok(ApiResponse.success(null, "Contestation traitée avec succès"));
    }
}