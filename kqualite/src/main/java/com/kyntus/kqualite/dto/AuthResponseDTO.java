package com.kyntus.kqualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private Long id;
    private String email;
    private String role;
    private List<String> permissions;
    private Long partenaireId;
    private Boolean mustChangePassword; // 🛡️ L'FIX HWA HNA
}