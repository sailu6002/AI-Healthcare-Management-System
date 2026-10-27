package com.healthcare.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
<<<<<<< HEAD
import org.springframework.http.HttpMethod;
=======
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.healthcare.backend.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CorsConfigurationSource corsConfigurationSource
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // 1. Explicitly wire the CORS configuration source into Spring Security
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // 2. Disable CSRF for stateless REST APIs
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth

                // Preflight OPTIONS requests MUST always be permitted for CORS to succeed
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public Authentication APIs
                .requestMatchers("/api/auth", "/api/auth/**").permitAll()

                // Public Doctor & Specialization Lookups
                .requestMatchers(HttpMethod.GET, "/api/doctors", "/api/doctors/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/specializations", "/api/specializations/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/departments", "/api/departments/**").permitAll()

                // Public Appointment Booking & Slot Availability & AI Recommendation queries
                .requestMatchers(HttpMethod.GET, "/api/appointments", "/api/appointments/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/appointments", "/api/appointments/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/appointments", "/api/appointments/**").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/api/appointments", "/api/appointments/**").permitAll()

                // Reminder retrieval for active patients
                .requestMatchers(HttpMethod.GET, "/api/reminders", "/api/reminders/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reminders", "/api/reminders/**").permitAll()

                // AI Disease Risk Prediction & Model Metrics (Screening accessibility)
                .requestMatchers("/api/ai", "/api/ai/**").permitAll()

                // Medicine Directory & Drug Interaction Checker (Educational / Safety reference)
                .requestMatchers("/api/medicines", "/api/medicines/**").permitAll()

                // Pharmacy Suggestions & Geolocation Lookups
                .requestMatchers("/api/pharmacies", "/api/pharmacies/**").permitAll()

                // Swagger / OpenAPI documentation
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // Admin endpoints require ADMIN role
                .requestMatchers("/api/admin/**")
                .hasAuthority("ROLE_ADMIN")

                // All other protected medical & patient APIs require authentication
                .requestMatchers("/api/**")
                .authenticated()

                .anyRequest()
                .authenticated()
            )

            // Return consistent JSON for missing/invalid authentication
            // instead of Spring's default 403 error page.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"status\":401,\"error\":\"Unauthorized\","
                            + "\"message\":\"Authentication is required to "
                            + "access this resource.\"}"
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"status\":403,\"error\":\"Forbidden\","
                            + "\"message\":\"You do not have permission to "
                            + "access this resource.\"}"
                    );
                })
            )

            // Add JWT filter before username/password authentication
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
