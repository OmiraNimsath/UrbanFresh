package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.AddToCartRequest;
import com.urbanfresh.dto.request.UpdateCartItemRequest;
import com.urbanfresh.dto.response.CartItemResponse;
import com.urbanfresh.dto.response.CartResponse;
import com.urbanfresh.exception.CartItemNotFoundException;
import com.urbanfresh.exception.InsufficientStockException;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.Cart;
import com.urbanfresh.model.CartItem;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.CartItemRepository;
import com.urbanfresh.repository.CartRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.CartService;
import com.urbanfresh.service.ProductBatchService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements cart management: add, update, remove, and clear items.
 * Each mutating method runs inside a transaction so that cart + item state is always consistent.
 * Orphaned items (product deleted after being added) are silently excluded from responses
 * so the customer can still view and clean up their cart.
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductBatchService productBatchService;

    /**
     * Returns the customer's cart, or an empty cart response if none exists yet.
     */
    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(String customerEmail) {
        User customer = resolveCustomer(customerEmail);
        return cartRepository.findByCustomerId(customer.getId())
                .map(this::toCartResponse)
                .orElse(emptyCartResponse());
    }

    /**
     * Adds a product to the cart.
     * If the product is already in the cart, the requested quantity is added to the existing amount.
     * Rejects the request if the product is currently out of stock.
     */
    @Override
    @Transactional
    public CartResponse addToCart(String customerEmail, AddToCartRequest request) {
        User customer = resolveCustomer(customerEmail);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

        // A product with zero stock cannot be added to the cart.
        if (product.getStockQuantity() < 1) {
            throw new InsufficientStockException(
                    "Product '" + product.getName() + "' is currently out of stock");
        }

        Cart cart = cartRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> cartRepository.save(
                        Cart.builder().customer(customer).build()));

        // If the product is already in the cart, increment quantity rather than add a duplicate line.
        cart.getItems().stream()
                .filter(item -> item.getProduct() != null
                        && item.getProduct().getId().equals(product.getId()))
                .findFirst()
                .ifPresentOrElse(
                        existing -> existing.setQuantity(existing.getQuantity() + request.getQuantity()),
                        () -> cart.getItems().add(
                                CartItem.builder()
                                        .cart(cart)
                                        .product(product)
                                        .quantity(request.getQuantity())
                                        .build()));

        cartRepository.save(cart);
        return toCartResponse(cart);
    }

    /**
     * Updates the quantity of a specific cart item.
     * Verifies ownership — only the cart item's owner can update it.
     */
    @Override
    @Transactional
    public CartResponse updateCartItem(String customerEmail, Long cartItemId, UpdateCartItemRequest request) {
        User customer = resolveCustomer(customerEmail);

        CartItem item = cartItemRepository
                .findByIdAndCartCustomerId(cartItemId, customer.getId())
                .orElseThrow(() -> new CartItemNotFoundException(cartItemId));

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return toCartResponse(item.getCart());
    }

    /**
     * Removes a specific item from the cart.
     * Verifies ownership — only the cart item's owner can remove it.
     */
    @Override
    @Transactional
    public CartResponse removeCartItem(String customerEmail, Long cartItemId) {
        User customer = resolveCustomer(customerEmail);

        CartItem item = cartItemRepository
                .findByIdAndCartCustomerId(cartItemId, customer.getId())
                .orElseThrow(() -> new CartItemNotFoundException(cartItemId));

        Cart cart = item.getCart();
        // Removing from the managed collection triggers orphanRemoval to delete the DB row.
        cart.getItems().remove(item);
        cartRepository.save(cart);

        return toCartResponse(cart);
    }

    /**
     * Clears all items from the customer's cart (called after a successful order placement).
     */
    @Override
    @Transactional
    public void clearCart(String customerEmail) {
        User customer = resolveCustomer(customerEmail);
        cartRepository.findByCustomerId(customer.getId()).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private User resolveCustomer(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + email));
    }

    /**
     * Maps a Cart entity to a CartResponse, computing line totals and grand total on the fly.
     * Items whose product has been deleted are filtered out silently.
     */
    private CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .filter(item -> item.getProduct() != null)
                .map(this::toCartItemResponse)
                .toList();

        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int itemCount = itemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartResponse.builder()
                .items(itemResponses)
                .totalAmount(totalAmount)
                .itemCount(itemCount)
                .build();
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        Product p = item.getProduct();
        
        // Apply product discount if present, then calculate line total from discounted unit price
        BigDecimal unitPrice = p.getPrice();
        Integer discountPercentage = p.getDiscountPercentage() != null ? p.getDiscountPercentage() : 0;
        BigDecimal discountedUnitPrice = unitPrice;
        
        if (discountPercentage > 0) {
            // discountedUnitPrice = unitPrice * (1 - discount% / 100)
            discountedUnitPrice = unitPrice.multiply(
                BigDecimal.valueOf(100 - discountPercentage)
            ).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        }

        BigDecimal lineTotal = discountedUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

        return CartItemResponse.builder()
                .cartItemId(item.getId())
                .productId(p.getId())
                .productName(p.getName())
                .imageUrl(p.getImageUrl())
                .unitPrice(unitPrice)
                .productDiscountPercentage(discountPercentage)
                .unit(p.getUnit().name())
                .quantity(item.getQuantity())
                .lineTotal(lineTotal)
                .inStock(p.getStockQuantity() > 0)
                .stockQuantity(productBatchService.getTotalAvailableQuantity(p.getId()) > 0
                        ? productBatchService.getTotalAvailableQuantity(p.getId())
                        : p.getStockQuantity())
                .build();
    }

    private CartResponse emptyCartResponse() {
        return CartResponse.builder()
                .items(List.of())
                .totalAmount(BigDecimal.ZERO)
                .itemCount(0)
                .build();
    }
}
