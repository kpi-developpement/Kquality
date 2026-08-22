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
public class ContestationResponseDTO {
    private Long id;
    private String type; // 🛡️ JDID: "ERREUR" ou "PENALITE_CQ"
    private String motif;
    private String commentaire;
    private String pieceJointeUrl;
    private LocalDateTime dateDepot;

    private Long erreurId;
    private String dossierReference;
    private String partenaireNom;
    private Double impactEstime;

    private String statut; // 🛡️ JDID: "EN_ATTENTE", "ACCEPTE", "REFUSE"
    private String reponseAdmin; // 🛡️ JDID
}