package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.CqLigneDetail;
import com.kyntus.kqualite.domain.CqPartenaireKpi;
import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Technicien;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.repository.CqLigneDetailRepository;
import com.kyntus.kqualite.repository.CqPartenaireKpiRepository;
import com.kyntus.kqualite.repository.TechnicienRepository;
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
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CqPartenaireImportService {

    private final CqPartenaireKpiRepository cqPartenaireKpiRepository;
    private final TechnicienRepository technicienRepository;
    private final CqLigneDetailRepository cqLigneDetailRepository; // 🛡️ JDID: Bach n-sauvegardew l'historique dyal TNH

    private static class Stats {
        long p1NumA = 0, p1DenA = 0, p1NumB = 0, p1DenB = 0, p1NumC = 0, p1DenC = 0;
        long hNumA = 0, hDenA = 0, hNumB = 0, hDenB = 0, hNumC = 0, hDenC = 0;
        long cNumA = 0, cDenA = 0, cNumB = 0, cDenB = 0, cNumC = 0, cDenC = 0;
        long p2NumA = 0, p2DenA = 0, p2NumB = 0, p2DenB = 0, p2NumC = 0, p2DenC = 0;
        long sacliNum = 0, sacliDenum = 0;
        long sarcliNum = 0, sarcliDenum = 0;
        long tnhNum = 0, tnhDenum = 0; // 🛡️ JDID: Compteurs dyal TNH
    }

    // ==========================================
    // 1. IMPORT FICHIER 2 (PLP, HOTLINE, CONST, R2, TNH)
    // ==========================================
    @Transactional
    public ImportSummaryDTO importCqPartenaire(MultipartFile file, int month, int year) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        // 🛡️ L'FIX HWA HNA: N-ms7ou ghir les indicateurs dyal Fichier 2 (b fihom TNH)
        List<String> f2Indicateurs = Arrays.asList("PLP", "HOTLINE", "CONSTRUCTION", "RANG_2", "TNH");
        List<CqPartenaireKpi> existing = cqPartenaireKpiRepository.findByMoisAndAnnee(month, year);
        List<CqPartenaireKpi> toDelete = new ArrayList<>();
        for (CqPartenaireKpi kpi : existing) {
            if (f2Indicateurs.contains(kpi.getIndicateur())) {
                toDelete.add(kpi);
            }
        }
        cqPartenaireKpiRepository.deleteAll(toDelete);
        cqPartenaireKpiRepository.flush();

        // N-ms7ou l'historique l9dim dyal TNH
        cqLigneDetailRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "TNH");

        Map<Partenaire, Stats> statsMap = new HashMap<>();
        List<CqLigneDetail> detailsToSave = new ArrayList<>(); // 🛡️ JDID: Liste dyal l'historique TNH
        Map<String, Technicien> techMap = loadTechniciensMap();
        int[] counts;

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                counts = processExcelFichier2(file, statsMap, detailsToSave, techMap, month, year);
            } else {
                counts = processCsvFichier2(file, statsMap, detailsToSave, techMap, month, year);
            }
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        List<CqPartenaireKpi> archivesToSave = new ArrayList<>();
        for (Map.Entry<Partenaire, Stats> entry : statsMap.entrySet()) {
            Partenaire p = entry.getKey();
            Stats s = entry.getValue();

            archivesToSave.add(buildKpi(p, month, year, "PLP", "A", s.p1NumA, s.p1DenA));
            archivesToSave.add(buildKpi(p, month, year, "PLP", "B", s.p1NumB, s.p1DenB));
            archivesToSave.add(buildKpi(p, month, year, "PLP", "C", s.p1NumC, s.p1DenC));

            archivesToSave.add(buildKpi(p, month, year, "HOTLINE", "A", s.hNumA, s.hDenA));
            archivesToSave.add(buildKpi(p, month, year, "HOTLINE", "B", s.hNumB, s.hDenB));
            archivesToSave.add(buildKpi(p, month, year, "HOTLINE", "C", s.hNumC, s.hDenC));

            archivesToSave.add(buildKpi(p, month, year, "CONSTRUCTION", "A", s.cNumA, s.cDenA));
            archivesToSave.add(buildKpi(p, month, year, "CONSTRUCTION", "B", s.cNumB, s.cDenB));
            archivesToSave.add(buildKpi(p, month, year, "CONSTRUCTION", "C", s.cNumC, s.cDenC));

            archivesToSave.add(buildKpi(p, month, year, "RANG_2", "A", s.p2NumA, s.p2DenA));
            archivesToSave.add(buildKpi(p, month, year, "RANG_2", "B", s.p2NumB, s.p2DenB));
            archivesToSave.add(buildKpi(p, month, year, "RANG_2", "C", s.p2NumC, s.p2DenC));

            // 🛡️ JDID: Sauvegarde dyal l'indicateur TNH
            archivesToSave.add(buildKpi(p, month, year, "TNH", "GLOBAL", s.tnhNum, s.tnhDenum));
        }

        cqPartenaireKpiRepository.saveAll(archivesToSave);
        cqLigneDetailRepository.saveAll(detailsToSave); // 🛡️ JDID: Sauvegarde dyal l'historique TNH

        return ImportSummaryDTO.builder().totalLignes(counts[0]).lignesInserees(counts[1]).lignesRejetees(counts[2]).message("Calculs Fichier 2 terminés").build();
    }

    // ==========================================
    // 2. IMPORT SACLI & SARCLI
    // ==========================================
    @Transactional
    public ImportSummaryDTO importSacliSarcli(MultipartFile file, int month, int year, boolean isSacli) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String indicateur = isSacli ? "SACLI" : "SARCLI";

        List<CqPartenaireKpi> existing = cqPartenaireKpiRepository.findByMoisAndAnnee(month, year);
        List<CqPartenaireKpi> toDelete = new ArrayList<>();
        for (CqPartenaireKpi kpi : existing) {
            if (kpi.getIndicateur().equals(indicateur)) toDelete.add(kpi);
        }
        cqPartenaireKpiRepository.deleteAll(toDelete);
        cqPartenaireKpiRepository.flush();

        Map<Partenaire, Stats> statsMap = new HashMap<>();
        Map<String, Technicien> techMap = loadTechniciensMap();
        int[] counts;

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                counts = processExcelSacliSarcli(file, statsMap, techMap, isSacli);
            } else {
                counts = processCsvSacliSarcli(file, statsMap, techMap, isSacli);
            }
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        List<CqPartenaireKpi> archivesToSave = new ArrayList<>();
        for (Map.Entry<Partenaire, Stats> entry : statsMap.entrySet()) {
            Partenaire p = entry.getKey();
            Stats s = entry.getValue();
            long num = isSacli ? s.sacliNum : s.sarcliNum;
            long denum = isSacli ? s.sacliDenum : s.sarcliDenum;
            archivesToSave.add(buildKpi(p, month, year, indicateur, "GLOBAL", num, denum));
        }

        cqPartenaireKpiRepository.saveAll(archivesToSave);

        return ImportSummaryDTO.builder().totalLignes(counts[0]).lignesInserees(counts[1]).lignesRejetees(counts[2]).message("Calculs " + indicateur + " terminés").build();
    }

    // ==========================================
    // 🛠️ MOTEURS DE LECTURE (Fichier 2)
    // ==========================================
    private int[] processExcelFichier2(MultipartFile file, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> detailsToSave, Map<String, Technicien> techMap, int month, int year) throws Exception {
        int total = 0, success = 0, rejected = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Fichier vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());

            Integer colKyn = findColumnIndex(headerMap, "prv_tcnw_id_tech", "idtecnow", "matricule", "kyn", "tech");
            Integer colZone = findColumnIndex(headerMap, "zone_statut prise", "zone");
            Integer colRang = findColumnIndex(headerMap, "rang_rdv", "rang");
            Integer colStatut = findColumnIndex(headerMap, "grp_statut_crinstall_mnt", "statut");

            // 🛡️ JDID: Colonnes dyal TNH
            Integer colCohorte = findColumnIndex(headerMap, "cohorte rdv racc", "cohorte");
            Integer colMotif = findColumnIndex(headerMap, "motf_ko_cr_inst_first_crinstall_mnt", "motf_ko", "motif");
            Integer colRef = findColumnIndex(headerMap, "lib ref erdv", "lib_ref", "reference");

            if (colKyn == null || colZone == null || colRang == null || colStatut == null) throw new RuntimeException("Colonnes introuvables.");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                String kyn = getCellValue(row.getCell(colKyn));
                String zone = getCellValue(row.getCell(colZone));
                String rang = getCellValue(row.getCell(colRang));
                String statut = getCellValue(row.getCell(colStatut));

                String cohorte = colCohorte != null ? getCellValue(row.getCell(colCohorte)) : "";
                String motif = colMotif != null ? getCellValue(row.getCell(colMotif)) : "";
                String ref = colRef != null ? getCellValue(row.getCell(colRef)) : "";

                if (processRowLogicFichier2(kyn, zone, rang, statut, cohorte, motif, ref, statsMap, detailsToSave, techMap, month, year)) success++; else rejected++;
            }
        }
        return new int[]{total, success, rejected};
    }

    private int[] processCsvFichier2(MultipartFile file, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> detailsToSave, Map<String, Technicien> techMap, int month, int year) throws Exception {
        int total = 0, success = 0, rejected = 0;
        char delimiter = detectDelimiter(file);
        CSVFormat format = CSVFormat.Builder.create().setDelimiter(delimiter).setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();
            String colKyn = findColumnName(headerMap, "prv_tcnw_id_tech", "idtecnow", "matricule", "kyn", "tech");
            String colZone = findColumnName(headerMap, "zone_statut prise", "zone");
            String colRang = findColumnName(headerMap, "rang_rdv", "rang");
            String colStatut = findColumnName(headerMap, "grp_statut_crinstall_mnt", "statut");

            // 🛡️ JDID: Colonnes dyal TNH
            String colCohorte = findColumnName(headerMap, "cohorte rdv racc", "cohorte");
            String colMotif = findColumnName(headerMap, "motf_ko_cr_inst_first_crinstall_mnt", "motf_ko", "motif");
            String colRef = findColumnName(headerMap, "lib ref erdv", "lib_ref", "reference");

            if (colKyn == null || colZone == null || colRang == null || colStatut == null) throw new RuntimeException("Colonnes introuvables.");

            for (CSVRecord record : parser) {
                total++;
                String kyn = record.get(colKyn);
                String zone = record.get(colZone);
                String rang = record.get(colRang);
                String statut = record.get(colStatut);

                String cohorte = colCohorte != null && record.isMapped(colCohorte) ? record.get(colCohorte) : "";
                String motif = colMotif != null && record.isMapped(colMotif) ? record.get(colMotif) : "";
                String ref = colRef != null && record.isMapped(colRef) ? record.get(colRef) : "";

                if (processRowLogicFichier2(kyn, zone, rang, statut, cohorte, motif, ref, statsMap, detailsToSave, techMap, month, year)) success++; else rejected++;
            }
        }
        return new int[]{total, success, rejected};
    }

    // ==========================================
    // 🛠️ MOTEURS DE LECTURE (SACLI / SARCLI)
    // ==========================================
    private int[] processExcelSacliSarcli(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, boolean isSacli) throws Exception {
        int total = 0, success = 0, rejected = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Fichier vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());

            Integer colKyn = findColumnIndex(headerMap, "nom_technicien", "nomtechnicien", "prv_tcnw_id_tech", "kyn");
            Integer colValr = findColumnIndex(headerMap, "valr not glbl", "valeur", "note");

            if (colValr == null) throw new RuntimeException("Colonne valeur introuvable.");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                String kyn = colKyn != null ? getCellValue(row.getCell(colKyn)) : "";
                String valr = getCellValue(row.getCell(colValr));

                if (processRowLogicSacliSarcli(kyn, valr, statsMap, techMap, isSacli)) success++; else rejected++;
            }
        }
        return new int[]{total, success, rejected};
    }

    private int[] processCsvSacliSarcli(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, boolean isSacli) throws Exception {
        int total = 0, success = 0, rejected = 0;
        char delimiter = detectDelimiter(file);
        CSVFormat format = CSVFormat.Builder.create().setDelimiter(delimiter).setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();
            String colKyn = findColumnName(headerMap, "nom_technicien", "nomtechnicien", "prv_tcnw_id_tech", "kyn");
            String colValr = findColumnName(headerMap, "valr not glbl", "valeur", "note");

            if (colValr == null) throw new RuntimeException("Colonne valeur introuvable.");

            for (CSVRecord record : parser) {
                total++;
                String kyn = colKyn != null && record.isMapped(colKyn) ? record.get(colKyn) : "";
                String valr = record.get(colValr);

                if (processRowLogicSacliSarcli(kyn, valr, statsMap, techMap, isSacli)) success++; else rejected++;
            }
        }
        return new int[]{total, success, rejected};
    }

    // ==========================================
    // ⚙️ LOGIQUE METIER (AVEC TNH)
    // ==========================================
    private boolean processRowLogicFichier2(String rawKyn, String rawZone, String rawRang, String rawStatut, String cohorte, String motif, String ref, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> detailsToSave, Map<String, Technicien> techMap, int month, int year) {
        if (rawKyn == null || rawKyn.trim().isEmpty()) return false;

        String kyn = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

        Technicien technicien = techMap.get(kyn);
        if (technicien == null) technicien = techMap.get(rawKyn.trim().toUpperCase());
        if (technicien == null) return false;

        Partenaire partenaire = technicien.getPartenaire();
        statsMap.putIfAbsent(partenaire, new Stats());
        Stats s = statsMap.get(partenaire);

        // 1. LOGIQUE PLP, HOTLINE, CONSTRUCTION, RANG 2
        String rang = rawRang != null ? rawRang.trim() : "";
        String zone = rawZone != null ? rawZone.toUpperCase().replaceAll("[\\s\\xA0]+", " ").trim() : "";
        String statut = rawStatut != null ? rawStatut.toUpperCase().replaceAll("[\\s\\xA0]+", " ").trim() : "";

        boolean isRang1 = isNumericValue(rawRang, 1.0);
        boolean isCrOk = statut.equals("CR_MNT_OK");

        if (isRang1) {
            if (zone.equals("PLP ZONE A")) { s.p1DenA++; if(isCrOk) s.p1NumA++; }
            if (zone.equals("PLP ZONE B")) { s.p1DenB++; if(isCrOk) s.p1NumB++; }
            if (zone.equals("PLP ZONE C")) { s.p1DenC++; if(isCrOk) s.p1NumC++; }

            if (zone.equals("HOTLINE ZONE A")) { s.hDenA++; if(isCrOk) s.hNumA++; }
            if (zone.equals("HOTLINE ZONE B")) { s.hDenB++; if(isCrOk) s.hNumB++; }
            if (zone.equals("HOTLINE ZONE C")) { s.hDenC++; if(isCrOk) s.hNumC++; }

            if (zone.equals("CONSTRUCTION ZONE A")) { s.cDenA++; if(isCrOk) s.cNumA++; }
            if (zone.equals("CONSTRUCTION ZONE B")) { s.cDenB++; if(isCrOk) s.cNumB++; }
            if (zone.equals("CONSTRUCTION ZONE C")) { s.cDenC++; if(isCrOk) s.cNumC++; }
        } else if (rawRang != null && !rawRang.trim().isEmpty()) {
            if (zone.contains("ZONE A")) { s.p2DenA++; if(isCrOk) s.p2NumA++; }
            if (zone.contains("ZONE B")) { s.p2DenB++; if(isCrOk) s.p2NumB++; }
            if (zone.contains("ZONE C")) { s.p2DenC++; if(isCrOk) s.p2NumC++; }
        }

        // 🛡️ 2. LOGIQUE TNH
        if (cohorte != null && !cohorte.trim().isEmpty()) {
            s.tnhDenum++;
            if (motif != null && motif.trim().equalsIgnoreCase("CR DELAI - Organisation installateur")) {
                s.tnhNum++;
            }

            // Sauvegarde dyal l'historique (Raw Data)
            detailsToSave.add(CqLigneDetail.builder()
                    .mois(month).annee(year).indicateur("TNH").partenaire(partenaire)
                    .kyn(kyn).reference(ref).champ1(motif).build());
        }

        return true;
    }

    private boolean processRowLogicSacliSarcli(String rawKyn, String rawValr, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, boolean isSacli) {
        if (rawKyn == null || rawKyn.trim().isEmpty()) return false;

        String kyn = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

        Technicien technicien = techMap.get(kyn);
        if (technicien == null) technicien = techMap.get(rawKyn.trim().toUpperCase());
        if (technicien == null) return false;

        Partenaire partenaire = technicien.getPartenaire();
        statsMap.putIfAbsent(partenaire, new Stats());
        Stats s = statsMap.get(partenaire);

        boolean isValr5 = isNumericValue(rawValr, 5.0);
        boolean isValr4 = isNumericValue(rawValr, 4.0);

        if (isSacli) {
            s.sacliDenum++;
            if (isValr5) s.sacliNum++;
        } else {
            s.sarcliDenum++;
            if (isValr4 || isValr5) s.sarcliNum++;
        }
        return true;
    }

    // ==========================================
    // 🛠️ HELPERS
    // ==========================================
    private Map<String, Technicien> loadTechniciensMap() {
        List<Technicien> allTechs = technicienRepository.findAll();
        Map<String, Technicien> map = new HashMap<>();
        for (Technicien t : allTechs) {
            if (t.getMatricule() != null) {
                String cleanMatricule = t.getMatricule().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                if (!cleanMatricule.startsWith("KYN")) cleanMatricule = "KYN" + cleanMatricule;
                map.put(cleanMatricule, t);
            }
        }
        return map;
    }

    private CqPartenaireKpi buildKpi(Partenaire p, int month, int year, String indicateur, String zone, long num, long denum) {
        double resultat = denum > 0 ? Math.round((((double) num / denum) * 100) * 100.0) / 100.0 : 0.0;
        return CqPartenaireKpi.builder().partenaire(p).mois(month).annee(year).indicateur(indicateur).zone(zone).num(num).denum(denum).resultat(resultat).bonus(0.0).build();
    }

    private char detectDelimiter(MultipartFile file) throws Exception {
        BufferedReader brTest = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
        String firstLine = brTest.readLine();
        brTest.close();
        if (firstLine != null && firstLine.contains(",") && !firstLine.contains(";")) return ',';
        return ';';
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

    private boolean isNumericValue(String raw, double target) {
        if (raw == null || raw.trim().isEmpty()) return false;
        try {
            String clean = raw.replaceAll("[^\\d.,-]", "").replace(",", ".");
            double val = Double.parseDouble(clean);
            return Math.abs(val - target) < 0.001;
        } catch (Exception e) {
            return false;
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
}