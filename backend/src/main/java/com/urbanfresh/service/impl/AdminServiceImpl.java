package com.urbanfresh.service.impl;

import org.springframework.stereotype.Service;

import com.urbanfresh.dto.response.AdminStatsResponse;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.AdminService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements admin business operations.
 * Aggregates data from the User and Product repositories.
 */
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    /**
     * Retrieve high-level platform statistics.
     * Uses JPA count queries to avoid loading full entity lists into memory.
     *
     * @return AdminStatsResponse with total user and product counts
     */
    @Override
    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalProducts(productRepository.count())
                .build();
    }
}
