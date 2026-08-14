package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.domain.CqData;
import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.CqDataDTO;
import com.kyntus.kqualite.dto.PartenaireDTO;
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
    public ResponseEntity<ApiResponse<List<CqDataDTO>>> getCqDataPartenaire(
            @PathVariable Long partenaireId,
            @RequestParam("type") String typeFeuille,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {

        List<CqDataDTO> data = cqDataRepository.findByPartenaireIdAndTypeFeuilleAndMoisAndAnnee(partenaireId, typeFeuille, month, year)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(data, "Données récupérées"));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<CqDataDTO>>> getCqDataAdmin(
            @RequestParam("type") String typeFeuille,
            @RequestParam("month") int month,
            @RequestParam("year") int year,
            @RequestParam(value = "partenaireId", required = false) Long partenaireId) {

        List<CqData> rawData;
        if (partenaireId != null) {
            rawData = cqDataRepository.findByMoisAndAnneeAndTypeFeuilleAndPartenaireId(month, year, typeFeuille, partenaireId);
        } else {
            rawData = cqDataRepository.findByMoisAndAnneeAndTypeFeuille(month, year, typeFeuille);
        }

        List<CqDataDTO> data = rawData.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(data, "Données Admin récupérées"));
    }

    // 🛡️ L'FIX HWA HNA: API jdida l'Dropdown dyal l'Admin
    @GetMapping("/admin/partenaires-actifs")
    public ResponseEntity<ApiResponse<List<PartenaireDTO>>> getPartenairesActifs(
            @RequestParam("month") int month,
            @RequestParam("year") int year) {

        List<PartenaireDTO> data = cqDataRepository.findDistinctPartenairesByMoisAndAnnee(month, year)
                .stream()
                .map(p -> new PartenaireDTO(p.getId(), p.getNomEntreprise()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(data, "Partenaires actifs récupérés"));
    }

    private CqDataDTO mapToDTO(CqData c) {
        return CqDataDTO.builder()
                .id(c.getId())
                .typeFeuille(c.getTypeFeuille())
                .kyn(c.getKyn())
                .mois(c.getMois())
                .annee(c.getAnnee())
                .anMois(c.getAnMois())
                .reference(c.getReference())
                .departement(c.getDepartement())
                .montant(c.getMontant())
                .mtSst(c.getMtSst())
                .valeurMetrique(c.getValeurMetrique())
                .partenaireId(c.getPartenaire().getId())
                .partenaireNom(c.getPartenaire().getNomEntreprise())
                .build();
    }
}