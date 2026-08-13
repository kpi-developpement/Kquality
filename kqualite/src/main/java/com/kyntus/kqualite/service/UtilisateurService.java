package com.kyntus.kqualite.service;

import com.kyntus.kqualite.domain.Partenaire;
import com.kyntus.kqualite.domain.Role;
import com.kyntus.kqualite.domain.Utilisateur;
import com.kyntus.kqualite.dto.PartenaireDTO;
import com.kyntus.kqualite.dto.UtilisateurDTO;
import com.kyntus.kqualite.repository.PartenaireRepository;
import com.kyntus.kqualite.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PartenaireRepository partenaireRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UtilisateurDTO> getAllUsers() {
        return utilisateurRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PartenaireDTO> getAllPartenaires() {
        return partenaireRepository.findAll().stream()
                .map(p -> new PartenaireDTO(p.getId(), p.getNomEntreprise()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void createUser(UtilisateurDTO dto) {
        if (utilisateurRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Cet email existe déjà !");
        }

        Utilisateur user = new Utilisateur();
        user.setEmail(dto.getEmail());
        user.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        user.setRole(Role.valueOf(dto.getRole()));
        user.setActif(dto.getActif() != null ? dto.getActif() : true);
        user.setPermissions(dto.getPermissions());

        if (dto.getPartenaireId() != null) {
            Partenaire p = partenaireRepository.findById(dto.getPartenaireId())
                    .orElseThrow(() -> new RuntimeException("Partenaire introuvable"));
            user.setPartenaire(p);
        }

        utilisateurRepository.save(user);
    }

    @Transactional
    public void updateUser(Long id, UtilisateurDTO dto) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        user.setEmail(dto.getEmail());
        user.setRole(Role.valueOf(dto.getRole()));
        user.setActif(dto.getActif());
        user.setPermissions(dto.getPermissions());

        if (dto.getMotDePasse() != null && !dto.getMotDePasse().isEmpty()) {
            user.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        }

        if (dto.getPartenaireId() != null) {
            Partenaire p = partenaireRepository.findById(dto.getPartenaireId())
                    .orElseThrow(() -> new RuntimeException("Partenaire introuvable"));
            user.setPartenaire(p);
        } else {
            user.setPartenaire(null);
        }

        utilisateurRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        utilisateurRepository.deleteById(id);
    }

    private UtilisateurDTO mapToDTO(Utilisateur user) {
        return UtilisateurDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .actif(user.getActif())
                .permissions(user.getPermissions())
                .partenaireId(user.getPartenaire() != null ? user.getPartenaire().getId() : null)
                .partenaireNom(user.getPartenaire() != null ? user.getPartenaire().getNomEntreprise() : null)
                .build();
    }
}