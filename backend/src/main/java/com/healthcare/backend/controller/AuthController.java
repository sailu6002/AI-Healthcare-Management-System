package com.healthcare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.AuthRequest;
import com.healthcare.backend.dto.AuthResponse;
import com.healthcare.backend.model.User;
import com.healthcare.backend.security.JwtService;
import com.healthcare.backend.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody User user) {

        User registeredUser = userService.register(user);

        String token = jwtService.generateToken(
                registeredUser.getEmail(),
                registeredUser.getRole()
        );

        AuthResponse response = new AuthResponse(
                registeredUser.getUserId(),
                registeredUser.getFullName(),
                registeredUser.getEmail(),
                registeredUser.getRole(),
                token
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody AuthRequest request) {

        User loggedInUser = userService.login(
                request.getEmail(),
                request.getPassword()
        );

        String token = jwtService.generateToken(
                loggedInUser.getEmail(),
                loggedInUser.getRole()
        );

        AuthResponse response = new AuthResponse(
                loggedInUser.getUserId(),
                loggedInUser.getFullName(),
                loggedInUser.getEmail(),
                loggedInUser.getRole(),
                token
        );

        return ResponseEntity.ok(response);
    }
}