package com.urbanfresh.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.SupplierBrand;
import com.urbanfresh.model.SupplierBrandId;

/**
 * Repository Layer – Data access for supplier-brand mappings.
 */
@Repository
public interface SupplierBrandRepository extends JpaRepository<SupplierBrand, SupplierBrandId> {

    /**
     * Load all mappings for a supplier.
     *
     * @param supplierId supplier user ID
     * @return mapping rows
     */
    @Query("SELECT sb FROM SupplierBrand sb JOIN FETCH sb.brand WHERE sb.supplier.id = :supplierId ORDER BY sb.brand.name ASC")
    List<SupplierBrand> findBySupplierId(@Param("supplierId") Long supplierId);

    /**
     * Delete all mappings for a supplier.
     * Used when replacing assignments.
     *
     * @param supplierId supplier user ID
     */
    @Modifying
    @Query("DELETE FROM SupplierBrand sb WHERE sb.supplier.id = :supplierId")
    void deleteBySupplierId(@Param("supplierId") Long supplierId);
}
