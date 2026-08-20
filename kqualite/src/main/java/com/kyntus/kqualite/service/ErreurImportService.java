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
                headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());
            }

            Integer colRdv = findColumnIndex(headerMap, "idrdv", "dossier", "rdv");
            Integer colKyn = findColumnIndex(headerMap, "kyn", "idtecnow", "tech", "matricule", "prv_tcnw_id_tech");

            // 🛡️ L'FIX HWA HNA: Séparation bin Categorie w Sous Categorie
            Integer colCat = findColumnIndexExact(headerMap, "categorie");
            Integer colSousCat = findColumnIndex(headerMap, "sous categorie", "souscategorie", "regle", "description");

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
                    String categorie = colCat != null ? getCellValue(row.getCell(colCat)) : "Non Catégorisée";
                    String sousCategorie = colSousCat != null ? getCellValue(row.getCell(colSousCat)) : "Erreur Qualité";
                    String impactStr = colImpact != null ? getCellValue(row.getCell(colImpact)) : "0";

                    if (rdv.isEmpty() || kyn.isEmpty()) {
                        rejected++; continue;
                    }

                    impactStr = impactStr.replaceAll("[^\\d.,-]", "").replace(",", ".");
                    double impact = impactStr.isEmpty() ? 0.0 : Double.parseDouble(impactStr);

                    processRow(rdv, kyn, categorie, sousCategorie, impact);
                    success++;
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

            String colRdv = findColumnName(headerMap, "idrdv", "dossier", "rdv");
            String colKyn = findColumnName(headerMap, "kyn", "idtecnow", "tech", "matricule", "prv_tcnw_id_tech");

            // 🛡️ L'FIX HWA HNA
            String colCat = findColumnNameExact(headerMap, "categorie");
            String colSousCat = findColumnName(headerMap, "sous categorie", "souscategorie", "regle", "description");

            String colImpact = findColumnName(headerMap, "impact", "montant");

            if (colRdv == null || colKyn == null) {
                throw new RuntimeException("Colonnes obligatoires introuvables (ID RDV ou KYN).");
            }

            for (CSVRecord record : parser) {
                total++;
                try {
                    String rdv = record.get(colRdv);
                    String kyn = record.get(colKyn);
                    String categorie = colCat != null && record.isMapped(colCat) ? record.get(colCat) : "Non Catégorisée";
                    String sousCategorie = colSousCat != null && record.isMapped(colSousCat) ? record.get(colSousCat) : "Erreur Qualité";
                    String impactStr = colImpact != null && record.isMapped(colImpact) ? record.get(colImpact) : "0";

                    if (rdv == null || rdv.trim().isEmpty() || kyn == null || kyn.trim().isEmpty()) {
                        rejected++; continue;
                    }

                    impactStr = impactStr.replaceAll("[^\\d.,-]", "").replace(",", ".");
                    double impact = impactStr.isEmpty() ? 0.0 : Double.parseDouble(impactStr);

                    processRow(rdv.trim(), kyn.trim(), categorie.trim(), sousCategorie.trim(), impact);
                    success++;
                } catch (Exception e) {
                    log.error("Erreur ligne {} : {}", total, e.getMessage());
                    rejected++;
                }
            }
        }
        return ImportSummaryDTO.builder().totalLignes(total).lignesInserees(success).lignesRejetees(rejected).message("Importation CSV terminée avec succès.").build();
    }

    private void processRow(String rdv, String rawKyn, String categorie, String sousCategorie, double impact) {
        String kyn = rawKyn.trim().toUpperCase();
        if (kyn.endsWith(".0")) kyn = kyn.substring(0, kyn.length() - 2);
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

        Optional<Technicien> techOpt = technicienRepository.findByMatricule(kyn);
        if (techOpt.isEmpty()) techOpt = technicienRepository.findByMatricule(rawKyn.trim());

        if (techOpt.isEmpty()) {
            throw new RuntimeException("Technicien KYN " + kyn + " introuvable dans la base de données.");
        }
        Technicien technicien = techOpt.get();

        Dossier dossier = dossierRepository.findByReferenceID(rdv)
                .orElseGet(() -> dossierRepository.save(Dossier.builder()
                        .referenceID(rdv)
                        .dateIntervention(LocalDateTime.now())
                        .technicien(technicien)
                        .build()));

        // 🛡️ L'FIX HWA HNA: Sauvegarde dyal Categorie w Sous Categorie
        RegleQualite regle = regleQualiteRepository.findByCodeRegle(sousCategorie)
                .orElseGet(() -> regleQualiteRepository.save(RegleQualite.builder()
                        .codeRegle(sousCategorie)
                        .description(sousCategorie)
                        .categorie(categorie)
                        .penaliteUnitaire(impact)
                        .build()));

        Erreur erreur = Erreur.builder()
                .dateDetection(LocalDateTime.now())
                .impactEstime(impact)
                .statut(StatutErreur.NOUVEAU)
                .echeanceContestation(LocalDateTime.now().plusDays(15))
                .dossier(dossier)
                .regleQualite(regle)
                .build();

        erreurRepository.save(erreur);
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

    private String findColumnName(Map<String, Integer> headers, String... keywords) {
        if (headers == null) return null;
        for (String kw : keywords) {
            String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (String header : headers.keySet()) {
                String clean = header.toLowerCase().replaceAll("[^a-z0-9]", "");
                if (clean.equals(cleanKw)) return header;
            }
        }
        for (String kw : keywords) {
            String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (String header : headers.keySet()) {
                String clean = header.toLowerCase().replaceAll("[^a-z0-9]", "");
                if (clean.contains(cleanKw)) return header;
            }
        }
        return null;
    }

    private Integer findColumnIndex(Map<String, Integer> headers, String... keywords) {
        String colName = findColumnName(headers, keywords);
        return colName != null ? headers.get(colName) : null;
    }

    // 🛡️ JDID: Fonction bach n-jbdou Categorie b Match Exact (bach mat-tkhletch m3a Sous Categorie)
    private String findColumnNameExact(Map<String, Integer> headers, String... keywords) {
        if (headers == null) return null;
        for (String kw : keywords) {
            String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (String header : headers.keySet()) {
                String clean = header.toLowerCase().replaceAll("[^a-z0-9]", "");
                if (clean.equals(cleanKw)) return header;
            }
        }
        return null;
    }

    private Integer findColumnIndexExact(Map<String, Integer> headers, String... keywords) {
        String colName = findColumnNameExact(headers, keywords);
        return colName != null ? headers.get(colName) : null;
    }
}