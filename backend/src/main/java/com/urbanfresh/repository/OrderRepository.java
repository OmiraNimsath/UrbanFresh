package com.urbanfresh.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.urbanfresh.dto.response.RecommendationResponse;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.PaymentStatus;

import jakarta.persistence.LockModeType;

/**
 * Repository Layer – Spring Data JPA repository for Order entities.
 * Provides query methods for retrieving a customer's order history.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Retrieve all orders placed by a specific customer, newest first.
     *
     * @param customerId the ID of the authenticated customer
     * @return list of orders belonging to that customer
     */
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    /**
     * Returns all orders in descending creation order with customer eagerly loaded.
     * EntityGraph prevents N+1 queries when mapping admin order summaries.
     *
     * @param pageable paging instructions
     * @return page of orders for admin views
     */
    @EntityGraph(attributePaths = "customer")
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Loads a single order with customer, items, and product references for admin review.
     *
     * @param id order ID
     * @return optional order with all required relations eagerly loaded
     */
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "assignedDeliveryPerson"})
    Optional<Order> findDetailedById(Long id);

    /**
     * Loads a single order with relations for a specific customer.
     * Used by customer confirmation/detail pages to enforce ownership.
     *
     * @param id order ID
     * @param customerId authenticated customer ID
     * @return optional order when it belongs to the customer
     */
    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    Optional<Order> findDetailedByIdAndCustomerId(Long id, Long customerId);

    /**
     * Loads a single order with relations for a specific assigned delivery person.
     * Used by delivery details screens to enforce assignment-based access.
     *
     * @param id order ID
     * @param assignedDeliveryPersonId authenticated delivery person ID
     * @return optional order when assignment matches
     */
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "assignedDeliveryPerson"})
    Optional<Order> findDetailedByIdAndAssignedDeliveryPersonId(Long id, Long assignedDeliveryPersonId);

    /**
     * Loads paginated orders assigned to a delivery person, newest first.
     * EntityGraph eagerly fetches customer and items for delivery dashboard cards.
     *
     * @param assignedDeliveryPersonId authenticated delivery person ID
     * @param pageable paging instructions
     * @return page of assigned orders
     */
    @EntityGraph(attributePaths = {"customer", "items", "assignedDeliveryPerson"})
    Page<Order> findByAssignedDeliveryPersonIdOrderByCreatedAtDesc(Long assignedDeliveryPersonId, Pageable pageable);

    /**
     * Loads unassigned READY orders, newest first.
     * Used by delivery personnel to accept newly available orders.
     *
     * @param status order status to filter (READY)
     * @param pageable paging instructions
     * @return page of available unassigned orders
     */
    @EntityGraph(attributePaths = {"customer", "items"})
    Page<Order> findByStatusAndAssignedDeliveryPersonIsNullOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    /**
     * Loads one order with a pessimistic write lock to avoid double-accept races.
     *
     * @param id order ID
     * @return optional locked order row
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    /**
     * Counts all orders currently or historically assigned to the given delivery person.
     *
     * @param assignedDeliveryPersonId delivery person user ID
     * @return total assigned order count
     */
    long countByAssignedDeliveryPersonId(Long assignedDeliveryPersonId);

    /**
     * Counts assigned orders by a specific status for the given delivery person.
     *
     * @param assignedDeliveryPersonId delivery person user ID
     * @param status order status to filter by
     * @return assigned order count for the requested status
     */
    long countByAssignedDeliveryPersonIdAndStatus(Long assignedDeliveryPersonId, OrderStatus status);

    /**
     * Finds stale PENDING orders older than the given cutoff time.
     * Used by the scheduler to auto-cancel orders where payment was never confirmed.
     *
     * @param status  order status to filter on (PENDING)
     * @param cutoff  datetime threshold — orders created before this are considered stale
     * @return list of stale orders needing cancellation
     */
    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime cutoff);

    /**
     * Returns the top N products most frequently ordered by a customer.
     * Ranks by SUM of quantity units purchased across the given statuses.
     * Hidden products and out-of-stock products are excluded.
     * Use {@code Pageable.ofSize(5)} to limit to the top 5 recommendations.
     *
     * @param customerId ID of the authenticated customer
     * @param statuses   order statuses representing confirmed purchases
     * @param pageable   controls the result limit (offset + page size)
     * @return ranked list of RecommendationResponse DTOs
     */
    @Query("""
            SELECT new com.urbanfresh.dto.response.RecommendationResponse(
                oi.product.id,
                oi.product.name,
                oi.product.imageUrl,
                oi.product.price,
                oi.product.stockQuantity,
                SUM(oi.quantity))
            FROM OrderItem oi
            JOIN oi.order o
            WHERE o.customer.id = :customerId
              AND o.status IN :statuses
              AND oi.product IS NOT NULL
              AND oi.product.hidden = false
              AND oi.product.stockQuantity > 0
            GROUP BY oi.product.id, oi.product.name, oi.product.imageUrl,
                     oi.product.price, oi.product.stockQuantity
            ORDER BY SUM(oi.quantity) DESC
            """)
    List<RecommendationResponse> findTopProductsByCustomer(
            @Param("customerId") Long customerId,
            @Param("statuses") List<OrderStatus> statuses,
            Pageable pageable
    );

    /**
     * Sums totalAmount across all orders whose payment status is PAID.
     * Counts every paid order regardless of current fulfilment status so that
     * revenue does not shrink as orders progress through PROCESSING → DELIVERED.
     *
     * @param status the payment status to filter on (pass {@code PaymentStatus.PAID})
     * @return aggregate total amount; zero when no matching orders exist
     */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.paymentStatus = :status")
    BigDecimal sumTotalAmountByPaymentStatus(@Param("status") PaymentStatus status);
}
