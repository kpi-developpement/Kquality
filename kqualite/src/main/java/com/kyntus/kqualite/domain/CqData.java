package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cq_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CqData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type_feuille", nullable = false)
    private String typeFeuille;

    @Column(name = "kyn", nullable = false)
    private String kyn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    @Column(name = "mois", nullable = false)
    private Integer mois;

    @Column(name = "annee", nullable = false)
    private Integer annee;

    @Column(name = "an_mois")
    private String anMois;

    @Column(name = "reference")
    private String reference;

    @Column(name = "departement")
    private String departement;

    @Column(name = "montant")
    private Double montant;

    // 🛡️ L'FIX HWA HNA: Zedt l'colonne MT SST
    @Column(name = "mt_sst")
    private Double mtSst;

    @Column(name = "valeur_metrique")
    private String valeurMetrique;
}