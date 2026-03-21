package com.urbanfresh.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.request.UpdateProfileRequest;
import com.urbanfresh.dto.response.ProfileResponse;
import com.urbanfresh.service.ProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Admin Profile Controller
 * Layer: Controller (HTTP API)
 * Exposes profile endpoints under /api/admin/profile for admin users only.
 * Admins can retrieve and update their own profile details (name, phone, address).
 * Email cannot be changed through this endpoint.
 */
@RestController
@RequestMapping("/api/admin/profile")
@RequiredArgsConstructor
public class AdminProfileController {

    private final ProfileService profileService;

    /**
     * GET /api/admin/profile
     * Return the current admin's profile.
     *
     * @param principal injected by Spring Security from the validated JWT
     * @return 200 ProfileResponse with admin details
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfileResponse> getAdminProfile(
            @AuthenticationPrincipal UserDetails principal) {

        ProfileResponse profile = profileService.getProfile(principal.getUsername());
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/admin/profile
     * Update name, phone, and/or address for the current admin.
     * Email cannot be changed through this endpoint.
     *
     * @param principal injected by Spring Security from the validated JWT
     * @param request   validated request body with updated fields
     * @return 200 updated ProfileResponse
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfileResponse> updateAdminProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request) {

        ProfileResponse updated = profileService.updateProfile(principal.getUsername(), request);
        return ResponseEntity.ok(updated);
    }
}
