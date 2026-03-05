package com.urbanfresh.service.impl;

import com.urbanfresh.dto.request.UpdateProfileRequest;
import com.urbanfresh.dto.response.ProfileResponse;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Layer – Implements ProfileService.
 * Fetches and mutates the authenticated user's profile.
 * Email is treated as the stable, immutable identifier; it is never changed here.
 */
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;

    /**
     * Load and return the profile for the given email.
     * Throws UserNotFoundException (→ 404) if the email is not in the database.
     */
    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {
        User user = findByEmailOrThrow(email);
        return toProfileResponse(user);
    }

    /**
     * Apply name, phone, and address updates to the authenticated user's record.
     * Null fields in the request are left unchanged to support partial updates.
     */
    @Override
    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmailOrThrow(email);

        user.setName(request.getName());

        // Keep existing value when the client sends null (optional fields)
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        User saved = userRepository.save(user);
        return toProfileResponse(saved);
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private User findByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    /** Map User entity → ProfileResponse DTO. Centralised to keep mapping DRY. */
    private ProfileResponse toProfileResponse(User user) {
        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole().name())
                .build();
    }
}
