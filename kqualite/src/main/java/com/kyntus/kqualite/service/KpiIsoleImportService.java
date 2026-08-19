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

    @Transactional
    public ImportSummaryDTO importIncoherencePto(MultipartFile file, int month, int year) {
        return processIsolatedFile(file, month, year, "INCOHERENCE_PTO");
    }

    @Transactional
    public ImportSummaryDTO importGemNok(MultipartFile file, int month, int year) {
        return processIsolatedFile(file, month, year, "GEM_NOK");
    }

    @Transactional
    public ImportSummaryDTO importCadrage(MultipartFile file, int month, int year) {
        return processIsolatedFile(file, month, year, "CADRAGE");
    }

    @Transactional
    public ImportSummaryDTO importTauxPlainte(MultipartFile file, int month, int year) {
        return processIsolatedFile(file, month, year, "TAUX_PLAINTE");
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

        int[] counts;

        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                counts = processExcel(file, statsMap, detailsToSave, techMap, inconnu, indicateur, month, year);
            } else {
                counts = processCsv(file, statsMap, detailsToSave, techMap, inconnu, indicateur, month, year);
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

        return ImportSummaryDTO.builder().totalLignes(counts[0]).lignesInserees(archivesToSave.size() + detailsToSave.size()).lignesRejetees(counts[1]).message("Calculs " + indicateur + " terminés").build();
    }

    private int[] processExcel(MultipartFile file, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> details, Map<String, Technicien> techMap, Partenaire inconnu, String indicateur, int month, int year) throws Exception {
        int total = 0, rejected = 0;
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
                boolean isProcessed = applyLogic(rowData, statsMap, details, techMap, inconnu, indicateur, month, year);
                if (!isProcessed) rejected++;
            }
        }
        return new int[]{total, rejected};
    }

    private int[] processCsv(MultipartFile file, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> details, Map<String, Technicien> techMap, Partenaire inconnu, String indicateur, int month, int year) throws Exception {
        int total = 0, rejected = 0;
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
                boolean isProcessed = applyLogic(rowData, statsMap, details, techMap, inconnu, indicateur, month, year);
                if (!isProcessed) rejected++;
            }
        }
        return new int[]{total, rejected};
    }

    private boolean applyLogic(Map<String, String> rowData, Map<Partenaire, Stats> statsMap, List<CqLigneDetail> details, Map<String, Technicien> techMap, Partenaire inconnu, String indicateur, int month, int year) {

        if (indicateur.equals("INCOHERENCE_PTO")) {
            String kyn = findValue(rowData, "prv_tcnw_id_tech", "id_tech", "idtech", "kyn", "tech", "nom_technicien");
            String idRacc = findValue(rowData, "id racc", "id_racc", "idrdv", "id_rdv");
            String ptoMagouille = findValue(rowData, "pto magouille", "pto_magouille", "ptomagouille", "magouille");

            if (idRacc.isEmpty()) return false;

            Partenaire p = getPartenaire(kyn, techMap, inconnu);
            statsMap.putIfAbsent(p, new Stats());
            Stats s = statsMap.get(p);

            s.denum++;
            String cleanPto = ptoMagouille.trim().toLowerCase();
            if (cleanPto.equals("1") || cleanPto.equals("1.0") || cleanPto.equals("1,0") || cleanPto.equals("true") || cleanPto.equals("vrai")) {
                s.num++;
            }

            details.add(CqLigneDetail.builder().mois(month).annee(year).indicateur(indicateur).partenaire(p)
                    .kyn(kyn).reference(idRacc).champ1(ptoMagouille).build());
            return true;
        }
        else if (indicateur.equals("GEM_NOK")) {
            String kyn = findValue(rowData, "kyn", "prv_tcnw_id_tech", "id_tech", "idtech", "tech", "nom_technicien");
            String tvc = findValue(rowData, "tvc");
            String flgGem = findValue(rowData, "flg gem", "flg_gem", "flggem");
            String statut = findValue(rowData, "grp statut crinstall mnt", "grp_statut");
            String libRef = findValue(rowData, "lib ref erdv", "lib_ref");
            String cohorte = findValue(rowData, "cohorte date rdv racc", "cohorte");

            String cleanFlgGem = flgGem.trim().toLowerCase();
            boolean isFlgGem1 = cleanFlgGem.equals("1") || cleanFlgGem.equals("1.0") || cleanFlgGem.equals("1,0") || cleanFlgGem.equals("true") || cleanFlgGem.equals("vrai");

            if (!tvc.equalsIgnoreCase("OUI") || !isFlgGem1) return false;
            if (cohorte.isEmpty()) return false;

            Partenaire p = getPartenaire(kyn, techMap, inconnu);
            statsMap.putIfAbsent(p, new Stats());
            Stats s = statsMap.get(p);

            s.denum++;
            if (statut.equalsIgnoreCase("CR_MNT_OK")) s.num++;

            details.add(CqLigneDetail.builder().mois(month).annee(year).indicateur(indicateur).partenaire(p)
                    .kyn(kyn).reference(libRef).champ1(tvc).champ2(flgGem).champ3(statut).build());
            return true;
        }
        else if (indicateur.equals("CADRAGE")) {
            String kyn = findValue(rowData, "id_tech", "idtech", "kyn", "prv_tcnw_id_tech", "tech", "nom_technicien");
            String idRdv = findValue(rowData, "idnt_rdv", "id rdv", "idrdv", "id_rdv");
            String malCadree = findValue(rowData, "mal_cadree", "mal cadree", "malcadree");

            String cleanMalCadree = malCadree.trim().toLowerCase();
            boolean is0 = cleanMalCadree.equals("0") || cleanMalCadree.equals("0.0") || cleanMalCadree.equals("0,0") || cleanMalCadree.equals("false") || cleanMalCadree.equals("faux");
            boolean is1 = cleanMalCadree.equals("1") || cleanMalCadree.equals("1.0") || cleanMalCadree.equals("1,0") || cleanMalCadree.equals("true") || cleanMalCadree.equals("vrai");

            if (!is0 && !is1) return false;

            Partenaire p = getPartenaire(kyn, techMap, inconnu);
            statsMap.putIfAbsent(p, new Stats());
            Stats s = statsMap.get(p);

            s.denum++;
            if (is1) s.num++;

            details.add(CqLigneDetail.builder().mois(month).annee(year).indicateur(indicateur).partenaire(p)
                    .kyn(kyn).reference(idRdv).champ1(malCadree).build());
            return true;
        }
        // 🛡️ L'FIX HWA HNA: TAUX DE PLAINTE (Recherche ultra-flexible)
        else if (indicateur.equals("TAUX_PLAINTE")) {
            String kyn = findValue(rowData, "id_tech", "id tech", "idtech", "kyn", "prv_tcnw_id_tech", "tech", "nom_technicien");
            String idRdv = findValue(rowData, "id_rdv", "id rdv", "idrdv", "idnt_rdv");
            String ticket = findValue(rowData, "volume ticket qualité", "volume ticket qualite", "volume ticket", "ticket", "volume");

            if (idRdv.isEmpty()) return false;

            Partenaire p = getPartenaire(kyn, techMap, inconnu);
            statsMap.putIfAbsent(p, new Stats());
            Stats s = statsMap.get(p);

            s.denum = 0;

            String cleanTicket = ticket.trim().toLowerCase();
            if (cleanTicket.equals("1") || cleanTicket.equals("1.0") || cleanTicket.equals("1,0") || cleanTicket.equals("true") || cleanTicket.equals("vrai")) {
                s.num++;
            }

            details.add(CqLigneDetail.builder().mois(month).annee(year).indicateur(indicateur).partenaire(p)
                    .kyn(kyn).reference(idRdv).champ1(ticket).build());
            return true;
        }
        return false;
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
            if (t.getNomComplet() != null) {
                String cleanName = t.getNomComplet().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                map.put(cleanName, t);
            }
        }
        return map;
    }

    private String findValue(Map<String, String> rowData, String... keywords) {
        for (String kw : keywords) {
            String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (Map.Entry<String, String> entry : rowData.entrySet()) {
                String cleanKey = entry.getKey().replaceAll("[^a-z0-9]", "");
                if (cleanKey.equals(cleanKw)) return entry.getValue().trim();
            }
        }
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
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return "";
        }
    }
}