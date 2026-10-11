package com.healthcare.backend.service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.healthcare.backend.exception.AuthException;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new AuthException("Email already registered", 409);
        }

        // Public registration must never be able to choose a privileged role.
        // Any client-supplied role (including "ADMIN") is ignored.
        user.setRole("PATIENT");

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    public User getByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new AuthException("Invalid email or password", 401));
    }


    public User login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new AuthException("Invalid email or password", 401));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AuthException("Invalid email or password", 401);
        }

        return user;
    }
    
}
