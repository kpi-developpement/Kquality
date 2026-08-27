package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    // 🛡️ JDID: Relation One-to-Many pour supporter plusieurs médias
    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ArticleMedia> medias = new ArrayList<>();
}