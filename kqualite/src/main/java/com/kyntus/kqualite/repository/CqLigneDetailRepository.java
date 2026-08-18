package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.CqLigneDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CqLigneDetailRepository extends JpaRepository<CqLigneDetail, Long> {
    @Transactional
    void deleteByMoisAndAnneeAndIndicateur(int mois, int annee, String indicateur);
}