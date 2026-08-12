package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.RegleQualite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegleQualiteRepository extends JpaRepository<RegleQualite, Long> {
    Optional<RegleQualite> findByCodeRegle(String codeRegle);
}