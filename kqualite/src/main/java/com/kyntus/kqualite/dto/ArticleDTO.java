package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDTO {
    private Long id;
    private String titre;
    private String contenu;
    private String imageUrl;
    private LocalDateTime dateCreation;
    private int vuesCount; // Pour l'admin
}