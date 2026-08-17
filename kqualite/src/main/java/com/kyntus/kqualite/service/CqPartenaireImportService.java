package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.CqPartenaireKpi;
import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Technicien;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.repository.CqPartenaireKpiRepository;
import com.kyntus.kqualite.repository.PartenaireRepository;
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
    private final PartenaireRepository partenaireRepository;

    private static class Stats {
        long p1NumA = 0, p1DenA = 0, p1NumB = 0, p1DenB = 0, p1NumC = 0, p1DenC = 0;
        long hNumA = 0, hDenA = 0, hNumB = 0, hDenB = 0, hNumC = 0, hDenC = 0;
        long cNumA = 0, cDenA = 0, cNumB = 0, cDenB = 0, cNumC = 0, cDenC = 0;
        long p2NumA = 0, p2DenA = 0, p2NumB = 0, p2DenB = 0, p2NumC = 0, p2DenC = 0;
        long sacliNum = 0, sacliDenum = 0;
        long sarcliNum = 0, sarcliDenum = 0;
    }

    // ==========================================
    // 1. IMPORT FICHIER 2 (PLP, HOTLINE, CONST, R2)
    // ==========================================
    @Transactional
    public ImportSummaryDTO importCqPartenaire(MultipartFile file, int month, int year) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        // 🛡️ L'FIX 1: Force Delete (Flush) bach may-doublach l'calcul
        List<CqPartenaireKpi> existing = cqPartenaireKpiRepository.findByMoisAndAnnee(month, year);
        List<CqPartenaireKpi> toDelete = new ArrayList<>();
        for (CqPartenaireKpi kpi : existing) {
            if (!kpi.getIndicateur().equals("SACLI") && !kpi.getIndicateur().equals("SARCLI")) {
                toDelete.add(kpi);
            }
        }
        cqPartenaireKpiRepository.deleteAll(toDelete);
        cqPartenaireKpiRepository.flush(); // Y-msse7 db 9bel may-kml

        Map<Partenaire, Stats> statsMap = new HashMap<>();
        Map<String, Technicien> techMap = loadTechniciensMap();

        Partenaire inconnu = partenaireRepository.findByNomEntrepriseIgnoreCase("INCONNU")
                .orElseGet(() -> partenaireRepository.save(Partenaire.builder().nomEntreprise("INCONNU").referenceContrat("AUTO-INCONNU").build()));

        int[] counts;

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                counts = processExcelFichier2(file, statsMap, techMap, inconnu);
            } else {
                counts = processCsvFichier2(file, statsMap, techMap, inconnu);
            }
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        int total = counts[0];
        int success = counts[1];
        int rejected = counts[2];

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
        }

        cqPartenaireKpiRepository.saveAll(archivesToSave);

        return ImportSummaryDTO.builder().totalLignes(total).lignesInserees(success).lignesRejetees(rejected).message("Calculs CQ Partenaire terminés").build();
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
        Partenaire inconnu = partenaireRepository.findByNomEntrepriseIgnoreCase("INCONNU")
                .orElseGet(() -> partenaireRepository.save(Partenaire.builder().nomEntreprise("INCONNU").referenceContrat("AUTO-INCONNU").build()));

        int[] counts;

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                counts = processExcelSacliSarcli(file, statsMap, techMap, inconnu, isSacli);
            } else {
                counts = processCsvSacliSarcli(file, statsMap, techMap, inconnu, isSacli);
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
    private int[] processExcelFichier2(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu) throws Exception {
        int total = 0, success = 0, rejected = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Fichier vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());

            // 🛡️ L'FIX 2: Recherche EXACTE b7al l'App 1
            Integer colKyn = null, colZone = null, colRang = null, colStatut = null;
            for (String header : headerMap.keySet()) {
                if (header.contains("prv_tcnw_id_tech") || header.contains("idtecnow") || header.contains("kyn")) colKyn = headerMap.get(header);
                else if (header.contains("zone_statut prise")) colZone = headerMap.get(header);
                else if (header.contains("rang_rdv") && header.contains("(copie)")) colRang = headerMap.get(header);
                else if (header.contains("grp_statut_crinstall_mnt")) colStatut = headerMap.get(header);
            }

            if (colZone == null || colRang == null || colStatut == null) throw new RuntimeException("Colonnes introuvables.");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                String kyn = colKyn != null ? getCellValue(row.getCell(colKyn)) : "";
                String zone = getCellValue(row.getCell(colZone));
                String rang = getCellValue(row.getCell(colRang));
                String statut = getCellValue(row.getCell(colStatut));

                processRowLogicFichier2(kyn, zone, rang, statut, statsMap, techMap, inconnu);
                success++;
            }
        }
        return new int[]{total, success, rejected};
    }

    private int[] processCsvFichier2(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu) throws Exception {
        int total = 0, success = 0, rejected = 0;
        char delimiter = detectDelimiter(file);
        CSVFormat format = CSVFormat.Builder.create().setDelimiter(delimiter).setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();

            // 🛡️ L'FIX 2: Recherche EXACTE b7al l'App 1
            String colKyn = null, colZone = null, colRang = null, colStatut = null;
            for (String header : headerMap.keySet()) {
                String cleanHeader = header.trim().toLowerCase();
                if (cleanHeader.contains("prv_tcnw_id_tech") || cleanHeader.contains("idtecnow") || cleanHeader.contains("kyn")) colKyn = header;
                else if (cleanHeader.contains("zone_statut prise")) colZone = header;
                else if (cleanHeader.contains("rang_rdv") && cleanHeader.contains("(copie)")) colRang = header;
                else if (cleanHeader.contains("grp_statut_crinstall_mnt")) colStatut = header;
            }

            if (colZone == null || colRang == null || colStatut == null) throw new RuntimeException("Colonnes introuvables.");

            for (CSVRecord record : parser) {
                total++;
                String kyn = colKyn != null && record.isMapped(colKyn) ? record.get(colKyn) : "";
                String zone = record.get(colZone);
                String rang = record.get(colRang);
                String statut = record.get(colStatut);

                processRowLogicFichier2(kyn, zone, rang, statut, statsMap, techMap, inconnu);
                success++;
            }
        }
        return new int[]{total, success, rejected};
    }

    // ==========================================
    // 🛠️ MOTEURS DE LECTURE (SACLI / SARCLI)
    // ==========================================
    private int[] processExcelSacliSarcli(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu, boolean isSacli) throws Exception {
        int total = 0, success = 0, rejected = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Fichier vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());

            Integer colKyn = null, colValr = null;
            for (String header : headerMap.keySet()) {
                if (header.contains("nom_technicien") || header.contains("nomtechnicien") || header.contains("prv_tcnw_id_tech") || header.contains("kyn")) colKyn = headerMap.get(header);
                else if (header.contains("valr not glbl") || header.contains("valeur") || header.contains("note")) colValr = headerMap.get(header);
            }

            if (colValr == null) throw new RuntimeException("Colonne valeur introuvable.");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                String kyn = colKyn != null ? getCellValue(row.getCell(colKyn)) : "";
                String valr = getCellValue(row.getCell(colValr));

                processRowLogicSacliSarcli(kyn, valr, statsMap, techMap, inconnu, isSacli);
                success++;
            }
        }
        return new int[]{total, success, rejected};
    }

    private int[] processCsvSacliSarcli(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu, boolean isSacli) throws Exception {
        int total = 0, success = 0, rejected = 0;
        char delimiter = detectDelimiter(file);
        CSVFormat format = CSVFormat.Builder.create().setDelimiter(delimiter).setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();
            String colKyn = null, colValr = null;
            for (String header : headerMap.keySet()) {
                String cleanHeader = header.trim().toLowerCase();
                if (cleanHeader.contains("nom_technicien") || cleanHeader.contains("nomtechnicien") || cleanHeader.contains("prv_tcnw_id_tech") || cleanHeader.contains("kyn")) colKyn = header;
                else if (cleanHeader.contains("valr not glbl") || cleanHeader.contains("valeur") || cleanHeader.contains("note")) colValr = header;
            }

            if (colValr == null) throw new RuntimeException("Colonne valeur introuvable.");

            for (CSVRecord record : parser) {
                total++;
                String kyn = colKyn != null && record.isMapped(colKyn) ? record.get(colKyn) : "";
                String valr = record.get(colValr);

                processRowLogicSacliSarcli(kyn, valr, statsMap, techMap, inconnu, isSacli);
                success++;
            }
        }
        return new int[]{total, success, rejected};
    }

    // ==========================================
    // ⚙️ LOGIQUE METIER (EXACTEMENT COMME L'APP 1)
    // ==========================================
    private void processRowLogicFichier2(String rawKyn, String rawZone, String rawRang, String rawStatut, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu) {

        Partenaire partenaire = inconnu;

        if (rawKyn != null && !rawKyn.trim().isEmpty()) {
            String kyn = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

            Technicien technicien = techMap.get(kyn);
            if (technicien == null) technicien = techMap.get(rawKyn.trim().toUpperCase());

            if (technicien != null) {
                partenaire = technicien.getPartenaire();
            }
        }

        statsMap.putIfAbsent(partenaire, new Stats());
        Stats s = statsMap.get(partenaire);

        String rang = rawRang != null ? rawRang.trim() : "";
        String zone = rawZone != null ? rawZone.toUpperCase().replaceAll("[\\n\\r]+", " ").replaceAll("\\s+", " ").trim() : "";
        String statut = rawStatut != null ? rawStatut.toUpperCase().trim() : "";

        boolean isRang1 = rang.equals("1") || rang.equals("1.0") || rang.equals("1,0");
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
        } else if (!rang.isEmpty()) {
            if (zone.contains("ZONE A")) { s.p2DenA++; if(isCrOk) s.p2NumA++; }
            if (zone.contains("ZONE B")) { s.p2DenB++; if(isCrOk) s.p2NumB++; }
            if (zone.contains("ZONE C")) { s.p2DenC++; if(isCrOk) s.p2NumC++; }
        }
    }

    private void processRowLogicSacliSarcli(String rawKyn, String rawValr, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu, boolean isSacli) {
        Partenaire partenaire = inconnu;

        if (rawKyn != null && !rawKyn.trim().isEmpty()) {
            String kyn = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

            Technicien technicien = techMap.get(kyn);
            if (technicien == null) technicien = techMap.get(rawKyn.trim().toUpperCase());

            if (technicien != null) {
                partenaire = technicien.getPartenaire();
            }
        }

        statsMap.putIfAbsent(partenaire, new Stats());
        Stats s = statsMap.get(partenaire);

        String valr = rawValr != null ? rawValr.trim() : "";
        boolean isValr5 = valr.equals("5") || valr.equals("5.0") || valr.equals("5,0");
        boolean isValr4 = valr.equals("4") || valr.equals("4.0") || valr.equals("4,0");

        if (isSacli) {
            s.sacliDenum++;
            if (isValr5) s.sacliNum++;
        } else {
            s.sarcliDenum++;
            if (isValr4 || isValr5) s.sarcliNum++;
        }
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
            default: return "";
        }
    }
}