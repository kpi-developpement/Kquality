package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.ArticleMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleMediaRepository extends JpaRepository<ArticleMedia, Long> {
}