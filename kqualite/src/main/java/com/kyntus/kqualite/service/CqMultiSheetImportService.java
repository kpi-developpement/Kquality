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

import java.text.Normalizer;
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
                    // 🛡️ L'FIX: On normalise proprement l'en-tête dès la lecture
                    headerMap.put(normalizeHeader(getCellValue(cell)), cell.getColumnIndex());
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
        String kyn = extractValue(row, headers, "kyn", "idtech", "tech", "matricule");
        if (kyn.isEmpty()) return false;

        kyn = kyn.trim().toUpperCase();
        if (kyn.endsWith(".0")) kyn = kyn.substring(0, kyn.length() - 2);
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

        Optional<Technicien> techOpt = technicienRepository.findByMatricule(kyn);
        if (techOpt.isEmpty()) return false;

        Partenaire partenaire = techOpt.get().getPartenaire();

        // 🛡️ L'EXTRACTION BLINDÉE (Gère les accents "Pénalité", les espaces "MT SST", etc.)
        Double montantGlobal = parseDouble(extractValue(row, headers, "montant", "impact", "penalite", "cout", "total"));
        String mtSstStr = extractValue(row, headers, "mtsst", "montantsst", "impactsst", "penalitesst", "sst");

        Double mtSst;
        if (!mtSstStr.isEmpty()) {
            mtSst = parseDouble(mtSstStr);
        } else {
            // Si la colonne MT SST n'existe pas, on prend l'impact global
            mtSst = montantGlobal;
        }

        CqData.CqDataBuilder builder = CqData.builder()
                .typeFeuille(sheetName)
                .kyn(kyn)
                .partenaire(partenaire)
                .mois(month)
                .annee(year)
                .montant(montantGlobal)
                .mtSst(mtSst);

        if (sheetName.equalsIgnoreCase("Audits tech")) {
            builder.anMois(extractValue(row, headers, "anmoistext", "anmois", "mois"))
                    .reference(extractValue(row, headers, "idntrdvintraudt", "idrdv", "reference"))
                    .departement(extractValue(row, headers, "codedepartement", "departement", "dpt"));
        }
        else if (sheetName.equalsIgnoreCase("Check-voisinage")) {
            builder.anMois(extractValue(row, headers, "anmoistext", "anmois", "mois"))
                    .reference(extractValue(row, headers, "interventionnumber", "idrdv"))
                    .valeurMetrique(extractValue(row, headers, "nbredevoisinsenetatko", "voisinsko"));
        }
        else if (sheetName.equalsIgnoreCase("Expertises SAV")) {
            builder.reference(extractValue(row, headers, "batnumerointerventionmaint", "numerointervention", "idrdv"));
        }
        else if (sheetName.equalsIgnoreCase("Taux de coupures")) {
            builder.reference(extractValue(row, headers, "idntrdv", "idrdv"))
                    .valeurMetrique(extractValue(row, headers, "nbclientscoupesrdv", "clientscoupes"))
                    .departement(extractValue(row, headers, "departement", "dpt"));
        }

        cqDataRepository.save(builder.build());
        return true;
    }

    // 🛡️ LE NETTOYEUR ABSOLU : Enlève les accents (é -> e) et les caractères spéciaux
    private String normalizeHeader(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    // 🛡️ L'EXTRACTEUR ROBUSTE
    private String extractValue(Row row, Map<String, Integer> headers, String... possibleNames) {
        // 1. Recherche Exacte
        for (String name : possibleNames) {
            String cleanTarget = normalizeHeader(name);
            if (headers.containsKey(cleanTarget)) {
                return getCellValue(row.getCell(headers.get(cleanTarget)));
            }
        }

        // 2. Recherche Partielle (Si le nom exact n'est pas trouvé, ex: "Impact (MT SST) €")
        for (String name : possibleNames) {
            String cleanTarget = normalizeHeader(name);
            for (Map.Entry<String, Integer> entry : headers.entrySet()) {
                if (entry.getKey().contains(cleanTarget)) {
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