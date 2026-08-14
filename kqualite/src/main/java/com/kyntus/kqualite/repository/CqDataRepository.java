package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.CqData;
import com.kyntus.kqualite.domain.Partenaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CqDataRepository extends JpaRepository<CqData, Long> {

    List<CqData> findByPartenaireIdAndTypeFeuilleAndMoisAndAnnee(Long partenaireId, String typeFeuille, int mois, int annee);

    List<CqData> findByMoisAndAnneeAndTypeFeuille(int mois, int annee, String typeFeuille);

    List<CqData> findByMoisAndAnneeAndTypeFeuilleAndPartenaireId(int mois, int annee, String typeFeuille, Long partenaireId);

    @Transactional
    void deleteByMoisAndAnnee(int mois, int annee);

    // 🛡️ L'FIX HWA HNA: Jbed ghir les partenaires li 3ndhom data f had l'mois w l'annee
    @Query("SELECT DISTINCT c.partenaire FROM CqData c WHERE c.mois = :mois AND c.annee = :annee")
    List<Partenaire> findDistinctPartenairesByMoisAndAnnee(@Param("mois") int mois, @Param("annee") int annee);
}