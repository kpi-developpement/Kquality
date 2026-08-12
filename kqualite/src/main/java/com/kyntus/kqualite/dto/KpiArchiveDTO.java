package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiArchiveDTO {
    private Long id;
    private int mois;
    private int annee;
    private String processus;
    private String departement;
    private long num;
    private long denum;
    private double resultat;
    private double partDeMarche;
    private double bonus;
    private LocalDateTime createdAt;
}