package com.kyntus.kqualite.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = true;

    @ManyToOne(fetch = FetchType.EAGER) // Eager bach njbdouh bzrba f l'Auth
    @JoinColumn(name = "partenaire_id")
    private Partenaire partenaire;

    // 🛡️ L'FIX HWA HNA: Liste dyal les permissions dynamiques (ex: "READ_DASHBOARD", "TRAITER_CONTESTATION")
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "utilisateur_permissions", joinColumns = @JoinColumn(name = "utilisateur_id"))
    @Column(name = "permission")
    @Builder.Default
    private List<String> permissions = new ArrayList<>();

    // --- Méthodes dyal Spring Security ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        // N-zidou l'Role
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        // N-zidou les Permissions
        for (String permission : permissions) {
            authorities.add(new SimpleGrantedAuthority(permission));
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return motDePasse;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return actif;
    }
}