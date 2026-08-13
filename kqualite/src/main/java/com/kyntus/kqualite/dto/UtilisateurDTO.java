package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurDTO {
    private Long id;
    private String email;
    private String motDePasse; // M-khdem ghir f la création/modification
    private String role;
    private Boolean actif;
    private Long partenaireId;
    private String partenaireNom;
    private List<String> permissions;
}