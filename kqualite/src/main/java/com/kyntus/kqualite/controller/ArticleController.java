package com.kyntus.kqualite.controller;

import com.kyntus.kqualite.dto.ApiResponse;
import com.kyntus.kqualite.dto.ArticleDTO;
import com.kyntus.kqualite.dto.ArticleViewDTO;
import com.kyntus.kqualite.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/articles")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> createArticle(
            @RequestParam("titre") String titre,
            @RequestParam("contenu") String contenu,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        articleService.createArticle(titre, contenu, file);
        return ResponseEntity.ok(ApiResponse.success(null, "Article publié"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ArticleDTO>>> getAllArticles() {
        return ResponseEntity.ok(ApiResponse.success(articleService.getAllArticles(), "Articles récupérés"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleDTO>> getArticleById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(articleService.getArticleById(id), "Article récupéré"));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<Void>> recordView(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        articleService.recordView(id, token);
        return ResponseEntity.ok(ApiResponse.success(null, "Vue enregistrée"));
    }

    @GetMapping("/{id}/views")
    public ResponseEntity<ApiResponse<List<ArticleViewDTO>>> getArticleViews(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(articleService.getArticleViews(id), "Vues récupérées"));
    }

    // 🛡️ JDID: Endpoint pour supprimer
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Article supprimé avec succès"));
    }
}