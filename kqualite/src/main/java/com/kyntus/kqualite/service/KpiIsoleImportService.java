package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.CqLigneDetail;
import com.kyntus.kqualite.domain.CqPartenaireKpi;
import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Technicien;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.repository.CqLigneDetailRepository;
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
public class KpiIsoleImportService {

    private final CqPartenaireKpiRepository cqPartenaireKpiRepository;
    private final CqLigneDetailRepository cqLigneDetailRepository;
    private final TechnicienRepository technicienRepository;
    private final PartenaireRepository partenaireRepository;

    private static class Stats {
        long num = 0;
        long denum = 0;
    }

    // ==========================================
    // 1. INCOHERENCE PTO (Fichier Indépendant)
    // ==========================================
    @Transactional
    public ImportSummaryDTO importIncoherencePto(MultipartFile file, int month, int year) {
        return processIsolatedFile(file, month, year, "INCOHERENCE_PTO");
    }

    // ==========================================
    // 2. GEM NOK (Fichier Indépendant)
    // ==========================================
    @Transactional
    public ImportSummaryDTO importGemNok(MultipartFile file, int month, int year) {
        return processIsolatedFile(file, month, year, "GEM_NOK");
    }

    private ImportSummaryDTO processIsolatedFile(MultipartFile file, int month, int year, String indicateur) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        List<CqPartenaireKpi> existing = cqPartenaireKpiRepository.findByMoisAndAnnee(month, year);
        List<CqPartenaireKpi> toDelete = new ArrayList<>();
        for (CqPartenaireKpi kpi : existing) {
            if (kpi.getIndicateur().equals(indicateur)) toDelete.add(kpi);
        }
        cqPartenaireKpiRepository.deleteAll(toDelete);
        cqLigneDetailRepository.deleteByMoisAndAnneeAndIndicateur(month, year, indicateur);

        Map<Partenaire, Stats> statsMap = new HashMap<>();
        List<CqLigneDetail> detailsToSave = new ArrayList<>();
        Map<String, Technicien> techMap = loadTechniciensMap();
        Partenaire inconnu = partenaireRepository.findByNomEntrepriseIgnoreCase("INCONNU")
                .orElseGet(() -> partenaireRepository.save(Partenaire.builder().nomEntreprise("INCONNU").referenceContrat("AUTO-INCONNU").build()));

        int total = 0;

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                total = processExcel(file, statsMap, detailsToSave, techMap, inconnu, indicateur, month, year);
            } else {
                total = processCsv(file, statsMap, detailsToSave, techMap, inconnu, indicateur, month, year);
            }
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        List<CqPartenaireKpi> archivesToSave = new ArrayList<>();
        for (Map.Entry<Partenaire, Stats> entry : statsMap.entrySet()) {
            Partenaire p = entry.getKey();
            Stats s = entry.getValue();
            double resultat = s.denum > 0 ? Math.round((((double) s.num / s.denum) * 100) * 100.0) / 100.0 : 0.0;

            archivesToSave.add(CqPartenaireKpi.builder()
                    .partenaire(p).mois(month).annee(year).indicateur(indicateur).zone("GLOBAL")
                    .num(s.num).denum(s.denum).resultat(resultat).bonus(0.0).build());
        }

        cqPartenaireKpiRepository.saveAll(archivesToSave);
        cqLigneDetailRepository.saveAll(detailsToSave);

        return ImportSummaryDTO.builder().totalLignes(total).lignesInserees(archivesToSave.size()).lignesRejetees(0).message("Calculs " + indicateur + " terminés").build();
    }

    private int processExcel(MultipartFile file, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> details, Map<String, Technicien> techMap, Partenaire inconnu, String indicateur, int month, int year) throws Exception {
        int total = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Fichier vide.");

            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) headerMap.put(getCellValue(cell).trim().toLowerCase(), cell.getColumnIndex());

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;

                Map<String, String> rowData = new HashMap<>();
                for (String key : headerMap.keySet()) {
                    rowData.put(key, getCellValue(row.getCell(headerMap.get(key))));
                }
                applyLogic(rowData, statsMap, details, techMap, inconnu, indicateur, month, year);
            }
        }
        return total;
    }

    private int processCsv(MultipartFile file, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> details, Map<String, Technicien> techMap, Partenaire inconnu, String indicateur, int month, int year) throws Exception {
        int total = 0;
        char delimiter = detectDelimiter(file);
        CSVFormat format = CSVFormat.Builder.create().setDelimiter(delimiter).setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            for (CSVRecord record : parser) {
                total++;
                Map<String, String> rowData = new HashMap<>();
                for (String key : parser.getHeaderMap().keySet()) {
                    rowData.put(key.toLowerCase().trim(), record.get(key));
                }
                applyLogic(rowData, statsMap, details, techMap, inconnu, indicateur, month, year);
            }
        }
        return total;
    }

    // 🛡️ L'LOGIQUE EXACTE LI TLBTI
    private void applyLogic(Map<String, String> rowData, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> details, Map<String, Technicien> techMap, Partenaire inconnu, String indicateur, int month, int year) {

        if (indicateur.equals("INCOHERENCE_PTO")) {
            String kyn = findValue(rowData, "prv_tcnw_id_tech", "kyn");
            String idRacc = findValue(rowData, "id racc", "id_racc", "idracc");

            // 🛡️ L'FIX HWA HNA: Recherche ultra-flexible dyal "PTO magouille"
            String ptoMagouille = findValue(rowData, "pto magouille", "pto_magouille", "ptomagouille", "magouille");

            if (idRacc.isEmpty()) return; // DENUM = Total des lignes dyal l collone : Id Racc

            Partenaire p = getPartenaire(kyn, techMap, inconnu);
            statsMap.putIfAbsent(p, new Stats());
            Stats s = statsMap.get(p);

            s.denum++;

            // 🛡️ L'FIX HWA HNA: Nettoyage dyal l'valeur 9bel l'comparaison
            String cleanPto = ptoMagouille.replaceAll("[^0-9]", ""); // N-khelliw ghir l'ar9am
            if (cleanPto.equals("1")) {
                s.num++; // NUM = colonne "PTO magouille" = 1
            }

            details.add(CqLigneDetail.builder().mois(month).annee(year).indicateur(indicateur).partenaire(p)
                    .kyn(kyn).reference(idRacc).champ1(ptoMagouille).build());
        }
        else if (indicateur.equals("GEM_NOK")) {
            String kyn = findValue(rowData, "kyn", "prv_tcnw_id_tech");
            String tvc = findValue(rowData, "tvc");
            String flgGem = findValue(rowData, "flg gem", "flg_gem", "flggem");
            String statut = findValue(rowData, "grp statut crinstall mnt", "grp_statut");
            String libRef = findValue(rowData, "lib ref erdv", "lib_ref");
            String cohorte = findValue(rowData, "cohorte date rdv racc", "cohorte");

            // Filtre --> Colonne "TVC" bla valeur OUI + Colonne "Flg Gem" bl valeur 1
            String cleanFlgGem = flgGem.replaceAll("[^0-9]", "");
            if (!tvc.equalsIgnoreCase("OUI") || !cleanFlgGem.equals("1")) return;

            // DENUM : TOTAL DES LIGNES dyal lcollone : Cohorte date rdv racc
            if (cohorte.isEmpty()) return;

            Partenaire p = getPartenaire(kyn, techMap, inconnu);
            statsMap.putIfAbsent(p, new Stats());
            Stats s = statsMap.get(p);

            s.denum++;
            // NUM : Colonne "Grp Statut Crinstall Mnt" = CR_MNT_OK
            if (statut.equalsIgnoreCase("CR_MNT_OK")) s.num++;

            details.add(CqLigneDetail.builder().mois(month).annee(year).indicateur(indicateur).partenaire(p)
                    .kyn(kyn).reference(libRef).champ1(tvc).champ2(flgGem).champ3(statut).build());
        }
    }

    // ==========================================
    // 🛠️ HELPERS
    // ==========================================
    private Partenaire getPartenaire(String rawKyn, Map<String, Technicien> techMap, Partenaire inconnu) {
        if (rawKyn == null || rawKyn.trim().isEmpty()) return inconnu;
        String kyn = rawKyn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (!kyn.startsWith("KYN")) kyn = "KYN" + kyn;
        Technicien t = techMap.get(kyn);
        if (t == null) t = techMap.get(rawKyn.trim().toUpperCase());
        return t != null ? t.getPartenaire() : inconnu;
    }

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

    private String findValue(Map<String, String> rowData, String... keywords) {
        for (String kw : keywords) {
            String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (Map.Entry<String, String> entry : rowData.entrySet()) {
                String cleanKey = entry.getKey().replaceAll("[^a-z0-9]", "");
                if (cleanKey.contains(cleanKw)) return entry.getValue().trim();
            }
        }
        return "";
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