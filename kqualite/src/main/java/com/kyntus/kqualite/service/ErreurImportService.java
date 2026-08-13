package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.*;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ErreurImportService {

    private final TechnicienRepository technicienRepository;
    private final DossierRepository dossierRepository;
    private final RegleQualiteRepository regleQualiteRepository;
    private final ErreurRepository erreurRepository;

    @Transactional
    public ImportSummaryDTO importErreurs(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                return processExcel(file);
            } else {
                return processCsv(file);
            }
        } catch (Exception e) {
            log.error("Erreur globale d'importation", e);
            throw new RuntimeException("Erreur de lecture du fichier : " + e.getMessage());
        }
    }

    private ImportSummaryDTO processExcel(MultipartFile file) throws Exception {
        int total = 0, success = 0, rejected = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);

            if (headerRow == null) throw new RuntimeException("Le fichier Excel est vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) {
                headerMap.put(getCellValue(cell).trim(), cell.getColumnIndex());
            }

            // 🛡️ L'FIX HWA HNA: 7iydna "tech" mn l'recherche. Kay-9leb GHIR 3la KYN.
            Integer colRdv = findColumnIndex(headerMap, "idrdv", "dossier", "rdv");
            Integer colKyn = findColumnIndex(headerMap, "kyn", "idtecnow");
            Integer colCat = findColumnIndex(headerMap, "categorie", "souscategorie", "regle");
            Integer colImpact = findColumnIndex(headerMap, "impact", "montant");

            if (colRdv == null || colKyn == null) {
                throw new RuntimeException("Colonnes obligatoires introuvables (ID RDV ou KYN) dans le fichier Excel.");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                try {
                    String rdv = getCellValue(row.getCell(colRdv));
                    String kyn = getCellValue(row.getCell(colKyn));
                    String categorie = colCat != null ? getCellValue(row.getCell(colCat)) : "Erreur Qualité";
                    String impactStr = colImpact != null ? getCellValue(row.getCell(colImpact)) : "0";

                    if (rdv.isEmpty() || kyn.isEmpty()) {
                        rejected++; continue;
                    }

                    impactStr = impactStr.replaceAll("[^\\d.,-]", "").replace(",", ".");
                    double impact = impactStr.isEmpty() ? 0.0 : Double.parseDouble(impactStr);

                    boolean isProcessed = processRow(rdv, kyn, categorie, impact);
                    if (isProcessed) success++; else rejected++;
                } catch (Exception e) {
                    log.error("Erreur ligne {} : {}", total, e.getMessage());
                    rejected++;
                }
            }
        }
        return ImportSummaryDTO.builder().totalLignes(total).lignesInserees(success).lignesRejetees(rejected).message("Importation Excel terminée avec succès.").build();
    }

    private ImportSummaryDTO processCsv(MultipartFile file) throws Exception {
        int total = 0, success = 0, rejected = 0;

        BufferedReader brTest = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
        String firstLine = brTest.readLine();
        char delimiter = ';';
        if (firstLine != null) {
            if (firstLine.contains(",") && !firstLine.contains(";")) delimiter = ',';
            else if (firstLine.contains("\t")) delimiter = '\t';
        }
        brTest.close();

        CSVFormat format = CSVFormat.Builder.create().setDelimiter(delimiter).setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();

            // 🛡️ L'FIX HWA HNA: 7iydna "tech" mn l'recherche.
            String colRdv = findColumnName(headerMap, "idrdv", "dossier", "rdv");
            String colKyn = findColumnName(headerMap, "kyn", "idtecnow");
            String colCat = findColumnName(headerMap, "categorie", "souscategorie", "regle");
            String colImpact = findColumnName(headerMap, "impact", "montant");

            if (colRdv == null || colKyn == null) {
                throw new RuntimeException("Colonnes obligatoires introuvables (ID RDV ou KYN). Délimiteur détecté: '" + delimiter + "'");
            }

            for (CSVRecord record : parser) {
                total++;
                try {
                    String rdv = record.get(colRdv);
                    String kyn = record.get(colKyn);
                    String categorie = colCat != null && record.isMapped(colCat) ? record.get(colCat) : "Erreur Qualité";
                    String impactStr = colImpact != null && record.isMapped(colImpact) ? record.get(colImpact) : "0";

                    if (rdv == null || rdv.trim().isEmpty() || kyn == null || kyn.trim().isEmpty()) {
                        rejected++; continue;
                    }

                    impactStr = impactStr.replaceAll("[^\\d.,-]", "").replace(",", ".");
                    double impact = impactStr.isEmpty() ? 0.0 : Double.parseDouble(impactStr);

                    boolean isProcessed = processRow(rdv.trim(), kyn.trim(), categorie.trim(), impact);
                    if (isProcessed) success++; else rejected++;
                } catch (Exception e) {
                    log.error("Erreur ligne {} : {}", total, e.getMessage());
                    rejected++;
                }
            }
        }
        return ImportSummaryDTO.builder().totalLignes(total).lignesInserees(success).lignesRejetees(rejected).message("Importation CSV terminée avec succès.").build();
    }

    // ==========================================
    // ⚙️ LOGIQUE COMMUNE (Recherche KYN w Sauvegarde)
    // ==========================================
    private boolean processRow(String rdv, String rawKyn, String categorie, double impact) {

        // 1. Nettoyage intelligent dyal l'KYN
        String kyn = rawKyn.trim().toUpperCase();
        if (kyn.endsWith(".0")) {
            kyn = kyn.substring(0, kyn.length() - 2); // 7iyd .0 dyal Excel
        }
        if (!kyn.startsWith("KYN")) {
            kyn = "KYN" + kyn; // Zid KYN ila kant na9ssa (ex: 1374 -> KYN1374)
        }

        // 2. Chercher le Technicien par son KYN (L'Backend kay-jbed l'Partenaire oumatiquement mn DB)
        Optional<Technicien> techOpt = technicienRepository.findByMatricule(kyn);

        // Fallback: Njerbou b rawKyn kima ja f l'fichier ila mal9inahch
        if (techOpt.isEmpty()) {
            techOpt = technicienRepository.findByMatricule(rawKyn.trim());
        }

        if (techOpt.isEmpty()) {
            log.warn("Technicien KYN [{}] introuvable dans la base de données.", kyn);
            return false; // Rejeté
        }

        Technicien technicien = techOpt.get();

        // 3. Chercher ou Créer le Dossier (M-lyé m3a l'Technicien w l'Partenaire dyalo)
        Dossier dossier = dossierRepository.findByReferenceID(rdv)
                .orElseGet(() -> dossierRepository.save(Dossier.builder()
                        .referenceID(rdv)
                        .dateIntervention(LocalDateTime.now())
                        .technicien(technicien)
                        .build()));

        // 4. Chercher ou Créer la Règle Qualité
        RegleQualite regle = regleQualiteRepository.findByCodeRegle(categorie)
                .orElseGet(() -> regleQualiteRepository.save(RegleQualite.builder()
                        .codeRegle(categorie)
                        .description(categorie)
                        .penaliteUnitaire(impact)
                        .build()));

        // 5. Créer l'Erreur (Li ghat-mchi l'Partenaire)
        Erreur erreur = Erreur.builder()
                .dateDetection(LocalDateTime.now())
                .impactEstime(impact)
                .statut(StatutErreur.NOUVEAU)
                .echeanceContestation(LocalDateTime.now().plusDays(5))
                .dossier(dossier)
                .regleQualite(regle)
                .build();

        erreurRepository.save(erreur);
        return true; // Succès
    }

    // ==========================================
    // 🛠️ HELPERS (Nettoyage et Recherche)
    // ==========================================
    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return "";
        }
    }

    private String findColumnName(Map<String, Integer> headers, String... keywords) {
        if (headers == null) return null;
        for (String header : headers.keySet()) {
            String clean = header.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (String kw : keywords) {
                String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
                if (clean.contains(cleanKw)) return header;
            }
        }
        return null;
    }

    private Integer findColumnIndex(Map<String, Integer> headers, String... keywords) {
        String colName = findColumnName(headers, keywords);
        return colName != null ? headers.get(colName) : null;
    }
}