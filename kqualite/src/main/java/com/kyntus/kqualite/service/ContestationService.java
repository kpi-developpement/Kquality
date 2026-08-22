package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.*;
import com.kyntus.kqualite.dto.ContestationRequestDTO;
import com.kyntus.kqualite.dto.ContestationResponseDTO;
import com.kyntus.kqualite.dto.TraitementRequestDTO;
import com.kyntus.kqualite.repository.ContestationRepository;
import com.kyntus.kqualite.repository.CqDataRepository;
import com.kyntus.kqualite.repository.ErreurRepository;
import com.kyntus.kqualite.repository.UtilisateurRepository;
import com.kyntus.kqualite.repository.ResultatCQRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContestationService {

    private final ContestationRepository contestationRepository;
    private final ErreurRepository erreurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ResultatCQRepository resultatCQRepository;
    private final CqDataRepository cqDataRepository;

    @Transactional
    public void deposerContestation(Long utilisateurId, ContestationRequestDTO request) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElseThrow();
        Erreur erreur = erreurRepository.findById(request.getErreurId()).orElseThrow();

        if (LocalDateTime.now().isAfter(erreur.getEcheanceContestation())) throw new RuntimeException("Délai dépassé.");
        if (erreur.getStatut() == StatutErreur.CONTESTE || erreur.getStatut() == StatutErreur.CLOTURE) throw new RuntimeException("Déjà contestée.");

        Contestation contestation = Contestation.builder()
                .motif(request.getMotif()).commentaire(request.getCommentaire())
                .pieceJointeUrl(request.getPieceJointeUrl()).dateDepot(LocalDateTime.now())
                .erreur(erreur).soumisePar(utilisateur).build();

        contestationRepository.save(contestation);
        erreur.setStatut(StatutErreur.CONTESTE);
        erreurRepository.save(erreur);
    }

    // 🛡️ JDID: Fusion des Contestations (Erreurs + CQ Data)
    @Transactional(readOnly = true)
    public List<ContestationResponseDTO> getAllContestations() {
        List<ContestationResponseDTO> list = new ArrayList<>();

        // 1. Contestations des Erreurs
        List<Contestation> contestations = contestationRepository.findAll();
        for (Contestation c : contestations) {
            String statut = c.getErreur().getStatut() == StatutErreur.CONTESTE ? "EN_ATTENTE" :
                    c.getErreur().getStatut() == StatutErreur.ANNULE ? "ACCEPTE" : "REFUSE";

            list.add(ContestationResponseDTO.builder()
                    .id(c.getId())
                    .type("ERREUR")
                    .motif(c.getMotif())
                    .commentaire(c.getCommentaire())
                    .pieceJointeUrl(c.getPieceJointeUrl())
                    .dateDepot(c.getDateDepot())
                    .erreurId(c.getErreur().getId())
                    .dossierReference(c.getErreur().getDossier().getReferenceID())
                    .partenaireNom(c.getErreur().getDossier().getTechnicien().getPartenaire().getNomEntreprise())
                    .impactEstime(c.getErreur().getImpactEstime())
                    .statut(statut)
                    .reponseAdmin(c.getCommentaireDecision())
                    .build());
        }

        // 2. Contestations des CQ Data
        List<CqData> cqDatas = cqDataRepository.findContestedCqData();
        for (CqData cq : cqDatas) {
            String statut = cq.getStatutContestation().equals("EN_COURS") ? "EN_ATTENTE" : cq.getStatutContestation();

            list.add(ContestationResponseDTO.builder()
                    .id(cq.getId())
                    .type("PENALITE_CQ")
                    .motif(cq.getMotifContestation())
                    .commentaire("Contestation sur fichier CQ: " + cq.getTypeFeuille())
                    .pieceJointeUrl(null)
                    .dateDepot(cq.getDateContestation() != null ? cq.getDateContestation() : LocalDateTime.now())
                    .erreurId(cq.getId())
                    .dossierReference(cq.getReference() != null ? cq.getReference() : "N/A")
                    .partenaireNom(cq.getPartenaire().getNomEntreprise())
                    .impactEstime(cq.getMtSst() != null ? cq.getMtSst() : (cq.getMontant() != null ? cq.getMontant() : 0.0))
                    .statut(statut)
                    .reponseAdmin(cq.getReponseAdmin())
                    .build());
        }

        // Tri par date décroissante
        list.sort((a, b) -> b.getDateDepot().compareTo(a.getDateDepot()));
        return list;
    }

    @Transactional(readOnly = true)
    public long countContestationsByMonthAndYear(int month, int year) {
        return contestationRepository.countByMonthAndYear(month, year);
    }

    // 🛡️ JDID: Traitement dynamique selon le type
    @Transactional
    public void traiterContestation(String type, Long id, TraitementRequestDTO request, Long adminId) {
        if ("ERREUR".equals(type)) {
            Contestation contestation = contestationRepository.findById(id).orElseThrow();
            Erreur erreur = contestation.getErreur();
            contestation.setCommentaireDecision(request.getCommentaire());

            if (request.isAccepter()) {
                erreur.setStatut(StatutErreur.ANNULE);
                erreur.setImpactEstime(0.0);
            } else {
                erreur.setStatut(StatutErreur.CONFIRME);
            }
            contestationRepository.save(contestation);
            erreurRepository.save(erreur);

        } else if ("PENALITE_CQ".equals(type)) {
            CqData cqData = cqDataRepository.findById(id).orElseThrow();
            cqData.setReponseAdmin(request.getCommentaire());

            if (request.isAccepter()) {
                cqData.setStatutContestation("ACCEPTE");
                cqData.setMtSst(0.0);
                cqData.setMontant(0.0);
            } else {
                cqData.setStatutContestation("REFUSE");
            }
            cqDataRepository.save(cqData);
        }
    }
}