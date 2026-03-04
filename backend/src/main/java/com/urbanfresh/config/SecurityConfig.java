package com.urbanfresh.config;

import com.urbanfresh.security.JwtAuthFilter;
import com.urbanfresh.security.JwtAuthEntryPoint;
import com.urbanfresh.security.RoleAccessDeniedHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Config Layer – Spring Security configuration.
 * Defines password encoding, stateless session policy, URL-level role restrictions,
 * and registers the JWT authentication filter.
 * Enables method-level security (@PreAuthorize) as a second layer of defence.
 * Returns JSON 401 (JwtAuthEntryPoint) for missing/invalid tokens and JSON 403
 * (RoleAccessDeniedHandler) for wrong-role requests.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize / @PostAuthorize on controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final RoleAccessDeniedHandler roleAccessDeniedHandler;

    /**
     * BCrypt encoder used by AuthService to hash passwords.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Security filter chain:
     * - Stateless sessions (no server-side sessions)
     * - CSRF disabled (not needed for stateless REST APIs)
     * - Public access to /api/auth/** endpoints
     * - Role-specific URL restrictions for /api/admin/**, /api/supplier/**, /api/delivery/**
     * - All other endpoints require a valid JWT
     * - JwtAuthFilter runs before UsernamePasswordAuthenticationFilter
     * - 401 → JwtAuthEntryPoint (no token or invalid token)
     * - 403 → RoleAccessDeniedHandler (valid token but wrong role)
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/**").permitAll()
                        // Landing page product endpoints are public — no JWT required
                        .requestMatchers(HttpMethod.GET, "/api/products/featured").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/near-expiry").permitAll()
                        // Product listing, search, and category filter are public
                        .requestMatchers(HttpMethod.GET, "/api/products").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/categories").permitAll()
                        // Role-based URL-level restrictions (first line of defence)
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/supplier/**").hasRole("SUPPLIER")
                        .requestMatchers("/api/delivery/**").hasRole("DELIVERY")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthEntryPoint)
                        .accessDeniedHandler(roleAccessDeniedHandler))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS configuration allowing the React dev server (port 5173) to call the API.
     * In production, restrict origins to the deployed frontend domain.
     */
    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        var config = new org.springframework.web.cors.CorsConfiguration();
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        var source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
