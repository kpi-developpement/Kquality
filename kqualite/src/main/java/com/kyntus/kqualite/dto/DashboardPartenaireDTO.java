package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardPartenaireDTO {
    // KPI 1: CQ prévisionnel
    private Double cqPrevisionnel;
    private Double objectifCq;
    private Double ecartCq; // ex: -1.4 pt

    // KPI 2: Dossiers contrôlés
    private Integer totalDossiersControles;

    // KPI 3: Erreurs actives
    private Integer erreursActives; // Les erreurs li ba9i mat-traitaw
    private Integer erreursUrgentes; // Les erreurs li 9rbat l'échéance dyalhom

    // KPI 4: Pénalités estimées
    private Double penalitesEstimees;
    private String statutPenalites; // "Estimée", "Confirmée", etc.
}