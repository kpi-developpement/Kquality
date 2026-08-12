package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resultats_cq")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultatCQ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "periode_mois", nullable = false)
    private String periodeMois; // Exemple: "2026-08"

    @Column(name = "score_actuel", nullable = false)
    private Double scoreActuel;

    @Column(name = "objectif_global", nullable = false)
    private Double objectifGlobal;

    // L'résultat m3le9 b partenaire wahed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    // Relation One-to-One m3a la pénalité (Kola résultat 3ndo pénalité dyalo f dik l'période)
    @OneToOne(mappedBy = "resultatCQ", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Penalite penalite;
}