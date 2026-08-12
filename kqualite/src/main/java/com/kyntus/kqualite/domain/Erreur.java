package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "erreurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Erreur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_detection", nullable = false)
    private LocalDateTime dateDetection;

    @Column(name = "preuve_url")
    private String preuveUrl;

    @Column(name = "impact_estime")
    private Double impactEstime;

    @Column(name = "echeance_contestation")
    private LocalDateTime echeanceContestation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutErreur statut;

    // L'erreur katlsa9 f dossier wahed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    // L'erreur katkhra9 règle wa7da
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "regle_qualite_id", nullable = false)
    private RegleQualite regleQualite;

    // 1-to-1 relation: Erreur wehda 3ndha f l'max contestation wehda
    @OneToOne(mappedBy = "erreur", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Contestation contestation;
}