package com.kyntus.kqualite.dto;

import com.kyntus.kqualite.domain.StatutErreur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErreurResponseDTO {
    private Long id;
    private LocalDateTime dateDetection;
    private String preuveUrl;
    private Double impactEstime;
    private LocalDateTime echeanceContestation;
    private StatutErreur statut;

    private String dossierReference;
    private LocalDateTime dossierDateIntervention;
    private String technicienNomComplet;
    private String technicienMatricule;
    private String regleCode;
    private String regleDescription;
    private Boolean aContestation;

    // 🛡️ L'FIX HWA HNA: Zedt smyt l'partenaire l'Admin
    private String partenaireNom;
}