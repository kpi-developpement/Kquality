package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "article_medias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "media_url", nullable = false)
    private String mediaUrl;

    @Column(name = "media_type", nullable = false)
    private String mediaType; // ex: "image/png", "video/mp4", "application/pdf"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;
}