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
    public List<ErreurResponseDTO> getErreursByPartenaire(Long partenaireId, int month, int year) {
        return erreurRepository.findByPartenaireIdAndMoisAndAnnee(partenaireId, month, year).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ErreurResponseDTO> getAllErreursAdmin(Long partenaireId, int month, int year) {
        return erreurRepository.findByFiltres(partenaireId, month, year).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ErreurResponseDTO getErreurById(Long id) {
        return erreurRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Erreur introuvable"));
    }

    private ErreurResponseDTO mapToDTO(Erreur erreur) {
        return ErreurResponseDTO.builder()
                .id(erreur.getId())
                .dateDetection(erreur.getDateDetection())
                .preuveUrl(erreur.getPreuveUrl())
                .impactEstime(erreur.getImpactEstime())
                .echeanceContestation(erreur.getEcheanceContestation())
                // 🛡️ L'FIX HWA HNA: On passe l'Enum directement, sans le .name() !
                .statut(erreur.getStatut())
                .dossierReference(erreur.getDossier().getReferenceID())
                .dossierDateIntervention(erreur.getDossier().getDateIntervention())
                .technicienNomComplet(erreur.getDossier().getTechnicien().getNomComplet())
                .technicienMatricule(erreur.getDossier().getTechnicien().getMatricule())
                .regleCode(erreur.getRegleQualite().getCodeRegle())
                .regleDescription(erreur.getRegleQualite().getDescription())
                .categorie(erreur.getRegleQualite().getCategorie())
                .aContestation(erreur.getContestation() != null)
                .partenaireNom(erreur.getDossier().getTechnicien().getPartenaire().getNomEntreprise())
                .build();
    }
}