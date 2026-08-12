package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "import_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_fichier_excel", nullable = false)
    private String nomFichierExcel;

    @Column(name = "date_import", nullable = false)
    private LocalDateTime dateImport;

    @Column(name = "lignes_traitees", nullable = false)
    private Integer lignesTraitees;

    @Column(name = "lignes_rejetees", nullable = false)
    private Integer lignesRejetees;

    // Y9der tzid 7ta chkon li dar l'import (Utilisateur interne)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importe_par_id")
    private Utilisateur importePar;
}