package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cq_ligne_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CqLigneDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer mois;

    @Column(nullable = false)
    private Integer annee;

    @Column(nullable = false)
    private String indicateur; // Ex: INCOHERENCE_PTO, GEM_NOK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    private String kyn;
    private String reference; // ID Racc awla Lib Ref Erdv

    // Champs génériques bach n-hzzou fihom ay data bghina 3la 7ssab l'indicateur
    private String champ1;
    private String champ2;
    private String champ3;
}