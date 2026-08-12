package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "techniciens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Technicien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String matricule;

    @Column(name = "nom_complet", nullable = false)
    private String nomComplet;

    private String agence;

    // L'technicien kheddam m3a Partenaire wahed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;
}