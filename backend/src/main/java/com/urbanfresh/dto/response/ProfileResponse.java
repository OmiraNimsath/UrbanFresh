package com.urbanfresh.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * Response Layer – DTO returned by GET /api/profile and PUT /api/profile.
 * Carries all displayable profile fields; excludes sensitive data (password).
 */
@Getter
@Builder
public class ProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    /** Role string (e.g. "CUSTOMER") – useful for UI role-aware rendering. */
    private String role;
}
