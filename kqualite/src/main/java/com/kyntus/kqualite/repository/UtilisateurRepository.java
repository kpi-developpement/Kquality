package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    // Htajnaha l'authentification (login)
    Optional<Utilisateur> findByEmail(String email);
}