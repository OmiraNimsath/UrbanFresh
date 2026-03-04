package com.urbanfresh.security;

import java.io.IOException;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Security Layer – Custom handler for authenticated requests that lack
 * the required role (HTTP 403 Forbidden).
 * Triggered when a valid JWT is present but the user's role is not permitted
 * for the requested resource. Complements JwtAuthEntryPoint which handles 401.
 */
@Component
public class RoleAccessDeniedHandler implements AccessDeniedHandler {

    /**
     * Writes a consistent JSON 403 body matching ApiErrorResponse format.
     * Prevents Spring Security's default HTML "Forbidden" page from
     * leaking implementation details to the client.
     *
     * @param request               the incoming HTTP request
     * @param response              the HTTP response to write to
     * @param accessDeniedException the exception raised by the security layer
     */
    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // Build JSON manually — keeps this class dependency-free (no ObjectMapper needed)
        String json = String.format(
                "{\"status\":403,\"message\":\"Access denied. You do not have permission to perform this action.\",\"timestamp\":\"%s\"}",
                LocalDateTime.now()
        );
        response.getWriter().write(json);
    }
}
