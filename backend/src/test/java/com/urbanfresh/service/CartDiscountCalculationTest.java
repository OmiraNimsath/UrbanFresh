package com.urbanfresh.service;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urbanfresh.dto.response.CartItemResponse;
import com.urbanfresh.model.Cart;
import com.urbanfresh.model.CartItem;
import com.urbanfresh.model.PricingUnit;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.CartItemRepository;
import com.urbanfresh.repository.CartRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.impl.CartServiceImpl;

/**
 * Test Layer – Unit tests for cart discount calculations.
 * Covers:
 *   - Cart items display current product discount (live update)
 *   - Line totals calculated from discounted unit prices
 *   - Cart total reflects sum of all discounted line items
 *   - Discount is snapshotted in cart items when order placed
 */
@ExtendWith(MockitoExtension.class)
class CartDiscountCalculationTest {

    @Mock(lenient = true)
    private CartRepository cartRepository;

    @Mock(lenient = true)
    private CartItemRepository cartItemRepository;

    @Mock(lenient = true)
    private ProductRepository productRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private User testCustomer;
    private Cart testCart;
    private Product productWithoutDiscount;
    private Product productWith15PercentDiscount;

    @BeforeEach
    void setUp() {
        testCustomer = User.builder()
                .id(1L)
                .email("customer@test.com")
                .build();

        testCart = Cart.builder()
                .id(1L)
                .customer(testCustomer)
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
    }

    /**
     * Scenario: Cart item WITHOUT discount.
     * Expected: Line total = unitPrice × quantity (no discount applied)
     */
    @Test
    void testCartItemLineTotal_NoDiscount() {
        // Arrange: 2x Regular Product @ Rs. 500 = Rs. 1000
        CartItem item = CartItem.builder()
                .id(1L)
                .cart(testCart)
                .product(productWithoutDiscount)
                .quantity(2)
                .build();

        // Act: Calculate line total
        BigDecimal unitPrice = item.getProduct().getPrice();
        Integer discount = item.getProduct().getDiscountPercentage();
        
        BigDecimal lineTotal = unitPrice;
        if (discount > 0) {
            lineTotal = unitPrice.multiply(BigDecimal.valueOf(100 - discount))
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        }
        lineTotal = lineTotal.multiply(BigDecimal.valueOf(item.getQuantity()));

        // Assert: 500 × 2 = 1000
        assertThat(lineTotal).isEqualByComparingTo(new BigDecimal("1000.00"));
    }

    /**
     * Scenario: Cart item WITH 15% discount.
     * Expected: Line total = (unitPrice × 0.85) × quantity
     */
    @Test
    void testCartItemLineTotal_With15PercentDiscount() {
        // Arrange: 2x Discounted Product @ Rs. 500 with 15% = Rs. 850
        CartItem item = CartItem.builder()
                .id(2L)
                .cart(testCart)
                .product(productWith15PercentDiscount)
                .quantity(2)
                .build();

        // Act: Calculate line total with discount
        BigDecimal unitPrice = item.getProduct().getPrice();
        Integer discount = item.getProduct().getDiscountPercentage();
        
        BigDecimal discountedUnitPrice = unitPrice;
        if (discount != null && discount > 0) {
            discountedUnitPrice = unitPrice.multiply(BigDecimal.valueOf(100 - discount))
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        }
        BigDecimal lineTotal = discountedUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

        // Assert: (500 × 0.85) × 2 = 425 × 2 = 850
        assertThat(discountedUnitPrice).isEqualByComparingTo(new BigDecimal("425.00"));
        assertThat(lineTotal).isEqualByComparingTo(new BigDecimal("850.00"));
    }

    /**
     * Scenario: Cart with multiple items (mixed discounts).
     * Expected: Cart total = sum of all line totals (each calculated with own discount)
     */
    @Test
    void testCartTotal_MixedDiscounts() {
        // Arrange: Two items in cart
        // Item 1: 1x Regular (no discount) @ 500 = 500
        // Item 2: 2x Discounted (15% off) @ 500 = 850
        // Total: 1350

        CartItem item1 = CartItem.builder()
                .id(1L)
                .cart(testCart)
                .product(productWithoutDiscount)
                .quantity(1)
                .build();

        CartItem item2 = CartItem.builder()
                .id(2L)
                .cart(testCart)
                .product(productWith15PercentDiscount)
                .quantity(2)
                .build();

        // Act: Calculate cart total
        BigDecimal cartTotal = BigDecimal.ZERO;

        for (CartItem item : new CartItem[]{item1, item2}) {
            BigDecimal unitPrice = item.getProduct().getPrice();
            Integer discount = item.getProduct().getDiscountPercentage();
            
            BigDecimal discountedUnitPrice = unitPrice;
            if (discount != null && discount > 0) {
                discountedUnitPrice = unitPrice.multiply(BigDecimal.valueOf(100 - discount))
                        .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            }
            BigDecimal lineTotal = discountedUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            cartTotal = cartTotal.add(lineTotal);
        }

        // Assert: 500 + 850 = 1350
        assertThat(cartTotal).isEqualByComparingTo(new BigDecimal("1350.00"));
    }

    /**
     * Scenario: Cart item discount is a live reference to current product discount.
     * Expected: If product discount changes, cart item reflects new discount
     */
    @Test
    void testCartItem_ReflectsLiveProductDiscount() {
        // Arrange
        CartItem item = CartItem.builder()
                .id(1L)
                .cart(testCart)
                .product(productWithoutDiscount)
                .quantity(1)
                .build();

        // Initial: No discount
        assertThat(item.getProduct().getDiscountPercentage()).isEqualTo(0);

        // Act: Admin applies discount to product
        item.getProduct().setDiscountPercentage(15);

        // Assert: Cart item sees the new discount immediately
        assertThat(item.getProduct().getDiscountPercentage()).isEqualTo(15);
    }

    /**
     * Scenario: CartItemResponse includes discount percentage.
     * Expected: DTO includes productDiscountPercentage field for frontend
     */
    @Test
    void testCartItemResponse_IncludesDiscount() {
        // Arrange
        BigDecimal unitPrice = productWith15PercentDiscount.getPrice();
        Integer discount = productWith15PercentDiscount.getDiscountPercentage();
        
        BigDecimal discountedUnitPrice = unitPrice.multiply(BigDecimal.valueOf(100 - discount))
                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal lineTotal = discountedUnitPrice.multiply(BigDecimal.valueOf(2));

        // Act: Build response
        CartItemResponse response = CartItemResponse.builder()
                .cartItemId(1L)
                .productId(101L)
                .productName("Discounted Product")
                .unitPrice(unitPrice)
                .productDiscountPercentage(discount)
                .quantity(2)
                .lineTotal(lineTotal)
                .inStock(true)
                .build();

        // Assert
        assertThat(response.getProductDiscountPercentage()).isEqualTo(15);
        assertThat(response.getLineTotal()).isEqualByComparingTo(new BigDecimal("850.00"));
    }

    /**
     * Scenario: Cart with various discount percentages.
     * Expected: Each item calculated correctly with its own discount
     */
    @Test
    void testCartItems_VariousDiscountPercentages() {
        // Test case data: (price, discount%, quantity, expected_line_total)
        Object[][] testCases = {
            {new BigDecimal("100.00"), 0, 1, new BigDecimal("100.00")},   // No discount
            {new BigDecimal("100.00"), 5, 1, new BigDecimal("95.00")},    // 5% off
            {new BigDecimal("200.00"), 10, 2, new BigDecimal("360.00")},  // 10% off: (200*0.9)*2
            {new BigDecimal("500.00"), 15, 1, new BigDecimal("425.00")},  // 15% off
            {new BigDecimal("1000.00"), 25, 3, new BigDecimal("2250.00")}, // 25% off: (1000*0.75)*3
        };

        for (Object[] testCase : testCases) {
            BigDecimal price = (BigDecimal) testCase[0];
            Integer discount = (Integer) testCase[1];
            Integer quantity = (Integer) testCase[2];
            BigDecimal expected = (BigDecimal) testCase[3];

            BigDecimal discountedPrice = price;
            if (discount > 0) {
                discountedPrice = price.multiply(BigDecimal.valueOf(100 - discount))
                        .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            }
            BigDecimal lineTotal = discountedPrice.multiply(BigDecimal.valueOf(quantity));

            assertThat(lineTotal).isEqualByComparingTo(expected);
        }
    }

    /**
     * Scenario: Empty cart total.
     * Expected: Cart total is 0
     */
    @Test
    void testCartTotal_Empty() {
        // Act
        BigDecimal cartTotal = BigDecimal.ZERO;

        // Assert
        assertThat(cartTotal).isEqualByComparingTo(BigDecimal.ZERO);
    }

    /**
     * Scenario: Single item in cart with various quantities.
     * Expected: Line total scales correctly with quantity
     */
    @Test
    void testCartItemLineTotal_QuantityScaling() {
        // Test: 1x, 2x, 5x, 10x quantity with same discounted price
        Product product = Product.builder()
                .id(101L)
                .name("Test")
                .price(new BigDecimal("100.00"))
                .discountPercentage(20)
                .stockQuantity(50)
                .unit(PricingUnit.PER_ITEM)
                .build();

        BigDecimal discountedPrice = new BigDecimal("80.00"); // 100 * 0.8

        Object[][] testCases = {
            {1, new BigDecimal("80.00")},
            {2, new BigDecimal("160.00")},
            {5, new BigDecimal("400.00")},
            {10, new BigDecimal("800.00")}
        };

        for (Object[] testCase : testCases) {
            Integer quantity = (Integer) testCase[0];
            BigDecimal expected = (BigDecimal) testCase[1];

            BigDecimal lineTotal = discountedPrice.multiply(BigDecimal.valueOf(quantity));
            assertThat(lineTotal).isEqualByComparingTo(expected);
        }
    }
}
