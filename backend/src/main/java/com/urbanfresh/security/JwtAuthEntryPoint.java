package com.urbanfresh.security;

import java.io.IOException;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.urbanfresh.dto.response.ApiErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Security Layer – Custom entry point for unauthenticated requests.
 * Returns a consistent JSON 401 response (matching ApiErrorResponse format)
 * instead of Spring Security's default HTML "Unauthorized" page.
 * Triggered when a request reaches a protected endpoint without a valid JWT.
 */
@Component
public class JwtAuthEntryPoint implements AuthenticationEntryPoint {

    /**
     * Write a 401 JSON body when an unauthenticated request hits a secured endpoint.
     * The frontend Axios interceptor reads this status to trigger session expiry.
     */
    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiErrorResponse payload = ApiErrorResponse.builder()
            .status(HttpStatus.UNAUTHORIZED.value())
            .message("Session expired or invalid token. Please log in again.")
            .timestamp(LocalDateTime.now())
            .build();

        String json = String.format(
            "{\"status\":%d,\"message\":\"%s\",\"timestamp\":\"%s\"}",
            payload.getStatus(), payload.getMessage(), payload.getTimestamp()
        );
        response.getWriter().write(json);
    }
}
