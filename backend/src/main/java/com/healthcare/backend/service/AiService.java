package com.healthcare.backend.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.backend.dto.AiAssessmentRequest;
import com.healthcare.backend.exception.AiServiceException;

@Service
public class AiService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final Duration requestTimeout;

    public AiService(
            @Value("${ai.service.base-url:http://127.0.0.1:8000}") String baseUrl,
            @Value("${ai.service.connect-timeout-ms:3000}") long connectTimeoutMs,
            @Value("${ai.service.request-timeout-ms:15000}") long requestTimeoutMs) {

        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.requestTimeout = Duration.ofMillis(requestTimeoutMs);

        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .build();

        this.objectMapper = new ObjectMapper();
    }

    public String checkHealth() {

        try {

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/health"))
                    .version(HttpClient.Version.HTTP_1_1)
                    .timeout(requestTimeout)
                    .GET()
                    .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            return response.body();

        } catch (IOException e) {

            throw new AiServiceException(
                    "Failed to connect to AI service",
                    true,
                    e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new AiServiceException(
                    "AI health request was interrupted",
                    true,
                    e
            );
        }
    }

    public String assessPatient(AiAssessmentRequest request) {

        try {

            // Convert Java object into JSON
            String jsonBody =
                    objectMapper.writeValueAsString(request);

            HttpRequest httpRequest =
                    HttpRequest.newBuilder()
                            .uri(URI.create(baseUrl + "/api/v1/assess"))
                            .version(HttpClient.Version.HTTP_1_1)
                            .timeout(requestTimeout)
                            .header(
                                    "Content-Type",
                                    "application/json; charset=UTF-8"
                            )
                            .header(
                                    "Accept",
                                    "application/json"
                            )
                            .POST(
                                    HttpRequest.BodyPublishers.ofString(
                                            jsonBody,
                                            StandardCharsets.UTF_8
                                    )
                            )
                            .build();

            HttpResponse<String> response =
                    httpClient.send(
                            httpRequest,
                            HttpResponse.BodyHandlers.ofString()
                    );

            // Handle error response
            if (response.statusCode() >= 400) {

                throw new AiServiceException(
                        "AI service returned HTTP "
                                + response.statusCode(),
                        false
                );
            }

            // Return successful AI response
            return response.body();

        } catch (JsonProcessingException e) {

            throw new AiServiceException(
                    "Failed to convert AI request to JSON",
                    false,
                    e
            );

        } catch (IOException e) {

            throw new AiServiceException(
                    "Failed to connect to AI service",
                    true,
                    e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new AiServiceException(
                    "AI request was interrupted",
                    true,
                    e
            );
        }
    }
}
