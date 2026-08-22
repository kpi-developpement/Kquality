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
    private Double mtSst;
    private String valeurMetrique;
    private Long partenaireId;
    private String partenaireNom;

    // 🛡️ JDID
    private String statutContestation;
    private String motifContestation;
    private LocalDateTime dateContestation;
    private String reponseAdmin;
}