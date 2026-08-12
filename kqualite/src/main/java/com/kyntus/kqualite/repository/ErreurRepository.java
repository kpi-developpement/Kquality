package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.Erreur;
import com.kyntus.kqualite.domain.StatutErreur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ErreurRepository extends JpaRepository<Erreur, Long> {

    // Njbdou ga3 les erreurs dyal un Partenaire specifique (ISOLATION)
    // Katmchi mn Erreur -> Dossier -> Technicien -> Partenaire
    @Query("SELECT e FROM Erreur e JOIN e.dossier d JOIN d.technicien t WHERE t.partenaire.id = :partenaireId")
    List<Erreur> findAllByPartenaireId(@Param("partenaireId") Long partenaireId);

    // Njbdou les erreurs b statut (b7al NOUVEAU wla A_ANALYSER) l wahed l'partenaire
    @Query("SELECT e FROM Erreur e JOIN e.dossier d JOIN d.technicien t WHERE t.partenaire.id = :partenaireId AND e.statut = :statut")
    List<Erreur> findByPartenaireIdAndStatut(@Param("partenaireId") Long partenaireId, @Param("statut") StatutErreur statut);
}