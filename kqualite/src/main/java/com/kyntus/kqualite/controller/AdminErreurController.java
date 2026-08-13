package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.service.ErreurImportService;
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

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<ImportSummaryDTO>> importErreurs(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        ImportSummaryDTO summary = erreurImportService.importErreursCsv(file);
        return ResponseEntity.ok(ApiResponse.success(summary, "Fichier traité"));
    }
}