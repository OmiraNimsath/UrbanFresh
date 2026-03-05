package com.urbanfresh.service;

import com.urbanfresh.dto.request.UpdateProfileRequest;
import com.urbanfresh.dto.response.ProfileResponse;

/**
 * Service Layer – Contract for customer profile read and update operations.
 * Implementations must enforce that a user can only access their own profile.
 */
public interface ProfileService {

    /**
     * Retrieve the profile of the authenticated user.
     *
     * @param email the email extracted from the validated JWT
     * @return ProfileResponse populated from the User entity
     * @throws com.urbanfresh.exception.UserNotFoundException if no user matches the email
     */
    ProfileResponse getProfile(String email);

    /**
     * Apply validated field updates to the authenticated user's profile.
     * Only name, phone, and address are mutable here; email is the stable identifier.
     *
     * @param email   the email extracted from the validated JWT
     * @param request DTO carrying the new field values (already bean-validated)
     * @return updated ProfileResponse
     * @throws com.urbanfresh.exception.UserNotFoundException if no user matches the email
     */
    ProfileResponse updateProfile(String email, UpdateProfileRequest request);
}
