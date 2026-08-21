package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Contestation;
import com.kyntus.kqualite.domain.Erreur;
import com.kyntus.kqualite.domain.StatutErreur;
import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ContestationRequestDTO;
import com.kyntus.kqualite.dto.ContestationResponseDTO;
import com.kyntus.kqualite.dto.TraitementRequestDTO;
import com.kyntus.kqualite.repository.ContestationRepository;
import com.kyntus.kqualite.repository.ErreurRepository;
import com.kyntus.kqualite.repository.UtilisateurRepository;
import com.kyntus.kqualite.repository.ResultatCQRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContestationService {

    private final ContestationRepository contestationRepository;
    private final ErreurRepository erreurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ResultatCQRepository resultatCQRepository;

    @Transactional
    public void deposerContestation(Long utilisateurId, ContestationRequestDTO request) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Erreur erreur = erreurRepository.findById(request.getErreurId())
                .orElseThrow(() -> new RuntimeException("Erreur introuvable"));

        if (LocalDateTime.now().isAfter(erreur.getEcheanceContestation())) {
            throw new RuntimeException("Le délai de contestation pour cette erreur est dépassé.");
        }

        if (erreur.getStatut() == StatutErreur.CONTESTE || erreur.getStatut() == StatutErreur.CLOTURE) {
            throw new RuntimeException("Cette erreur ne peut plus être contestée.");
        }

        Contestation contestation = Contestation.builder()
                .motif(request.getMotif())
                .commentaire(request.getCommentaire())
                .pieceJointeUrl(request.getPieceJointeUrl())
                .dateDepot(LocalDateTime.now())
                .erreur(erreur)
                .soumisePar(utilisateur)
                .build();

        contestationRepository.save(contestation);
        erreur.setStatut(StatutErreur.CONTESTE);
        erreurRepository.save(erreur);
    }

    @Transactional(readOnly = true)
    public List<ContestationResponseDTO> getContestationsEnAttente() {
        return contestationRepository.findByErreurStatut(StatutErreur.CONTESTE)
                .stream()
                .map(c -> ContestationResponseDTO.builder()
                        .id(c.getId())
                        .motif(c.getMotif())
                        .commentaire(c.getCommentaire())
                        .pieceJointeUrl(c.getPieceJointeUrl())
                        .dateDepot(c.getDateDepot())
                        .erreurId(c.getErreur().getId())
                        .dossierReference(c.getErreur().getDossier().getReferenceID())
                        .partenaireNom(c.getErreur().getDossier().getTechnicien().getPartenaire().getNomEntreprise())
                        .impactEstime(c.getErreur().getImpactEstime())
                        .build())
                .collect(Collectors.toList());
    }

    // 🛡️ JDID: Récupérer le nombre total de contestations pour le Dashboard
    @Transactional(readOnly = true)
    public long countContestationsByMonthAndYear(int month, int year) {
        return contestationRepository.countByMonthAndYear(month, year);
    }

    @Transactional
    public void traiterContestation(Long contestationId, TraitementRequestDTO request, Long adminId) {
        Contestation contestation = contestationRepository.findById(contestationId)
                .orElseThrow(() -> new RuntimeException("Contestation introuvable"));

        Erreur erreur = contestation.getErreur();
        contestation.setCommentaireDecision(request.getCommentaire());

        if (request.isAccepter()) {
            Double ancienImpact = erreur.getImpactEstime();
            erreur.setStatut(StatutErreur.ANNULE);
            erreur.setImpactEstime(0.0);

            Long partenaireId = erreur.getDossier().getTechnicien().getPartenaire().getId();
            resultatCQRepository.findByPartenaireIdAndPeriodeMois(partenaireId, "2026-08")
                    .ifPresent(resultat -> {
                        if (resultat.getPenalite() != null) {
                            double nouveauMontant = resultat.getPenalite().getMontantTotal() - ancienImpact;
                            resultat.getPenalite().setMontantTotal(nouveauMontant);
                        }
                    });

        } else {
            erreur.setStatut(StatutErreur.CONFIRME);
        }

        contestationRepository.save(contestation);
        erreurRepository.save(erreur);
    }
}