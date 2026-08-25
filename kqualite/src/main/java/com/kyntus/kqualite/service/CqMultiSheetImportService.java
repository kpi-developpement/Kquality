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
    public ImportSummaryDTO importMultiSheetExcel(MultipartFile file, int month, int year) {
        int total = 0, success = 0, rejected = 0;

        cqDataRepository.deleteByMoisAndAnnee(month, year);

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String sheetName = sheet.getSheetName().trim();

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
                    headerMap.put(getCellValue(cell), cell.getColumnIndex()); // On garde la valeur brute ici
                }

                for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;
                    total++;

                    try {
                        boolean isProcessed = processRowBySheet(sheetName, row, headerMap, month, year);
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
                .message("Importation Multi-feuilles terminée pour " + month + "/" + year)
                .build();
    }

    private boolean processRowBySheet(String sheetName, Row row, Map<String, Integer> headers, int month, int year) {
        String kyn = extractValue(row, headers, "kyn", "id_tech", "tech", "matricule");
        if (kyn.isEmpty()) return false;

        kyn = kyn.trim().toUpperCase();
        if (kyn.endsWith(".0")) kyn = kyn.substring(0, kyn.length() - 2);
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

        Optional<Technicien> techOpt = technicienRepository.findByMatricule(kyn);
        if (techOpt.isEmpty()) return false;

        Partenaire partenaire = techOpt.get().getPartenaire();

        // 🛡️ L'EXTRACTION BLINDÉE: On cherche exactement "MT SST"
        Double montantGlobal = parseDouble(extractValue(row, headers, "montant", "impact", "penalite", "cout"));
        Double mtSst = parseDouble(extractValue(row, headers, "mt sst", "mtsst", "montant sst"));

        CqData.CqDataBuilder builder = CqData.builder()
                .typeFeuille(sheetName)
                .kyn(kyn)
                .partenaire(partenaire)
                .mois(month)
                .annee(year)
                .montant(montantGlobal)
                .mtSst(mtSst);

        if (sheetName.equalsIgnoreCase("Audits tech")) {
            builder.anMois(extractValue(row, headers, "an_mois_text", "an mois", "mois"))
                    .reference(extractValue(row, headers, "idnt_rdv_intr_audt", "id rdv", "reference"))
                    .departement(extractValue(row, headers, "code_departement", "departement", "dpt"));
        }
        else if (sheetName.equalsIgnoreCase("Check-voisinage")) {
            builder.anMois(extractValue(row, headers, "an_mois_text", "an mois", "mois"))
                    .reference(extractValue(row, headers, "intervention number", "id_rdv", "idrdv"))
                    .valeurMetrique(extractValue(row, headers, "nbre de voisins en état ko", "voisins ko"));
        }
        else if (sheetName.equalsIgnoreCase("Expertises SAV")) {
            builder.reference(extractValue(row, headers, "bat_numero intervention maint", "numero intervention", "id_rdv"));
        }
        else if (sheetName.equalsIgnoreCase("Taux de coupures")) {
            builder.reference(extractValue(row, headers, "idnt_rdv", "id_rdv"))
                    .valeurMetrique(extractValue(row, headers, "nb_clients_coupes_rdv", "clients coupes"))
                    .departement(extractValue(row, headers, "département", "departement", "dpt"));
        }

        cqDataRepository.save(builder.build());
        return true;
    }

    // 🛡️ L'EXTRACTEUR BLINDÉ (ROBUST MATCHER)
    private String extractValue(Row row, Map<String, Integer> headers, String... possibleNames) {
        // 1. Recherche Exacte (Après nettoyage total des espaces et caractères invisibles)
        for (String name : possibleNames) {
            String cleanTarget = name.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (Map.Entry<String, Integer> entry : headers.entrySet()) {
                String cleanHeader = entry.getKey().toLowerCase().replaceAll("[^a-z0-9]", "");
                if (cleanHeader.equals(cleanTarget)) {
                    return getCellValue(row.getCell(entry.getValue()));
                }
            }
        }

        // 2. Recherche Partielle (Si le nom exact n'est pas trouvé)
        for (String name : possibleNames) {
            String cleanTarget = name.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (Map.Entry<String, Integer> entry : headers.entrySet()) {
                String cleanHeader = entry.getKey().toLowerCase().replaceAll("[^a-z0-9]", "");
                if (cleanHeader.contains(cleanTarget)) {
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