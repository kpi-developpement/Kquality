package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.DashboardPartenaireDTO;
import com.kyntus.kqualite.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = "*") // N-khliw l'front dyal Next.js y-accéder
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/partenaire/{partenaireId}")
    public ResponseEntity<ApiResponse<DashboardPartenaireDTO>> getDashboard(
            @PathVariable Long partenaireId,
            @RequestParam(defaultValue = "2026-08") String periodeMois) {

        DashboardPartenaireDTO data = dashboardService.getDashboardData(partenaireId, periodeMois);
        return ResponseEntity.ok(ApiResponse.success(data, "Données du tableau de bord récupérées avec succès"));
    }
}