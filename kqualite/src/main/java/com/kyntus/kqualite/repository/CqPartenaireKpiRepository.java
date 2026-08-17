package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.CqPartenaireKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CqPartenaireKpiRepository extends JpaRepository<CqPartenaireKpi, Long> {

    @Transactional
    void deleteByMoisAndAnnee(int mois, int annee);

    List<CqPartenaireKpi> findByMoisAndAnnee(int mois, int annee);

    List<CqPartenaireKpi> findByMoisAndAnneeAndPartenaireId(int mois, int annee, Long partenaireId);
}