package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.CqPartenaireKpiDTO;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.repository.CqPartenaireKpiRepository;
import com.kyntus.kqualite.service.CqPartenaireImportService;
import com.kyntus.kqualite.service.KpiIsoleImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/cq-partenaire")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminCqPartenaireController {

    private final CqPartenaireImportService importService;
    private final KpiIsoleImportService kpiIsoleImportService; // 🛡️ JDID
    private final CqPartenaireKpiRepository repository;

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importCqPartenaire(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = importService.importCqPartenaire(file, month, year);
        return ResponseEntity.ok(ApiResponse.success(summary, "Calculs CQ Partenaire terminés"));
    }

    @PostMapping("/import-sacli")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importSacli(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = importService.importSacliSarcli(file, month, year, true);
        return ResponseEntity.ok(ApiResponse.success(summary, "Calculs SACLI terminés"));
    }

    @PostMapping("/import-sarcli")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importSarcli(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = importService.importSacliSarcli(file, month, year, false);
        return ResponseEntity.ok(ApiResponse.success(summary, "Calculs SARCLI terminés"));
    }

    // 🛡️ L'FIX HWA HNA: 2 APIs jdad l'Incoherence PTO w GEM NOK
    @PostMapping("/import-incoherence-pto")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importIncoherencePto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = kpiIsoleImportService.importIncoherencePto(file, month, year);
        return ResponseEntity.ok(ApiResponse.success(summary, "Calculs Incohérence PTO terminés"));
    }

    @PostMapping("/import-gem-nok")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importGemNok(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = kpiIsoleImportService.importGemNok(file, month, year);
        return ResponseEntity.ok(ApiResponse.success(summary, "Calculs GEM NOK terminés"));
    }
    @PostMapping("/import-cadrage")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importCadrage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = kpiIsoleImportService.importCadrage(file, month, year);
        return ResponseEntity.ok(ApiResponse.success(summary, "Calculs CADRAGE terminés"));
    }
    @PostMapping("/import-taux-plainte")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importTauxPlainte(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = kpiIsoleImportService.importTauxPlainte(file, month, year);
        return ResponseEntity.ok(ApiResponse.success(summary, "Calculs TAUX DE PLAINTE terminés"));
    }
    @GetMapping
    public ResponseEntity<ApiResponse<List<CqPartenaireKpiDTO>>> getCqPartenaire(
            @RequestParam("month") int month,
            @RequestParam("year") int year,
            @RequestParam(value = "partenaireId", required = false) Long partenaireId) {

        List<CqPartenaireKpiDTO> data;
        if (partenaireId != null) {
            data = repository.findByMoisAndAnneeAndPartenaireId(month, year, partenaireId).stream().map(this::mapToDTO).collect(Collectors.toList());
        } else {
            data = repository.findByMoisAndAnnee(month, year).stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        return ResponseEntity.ok(ApiResponse.success(data, "Données CQ Partenaire récupérées"));
    }

    private CqPartenaireKpiDTO mapToDTO(com.kyntus.kqualite.domain.CqPartenaireKpi c) {
        return CqPartenaireKpiDTO.builder()
                .id(c.getId())
                .partenaireId(c.getPartenaire().getId())
                .partenaireNom(c.getPartenaire().getNomEntreprise())
                .mois(c.getMois())
                .annee(c.getAnnee())
                .indicateur(c.getIndicateur())
                .zone(c.getZone())
                .num(c.getNum())
                .denum(c.getDenum())
                .resultat(c.getResultat())
                .bonus(c.getBonus())
                .build();
    }
}