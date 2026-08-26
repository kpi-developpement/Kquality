package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.*;
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
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContestationService {

    private final ContestationRepository contestationRepository;
    private final ErreurRepository erreurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ResultatCQRepository resultatCQRepository;
    private final CqDataRepository cqDataRepository;

    private final Path fileStorageLocation = Paths.get("uploads/preuves").toAbsolutePath().normalize();

    // 🛡️ L'FIX HWA HNA: Logique de sauvegarde du fichier
    @Transactional
    public void deposerContestation(Long utilisateurId, Long erreurId, String motif, String commentaire, MultipartFile file) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElseThrow();
        Erreur erreur = erreurRepository.findById(erreurId).orElseThrow();

        if (LocalDateTime.now().isAfter(erreur.getEcheanceContestation())) throw new RuntimeException("Délai dépassé.");
        if (erreur.getStatut() == StatutErreur.CONTESTE || erreur.getStatut() == StatutErreur.CLOTURE) throw new RuntimeException("Déjà contestée.");

        String fileUrl = null;
        if (file != null && !file.isEmpty()) {
            try {
                Files.createDirectories(this.fileStorageLocation);
                String originalFilename = file.getOriginalFilename();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String newFilename = UUID.randomUUID().toString() + extension;

                Path targetLocation = this.fileStorageLocation.resolve(newFilename);
                Files.copy(file.getInputStream(), targetLocation);

                // L'URL qui sera stockée dans la base de données
                fileUrl = "/api/v1/files/" + newFilename;
            } catch (Exception ex) {
                throw new RuntimeException("Impossible de sauvegarder le fichier. Veuillez réessayer.", ex);
            }
        }

        Contestation contestation = Contestation.builder()
                .motif(motif)
                .commentaire(commentaire)
                .pieceJointeUrl(fileUrl)
                .dateDepot(LocalDateTime.now())
                .erreur(erreur)
                .soumisePar(utilisateur)
                .build();

        contestationRepository.save(contestation);

        // On met à jour l'URL de la preuve dans l'erreur pour un accès rapide
        if (fileUrl != null) {
            erreur.setPreuveUrl(fileUrl);
        }
        erreur.setStatut(StatutErreur.CONTESTE);
        erreurRepository.save(erreur);
    }

    @Transactional(readOnly = true)
    public List<ContestationResponseDTO> getAllContestations() {
        List<ContestationResponseDTO> list = new ArrayList<>();

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

        list.sort((a, b) -> b.getDateDepot().compareTo(a.getDateDepot()));
        return list;
    }

    @Transactional(readOnly = true)
    public long countContestationsByMonthAndYear(int month, int year) {
        return contestationRepository.countByMonthAndYear(month, year);
    }

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