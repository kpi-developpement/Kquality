package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.CqData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CqDataRepository extends JpaRepository<CqData, Long> {
    List<CqData> findByPartenaireIdAndTypeFeuille(Long partenaireId, String typeFeuille);
}