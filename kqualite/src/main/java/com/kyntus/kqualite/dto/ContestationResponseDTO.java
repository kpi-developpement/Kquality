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
    private String motif;
    private String commentaire;
    private String pieceJointeUrl;
    private LocalDateTime dateDepot;

    // Infos 3la l'erreur w l'partenaire bach l'admin y3ref 3mn kay7kem
    private Long erreurId;
    private String dossierReference;
    private String partenaireNom;
    private Double impactEstime;
}