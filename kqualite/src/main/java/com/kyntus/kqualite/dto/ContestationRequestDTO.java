package com.kyntus.kqualite.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestationRequestDTO {

    @NotNull(message = "L'ID de l'erreur est obligatoire")
    private Long erreurId;

    @NotBlank(message = "Le motif est obligatoire")
    private String motif;

    private String commentaire;

    private String pieceJointeUrl;
}