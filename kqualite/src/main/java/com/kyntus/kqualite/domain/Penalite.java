package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "penalites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Penalite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "periode_mois", nullable = false)
    private String periodeMois; // Exemple: "2026-08"

    @Column(name = "montant_total", nullable = false)
    private Double montantTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPenalite statut;

    // L'pénalité katlsa9 f l'résultat CQ dyal dak ch'her
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resultat_cq_id", nullable = false)
    private ResultatCQ resultatCQ;
}