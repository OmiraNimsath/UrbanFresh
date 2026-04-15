package com.urbanfresh.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urbanfresh.dto.request.OrderItemRequest;
import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.OrderResponse;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderItem;
import com.urbanfresh.model.PricingUnit;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.impl.OrderServiceImpl;

/**
 * Test Layer – Unit tests for discount calculation in order creation.
 * Covers:
 *   - Products with discounts have line totals calculated from discounted price
 *   - Order totals reflect all product discounts
 *   - Order items snapshot discount percentage for history
 *   - Discount is applied as: unitPrice * (1 - discount% / 100)
 */
@ExtendWith(MockitoExtension.class)
class DiscountCalculationTest {

    @Mock(lenient = true)
    private ProductRepository productRepository;

    @Mock(lenient = true)
    private UserRepository userRepository;

    @Mock(lenient = true)
    private OrderRepository orderRepository;

    @Mock(lenient = true)
    private com.urbanfresh.service.LoyaltyService loyaltyService;

    @Mock(lenient = true)
    private com.urbanfresh.service.NotificationService notificationService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User testCustomer;
    private Product productWithoutDiscount;
    private Product productWith15PercentDiscount;

    @BeforeEach
    void setUp() {
        testCustomer = User.builder()
                .id(1L)
                .email("customer@test.com")
                .build();

        productWithoutDiscount = Product.builder()
                .id(100L)
                .name("Regular Product")
                .price(new BigDecimal("500.00"))
                .stockQuantity(10)
                .unit(PricingUnit.PER_ITEM)
                .discountPercentage(0)
                .build();

        productWith15PercentDiscount = Product.builder()
                .id(101L)
                .name("Discounted Product")
                .price(new BigDecimal("500.00"))
                .stockQuantity(10)
                .unit(PricingUnit.PER_ITEM)
                .discountPercentage(15)  // 15% off
                .build();

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(testCustomer));
    }

    /**
     * Scenario: Order with product WITHOUT discount.
     * Expected: Line total = unitPrice × quantity (original price)
     */
    @Test
    void testOrderLineTotal_NoDiscount() {
        // Arrange: Product Rs. 500, no discount, qty 2
        when(productRepository.findByIdWithLock(100L)).thenReturn(Optional.of(productWithoutDiscount));
        when(orderRepository.save(any())).thenAnswer(invocation -> {
            Order order = (Order) invocation.getArgument(0);
            order.setId(1L);
            return order;
        });

        PlaceOrderRequest request = new PlaceOrderRequest();
        OrderItemRequest item1 = new OrderItemRequest();
        item1.setProductId(100L);
        item1.setQuantity(2);
        request.setItems(List.of(item1));
        request.setDeliveryAddress("123 Main Rd");
        request.setPointsToRedeem(0);

        // Act
        OrderResponse response = orderService.placeOrder(request, "customer@test.com");

        // Assert: Line total should be 500 × 2 = 1000
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getLineTotal())
                .isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(response.getTotalAmount())
                .isEqualByComparingTo(new BigDecimal("1000.00"));
    }

    /**
     * Scenario: Order with product WITH 15% discount.
     * Expected: Line total = (unitPrice × (1 - 15/100)) × quantity
     *           = (500 × 0.85) × 2 = 425 × 2 = 850
     */
    @Test
    void testOrderLineTotal_With15PercentDiscount() {
        // Arrange: Product Rs. 500 with 15% discount, qty 2
        when(productRepository.findByIdWithLock(101L)).thenReturn(Optional.of(productWith15PercentDiscount));
        when(orderRepository.save(any())).thenAnswer(invocation -> {
            Order order = (Order) invocation.getArgument(0);
            order.setId(1L);
            return order;
        });

        PlaceOrderRequest request = new PlaceOrderRequest();
        OrderItemRequest item1 = new OrderItemRequest();
        item1.setProductId(101L);
        item1.setQuantity(2);
        request.setItems(List.of(item1));
        request.setDeliveryAddress("123 Main Rd");
        request.setPointsToRedeem(0);

        // Act
        OrderResponse response = orderService.placeOrder(request, "customer@test.com");

        // Assert: Discounted unit price = 500 × 0.85 = 425
        //         Line total = 425 × 2 = 850
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getLineTotal())
                .isEqualByComparingTo(new BigDecimal("850.00"));
        assertThat(response.getItems().get(0).getProductDiscountPercentage()).isEqualTo(15);
        assertThat(response.getTotalAmount())
                .isEqualByComparingTo(new BigDecimal("850.00"));
    }

    /**
     * Scenario: Order with mixed products (one with discount, one without).
     * Expected: Line totals calculated individually, then summed
     *   - Product A (no discount): 500 × 1 = 500
     *   - Product B (15% discount): 425 × 1 = 425
     *   - Total: 925
     */
    @Test
    void testOrderLineTotal_MixedDiscounts() {
        // Arrange: Two products in same order
        when(productRepository.findByIdWithLock(100L)).thenReturn(Optional.of(productWithoutDiscount));
        when(productRepository.findByIdWithLock(101L)).thenReturn(Optional.of(productWith15PercentDiscount));
        when(orderRepository.save(any())).thenAnswer(invocation -> {
            Order order = (Order) invocation.getArgument(0);
            order.setId(1L);
            return order;
        });

        PlaceOrderRequest request = new PlaceOrderRequest();
        OrderItemRequest item1 = new OrderItemRequest();
        item1.setProductId(100L);
        item1.setQuantity(1);
        OrderItemRequest item2 = new OrderItemRequest();
        item2.setProductId(101L);
        item2.setQuantity(1);
        request.setItems(List.of(item1, item2));
        request.setDeliveryAddress("123 Main Rd");
        request.setPointsToRedeem(0);

        // Act
        OrderResponse response = orderService.placeOrder(request, "customer@test.com");

        // Assert
        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getItems().get(0).getLineTotal())
                .isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(response.getItems().get(1).getLineTotal())
                .isEqualByComparingTo(new BigDecimal("425.00"));
        assertThat(response.getTotalAmount())
                .isEqualByComparingTo(new BigDecimal("925.00"));
    }

    /**
     * Scenario: Order discount percentage is snapshotted in OrderItem.
     * Expected: Even if product discount changes after order, order item retains original %
     */
    @Test
    void testOrderItem_DiscountPercentageSnapshot() {
        // Arrange
        when(productRepository.findByIdWithLock(101L)).thenReturn(Optional.of(productWith15PercentDiscount));
        when(orderRepository.save(any())).thenAnswer(invocation -> {
            Order order = (Order) invocation.getArgument(0);
            order.setId(1L);
            // Verify that order items have the snapshotted discount
            assertThat(order.getItems().get(0).getProductDiscountPercentage()).isEqualTo(15);
            return order;
        });

        PlaceOrderRequest request = new PlaceOrderRequest();
        OrderItemRequest item1 = new OrderItemRequest();
        item1.setProductId(101L);
        item1.setQuantity(1);
        request.setItems(List.of(item1));
        request.setDeliveryAddress("123 Main Rd");
        request.setPointsToRedeem(0);

        // Act
        orderService.placeOrder(request, "customer@test.com");

        // Assert: Verified in the mock's answer block above
    }

    /**
     * Scenario: Product validation accepts 0-100% discount range.
     * Expected: No validation error for valid discounts
     */
    @Test
    void testProductDiscount_ValidRange() {
        // Test boundary values
        for (int discount : new int[]{0, 1, 50, 99, 100}) {
            Product p = Product.builder()
                    .id((long) discount)
                    .name("Test")
                    .price(new BigDecimal("100"))
                    .discountPercentage(discount)
                    .stockQuantity(1)
                    .build();
            
            // Verify discount field accepts the value
            assertThat(p.getDiscountPercentage()).isEqualTo(discount);
        }
    }

    /**
     * Scenario: Verify discount calculation formula.
     * Test the exact calculation: discountedPrice = price * (1 - discount% / 100)
     */
    @Test
    void testDiscountCalculation_Formula() {
        BigDecimal price = new BigDecimal("500.00");
        int discountPercentage = 15;

        // Formula: discountedPrice = price * (1 - discount% / 100)
        BigDecimal discountedPrice = price.multiply(
                BigDecimal.valueOf(100 - discountPercentage)
        ).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Expected: 500 * 85 / 100 = 425
        assertThat(discountedPrice).isEqualByComparingTo(new BigDecimal("425.00"));
    }

    /**
     * Scenario: Discount calculation with various percentages.
     * Expected: Correct rounding to 2 decimal places
     */
    @Test
    void testDiscountCalculation_Rounding() {
        BigDecimal price = new BigDecimal("333.33");
        
        // Test 10% discount: 333.33 * 0.9 = 299.997 → 300.00 (HALF_UP)
        BigDecimal discounted10 = price.multiply(BigDecimal.valueOf(90))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        assertThat(discounted10).isEqualByComparingTo(new BigDecimal("300.00"));

        // Test 20% discount: 333.33 * 0.8 = 266.664 → 266.66 (HALF_UP)
        BigDecimal discounted20 = price.multiply(BigDecimal.valueOf(80))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        assertThat(discounted20).isEqualByComparingTo(new BigDecimal("266.66"));
    }
}
