package com.urbanfresh.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.Brand;

/**
 * Repository Layer – Data access for Brand entities.
 */
@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    /**
     * Returns active brands ordered by name for assignment UIs.
     *
     * @return list of active brands
     */
    List<Brand> findByActiveTrueOrderByNameAsc();

    /**
     * Returns all brands ordered by name for admin brand management.
     *
     * @return list of all brands
     */
    List<Brand> findAllByOrderByNameAsc();

    /**
     * Check whether a brand name already exists (case-insensitive).
     *
     * @param name brand name
     * @return true if taken
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Check whether a brand code already exists (case-insensitive).
     *
     * @param code brand code
     * @return true if taken
     */
    boolean existsByCodeIgnoreCase(String code);

    /**
     * Check name uniqueness excluding current brand during updates.
     *
     * @param name brand name
     * @param id current brand ID
     * @return true if conflicting
     */
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    /**
     * Check code uniqueness excluding current brand during updates.
     *
     * @param code brand code
     * @param id current brand ID
     * @return true if conflicting
     */
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
