package com.urbanfresh.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO Layer – Returned to the client after successful login.
 * Contains the JWT token and basic user info for frontend role-based routing.
 */
@Getter
@Setter
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String email;
    private String name;
    private String phone;
    private String address;
    private String role;
    private String message;
}
