package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Erreur;
import com.kyntus.kqualite.repository.CqDataRepository;
import com.kyntus.kqualite.repository.CqLigneDetailRepository;
import com.kyntus.kqualite.repository.CqPartenaireKpiRepository;
import com.kyntus.kqualite.repository.ErreurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurgeService {

    private final ErreurRepository erreurRepository;
    private final CqDataRepository cqDataRepository;
    private final CqPartenaireKpiRepository cqPartenaireKpiRepository;
    private final CqLigneDetailRepository cqLigneDetailRepository;

    @Transactional
    public void purgeData(String target, int month, int year) {
        log.info("🧹 Démarrage de la purge pour la cible [{}] - Période: {}/{}", target, month, year);

        if ("ERREURS".equals(target) || "ALL".equals(target)) {
            List<Erreur> erreurs = erreurRepository.findByFiltres(null, month, year);
            erreurRepository.deleteAll(erreurs);
        }
        if ("MULTI_CQ".equals(target) || "ALL".equals(target)) {
            cqDataRepository.deleteByMoisAndAnnee(month, year);
        }
        if ("CQ_PARTENAIRE".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateurIn(month, year, Arrays.asList("PLP", "HOTLINE", "CONSTRUCTION", "RANG_2", "TNH"));
        }
        if ("SACLI".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "SACLI");
        }
        if ("SARCLI".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "SARCLI");
        }
        if ("INCOHERENCE_PTO".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "INCOHERENCE_PTO");
            cqLigneDetailRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "INCOHERENCE_PTO");
        }
        if ("GEM_NOK".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "GEM_NOK");
            cqLigneDetailRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "GEM_NOK");
        }
        if ("CADRAGE".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "CADRAGE");
            cqLigneDetailRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "CADRAGE");
        }
        if ("TAUX_PLAINTE".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "TAUX_PLAINTE");
            cqLigneDetailRepository.deleteByMoisAndAnneeAndIndicateur(month, year, "TAUX_PLAINTE");
        }
        if ("SAV".equals(target) || "ALL".equals(target)) {
            cqPartenaireKpiRepository.deleteByMoisAndAnneeAndIndicateurIn(month, year, Arrays.asList("SATCLI_SAV", "SECURISATION", "TNH_SAV", "CCR", "SAV_PERF"));
        }

        log.info("✅ Purge terminée avec succès.");
    }
}