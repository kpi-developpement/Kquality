package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CqDataDTO {
    private Long id;
    private String typeFeuille;
    private String kyn;
    private Integer mois;
    private Integer annee;
    private String anMois;
    private String reference;
    private String departement;
    private Double montant;
    private String valeurMetrique;
    private Long partenaireId;
    private String partenaireNom; // 🛡️ JDID: Bach l'Admin y-chouf smyt l'entreprise
}