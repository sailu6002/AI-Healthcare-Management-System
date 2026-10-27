package com.healthcare.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.healthcare.backend.exception.AuthException;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void registerAlwaysAssignsPatientRoleEvenWhenClientSendsAdmin() {

        User incoming = new User(
                "Mallory", "mallory@example.com", "plain", "ADMIN");

        when(userRepository.existsByEmail("mallory@example.com")).thenReturn(false);
        when(passwordEncoder.encode("plain")).thenReturn("encoded");
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        userService.register(incoming);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User saved = captor.getValue();
        assertThat(saved.getRole()).isEqualTo("PATIENT");
        assertThat(saved.getPassword()).isEqualTo("encoded");
    }

    @Test
    void registerRejectsDuplicateEmailWithConflict() {

        User incoming = new User(
                "Dup", "dup@example.com", "plain", "PATIENT");

        when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(incoming))
                .isInstanceOf(AuthException.class)
                .satisfies(ex -> assertThat(((AuthException) ex).getStatus())
                        .isEqualTo(409));
    }
}
