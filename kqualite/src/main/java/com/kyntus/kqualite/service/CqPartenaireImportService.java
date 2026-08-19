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
        long tnhNum = 0, tnhDenum = 0;

        long savSatcliNum = 0, savSatcliDenum = 0;
        long secuNum = 0, secuDenum = 0;
        long savTnhNum = 0, savTnhDenum = 0;

        // 🛡️ JDID: Les compteurs dyal CCR w SAV PERF
        long ccrNum = 0, ccrDenum = 0;
        long savPerfNum = 0, savPerfDenum = 0;
    }

    // ==========================================
    // 1. IMPORT FICHIER 2 (PLP, HOTLINE, CONST, R2, TNH)
    // ==========================================
    @Transactional
    public ImportSummaryDTO importCqPartenaire(MultipartFile file, int month, int year) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        List<String> f2Indicateurs = Arrays.asList("PLP", "HOTLINE", "CONSTRUCTION", "RANG_2", "TNH");
        List<CqPartenaireKpi> existing = cqPartenaireKpiRepository.findByMoisAndAnnee(month, year);
        List<CqPartenaireKpi> toDelete = new ArrayList<>();
        for (CqPartenaireKpi kpi : existing) {
            if (f2Indicateurs.contains(kpi.getIndicateur())) toDelete.add(kpi);
        }
        cqPartenaireKpiRepository.deleteAll(toDelete);
        cqPartenaireKpiRepository.flush();

        Map<Partenaire, Stats> statsMap = new HashMap<>();
        Map<String, Technicien> techMap = loadTechniciensMap();
        Partenaire inconnu = partenaireRepository.findByNomEntrepriseIgnoreCase("INCONNU")
                .orElseGet(() -> partenaireRepository.save(Partenaire.builder().nomEntreprise("INCONNU").referenceContrat("AUTO-INCONNU").build()));

        int[] counts;
        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) counts = processExcelFichier2(file, statsMap, techMap, inconnu);
            else counts = processCsvFichier2(file, statsMap, techMap, inconnu);
        } catch (Exception e) { throw new RuntimeException(e.getMessage()); }

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

            archivesToSave.add(buildKpi(p, month, year, "TNH", "GLOBAL", s.tnhNum, s.tnhDenum));
        }

        cqPartenaireKpiRepository.saveAll(archivesToSave);
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
        Partenaire inconnu = partenaireRepository.findByNomEntrepriseIgnoreCase("INCONNU")
                .orElseGet(() -> partenaireRepository.save(Partenaire.builder().nomEntreprise("INCONNU").referenceContrat("AUTO-INCONNU").build()));

        int[] counts;
        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) counts = processExcelSacliSarcli(file, statsMap, techMap, inconnu, isSacli);
            else counts = processCsvSacliSarcli(file, statsMap, techMap, inconnu, isSacli);
        } catch (Exception e) { throw new RuntimeException(e.getMessage()); }

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
    // 3. IMPORT SAV (SATCLI, SECU, TNH SAV, CCR, PERF)
    // ==========================================
    @Transactional
    public ImportSummaryDTO importSav(MultipartFile file, int month, int year) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        // 🛡️ JDID: Zedt CCR w SAV_PERF f l'liste dyal l'msi7
        List<String> savIndicateurs = Arrays.asList("SATCLI_SAV", "SECURISATION", "TNH_SAV", "CCR", "SAV_PERF");
        List<CqPartenaireKpi> existing = cqPartenaireKpiRepository.findByMoisAndAnnee(month, year);
        List<CqPartenaireKpi> toDelete = new ArrayList<>();
        for (CqPartenaireKpi kpi : existing) {
            if (savIndicateurs.contains(kpi.getIndicateur())) toDelete.add(kpi);
        }
        cqPartenaireKpiRepository.deleteAll(toDelete);
        cqPartenaireKpiRepository.flush();

        Map<Partenaire, Stats> statsMap = new HashMap<>();
        Map<String, Technicien> techMap = loadTechniciensMap();
        Partenaire inconnu = partenaireRepository.findByNomEntrepriseIgnoreCase("INCONNU")
                .orElseGet(() -> partenaireRepository.save(Partenaire.builder().nomEntreprise("INCONNU").referenceContrat("AUTO-INCONNU").build()));

        int[] counts;
        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) counts = processExcelSav(file, statsMap, techMap, inconnu);
            else counts = processCsvSav(file, statsMap, techMap, inconnu);
        } catch (Exception e) {
            log.error("❌ Erreur CRITIQUE Import SAV: ", e);
            throw new RuntimeException(e.getMessage());
        }

        List<CqPartenaireKpi> archivesToSave = new ArrayList<>();
        for (Map.Entry<Partenaire, Stats> entry : statsMap.entrySet()) {
            Partenaire p = entry.getKey();
            Stats s = entry.getValue();

            archivesToSave.add(buildKpi(p, month, year, "SATCLI_SAV", "GLOBAL", s.savSatcliNum, s.savSatcliDenum));
            archivesToSave.add(buildKpi(p, month, year, "SECURISATION", "GLOBAL", s.secuNum, s.secuDenum));
            archivesToSave.add(buildKpi(p, month, year, "TNH_SAV", "GLOBAL", s.savTnhNum, s.savTnhDenum));

            // 🛡️ JDID: Sauvegarde dyal CCR w SAV PERF
            archivesToSave.add(buildKpi(p, month, year, "CCR", "GLOBAL", s.ccrNum, s.ccrDenum));
            archivesToSave.add(buildKpi(p, month, year, "SAV_PERF", "GLOBAL", s.savPerfNum, s.savPerfDenum));
        }

        cqPartenaireKpiRepository.saveAll(archivesToSave);
        return ImportSummaryDTO.builder().totalLignes(counts[0]).lignesInserees(counts[1]).lignesRejetees(counts[2]).message("Calculs SAV terminés").build();
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

            Integer colKyn = findColumnIndex(headerMap, "prv_tcnw_id_tech", "idtecnow", "matricule", "kyn", "tech", "nom_technicien");
            Integer colZone = findColumnIndex(headerMap, "zone_statut prise", "zone");
            Integer colRang = findColumnIndex(headerMap, "rang_rdv", "rang");
            Integer colStatut = findColumnIndex(headerMap, "grp_statut_crinstall_mnt", "statut");
            Integer colCohorte = findColumnIndex(headerMap, "cohorte rdv racc", "cohorte");
            Integer colMotif = findColumnIndex(headerMap, "motf_ko_cr_inst_first_crinstall_mnt", "motf_ko", "motif");

            if (colZone == null || colRang == null || colStatut == null) throw new RuntimeException("Colonnes introuvables.");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                String kyn = colKyn != null ? getCellValue(row.getCell(colKyn)) : "";
                String zone = getCellValue(row.getCell(colZone));
                String rang = getCellValue(row.getCell(colRang));
                String statut = getCellValue(row.getCell(colStatut));
                String cohorte = colCohorte != null ? getCellValue(row.getCell(colCohorte)) : "";
                String motif = colMotif != null ? getCellValue(row.getCell(colMotif)) : "";

                processRowLogicFichier2(kyn, zone, rang, statut, cohorte, motif, statsMap, techMap, inconnu);
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
            String colKyn = findColumnName(headerMap, "prv_tcnw_id_tech", "idtecnow", "matricule", "kyn", "tech", "nom_technicien");
            String colZone = findColumnName(headerMap, "zone_statut prise", "zone");
            String colRang = findColumnName(headerMap, "rang_rdv", "rang");
            String colStatut = findColumnName(headerMap, "grp_statut_crinstall_mnt", "statut");
            String colCohorte = findColumnName(headerMap, "cohorte rdv racc", "cohorte");
            String colMotif = findColumnName(headerMap, "motf_ko_cr_inst_first_crinstall_mnt", "motf_ko", "motif");

            if (colZone == null || colRang == null || colStatut == null) throw new RuntimeException("Colonnes introuvables.");

            for (CSVRecord record : parser) {
                total++;
                String kyn = colKyn != null && record.isMapped(colKyn) ? record.get(colKyn) : "";
                String zone = record.get(colZone);
                String rang = record.get(colRang);
                String statut = record.get(colStatut);
                String cohorte = colCohorte != null && record.isMapped(colCohorte) ? record.get(colCohorte) : "";
                String motif = colMotif != null && record.isMapped(colMotif) ? record.get(colMotif) : "";

                processRowLogicFichier2(kyn, zone, rang, statut, cohorte, motif, statsMap, techMap, inconnu);
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

            Integer colKyn = findColumnIndex(headerMap, "id_tech", "id tech", "idtech", "nom_technicien", "nomtechnicien", "prv_tcnw_id_tech", "kyn", "tech", "utilisateur");
            Integer colValr = findColumnIndex(headerMap, "valr not glbl", "valeur", "note");

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
            String colKyn = findColumnName(headerMap, "id_tech", "id tech", "idtech", "nom_technicien", "nomtechnicien", "prv_tcnw_id_tech", "kyn", "tech", "utilisateur");
            String colValr = findColumnName(headerMap, "valr not glbl", "valeur", "note");

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
    // 🛠️ MOTEURS DE LECTURE (SAV)
    // ==========================================
    private int[] processExcelSav(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu) throws Exception {
        int total = 0, success = 0, rejected = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Fichier vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());

            Integer colKyn = findColumnIndex(headerMap, "id_tech", "id tech", "idtech", "nom_technicien", "nomtechnicien", "prv_tcnw_id_tech", "kyn", "tech", "utilisateur", "intervenant");
            Integer colSatcli = findColumnIndexExact(headerMap, "note satcli ftth");
            Integer colSecu = findColumnIndexExact(headerMap, "flag_secu_interv_cq2024");
            Integer colTnh = findColumnIndexExact(headerMap, "cod cltr main");

            // 🛡️ JDID: Colonnes dyal CCR w PERF
            Integer colCcr = findColumnIndex(headerMap, "poids ccr", "poids_ccr", "contrat_qualite_2025");
            Integer colPerf = findColumnIndex(headerMap, "statut intervention", "statut_intervention");

            if (colKyn == null) throw new RuntimeException("Colonne KYN (Id Tech / Nom_Technicien) introuvable.");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                String kyn = getCellValue(row.getCell(colKyn));
                String satcli = colSatcli != null ? getCellValue(row.getCell(colSatcli)) : "";
                String secu = colSecu != null ? getCellValue(row.getCell(colSecu)) : "";
                String tnh = colTnh != null ? getCellValue(row.getCell(colTnh)) : "";
                String ccr = colCcr != null ? getCellValue(row.getCell(colCcr)) : "";
                String perf = colPerf != null ? getCellValue(row.getCell(colPerf)) : "";

                processRowLogicSav(kyn, satcli, secu, tnh, ccr, perf, statsMap, techMap, inconnu);
                success++;
            }
        }
        return new int[]{total, success, rejected};
    }

    private int[] processCsvSav(MultipartFile file, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu) throws Exception {
        int total = 0, success = 0, rejected = 0;
        char delimiter = detectDelimiter(file);
        CSVFormat format = CSVFormat.Builder.create().setDelimiter(delimiter).setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();

            String colKyn = findColumnName(headerMap, "id_tech", "id tech", "idtech", "nom_technicien", "nomtechnicien", "prv_tcnw_id_tech", "kyn", "tech", "utilisateur", "intervenant");
            String colSatcli = findColumnNameExact(headerMap, "note satcli ftth");
            String colSecu = findColumnNameExact(headerMap, "flag_secu_interv_cq2024");
            String colTnh = findColumnNameExact(headerMap, "cod cltr main");

            // 🛡️ JDID: Colonnes dyal CCR w PERF
            String colCcr = findColumnName(headerMap, "poids ccr", "poids_ccr", "contrat_qualite_2025");
            String colPerf = findColumnName(headerMap, "statut intervention", "statut_intervention");

            if (colKyn == null) throw new RuntimeException("Colonne KYN (Id Tech / Nom_Technicien) introuvable.");

            for (CSVRecord record : parser) {
                total++;
                String kyn = record.get(colKyn);
                String satcli = colSatcli != null && record.isMapped(colSatcli) ? record.get(colSatcli) : "";
                String secu = colSecu != null && record.isMapped(colSecu) ? record.get(colSecu) : "";
                String tnh = colTnh != null && record.isMapped(colTnh) ? record.get(colTnh) : "";
                String ccr = colCcr != null && record.isMapped(colCcr) ? record.get(colCcr) : "";
                String perf = colPerf != null && record.isMapped(colPerf) ? record.get(colPerf) : "";

                processRowLogicSav(kyn, satcli, secu, tnh, ccr, perf, statsMap, techMap, inconnu);
                success++;
            }
        }
        return new int[]{total, success, rejected};
    }

    // ==========================================
    // ⚙️ LOGIQUE METIER
    // ==========================================
    private void processRowLogicFichier2(String rawKyn, String rawZone, String rawRang, String rawStatut, String cohorte, String motif, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu) {
        Partenaire partenaire = inconnu;

        if (rawKyn != null && !rawKyn.trim().isEmpty()) {
            String cleanKynOrName = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            Technicien technicien = techMap.get(cleanKynOrName);
            if (technicien == null) technicien = techMap.get("KYN" + cleanKynOrName);
            if (technicien != null) partenaire = technicien.getPartenaire();
        }

        statsMap.putIfAbsent(partenaire, new Stats());
        Stats s = statsMap.get(partenaire);

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

        if (cohorte != null && !cohorte.trim().isEmpty()) {
            s.tnhDenum++;
            if (motif != null && motif.trim().equalsIgnoreCase("CR DELAI - Organisation installateur")) {
                s.tnhNum++;
            }
        }
    }

    private void processRowLogicSacliSarcli(String rawKyn, String rawValr, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu, boolean isSacli) {
        Partenaire partenaire = inconnu;

        if (rawKyn != null && !rawKyn.trim().isEmpty()) {
            String cleanKynOrName = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            Technicien technicien = techMap.get(cleanKynOrName);
            if (technicien == null) technicien = techMap.get("KYN" + cleanKynOrName);
            if (technicien != null) partenaire = technicien.getPartenaire();
        }

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
    }

    private void processRowLogicSav(String rawKyn, String rawSatcli, String rawSecu, String rawTnh, String rawCcr, String rawPerf, Map<Partenaire, Stats> statsMap, Map<String, Technicien> techMap, Partenaire inconnu) {
        Partenaire partenaire = inconnu;

        if (rawKyn != null && !rawKyn.trim().isEmpty()) {
            String cleanKynOrName = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            Technicien technicien = techMap.get(cleanKynOrName);
            if (technicien == null) technicien = techMap.get("KYN" + cleanKynOrName);
            if (technicien != null) partenaire = technicien.getPartenaire();
        }

        statsMap.putIfAbsent(partenaire, new Stats());
        Stats s = statsMap.get(partenaire);

        // SATCLI
        if (rawSatcli != null && !rawSatcli.trim().isEmpty()) {
            s.savSatcliDenum++;
            if (isNumericValue(rawSatcli, 1.0) || isNumericValue(rawSatcli, 2.0)) {
                s.savSatcliNum++;
            }
        }

        // SECURISATION
        if (rawSecu != null && !rawSecu.trim().isEmpty()) {
            if (isNumericValue(rawSecu, 0.0) || isNumericValue(rawSecu, 1.0)) {
                s.secuDenum++;
                if (isNumericValue(rawSecu, 1.0)) s.secuNum++;
            }
        }

        // TNH SAV
        if (rawTnh != null) {
            String cleanTnh = rawTnh.trim().toUpperCase();
            if (!cleanTnh.isEmpty() && !cleanTnh.equals("-") && !cleanTnh.equals("N/A") && !cleanTnh.equals("0")) {
                s.savTnhDenum++;
                if (cleanTnh.equals("INR2C") || cleanTnh.equals("INR2B")) {
                    s.savTnhNum++;
                }
            }
        }

        // 🛡️ JDID: CCR
        if (rawCcr != null && !rawCcr.trim().isEmpty()) {
            s.ccrDenum++;
            if (isNumericValue(rawCcr, 0.0)) {
                s.ccrNum++;
            }
        }

        // 🛡️ JDID: SAV PERF
        if (rawPerf != null && !rawPerf.trim().isEmpty()) {
            s.savPerfDenum++;
            if (rawPerf.trim().equalsIgnoreCase("TERMINEE_OK")) {
                s.savPerfNum++;
            }
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
            if (t.getNomComplet() != null) {
                String cleanName = t.getNomComplet().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                map.put(cleanName, t);
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