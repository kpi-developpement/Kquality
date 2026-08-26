package com.kyntus.kqualite.repository;

import com.kyntus.kqualite.domain.ArticleView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleViewRepository extends JpaRepository<ArticleView, Long> {
    List<ArticleView> findByArticleId(Long articleId);
    Optional<ArticleView> findByArticleIdAndPartenaireId(Long articleId, Long partenaireId);
}