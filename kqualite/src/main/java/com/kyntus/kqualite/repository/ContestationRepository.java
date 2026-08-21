package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.Contestation;
import com.kyntus.kqualite.domain.StatutErreur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestationRepository extends JpaRepository<Contestation, Long> {

    // Kat-jbed les contestations li l'erreur dyalhom mazal f statut 'CONTESTE'
    @Query("SELECT c FROM Contestation c JOIN c.erreur e WHERE e.statut = :statut")
    List<Contestation> findByErreurStatut(@Param("statut") StatutErreur statut);

    // 🛡️ JDID: Compter le nombre de contestations pour un mois et une année spécifiques
    @Query("SELECT COUNT(c) FROM Contestation c WHERE EXTRACT(MONTH FROM c.dateDepot) = :month AND EXTRACT(YEAR FROM c.dateDepot) = :year")
    long countByMonthAndYear(@Param("month") int month, @Param("year") int year);
}