package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.Technicien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TechnicienRepository extends JpaRepository<Technicien, Long> {
    Optional<Technicien> findByMatricule(String matricule);
}