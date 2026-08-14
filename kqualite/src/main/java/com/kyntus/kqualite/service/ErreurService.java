package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Erreur;
import com.kyntus.kqualite.dto.ErreurResponseDTO;
import com.kyntus.kqualite.repository.ErreurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ErreurService {

    private final ErreurRepository erreurRepository;

    @Transactional(readOnly = true)
    public List<ErreurResponseDTO> getErreursByPartenaire(Long partenaireId) {
        return erreurRepository.findAllByPartenaireId(partenaireId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 🛡️ L'FIX HWA HNA: Fonction jdida l'Admin bach y-jbed kolchi wla y-filtri
    @Transactional(readOnly = true)
    public List<ErreurResponseDTO> getAllErreursAdmin(Long partenaireId) {
        List<Erreur> erreurs;
        if (partenaireId != null) {
            erreurs = erreurRepository.findAllByPartenaireId(partenaireId);
        } else {
            erreurs = erreurRepository.findAll();
        }
        return erreurs.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private ErreurResponseDTO mapToDTO(Erreur erreur) {
        return ErreurResponseDTO.builder()
                .id(erreur.getId())
                .dateDetection(erreur.getDateDetection())
                .preuveUrl(erreur.getPreuveUrl())
                .impactEstime(erreur.getImpactEstime())
                .echeanceContestation(erreur.getEcheanceContestation())
                .statut(erreur.getStatut())
                .dossierReference(erreur.getDossier().getReferenceID())
                .dossierDateIntervention(erreur.getDossier().getDateIntervention())
                .technicienNomComplet(erreur.getDossier().getTechnicien().getNomComplet())
                .technicienMatricule(erreur.getDossier().getTechnicien().getMatricule())
                .regleCode(erreur.getRegleQualite().getCodeRegle())
                .regleDescription(erreur.getRegleQualite().getDescription())
                .aContestation(erreur.getContestation() != null)
                .partenaireNom(erreur.getDossier().getTechnicien().getPartenaire().getNomEntreprise()) // 🛡️ JDID
                .build();
    }
}