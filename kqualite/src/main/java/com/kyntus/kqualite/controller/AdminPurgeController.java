package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.service.PurgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/purge")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminPurgeController {

    private final PurgeService purgeService;

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> purgeData(
            @RequestParam("target") String target,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {

        purgeService.purgeData(target, month, year);
        return ResponseEntity.ok(ApiResponse.success(null, "Données purgées avec succès"));
    }
}