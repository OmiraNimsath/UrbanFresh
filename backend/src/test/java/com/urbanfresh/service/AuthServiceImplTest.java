package com.urbanfresh.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.urbanfresh.dto.request.LoginRequest;
import com.urbanfresh.dto.response.LoginResponse;
import com.urbanfresh.exception.InvalidCredentialsException;
import com.urbanfresh.exception.SupplierInactiveException;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.security.JwtUtil;
import com.urbanfresh.service.impl.AuthServiceImpl;

/**
 * Test Layer – Unit tests for login behavior with supplier deactivation rules.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    /**
     * Verifies an inactive supplier cannot authenticate.
     */
    @Test
    void login_throwsWhenSupplierInactive() {
        LoginRequest request = new LoginRequest("supplier@urbanfresh.test", "Temp@12345");
        User supplier = User.builder()
                .email("supplier@urbanfresh.test")
                .password("encoded")
                .role(Role.SUPPLIER)
                .isActive(false)
                .build();

        when(userRepository.findByEmail("supplier@urbanfresh.test")).thenReturn(Optional.of(supplier));
        when(passwordEncoder.matches("Temp@12345", "encoded")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(SupplierInactiveException.class);
    }

    /**
     * Verifies inactive non-supplier users keep generic invalid-credentials behavior.
     */
    @Test
    void login_throwsGenericInvalidCredentialsWhenNonSupplierInactive() {
        LoginRequest request = new LoginRequest("delivery@urbanfresh.test", "Temp@12345");
        User delivery = User.builder()
                .email("delivery@urbanfresh.test")
                .password("encoded")
                .role(Role.DELIVERY)
                .isActive(false)
                .build();

        when(userRepository.findByEmail("delivery@urbanfresh.test")).thenReturn(Optional.of(delivery));
        when(passwordEncoder.matches("Temp@12345", "encoded")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    /**
     * Verifies active suppliers can authenticate successfully.
     */
    @Test
    void login_returnsTokenWhenSupplierActive() {
        LoginRequest request = new LoginRequest("supplier@urbanfresh.test", "Temp@12345");
        User supplier = User.builder()
                .email("supplier@urbanfresh.test")
                .name("Saira Supplier")
                .password("encoded")
                .role(Role.SUPPLIER)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("supplier@urbanfresh.test")).thenReturn(Optional.of(supplier));
        when(passwordEncoder.matches("Temp@12345", "encoded")).thenReturn(true);
        when(jwtUtil.generateToken("supplier@urbanfresh.test", "SUPPLIER")).thenReturn("jwt-token");

        LoginResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getRole()).isEqualTo("SUPPLIER");
    }
}
