package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.domain.CqPartenaireKpi;
import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.CqPartenaireKpiDTO;
import com.kyntus.kqualite.repository.CqPartenaireKpiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/cq-partenaire")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CqPartenaireController {

    private final CqPartenaireKpiRepository repository;

    // 🛡️ API khassa b l'Partenaire (kay-jbed ghir data dyalo)
    @GetMapping("/partenaire/{partenaireId}")
    public ResponseEntity<ApiResponse<List<CqPartenaireKpiDTO>>> getCqPartenaire(
            @PathVariable Long partenaireId,
            @RequestParam("month") int month,
            @RequestParam("year") int year) {

        List<CqPartenaireKpiDTO> data = repository.findByMoisAndAnneeAndPartenaireId(month, year, partenaireId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(data, "Données CQ Partenaire récupérées"));
    }

    private CqPartenaireKpiDTO mapToDTO(CqPartenaireKpi c) {
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