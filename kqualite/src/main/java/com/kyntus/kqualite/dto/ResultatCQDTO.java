package com.kyntus.kqualite.dto;

import com.kyntus.kqualite.domain.StatutPenalite;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResultatCQDTO {
    private String periodeMois;
    private Double scoreActuel;
    private Double objectifGlobal;

    private Double montantPenalite;
    private StatutPenalite statutPenalite;
}