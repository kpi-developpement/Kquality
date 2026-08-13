package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.domain.CqData;
import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.CqDataDTO;
import com.kyntus.kqualite.repository.CqDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/cq-data")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CqDataController {

    private final CqDataRepository cqDataRepository;

    @GetMapping("/partenaire/{partenaireId}")
    public ResponseEntity<ApiResponse<List<CqDataDTO>>> getCqData(
            @PathVariable Long partenaireId,
            @RequestParam("type") String typeFeuille) {

        List<CqDataDTO> data = cqDataRepository.findByPartenaireIdAndTypeFeuille(partenaireId, typeFeuille)
                .stream()
                .map(c -> CqDataDTO.builder()
                        .id(c.getId())
                        .typeFeuille(c.getTypeFeuille())
                        .kyn(c.getKyn())
                        .anMois(c.getAnMois())
                        .reference(c.getReference())
                        .departement(c.getDepartement())
                        .montant(c.getMontant())
                        .valeurMetrique(c.getValeurMetrique())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(data, "Données récupérées"));
    }
}