package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.Dossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DossierRepository extends JpaRepository<Dossier, Long> {
    Optional<Dossier> findByReferenceID(String referenceID);
}