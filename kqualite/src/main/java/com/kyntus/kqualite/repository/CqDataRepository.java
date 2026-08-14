package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.CqData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CqDataRepository extends JpaRepository<CqData, Long> {

    // L'Partenaire y-jbed data dyalo f ch'her w 3am
    List<CqData> findByPartenaireIdAndTypeFeuilleAndMoisAndAnnee(Long partenaireId, String typeFeuille, int mois, int annee);

    // L'Admin y-jbed data globale f ch'her w 3am
    List<CqData> findByMoisAndAnneeAndTypeFeuille(int mois, int annee, String typeFeuille);

    // L'Admin y-jbed data m-filtréya b l'partenaire
    List<CqData> findByMoisAndAnneeAndTypeFeuilleAndPartenaireId(int mois, int annee, String typeFeuille, Long partenaireId);

    @Transactional
    void deleteByMoisAndAnnee(int mois, int annee);
}