package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.Partenaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartenaireRepository extends JpaRepository<Partenaire, Long> {
    Optional<Partenaire> findByReferenceContrat(String referenceContrat);
}