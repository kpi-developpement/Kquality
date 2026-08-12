package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.Penalite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PenaliteRepository extends JpaRepository<Penalite, Long> {
    // L'penalite mliya m3a ResultatCQ, n9drou njbdouha b l'ID dyal Resultat
    Optional<Penalite> findByResultatCQId(Long resultatCqId);
}