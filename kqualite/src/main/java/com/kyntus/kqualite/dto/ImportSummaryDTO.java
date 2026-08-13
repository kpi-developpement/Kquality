package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportSummaryDTO {
    private int totalLignes;
    private int lignesInserees;
    private int lignesRejetees;
    private String message;
}