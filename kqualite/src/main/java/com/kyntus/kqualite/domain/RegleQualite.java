package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regles_qualite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegleQualite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code_regle", nullable = false, unique = true)
    private String codeRegle;

    @Column(nullable = false)
    private String description; // Hadi hya Sous Catégorie

    // 🛡️ L'FIX HWA HNA: Zedt Categorie
    @Column(name = "categorie")
    private String categorie;

    @Column(name = "penalite_unitaire", nullable = false)
    private Double penaliteUnitaire;

    @Column(name = "poid_indicateur")
    private Double poidIndicateur;

    @Column(name = "objectif_seuil")
    private Double objectifSeuil;
}