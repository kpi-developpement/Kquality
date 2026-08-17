package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.CqPartenaireKpi;
import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Technicien;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
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

    private static class Stats {
        long p1NumA = 0, p1DenA = 0, p1NumB = 0, p1DenB = 0, p1NumC = 0, p1DenC = 0;
        long hNumA = 0, hDenA = 0, hNumB = 0, hDenB = 0, hNumC = 0, hDenC = 0;
        long cNumA = 0, cDenA = 0, cNumB = 0, cDenB = 0, cNumC = 0, cDenC = 0;
        long p2NumA = 0, p2DenA = 0, p2NumB = 0, p2DenB = 0, p2NumC = 0, p2DenC = 0;
    }

    @Transactional
    public ImportSummaryDTO importCqPartenaire(MultipartFile file, int month, int year) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        cqPartenaireKpiRepository.deleteByMoisAndAnnee(month, year);

        Map<Partenaire, Stats> statsMap = new HashMap<>();
        int total = 0, success = 0, rejected = 0;

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                processExcel(file, statsMap);
            } else {
                processCsv(file, statsMap);
            }
        } catch (Exception e) {
            log.error("Erreur globale d'importation CQ Partenaire", e);
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
        }

        cqPartenaireKpiRepository.saveAll(archivesToSave);

        return ImportSummaryDTO.builder()
                .totalLignes(total)
                .lignesInserees(archivesToSave.size())
                .lignesRejetees(0)
                .message("Calculs CQ Partenaire terminés pour " + month + "/" + year)
                .build();
    }

    private void processExcel(MultipartFile file, Map<Partenaire, Stats> statsMap) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Le fichier Excel est vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) {
                headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());
            }

            // 🛡️ L'FIX HWA HNA: Zedt prv_tcnw_id_tech
            Integer colKyn = findColumnIndex(headerMap, "kyn", "idtecnow", "tech", "matricule", "prv_tcnw_id_tech");
            Integer colZone = findColumnIndex(headerMap, "zone_statut prise", "zone");
            Integer colRang = findColumnIndex(headerMap, "rang_rdv", "rang");
            Integer colStatut = findColumnIndex(headerMap, "grp_statut_crinstall_mnt", "statut");

            if (colKyn == null || colZone == null || colRang == null || colStatut == null) {
                List<String> missing = new ArrayList<>();
                if (colKyn == null) missing.add("KYN/TECH");
                if (colZone == null) missing.add("ZONE");
                if (colRang == null) missing.add("RANG");
                if (colStatut == null) missing.add("STATUT");
                throw new RuntimeException("Colonnes introuvables : " + missing + ". Headers détectés dans votre fichier : " + headerMap.keySet());
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String kyn = getCellValue(row.getCell(colKyn));
                String zone = getCellValue(row.getCell(colZone));
                String rang = getCellValue(row.getCell(colRang));
                String statut = getCellValue(row.getCell(colStatut));

                processRowLogic(kyn, zone, rang, statut, statsMap);
            }
        }
    }

    private void processCsv(MultipartFile file, Map<Partenaire, Stats> statsMap) throws Exception {
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

            // 🛡️ L'FIX HWA HNA: Zedt prv_tcnw_id_tech
            String colKyn = findColumnName(headerMap, "kyn", "idtecnow", "tech", "matricule", "prv_tcnw_id_tech");
            String colZone = findColumnName(headerMap, "zone_statut prise", "zone");
            String colRang = findColumnName(headerMap, "rang_rdv", "rang");
            String colStatut = findColumnName(headerMap, "grp_statut_crinstall_mnt", "statut");

            if (colKyn == null || colZone == null || colRang == null || colStatut == null) {
                List<String> missing = new ArrayList<>();
                if (colKyn == null) missing.add("KYN/TECH");
                if (colZone == null) missing.add("ZONE");
                if (colRang == null) missing.add("RANG");
                if (colStatut == null) missing.add("STATUT");
                throw new RuntimeException("Colonnes introuvables : " + missing + ". Headers détectés dans votre fichier : " + headerMap.keySet());
            }

            for (CSVRecord record : parser) {
                String kyn = record.get(colKyn);
                String zone = record.get(colZone);
                String rang = record.get(colRang);
                String statut = record.get(colStatut);

                processRowLogic(kyn, zone, rang, statut, statsMap);
            }
        }
    }

    private void processRowLogic(String rawKyn, String rawZone, String rawRang, String rawStatut, Map<Partenaire, Stats> statsMap) {
        if (rawKyn == null || rawKyn.trim().isEmpty()) return;

        String kyn = rawKyn.trim().toUpperCase();
        if (kyn.endsWith(".0")) kyn = kyn.substring(0, kyn.length() - 2);
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;

        Optional<Technicien> techOpt = technicienRepository.findByMatricule(kyn);
        if (techOpt.isEmpty()) techOpt = technicienRepository.findByMatricule(rawKyn.trim());
        if (techOpt.isEmpty()) return;

        Partenaire partenaire = techOpt.get().getPartenaire();
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

    private CqPartenaireKpi buildKpi(Partenaire p, int month, int year, String indicateur, String zone, long num, long denum) {
        double resultat = denum > 0 ? Math.round((((double) num / denum) * 100) * 100.0) / 100.0 : 0.0;
        return CqPartenaireKpi.builder()
                .partenaire(p)
                .mois(month)
                .annee(year)
                .indicateur(indicateur)
                .zone(zone)
                .num(num)
                .denum(denum)
                .resultat(resultat)
                .bonus(0.0)
                .build();
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: return String.valueOf(cell.getNumericCellValue());
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