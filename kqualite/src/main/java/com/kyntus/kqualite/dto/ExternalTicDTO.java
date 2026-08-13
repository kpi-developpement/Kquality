package com.kyntus.kqualite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ExternalTicDTO {
    @JsonProperty("ID_TECNOW")
    private String idTecnow;

    @JsonProperty("ENTREPRISE")
    private String entreprise;

    @JsonProperty("NOM_TECHNICIEN")
    private String nomTechnicien;

    @JsonProperty("COURRIEL_TECHNICIEN")
    private String courrielTechnicien;

    // 🛡️ L'FIX HWA HNA: Zedt l'Etat
    @JsonProperty("ETAT")
    private String etat;
}