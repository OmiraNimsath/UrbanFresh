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
 * Controller Layer – Exposes profile endpoints under /api/profile.
 * Both endpoints require an authenticated CUSTOMER, DELIVERY, or SUPPLIER; the email is read directly
 * from the validated JWT (via UserDetails principal) so users can only ever
 * access their own profile — no user-ID path parameter is needed or exposed.
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /**
     * GET /api/profile
     * Return the current user's profile.
     *
     * @param principal injected by Spring Security from the validated JWT
     * @return 200 ProfileResponse
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','DELIVERY','SUPPLIER')")
    public ResponseEntity<ProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails principal) {

        ProfileResponse profile = profileService.getProfile(principal.getUsername());
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/profile
     * Update name, phone, and/or address for the current user.
     * Email cannot be changed through this endpoint.
     *
     * @param principal injected by Spring Security from the validated JWT
     * @param request   validated request body
     * @return 200 updated ProfileResponse
     */
    @PutMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','DELIVERY','SUPPLIER')")
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request) {

        ProfileResponse updated = profileService.updateProfile(principal.getUsername(), request);
        return ResponseEntity.ok(updated);
    }
}
