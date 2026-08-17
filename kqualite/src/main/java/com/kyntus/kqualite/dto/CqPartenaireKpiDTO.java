package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CqPartenaireKpiDTO {
    private Long id;
    private Long partenaireId;
    private String partenaireNom;
    private Integer mois;
    private Integer annee;
    private String indicateur;
    private String zone;
    private long num;
    private long denum;
    private double resultat;
    private double bonus;
}