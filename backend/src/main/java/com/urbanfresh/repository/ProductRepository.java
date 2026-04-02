package com.urbanfresh.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.Product;

import jakarta.persistence.LockModeType;

/**
 * Repository Layer – Spring Data JPA repository for Product entities.
 * Provides derived queries for the landing page sections and a JPQL search
 * query for the product listing page (search, category filter, sort, pagination).
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Full-text search over name and description with optional category filter.
     * Passing null for either parameter disables that filter so the query stays DRY.
     * Accepts a Pageable for sorting and pagination without extra method variants.
     *
     * @param search   substring to match in name or description (case-insensitive); null = no filter
     * @param category exact category to match (case-insensitive); null = no filter
     * @param pageable sort and pagination instructions from the controller
     * @return page of matching products
     */
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND p.stockQuantity > 0 " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))")
    Page<Product> searchProducts(
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable
    );

    /**
     * Returns all distinct, non-null category values for the filter dropdown.
     *
     * @return list of unique category strings
     */
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.approvalStatus = 'APPROVED' AND p.stockQuantity > 0 ORDER BY p.category ASC")
    List<String> findAllCategories();

    /**
     * Returns up to {@code pageable.getPageSize()} lightweight suggestion payloads
     * for products whose name contains the given query string (case-insensitive).
     * Uses a JPQL constructor expression so only the five needed columns are fetched;
     * the full entity is never loaded.
     *
     * @param query    substring to match in product name
     * @param pageable page request used purely to cap result size (e.g. PageRequest.of(0, 8))
     * @return list of matching ProductSuggestionResponse objects
     */
    @Query("SELECT NEW com.urbanfresh.dto.response.ProductSuggestionResponse(" +
           "p.id, p.name, p.imageUrl, p.price, p.unit) " +
           "FROM Product p " +
           "WHERE p.approvalStatus = 'APPROVED' AND p.stockQuantity > 0 AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY p.name ASC")
    List<com.urbanfresh.dto.response.ProductSuggestionResponse> findNameSuggestions(
            @Param("query") String query, Pageable pageable);
            
    /**
     * Fetches a product row with a PESSIMISTIC_WRITE database lock.
     * Used during order placement so two concurrent transactions cannot both
     * read the same stock level and over-sell the last unit.
     *
     * @param id product ID to lock and load
     * @return Optional containing the locked product, empty if not found
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);

    /**
     * Retrieves all products marked as featured (featured = true) and approved.
     * Used by the landing page "Featured Products" section.
     *
     * @return list of featured products, empty list when none exist
     */
    @Query("SELECT p FROM Product p WHERE p.featured = true AND p.approvalStatus = 'APPROVED' AND p.stockQuantity > 0")
    List<Product> findByFeaturedTrue();

    /**
     * Retrieves in-stock approved products whose expiry date falls within [today, cutoff].
     * Ordered by earliest expiry so the most urgent offers appear first.       
     *
     * @param today   the current date (inclusive start of window)
     * @param cutoff  the last acceptable expiry date (e.g. today + 7 days)     
     * @param minStock minimum stock threshold (pass 0 to exclude zero-stock items)
     * @return list of near-expiry, in-stock products
     */
    @Query("SELECT p FROM Product p WHERE p.expiryDate BETWEEN :today AND :cutoff AND p.stockQuantity > :minStock AND p.approvalStatus = 'APPROVED' ORDER BY p.expiryDate ASC")
    List<Product> findByExpiryDateBetweenAndStockQuantityGreaterThanOrderByExpiryDateAsc(
            @Param("today") LocalDate today,
            @Param("cutoff") LocalDate cutoff,
            @Param("minStock") int minStock
    );

    /**
     * Returns products visible to a supplier based on assigned brands.
     *
     * @param supplierId authenticated supplier user ID
     * @return list of products owned by assigned active brands
     */
    @Query("SELECT DISTINCT p FROM Product p " +
            "JOIN p.brand b " +
            "JOIN SupplierBrand sb ON sb.brand.id = b.id " +
            "WHERE sb.supplier.id = :supplierId " +
            "AND b.active = true " +
            "ORDER BY p.name ASC")
    List<Product> findProductsForSupplier(@Param("supplierId") Long supplierId);

    /**
     * Counts the number of products requiring restock across all active brands
     * assigned to a specific supplier.
     * 
     * @param supplierId authenticated supplier user ID
     * @return count of pending restock products
     */
    @Query("SELECT COUNT(DISTINCT p) FROM Product p " +
           "JOIN p.brand b " +
           "JOIN SupplierBrand sb ON sb.brand.id = b.id " +
           "WHERE sb.supplier.id = :supplierId " +
           "AND b.active = true " +
           "AND p.stockQuantity <= p.reorderThreshold")
    int countPendingRestocksForSupplier(@Param("supplierId") Long supplierId);

    /**
     * Find products by approval status with pagination.
     */
    Page<Product> findByApprovalStatus(com.urbanfresh.model.ApprovalStatus status, Pageable pageable);
}
