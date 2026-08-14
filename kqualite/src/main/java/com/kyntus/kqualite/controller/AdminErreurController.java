package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.service.ErreurImportService;
import com.kyntus.kqualite.service.CqMultiSheetImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/erreurs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminErreurController {

    private final ErreurImportService erreurImportService;
    private final CqMultiSheetImportService cqMultiSheetImportService;

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importErreurs(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = erreurImportService.importErreurs(file);
        return ResponseEntity.ok(ApiResponse.success(summary, "Fichier traité"));
    }

    @PostMapping("/import-multi-cq")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importMultiCq(
            @RequestParam("file") MultipartFile file,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = cqMultiSheetImportService.importMultiSheetExcel(file, month, year);
        return ResponseEntity.ok(ApiResponse.success(summary, "Fichier Multi-feuilles traité"));
    }
}