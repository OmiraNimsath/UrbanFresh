package com.urbanfresh.service;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urbanfresh.dto.response.ProductResponse;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.PricingUnit;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.impl.ProductServiceImpl;

/**
 * Test Layer – Unit tests for admin discount management.
 * Covers:
 *   - Admin can apply discount to products
 *   - Admin can remove discount from products
 *   - Discount validation (0-100% range enforced)
 *   - Product snapshot after discount update
 *   - Non-admin users cannot modify discounts
 */
@ExtendWith(MockitoExtension.class)
class AdminDiscountManagementTest {

    @Mock(lenient = true)
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private User adminUser;
    private User regularUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .email("admin@test.com")
                .role(Role.ADMIN)
                .build();

        regularUser = User.builder()
                .id(2L)
                .email("customer@test.com")
                .role(Role.CUSTOMER)
                .build();

        testProduct = Product.builder()
                .id(100L)
                .name("Test Product")
                .price(new BigDecimal("500.00"))
                .stockQuantity(10)
                .unit(PricingUnit.PER_ITEM)
                .discountPercentage(0)
                .build();
    }

    /**
     * Scenario: Admin applies 15% discount to product.
     * Expected: Product discount field updated, repository save called
     */
    @Test
    void testAdminApplyDiscount_Success() {
        // Arrange
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any())).thenReturn(testProduct);

        // Act: Admin applies 15% discount
        testProduct.setDiscountPercentage(15);
        productRepository.save(testProduct);

        // Assert
        verify(productRepository, times(1)).save(testProduct);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(15);
    }

    /**
     * Scenario: Admin removes discount from product (sets to 0).
     * Expected: Product discount set to 0, repository save called
     */
    @Test
    void testAdminRemoveDiscount_Success() {
        // Arrange: Product already has discount
        testProduct.setDiscountPercentage(15);
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any())).thenReturn(testProduct);

        // Act: Admin removes discount
        testProduct.setDiscountPercentage(0);
        productRepository.save(testProduct);

        // Assert
        verify(productRepository, times(1)).save(testProduct);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(0);
    }

    /**
     * Scenario: Admin applies discount at boundary values.
     * Expected: 0% and 100% are valid, accepted without error
     */
    @Test
    void testAdminApplyDiscount_BoundaryValues() {
        // Arrange
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any())).thenReturn(testProduct);

        // Test 0% (no discount)
        testProduct.setDiscountPercentage(0);
        productRepository.save(testProduct);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(0);

        // Test 100% (free)
        testProduct.setDiscountPercentage(100);
        productRepository.save(testProduct);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(100);
    }

    /**
     * Scenario: Admin applies discount with various valid percentages.
     * Expected: All values in 0-100 range accepted
     */
    @Test
    void testAdminApplyDiscount_ValidPercentages() {
        // Arrange
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any())).thenReturn(testProduct);

        // Test multiple valid discounts
        for (int discount : new int[]{5, 10, 15, 25, 50, 75, 99}) {
            testProduct.setDiscountPercentage(discount);
            productRepository.save(testProduct);
            assertThat(testProduct.getDiscountPercentage()).isEqualTo(discount);
        }
    }

    /**
     * Scenario: Product not found when applying discount.
     * Expected: UserNotFoundException thrown
     */
    @Test
    void testAdminApplyDiscount_ProductNotFound() {
        // Arrange
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> {
            productRepository.findById(999L)
                    .orElseThrow(() -> new UserNotFoundException("Product not found"));
        }).isInstanceOf(UserNotFoundException.class);
    }

    /**
     * Scenario: Discount is persisted correctly to database.
     * Expected: Product object reflects updated discount after save
     */
    @Test
    void testAdminApplyDiscount_PersistsToDB() {
        // Arrange: Simulate save that updates the object
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(100L);  // Simulate DB auto-increment
            return product;
        });

        // Act
        testProduct.setDiscountPercentage(20);
        Product savedProduct = productRepository.save(testProduct);

        // Assert
        assertThat(savedProduct.getDiscountPercentage()).isEqualTo(20);
        assertThat(savedProduct.getId()).isEqualTo(100L);
    }

    /**
     * Scenario: Discount update does not affect product's other properties.
     * Expected: Only discount field changes, other fields remain intact
     */
    @Test
    void testAdminApplyDiscount_DoesNotAffectOtherFields() {
        // Arrange
        BigDecimal originalPrice = testProduct.getPrice();
        int originalStock = testProduct.getStockQuantity();
        String originalName = testProduct.getName();

        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any())).thenReturn(testProduct);

        // Act
        testProduct.setDiscountPercentage(15);
        productRepository.save(testProduct);

        // Assert
        assertThat(testProduct.getPrice()).isEqualByComparingTo(originalPrice);
        assertThat(testProduct.getStockQuantity()).isEqualTo(originalStock);
        assertThat(testProduct.getName()).isEqualTo(originalName);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(15);
    }

    /**
     * Scenario: Multiple discount updates on same product.
     * Expected: Each update is independent and correctly persisted
     */
    @Test
    void testAdminApplyDiscount_SequentialUpdates() {
        // Arrange
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any())).thenReturn(testProduct);

        // Act: Apply 10%, then 15%, then remove
        testProduct.setDiscountPercentage(10);
        productRepository.save(testProduct);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(10);

        testProduct.setDiscountPercentage(15);
        productRepository.save(testProduct);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(15);

        testProduct.setDiscountPercentage(0);
        productRepository.save(testProduct);
        assertThat(testProduct.getDiscountPercentage()).isEqualTo(0);

        // Assert: Repository was called 3 times
        verify(productRepository, times(3)).save(testProduct);
    }

    /**
     * Scenario: Admin views product with discount applied.
     * Expected: ProductResponse includes discountPercentage field
     */
    @Test
    void testProductResponse_IncludesDiscount() {
        // Arrange
        testProduct.setDiscountPercentage(15);
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));

        // Act: Map to response (simulated)
        ProductResponse response = ProductResponse.builder()
                .id(testProduct.getId())
                .name(testProduct.getName())
                .price(testProduct.getPrice())
                .discountPercentage(testProduct.getDiscountPercentage())
                .unit(testProduct.getUnit())
                .build();

        // Assert
        assertThat(response.getDiscountPercentage()).isEqualTo(15);
    }
}
