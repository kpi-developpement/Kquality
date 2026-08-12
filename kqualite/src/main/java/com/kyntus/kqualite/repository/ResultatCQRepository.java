package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.ResultatCQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResultatCQRepository extends JpaRepository<ResultatCQ, Long> {
    // Njbdou l'resultat dyal partenaire f ch'her specifique (ex: "2026-08")
    Optional<ResultatCQ> findByPartenaireIdAndPeriodeMois(Long partenaireId, String periodeMois);
}