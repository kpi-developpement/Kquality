package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.KpiArchiveDTO;
import com.kyntus.kqualite.service.KpiIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/kpi")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminKpiController {

    private final KpiIntegrationService kpiIntegrationService;

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<List<KpiArchiveDTO>>> getVueGlobale(
            @RequestParam("month") int month,
            @RequestParam("year") int year) {

        List<KpiArchiveDTO> data = kpiIntegrationService.fetchKpiGlobal(month, year);
        return ResponseEntity.ok(ApiResponse.success(data, "Vue globale récupérée avec succès"));
    }
}