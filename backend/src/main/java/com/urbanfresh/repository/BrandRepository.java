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
}
