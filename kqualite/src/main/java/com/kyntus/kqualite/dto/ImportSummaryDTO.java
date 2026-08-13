package com.kyntus.kqualite.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImportSummaryDTO {
    private int totalLignes;
    private int lignesInserees;
    private int lignesRejetees;
    private String message;
}