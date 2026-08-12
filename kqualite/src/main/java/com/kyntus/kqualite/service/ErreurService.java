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
        List<Erreur> erreurs = erreurRepository.findAllByPartenaireId(partenaireId);

        return erreurs.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Fonction d'aide bach n-mappiw l'Entité l' DTO bla man3riw la base de données
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
                .build();
    }
}