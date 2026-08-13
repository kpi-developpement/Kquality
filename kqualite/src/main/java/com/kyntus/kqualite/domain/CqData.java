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
    private String typeFeuille; // Ex: "Audits tech", "Check-voisinage"...

    @Column(name = "kyn", nullable = false)
    private String kyn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    @Column(name = "an_mois")
    private String anMois;

    @Column(name = "reference")
    private String reference; // IDNT_RDV, Intervention number...

    @Column(name = "departement")
    private String departement;

    @Column(name = "montant")
    private Double montant;

    @Column(name = "valeur_metrique")
    private String valeurMetrique; // Nb_clients_coupes, Nbre de voisins KO...
}