package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDTO {
    private Long id;
    private String titre;
    private String contenu;
    private LocalDateTime dateCreation;
    private int vuesCount;
    private List<MediaDTO> medias; // 🛡️ JDID
}