package com.healthcare.backend.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.backend.dto.AiAssessmentRequest;

@Service
public class AiService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public AiService() {

        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        this.objectMapper = new ObjectMapper();
    }

    public String checkHealth() {

        try {

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://127.0.0.1:8000/health"))
                    .version(HttpClient.Version.HTTP_1_1)
                    .GET()
                    .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            return response.body();

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to connect to AI service",
                    e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "AI health request was interrupted",
                    e
            );
        }
    }

    public String assessPatient(AiAssessmentRequest request) {

        try {

            // Convert Java object into JSON
            String jsonBody =
                    objectMapper.writeValueAsString(request);

            // Debug: print the JSON being sent
            System.out.println("AI REQUEST BODY:");
            System.out.println(jsonBody);

            // Create HTTP request
            HttpRequest httpRequest =
                    HttpRequest.newBuilder()
                            .uri(URI.create(
                                    "http://127.0.0.1:8000/api/v1/assess"
                            ))
                            .version(HttpClient.Version.HTTP_1_1)
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

            System.out.println("SENDING REQUEST TO AI...");

            // Send request to FastAPI
            HttpResponse<String> response =
                    httpClient.send(
                            httpRequest,
                            HttpResponse.BodyHandlers.ofString()
                    );

            // Print AI response status
            System.out.println(
                    "AI RESPONSE STATUS: "
                            + response.statusCode()
            );

            // Print AI response
            System.out.println("AI RESPONSE BODY:");
            System.out.println(response.body());

            // Handle error response
            if (response.statusCode() >= 400) {

                throw new RuntimeException(
                        "AI service returned HTTP "
                                + response.statusCode()
                                + ": "
                                + response.body()
                );
            }

            // Return successful AI response
            return response.body();

        } catch (JsonProcessingException e) {

            throw new RuntimeException(
                    "Failed to convert AI request to JSON",
                    e
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to connect to AI service",
                    e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "AI request was interrupted",
                    e
            );
        }
    }
}