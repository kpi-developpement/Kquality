package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cq_partenaire_kpis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CqPartenaireKpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    @Column(nullable = false)
    private Integer mois;

    @Column(nullable = false)
    private Integer annee;

    @Column(nullable = false)
    private String indicateur; // Ex: "PLP", "HOTLINE", "CONSTRUCTION", "RANG_2"

    @Column(nullable = false)
    private String zone; // Ex: "A", "B", "C"

    private long num;
    private long denum;
    private double resultat;
    private double bonus; // Wajda l'etape jaya
}