package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Article;
import com.kyntus.kqualite.domain.ArticleMedia;
import com.kyntus.kqualite.domain.ArticleView;
import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.ArticleDTO;
import com.kyntus.kqualite.dto.ArticleViewDTO;
import com.kyntus.kqualite.dto.MediaDTO;
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
import java.util.ArrayList;
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
    public void createArticle(String titre, String contenu, MultipartFile[] files) {
        Article article = Article.builder()
                .titre(titre)
                .contenu(contenu)
                .dateCreation(LocalDateTime.now())
                .build();

        // On sauvegarde l'article d'abord pour avoir son ID
        article = articleRepository.save(article);

        // 🛡️ JDID: Traitement de plusieurs fichiers
        if (files != null && files.length > 0) {
            List<ArticleMedia> mediaList = new ArrayList<>();
            try {
                Files.createDirectories(this.fileStorageLocation);
                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;

                    String originalFilename = file.getOriginalFilename();
                    String extension = originalFilename != null && originalFilename.contains(".")
                            ? originalFilename.substring(originalFilename.lastIndexOf("."))
                            : "";
                    String newFilename = UUID.randomUUID().toString() + extension;
                    Path targetLocation = this.fileStorageLocation.resolve(newFilename);
                    Files.copy(file.getInputStream(), targetLocation);

                    ArticleMedia media = ArticleMedia.builder()
                            .mediaUrl("/api/v1/files/" + newFilename)
                            .mediaType(file.getContentType())
                            .article(article)
                            .build();
                    mediaList.add(media);
                }
                article.setMedias(mediaList);
                articleRepository.save(article);
            } catch (Exception ex) {
                throw new RuntimeException("Erreur lors de la sauvegarde des fichiers multimédias", ex);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<ArticleDTO> getAllArticles() {
        return articleRepository.findAll(Sort.by(Sort.Direction.DESC, "dateCreation")).stream().map(a -> {
            int views = articleViewRepository.findByArticleId(a.getId()).size();
            List<MediaDTO> mediaDTOs = a.getMedias().stream()
                    .map(m -> new MediaDTO(m.getId(), m.getMediaUrl(), m.getMediaType()))
                    .collect(Collectors.toList());

            return ArticleDTO.builder()
                    .id(a.getId())
                    .titre(a.getTitre())
                    .contenu(a.getContenu())
                    .dateCreation(a.getDateCreation())
                    .vuesCount(views)
                    .medias(mediaDTOs)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ArticleDTO getArticleById(Long id) {
        Article a = articleRepository.findById(id).orElseThrow(() -> new RuntimeException("Article introuvable"));
        List<MediaDTO> mediaDTOs = a.getMedias().stream()
                .map(m -> new MediaDTO(m.getId(), m.getMediaUrl(), m.getMediaType()))
                .collect(Collectors.toList());

        return ArticleDTO.builder()
                .id(a.getId())
                .titre(a.getTitre())
                .contenu(a.getContenu())
                .dateCreation(a.getDateCreation())
                .medias(mediaDTOs)
                .build();
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

    @Transactional
    public void deleteArticle(Long id) {
        Article article = articleRepository.findById(id).orElseThrow(() -> new RuntimeException("Article introuvable"));
        List<ArticleView> views = articleViewRepository.findByArticleId(id);
        articleViewRepository.deleteAll(views);
        articleRepository.delete(article);
    }
}