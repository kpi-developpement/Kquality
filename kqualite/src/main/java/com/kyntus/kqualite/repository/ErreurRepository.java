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

    @Query("SELECT e FROM Erreur e JOIN e.dossier d JOIN d.technicien t WHERE t.partenaire.id = :partenaireId")
    List<Erreur> findAllByPartenaireId(@Param("partenaireId") Long partenaireId);

    // 🛡️ L'FIX HWA HNA: Support du "0" pour dire "Toute la période" (All Time)
    @Query("SELECT e FROM Erreur e JOIN e.dossier d JOIN d.technicien t WHERE t.partenaire.id = :partenaireId AND (:month = 0 OR EXTRACT(MONTH FROM e.dateDetection) = :month) AND (:year = 0 OR EXTRACT(YEAR FROM e.dateDetection) = :year)")
    List<Erreur> findByPartenaireIdAndMoisAndAnnee(@Param("partenaireId") Long partenaireId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT e FROM Erreur e JOIN e.dossier d JOIN d.technicien t WHERE t.partenaire.id = :partenaireId AND e.statut = :statut")
    List<Erreur> findByPartenaireIdAndStatut(@Param("partenaireId") Long partenaireId, @Param("statut") StatutErreur statut);

    // 🛡️ Support du "0" pour l'Admin aussi
    @Query("SELECT e FROM Erreur e JOIN e.dossier d JOIN d.technicien t WHERE (:partenaireId IS NULL OR t.partenaire.id = :partenaireId) AND (:month = 0 OR EXTRACT(MONTH FROM e.dateDetection) = :month) AND (:year = 0 OR EXTRACT(YEAR FROM e.dateDetection) = :year)")
    List<Erreur> findByFiltres(@Param("partenaireId") Long partenaireId, @Param("month") int month, @Param("year") int year);
}