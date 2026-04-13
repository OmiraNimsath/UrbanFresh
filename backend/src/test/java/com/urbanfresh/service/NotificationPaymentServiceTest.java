package com.urbanfresh.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.Payment;
import com.urbanfresh.model.PaymentStatus;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.PaymentRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.impl.PaymentServiceImpl;

/**
 * Test Layer – Verifies notification creation for the payment confirmation flow.
 * Covers SCRUM-45 DoD: automated test for the CONFIRMED notification trigger.
 *
 * applyPaidState() is a private method invoked by both the payment_intent.succeeded
 * and charge.updated Stripe webhook paths. It is tested here via reflection to keep
 * the test scope tight and avoid pulling in the Stripe SDK event-parsing stack.
 *
 * Uses Mockito only — no Spring context loaded, so these run fast.
 */
@ExtendWith(MockitoExtension.class)
class NotificationPaymentServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private UserRepository userRepository;
    @Mock private LoyaltyService loyaltyService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    // ── Payment confirmation trigger ───────────────────────────────────────────

    /**
     * When applyPaidState() runs for a PENDING order it must:
     *   1. Mark the payment as PAID and save it
     *   2. Mark the order as CONFIRMED and save it
     *   3. Fire a CONFIRMED notification for the customer
     *   4. Award loyalty points (delegated to LoyaltyService — not the focus here)
     *
     * The method is reached via reflection to avoid constructing a real Stripe Event.
     */
    @Test
    void applyPaidState_createsConfirmedNotification_whenOrderNotYetConfirmed() throws Exception {
        User customer = User.builder()
                .id(1L).name("Jane Doe").email("jane@example.com").role(Role.CUSTOMER).build();

        Order order = Order.builder()
                .id(42L)
                .customer(customer)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(5000))
                .build();

        Payment payment = Payment.builder()
                .id(1L)
                .order(order)
                .stripePaymentIntentId("pi_test_123")
                .amount(BigDecimal.valueOf(5000))
                .build();

        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);

        // Invoke the private applyPaidState method directly via reflection.
        Method applyPaidState = PaymentServiceImpl.class.getDeclaredMethod(
                "applyPaidState", Payment.class, String.class, String.class);
        applyPaidState.setAccessible(true);
        applyPaidState.invoke(paymentService, payment, "pi_test_123", "payment_intent.succeeded");

        verify(notificationService).createOrderStatusNotification(order, OrderStatus.CONFIRMED);
    }

    /**
     * Idempotency guard: if the order is already CONFIRMED when applyPaidState() is
     * called (e.g. duplicate webhook event), no notification must be fired and no
     * repositories must be touched for the status transition.
     */
    @Test
    void applyPaidState_doesNotCreateNotification_whenOrderAlreadyConfirmed() throws Exception {
        User customer = User.builder()
                .id(1L).name("Jane Doe").email("jane@example.com").role(Role.CUSTOMER).build();

        Order order = Order.builder()
                .id(42L)
                .customer(customer)
                .status(OrderStatus.CONFIRMED)   // already confirmed — duplicate event
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(BigDecimal.valueOf(5000))
                .build();

        Payment payment = Payment.builder()
                .id(1L)
                .order(order)
                .stripePaymentIntentId("pi_test_123")
                .amount(BigDecimal.valueOf(5000))
                .build();

        Method applyPaidState = PaymentServiceImpl.class.getDeclaredMethod(
                "applyPaidState", Payment.class, String.class, String.class);
        applyPaidState.setAccessible(true);
        applyPaidState.invoke(paymentService, payment, "pi_test_123", "payment_intent.succeeded");

        verify(notificationService, org.mockito.Mockito.never())
                .createOrderStatusNotification(any(), any());
    }
}
