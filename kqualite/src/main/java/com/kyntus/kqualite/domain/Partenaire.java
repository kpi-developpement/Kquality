package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "partenaires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partenaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_entreprise", nullable = false)
    private String nomEntreprise;

    @Column(name = "reference_contrat", nullable = false, unique = true)
    private String referenceContrat;

    // Relation m3a les utilisateurs dyal had l'partenaire
    @OneToMany(mappedBy = "partenaire", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Utilisateur> utilisateurs;
}