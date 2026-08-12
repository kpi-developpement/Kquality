package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contestations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contestation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String motif;

    @Column(length = 1000)
    private String commentaire;

    @Column(name = "piece_jointe_url")
    private String pieceJointeUrl;

    @Column(name = "date_depot", nullable = false)
    private LocalDateTime dateDepot;

    @Column(name = "commentaire_decision", length = 1000)
    private String commentaireDecision;

    // Relation m3a l'erreur
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "erreur_id", nullable = false)
    private Erreur erreur;

    // Chkon li dar la contestation (L'utilisateur dyal l'partenaire)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "soumise_par_id", nullable = false)
    private Utilisateur soumisePar;

    // Chkon li jaweb 3liha (L'utilisateur interne dyal KYNTUS) - Y9der ykon null f l'wl
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traitee_par_id")
    private Utilisateur traiteePar;
}