package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Erreur;
import com.kyntus.kqualite.domain.ResultatCQ;
import com.kyntus.kqualite.domain.StatutErreur;
import com.kyntus.kqualite.domain.StatutPenalite;
import com.kyntus.kqualite.dto.DashboardPartenaireDTO;
import com.kyntus.kqualite.repository.ErreurRepository;
import com.kyntus.kqualite.repository.ResultatCQRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ErreurRepository erreurRepository;
    private final ResultatCQRepository resultatCQRepository;

    @Transactional(readOnly = true)
    public DashboardPartenaireDTO getDashboardData(Long partenaireId, String periodeMois) {

        // 1. Njbdou ga3 les erreurs dyal l'partenaire
        List<Erreur> erreurs = erreurRepository.findAllByPartenaireId(partenaireId);

        // 2. N7esbou l'erreurs actives (li ba9i khasshom action)
        long erreursActives = erreurs.stream()
                .filter(e -> e.getStatut() == StatutErreur.NOUVEAU || e.getStatut() == StatutErreur.A_ANALYSER)
                .count();

        // 3. N7esbou l'erreurs urgentes (li 9rebt tssali l'échéance dyalhom f 48h jaya)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dans48h = now.plusHours(48);
        long erreursUrgentes = erreurs.stream()
                .filter(e -> e.getStatut() != StatutErreur.CLOTURE && e.getStatut() != StatutErreur.CONTESTE)
                .filter(e -> e.getEcheanceContestation().isAfter(now) && e.getEcheanceContestation().isBefore(dans48h))
                .count();

        // 4. Njbdou CQ w la pénalité dyal ch'her l'7ali
        DashboardPartenaireDTO dto = DashboardPartenaireDTO.builder()
                .erreursActives((int) erreursActives)
                .erreursUrgentes((int) erreursUrgentes)
                .totalDossiersControles(1248) // Hada khassou yji mn système externe wla yt7seb ila 3ndna ga3 les dossiers
                .build();

        resultatCQRepository.findByPartenaireIdAndPeriodeMois(partenaireId, periodeMois)
                .ifPresentOrElse(
                        resultat -> {
                            dto.setCqPrevisionnel(resultat.getScoreActuel());
                            dto.setObjectifCq(resultat.getObjectifGlobal());
                            dto.setEcartCq(Math.round((resultat.getScoreActuel() - resultat.getObjectifGlobal()) * 100.0) / 100.0);

                            if (resultat.getPenalite() != null) {
                                dto.setPenalitesEstimees(resultat.getPenalite().getMontantTotal());
                                dto.setStatutPenalites(resultat.getPenalite().getStatut().name());
                            } else {
                                dto.setPenalitesEstimees(0.0);
                                dto.setStatutPenalites(StatutPenalite.ESTIMEE.name());
                            }
                        },
                        () -> {
                            // Ila makaynch data f had ch'her ba9i
                            dto.setCqPrevisionnel(100.0);
                            dto.setObjectifCq(95.0);
                            dto.setEcartCq(0.0);
                            dto.setPenalitesEstimees(0.0);
                            dto.setStatutPenalites(StatutPenalite.ESTIMEE.name());
                        }
                );

        return dto;
    }
}