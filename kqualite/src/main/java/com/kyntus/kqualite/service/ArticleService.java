package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Article;
import com.kyntus.kqualite.domain.ArticleView;
import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ArticleDTO;
import com.kyntus.kqualite.dto.ArticleViewDTO;
import com.kyntus.kqualite.repository.ArticleRepository;
import com.kyntus.kqualite.repository.ArticleViewRepository;
import com.kyntus.kqualite.repository.UtilisateurRepository;
import com.kyntus.kqualite.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleViewRepository articleViewRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtService jwtService;

    private final Path fileStorageLocation = Paths.get("uploads/preuves").toAbsolutePath().normalize();

    @Transactional
    public void createArticle(String titre, String contenu, MultipartFile file) {
        String fileUrl = null;
        if (file != null && !file.isEmpty()) {
            try {
                Files.createDirectories(this.fileStorageLocation);
                String originalFilename = file.getOriginalFilename();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String newFilename = UUID.randomUUID().toString() + extension;
                Path targetLocation = this.fileStorageLocation.resolve(newFilename);
                Files.copy(file.getInputStream(), targetLocation);
                fileUrl = "/api/v1/files/" + newFilename;
            } catch (Exception ex) {
                throw new RuntimeException("Erreur sauvegarde image", ex);
            }
        }

        Article article = Article.builder()
                .titre(titre)
                .contenu(contenu)
                .imageUrl(fileUrl)
                .dateCreation(LocalDateTime.now())
                .build();
        articleRepository.save(article);
    }

    @Transactional(readOnly = true)
    public List<ArticleDTO> getAllArticles() {
        return articleRepository.findAll(Sort.by(Sort.Direction.DESC, "dateCreation")).stream().map(a -> {
            int views = articleViewRepository.findByArticleId(a.getId()).size();
            return ArticleDTO.builder()
                    .id(a.getId()).titre(a.getTitre()).contenu(a.getContenu())
                    .imageUrl(a.getImageUrl()).dateCreation(a.getDateCreation())
                    .vuesCount(views).build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ArticleDTO getArticleById(Long id) {
        Article a = articleRepository.findById(id).orElseThrow(() -> new RuntimeException("Article introuvable"));
        return ArticleDTO.builder()
                .id(a.getId()).titre(a.getTitre()).contenu(a.getContenu())
                .imageUrl(a.getImageUrl()).dateCreation(a.getDateCreation()).build();
    }

    @Transactional
    public void recordView(Long articleId, String token) {
        String email = jwtService.extractUsername(token.substring(7));
        Utilisateur user = utilisateurRepository.findByEmail(email).orElseThrow();
        Partenaire partenaire = user.getPartenaire();

        if (partenaire != null) {
            Article article = articleRepository.findById(articleId).orElseThrow();
            if (articleViewRepository.findByArticleIdAndPartenaireId(articleId, partenaire.getId()).isEmpty()) {
                articleViewRepository.save(ArticleView.builder()
                        .article(article)
                        .partenaire(partenaire)
                        .dateVue(LocalDateTime.now())
                        .build());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<ArticleViewDTO> getArticleViews(Long articleId) {
        return articleViewRepository.findByArticleId(articleId).stream()
                .map(v -> new ArticleViewDTO(v.getPartenaire().getNomEntreprise(), v.getDateVue()))
                .collect(Collectors.toList());
    }
}