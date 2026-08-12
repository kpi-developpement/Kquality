package com.kyntus.kqualite.service;

import com.kyntus.kqualite.dto.KpiArchiveDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class KpiIntegrationService {

    // L'FIX HWA HNA: Derna l'IP dyal l'serveur bach Docker y9der y-l9a l'application lwla
    private final String CONTRAT_QUALITY_API_URL = "http://10.10.10.25:7623/api/v1/export/kpi";

    public List<KpiArchiveDTO> fetchKpiGlobal(int month, int year) {
        RestTemplate restTemplate = new RestTemplate();
        String url = CONTRAT_QUALITY_API_URL + "?month=" + month + "&year=" + year;

        try {
            ResponseEntity<List<KpiArchiveDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<KpiArchiveDTO>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des KPIs depuis ContratQuality: {}", e.getMessage());
            throw new RuntimeException("Impossible de récupérer les données de l'usine à KPIs.");
        }
    }
}