package com.healthcare.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Date;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.backend.security.JwtService;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * HTTP-layer authorization checks exercised against a real running server, so
 * the production JWT filter and method security are genuinely on the path.
 * Tokens are minted with the production {@link JwtService} (and a deliberately
 * expired one with the same configured secret); this avoids depending on the
 * plaintext seed admin accounts, which cannot log in.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HttpSecurityIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final HttpClient http = HttpClient.newHttpClient();

    private HttpResponse<String> call(
            String method, String path, String token, String body)
            throws Exception {

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json");

        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }

        if (body != null) {
            builder.method(method, HttpRequest.BodyPublishers.ofString(body));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }

        return http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String token(String email, String role) {
        return jwtService.generateToken(email, role);
    }

    private String expiredToken(String email, String role) {
        byte[] key = Decoders.BASE64.decode(jwtSecret);
        long longAgo = System.currentTimeMillis() - 7_200_000L;
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date(longAgo))
                .expiration(new Date(longAgo + 60_000L))
                .signWith(Keys.hmacShaKeyFor(key))
                .compact();
    }

    @AfterEach
    void cleanUpSchedules() {
        // Remove only the schedule this test can create (doctor 1, Wed 09-10).
        jdbcTemplate.update(
                "DELETE FROM doctor_schedules WHERE doctor_id = 1 "
                        + "AND day_of_week = 3 AND start_time = '09:00:00' "
                        + "AND end_time = '10:00:00'");
    }

    @Test
    void adminCanCreateAndDeleteASchedule() throws Exception {
        String admin = token("admin@test.local", "ADMIN");

        HttpResponse<String> created = call("POST",
                "/api/admin/doctors/1/schedule", admin,
                "{\"dayOfWeek\":3,\"startTime\":\"09:00:00\","
                        + "\"endTime\":\"10:00:00\",\"slotMinutes\":30}");
        assertThat(created.statusCode()).isEqualTo(201);

        JsonNode json = objectMapper.readTree(created.body());
        long scheduleId = json.get("scheduleId").asLong();

        assertThat(call("GET", "/api/admin/doctors/1/schedule", admin, null)
                .statusCode()).isEqualTo(200);

        assertThat(call("DELETE",
                "/api/admin/doctors/1/schedule/" + scheduleId, admin, null)
                .statusCode()).isEqualTo(204);
    }

    @Test
    void patientCannotManageSchedules() throws Exception {
        String patient = token("patient@test.local", "PATIENT");

        assertThat(call("POST", "/api/admin/doctors/1/schedule", patient,
                "{\"dayOfWeek\":3,\"startTime\":\"09:00:00\","
                        + "\"endTime\":\"10:00:00\"}")
                .statusCode()).isEqualTo(403);
    }

    @Test
    void onlyAdminCanListAllAppointments() throws Exception {
        assertThat(call("GET", "/api/appointments",
                token("patient@test.local", "PATIENT"), null)
                .statusCode()).isEqualTo(403);

        assertThat(call("GET", "/api/appointments",
                token("admin@test.local", "ADMIN"), null)
                .statusCode()).isEqualTo(200);
    }

    @Test
    void missingTokenIsUnauthorized() throws Exception {
        assertThat(call("POST", "/api/admin/doctors/1/schedule", null,
                "{\"dayOfWeek\":3,\"startTime\":\"09:00:00\","
                        + "\"endTime\":\"10:00:00\"}")
                .statusCode()).isEqualTo(401);
    }

    @Test
    void malformedTokenIsUnauthorized() throws Exception {
        assertThat(call("GET", "/api/appointments/mine", "not.a.jwt", null)
                .statusCode()).isEqualTo(401);
    }

    @Test
    void expiredTokenIsUnauthorized() throws Exception {
        assertThat(call("GET", "/api/appointments/mine",
                expiredToken("patient@test.local", "PATIENT"), null)
                .statusCode()).isEqualTo(401);
    }
}
