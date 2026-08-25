package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.CqPartenaireKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CqPartenaireKpiRepository extends JpaRepository<CqPartenaireKpi, Long> {

    @Transactional
    void deleteByMoisAndAnnee(int mois, int annee);

    List<CqPartenaireKpi> findByMoisAndAnnee(int mois, int annee);

    List<CqPartenaireKpi> findByMoisAndAnneeAndPartenaireId(int mois, int annee, Long partenaireId);

    // 🛡️ JDID: Requêtes pour la purge ciblée
    @Modifying
    @Transactional
    @Query("DELETE FROM CqPartenaireKpi c WHERE c.mois = :mois AND c.annee = :annee AND c.indicateur IN :indicateurs")
    void deleteByMoisAndAnneeAndIndicateurIn(@Param("mois") int mois, @Param("annee") int annee, @Param("indicateurs") List<String> indicateurs);

    @Modifying
    @Transactional
    @Query("DELETE FROM CqPartenaireKpi c WHERE c.mois = :mois AND c.annee = :annee AND c.indicateur = :indicateur")
    void deleteByMoisAndAnneeAndIndicateur(@Param("mois") int mois, @Param("annee") int annee, @Param("indicateur") String indicateur);
}