package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.CqData;
import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Technicien;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.repository.CqDataRepository;
import com.kyntus.kqualite.repository.TechnicienRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CqMultiSheetImportService {

    private final CqDataRepository cqDataRepository;
    private final TechnicienRepository technicienRepository;

    @Transactional
    public ImportSummaryDTO importMultiSheetExcel(MultipartFile file) {
        int total = 0, success = 0, rejected = 0;

        // Vider l'ancienne table avant le nouvel import (Idempotence)
        cqDataRepository.deleteAll();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String sheetName = sheet.getSheetName().trim();

                // On ignore les feuilles non concernées
                if (!sheetName.equalsIgnoreCase("Audits tech") &&
                        !sheetName.equalsIgnoreCase("Check-voisinage") &&
                        !sheetName.equalsIgnoreCase("Expertises SAV") &&
                        !sheetName.equalsIgnoreCase("Taux de coupures")) {
                    continue;
                }

                Row headerRow = sheet.getRow(0);
                if (headerRow == null) continue;

                Map<String, Integer> headerMap = new HashMap<>();
                for (Cell cell : headerRow) {
                    headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());
                }

                for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;
                    total++;

                    try {
                        boolean isProcessed = processRowBySheet(sheetName, row, headerMap);
                        if (isProcessed) success++; else rejected++;
                    } catch (Exception e) {
                        log.error("Erreur ligne {} feuille {} : {}", r, sheetName, e.getMessage());
                        rejected++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erreur lecture fichier Excel Multi-feuilles", e);
            throw new RuntimeException("Erreur de lecture du fichier : " + e.getMessage());
        }

        return ImportSummaryDTO.builder()
                .totalLignes(total)
                .lignesInserees(success)
                .lignesRejetees(rejected)
                .message("Importation Multi-feuilles terminée.")
                .build();
    }

    private boolean processRowBySheet(String sheetName, Row row, Map<String, Integer> headers) {
        String kyn = extractValue(row, headers, "kyn");
        if (kyn.isEmpty()) return false;

        // Nettoyage KYN
        kyn = kyn.trim().toUpperCase();
        if (kyn.endsWith(".0")) kyn = kyn.substring(0, kyn.length() - 2);
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

        Optional<Technicien> techOpt = technicienRepository.findByMatricule(kyn);
        if (techOpt.isEmpty()) return false; // Rejeté si KYN introuvable

        Partenaire partenaire = techOpt.get().getPartenaire();
        CqData.CqDataBuilder builder = CqData.builder()
                .typeFeuille(sheetName)
                .kyn(kyn)
                .partenaire(partenaire);

        if (sheetName.equalsIgnoreCase("Audits tech")) {
            builder.anMois(extractValue(row, headers, "an_mois_text"))
                    .reference(extractValue(row, headers, "idnt_rdv_intr_audt"))
                    .departement(extractValue(row, headers, "code_departement"))
                    .montant(parseDouble(extractValue(row, headers, "montant")));
        }
        else if (sheetName.equalsIgnoreCase("Check-voisinage")) {
            builder.anMois(extractValue(row, headers, "an_mois_text"))
                    .reference(extractValue(row, headers, "intervention number"))
                    .valeurMetrique(extractValue(row, headers, "nbre de voisins en état ko"))
                    .montant(parseDouble(extractValue(row, headers, "montant")));
        }
        else if (sheetName.equalsIgnoreCase("Expertises SAV")) {
            builder.reference(extractValue(row, headers, "bat_numero intervention maint"));
        }
        else if (sheetName.equalsIgnoreCase("Taux de coupures")) {
            builder.reference(extractValue(row, headers, "idnt_rdv"))
                    .valeurMetrique(extractValue(row, headers, "nb_clients_coupes_rdv"))
                    .departement(extractValue(row, headers, "département", "departement"))
                    .montant(parseDouble(extractValue(row, headers, "montant", "mt sst")));
        }

        cqDataRepository.save(builder.build());
        return true;
    }

    private String extractValue(Row row, Map<String, Integer> headers, String... possibleNames) {
        for (String name : possibleNames) {
            for (Map.Entry<String, Integer> entry : headers.entrySet()) {
                if (entry.getKey().contains(name.toLowerCase())) {
                    return getCellValue(row.getCell(entry.getValue()));
                }
            }
        }
        return "";
    }

    private Double parseDouble(String val) {
        if (val == null || val.isEmpty()) return 0.0;
        String clean = val.replaceAll("[^\\d.,-]", "").replace(",", ".");
        try { return Double.parseDouble(clean); } catch (Exception e) { return 0.0; }
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return "";
        }
    }
}