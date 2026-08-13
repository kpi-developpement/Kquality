package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.*;
import com.kyntus.kqualite.dto.ImportSummaryDTO;
import com.kyntus.kqualite.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ErreurImportService {

    private final TechnicienRepository technicienRepository;
    private final DossierRepository dossierRepository;
    private final RegleQualiteRepository regleQualiteRepository;
    private final ErreurRepository erreurRepository;

    @Transactional
    public ImportSummaryDTO importErreursCsv(MultipartFile file) {
        int total = 0;
        int success = 0;
        int rejected = 0;

        CSVFormat format = CSVFormat.Builder.create()
                .setDelimiter(';')
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = new CSVParser(br, format)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();

            // Recherche des colonnes (Fuzzy Match)
            String colRdv = findColumn(headerMap, "id rdv", "dossier");
            String colKyn = findColumn(headerMap, "kyn", "tech");
            String colCat = findColumn(headerMap, "categorie", "sous categorie");
            String colImpact = findColumn(headerMap, "impact", "montant");

            if (colRdv == null || colKyn == null) {
                throw new RuntimeException("Colonnes obligatoires introuvables (ID RDV ou KYN)");
            }

            for (CSVRecord record : parser) {
                total++;
                try {
                    String rdv = record.get(colRdv);
                    String kyn = record.get(colKyn);
                    String categorie = colCat != null && record.isMapped(colCat) ? record.get(colCat) : "Erreur Qualité";

                    String impactStr = colImpact != null && record.isMapped(colImpact) ? record.get(colImpact) : "0";
                    // Nettoyage dyal l'impact (7iyd € w les espaces)
                    impactStr = impactStr.replaceAll("[^\\d.,-]", "").replace(",", ".");
                    double impact = impactStr.isEmpty() ? 0.0 : Double.parseDouble(impactStr);

                    // 1. Chercher le Technicien (KYN)
                    Optional<Technicien> techOpt = technicienRepository.findByMatricule(kyn);
                    if (techOpt.isEmpty()) {
                        log.warn("Ligne {} rejetée : Technicien KYN {} introuvable.", total, kyn);
                        rejected++;
                        continue;
                    }
                    Technicien technicien = techOpt.get();

                    // 2. Chercher ou Créer le Dossier
                    Dossier dossier = dossierRepository.findByReferenceID(rdv)
                            .orElseGet(() -> dossierRepository.save(Dossier.builder()
                                    .referenceID(rdv)
                                    .dateIntervention(LocalDateTime.now()) // Par défaut
                                    .technicien(technicien)
                                    .build()));

                    // 3. Chercher ou Créer la Règle Qualité
                    RegleQualite regle = regleQualiteRepository.findByCodeRegle(categorie)
                            .orElseGet(() -> regleQualiteRepository.save(RegleQualite.builder()
                                    .codeRegle(categorie)
                                    .description(categorie)
                                    .penaliteUnitaire(impact)
                                    .build()));

                    // 4. Créer l'Erreur (Li ghat-mchi l'Partenaire)
                    Erreur erreur = Erreur.builder()
                            .dateDetection(LocalDateTime.now())
                            .impactEstime(impact)
                            .statut(StatutErreur.NOUVEAU)
                            .echeanceContestation(LocalDateTime.now().plusDays(5)) // 5 jours bach y-contester
                            .dossier(dossier)
                            .regleQualite(regle)
                            .build();

                    erreurRepository.save(erreur);
                    success++;

                } catch (Exception e) {
                    log.error("Erreur ligne {} : {}", total, e.getMessage());
                    rejected++;
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Erreur de lecture du fichier : " + e.getMessage());
        }

        return ImportSummaryDTO.builder()
                .totalLignes(total)
                .lignesInserees(success)
                .lignesRejetees(rejected)
                .message("Importation terminée.")
                .build();
    }

    private String findColumn(Map<String, Integer> headers, String... keywords) {
        for (String header : headers.keySet()) {
            String clean = header.toLowerCase().trim();
            for (String kw : keywords) {
                if (clean.contains(kw)) return header;
            }
        }
        return null;
    }
}