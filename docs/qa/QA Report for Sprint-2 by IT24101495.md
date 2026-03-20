# UrbanFresh - Sprint 2 QA Report

| Field                   | Detail                     |
|-------------------------|----------------------------|
| **Project**             | UrbanFresh                 |
| **Sprint**              | Sprint 2                   |
| **Report Date**         | 20 March 2026              |
| **QA Engineer**         | Maith-2004                 |
| **Stories Tested**      | 9                          |
| **Total Defects Found** | 1                          |
| **Overall Verdict**     | ✅ All stories approved    |

---

## Stories Tested

| Story ID  | Title                                                      | SP | Verdict     |
|-----------|------------------------------------------------------------|----|-------------|
| SCRUM-15  | Cart Management                                            | 2  | ✅ Approved |
| SCRUM-16  | Checkout Page (Address + Order Summary)                    | 3  | ✅ Approved |
| SCRUM-17  | Order Confirmation Page                                    | 1  | ✅ Approved |
| SCRUM-19  | Place Order with Stock Validation & Deduction              | 2  | ✅ Approved |
| SCRUM-20  | Payment Processing                                         | 5  | ✅ Approved |
| SCRUM-21  | Customer Dashboard with Order History and Loyalty Points   | 3  | ✅ Approved |
| SCRUM-25  | Admin Inventory Management                                 | 2  | ✅ Approved |
| SCRUM-27  | Admin Order Management                                     | 2  | ✅ Approved |
| SCRUM-49  | Debounced Search & Rich Suggestions                        | 2  | ✅ Approved |

---

## SCRUM-15 - Cart Management

**Branch:** `feature/SCRUM-15-cart-management`
**Tested by:** Maith-2004

### Test Cases
- [x] **POST /api/cart/items** with a valid in-stock productId returns 200 with the item in the cart at quantity 1.
- [x] **POST /api/cart/items** for a product already in the cart increments quantity instead of creating a duplicate line.
- [x] **POST /api/cart/items** for an out-of-stock product returns 409 with a descriptive error message.
- [x] **GET /api/cart** returns the current cart with correct items, line totals, totalAmount, and itemCount.
- [x] **GET /api/cart** with no existing cart returns an empty cart (items: [], totalAmount: 0, itemCount: 0).
- [x] **PUT /api/cart/items/{cartItemId}** with a valid quantity updates the item and recalculates totals.
- [x] **PUT /api/cart/items/{cartItemId}** with quantity < 1 returns 400 validation error.
- [x] **PUT /api/cart/items/{cartItemId}** with another customer's cartItemId returns 404.
- [x] **DELETE /api/cart/items/{cartItemId}** removes the item and totals update correctly.
- [x] **DELETE /api/cart** clears all items; subsequent GET returns empty cart.
- [x] All **/api/cart/** endpoints return 401 without a JWT.
- [x] All **/api/cart/** endpoints return 403 when called with an ADMIN or SUPPLIER JWT.
- [x] "Add to Cart" button on product detail page adds item and shows success toast.
- [x] Clicking "Add to Cart" as a guest redirects to `/login`.
- [x] Cart icon in Navbar shows correct item count badge after adding items.
- [x] Badge disappears when cart is empty.
- [x] `/cart` page loads with all cart items, unit prices, line totals, and subtotal.
- [x] Quantity **−** button decrements quantity; totals update; **−** disabled at quantity 1.
- [x] Quantity **+** button increments quantity; totals update.
- [x] Remove button removes the item from the list and subtotal recalculates.
- [x] "Clear all items" removes all rows and renders the empty cart state.
- [x] Out-of-stock item in cart shows ⚠ badge and disables the Checkout button.
- [x] Empty cart state shown with "Shop Now" CTA when no items are present.
- [x] Loading skeleton shown briefly on first cart load.
- [x] `/cart` route returns 302 → `/login` when accessed without authentication.

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-16 - Checkout Page (Address + Order Summary)

**Branch:** `feature/SCRUM-16-Checkout-Page-(Address-+-Order-Summary)`
**Tested by:** Maith-2004

### Test Cases
- [x] Login response now returns `address` and `phone` fields.
- [x] AuthContext correctly updates user state with address on login.
- [x] Navigating to `/checkout` pre-fills the address field if the user has one saved.
- [x] Formatting/Edit of the pre-filled address works correctly.
- [x] Validation error shown if the address field is cleared and "Place Order" is clicked.
- [x] "Order Summary" panel correctly lists items and total amount on initial load.
- [x] Clicking "Place Order & Pay" successfully transitions to the Payment step.
- [x] **Crucial:** Order Summary persists and remains accurate during the Payment step (even though the cart is cleared in the background).
- [x] Redirects to `/cart` if a user tries to access `/checkout` with an empty cart.

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-17 - Order Confirmation Page

**Branch:** `feature/SCRUM-17-order-confirmation`
**Tested by:** Maith-2004

### Order Confirmation Flow
- [x] User completes checkout and is redirected to `/order-success`; page displays Order ID, order summary, and delivery estimate.
- [x] Order ID is displayed in a prominent location and copyable; sample ID: `ORD-12345`.
- [x] Order summary includes each item name, SKU/ID, quantity, unit price, line total, subtotal, shipping, taxes, discounts, and grand total.
- [x] Delivery estimate is human-readable (e.g., "Delivery in 2-3 business days") and includes date range when available.
- [x] Action CTAs present: **View Order** (navigates to `/orders/{orderId}`), **Continue Shopping** (navigates to `/products`).
- [x] If navigation state contains full order payload, page renders immediately without extra API calls.
- [x] If navigation state is absent, page fetches order via `GET /api/orders/{orderId}` using the orderId passed in query or session; successful response 200 renders the page.
- [x] Loading state is shown while awaiting backend response; spinner or skeleton present.

### Direct Access / Empty-State
- [x] Accessing `/order-success` with no recent order or orderId shows an empty-state message: "No recent order found" and buttons: **View Orders** and **Continue Shopping**.
- [x] Empty-state does not display stale or partial order data.
- [x] Deep-link with invalid/expired orderId results in safe message and actionable buttons (**Orders**/**Products**).

### Failure / Negative Flows
- [x] `GET /api/orders/{orderId}` returns 404 → UI shows "Order not found" and buttons to **View Orders** and **Continue Shopping**.
- [x] `GET /api/orders/{orderId}` returns 403 → UI shows "Not authorized to view this order" and prompts to Login or **View Orders**.
- [x] `GET /api/orders/{orderId}` returns 500 or network error → UI shows friendly error with Retry action; retry re-attempts fetch.
- [x] Payment succeeded but order creation failed (no backend order) → show safe guidance: "We’re processing your order. Contact support if needed" and provide **Contact Support**/**View Orders** options.
- [x] Partial/malformed order payload (missing items[] or deliveryEstimate) → show placeholders like "Delivery estimate unavailable" while rendering available fields.
- [x] If API returns inconsistent totals, UI highlights discrepancy and logs an error for support.

### Security & Validation
- [x] API protection: all calls to `GET /api/orders/{orderId}` require Authorization header/token; verify via devtools or automated tests.
- [x] Order ownership check: ensure backend returns order only for the authenticated user; test with two accounts to confirm access denied for foreign orders.
- [x] No payment-sensitive data shown on page (no card numbers, CVV). Verify navigation state does not include full payment details.
- [x] Order ID format validation: expect pattern like `ORD-\d{3,}`; UI displays exactly the returned ID, test with `ORD-12345`.
- [x] XSS prevention: product names, notes, and any user input are escaped/sanitized; test with product name `<script>alert(1)</script>` and confirm no script runs.
- [x] Error messages do not leak internal stack traces or PII.
- [x] Analytics: page emits `order_success` event with payload `{ orderId, total, currency, itemCount }`; verify event fires once on initial successful render.
- [x] Logging: client-side logs capture API failures and user-facing messages are user-friendly.

### Edge Cases / Retry / Additional Flows
- [x] Page refresh when using navigation-state-only data triggers a backend fetch fallback and still shows order when available.
- [x] Order with 100+ line items renders and is usable (test with 120 items); ensure virtualization or scroll works.
- [x] Orders with very long product names or special characters render without layout break.
- [x] Locale/timezone: delivery estimate respects user's locale; test with en-US vs en-GB and confirm date formats.
- [x] Mobile/responsive: check layouts on typical sizes (iPhone 12: 390x844, iPhone SE: 375x667, tablet 768x1024).
- [x] Accessibility: order ID has aria-label (e.g., `aria-label="Order ID ORD-12345"`), headings use semantic tags, CTAs reachable via keyboard, color contrast >= WCAG AA.
- [x] Retry after transient network failure: Retry triggers refetch; confirm success after temporary network restoration.
- [x] Delayed-order scenarios (webhook finalization): page shows "Order processing" state with auto-refresh or polling until final deliveryEstimate available.
- [x] Performance: initial render under 300ms for small orders; large orders remain responsive (no jank while scrolling).

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-19 - Place Order with Stock Validation & Deduction

**Branch:** `feature/SCRUM-19-place-order-stock-validation`
**Tested by:** Maith-2004

### Test Cases
- [x] `POST /api/orders` with valid CUSTOMER JWT and sufficient stock → 201 Created with order ID, status PENDING, total, and line items.
- [x] Inventory correctly deducted — stock quantity reduced by ordered amount after successful order.
- [x] `POST /api/orders` with quantity exceeding available stock → 409 Conflict with message naming the failing product.
- [x] `POST /api/orders` with multiple items where one is out of stock → entire order rejected, no stock deducted for any item.
- [x] `POST /api/orders` with quantity: 0 → 400 Bad Request with validation error.
- [x] `POST /api/orders` with missing deliveryAddress → 400 Bad Request with field error.
- [x] `POST /api/orders` with empty items array → 400 Bad Request with field error.
- [x] `POST /api/orders` with non-existent productId → 404 Not Found.
- [x] `POST /api/orders` with ADMIN JWT → 403 Forbidden.
- [x] `POST /api/orders` with no token → 401 Unauthorized.
- [x] Concurrent purchase safety - only one of two simultaneous requests for the last unit succeeds; the other receives 409.

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-20 - Payment Processing

**Branch:** `feature/SCRUM-20-payment-processing`
**Tested by:** Maith-2004

### Payment Success
- [x] Checkout page displays order total in LKR.
- [x] Stripe CardElement accepts test card `4242 4242 4242 4242`.
- [x] Payment submitted and processed by Stripe.
- [x] Webhook received and order confirmed automatically.
- [x] Order status changed PENDING → CONFIRMED in database.
- [x] Customer redirected to success page.

### Payment Failure
- [x] Test card `4000 0000 0000 0002` (declined) rejects payment.
- [x] Error message displayed clearly.
- [x] Order stays PENDING, can retry.

### Security & Validation
- [x] Customer cannot pay for another customer's order.
- [x] Webhook signature verified (no unauthorized confirmations).
- [x] Minimum order amount enforced (Rs. 200).
- [x] LKR → USD conversion correct (311.33 rate).
- [x] Card details never sent to backend.

### Retry Flow
- [x] PENDING orders show "Retry Payment" button in dashboard.
- [x] Retry modal works and confirms order on success.

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-21 - Customer Dashboard with Order History and Loyalty Points

**Branch:** `feature/SCRUM-21-customer-dashboard-with-order-history-and-loyalty-points`
**Tested by:** Maith-2004

### Test Cases
- [x] `GET /api/customer/orders` with valid CUSTOMER JWT and existing orders → 200 OK with ordered list, each entry containing orderId, status, totalAmount, createdAt, deliveryAddress, and line items.
- [x] Orders returned newest-first - most recent order appears at top of list.
- [x] `GET /api/customer/orders` with valid CUSTOMER JWT and no past orders → 200 OK with empty array (no 404).
- [x] Customer A cannot see Customer B's orders - only the JWT principal's orders are returned.
- [x] `GET /api/customer/loyalty` with valid CUSTOMER JWT → 200 OK with totalPoints, earnedPoints, redeemedPoints, and conversionRule string.
- [x] `GET /api/customer/loyalty` for a customer with no orders → 200 OK with all point values as 0.
- [x] Loyalty points awarded correctly after placing an order - 1 point per LKR 100 spent (integer division, no rounding).
- [x] Points accumulate across multiple orders - second order adds to existing ledger, not replacing it.
- [x] `GET /api/customer/orders` with ADMIN JWT → 403 Forbidden.
- [x] `GET /api/customer/loyalty` with ADMIN JWT → 403 Forbidden.
- [x] `GET /api/customer/orders` with no token → 401 Unauthorized.
- [x] `GET /api/customer/loyalty` with no token → 401 Unauthorized.
- [x] Dashboard loads with empty order state - "No orders yet" message and Browse Products CTA displayed correctly.
- [x] Dashboard loads with existing orders - order cards render with correct status badge colours (PENDING=yellow, CONFIRMED=green, CANCELLED=red).
- [x] Loyalty section displays Available Balance, Total Earned, Redeemed, and the conversion rule text from the backend.
- [x] Expanding an order card shows itemised breakdown with product name, quantity, unit price, and line total in LKR.

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-25 - Admin Inventory Management

**Branch:** `feature/SCRUM-25-admin-inventory-management`
**Tested by:** Maith-2004

### Test Cases
- [x] `GET /api/admin/inventory` with valid ADMIN JWT → 200 OK and returns an array of inventory entries. Each entry includes: productId, productName, category, quantity, reorderThreshold, lowStock (derived), updatedAt, updatedBy.
- [x] Inventory list loads correctly in the admin UI (`/admin/inventory`) with loading skeleton shown while fetching.
- [x] Table columns render correctly: Product, Category, Quantity, Reorder Threshold, Status, Last Updated, Updated By, Actions.
- [x] Inline edit: clicking "Edit" opens editable quantity and reorderThreshold inputs pre-filled with current values.
- [x] Save action (inline edit) with valid integers persists changes: subsequent `GET /api/admin/inventory` returns the updated values.
- [x] Save action shows success toast; failure shows error toast with backend message.
- [x] Cancel action discards unsaved changes and restores read-only view.
- [x] Low-stock badge displays when quantity <= reorderThreshold and uses visual distinction (red for low, green for OK).
- [x] `PUT /api/admin/inventory/{productId}` with valid ADMIN JWT and valid payload → 200 OK and response reflects persisted state.
- [x] Validation: quantity < 0 or reorderThreshold < 0 → 400 Bad Request with field-level error messages.
- [x] Audit: after a successful update, `inventoryUpdatedBy` equals the authenticated admin's email and `updatedAt` is updated. Verified by: update → GET → check updatedBy + updatedAt.
- [x] RBAC: `PUT /api/admin/inventory/{productId}` with CUSTOMER/SUPPLIER/DELIVERY JWT → 403 Forbidden (role enforcement).
- [x] Auth: GET or PUT without token → 401 Unauthorized.
- [x] UI protection: Attempting to navigate to `/admin/inventory` without ADMIN role redirects to `/unauthorized` or shows the unauthorized page as per app behavior.
- [x] Empty state: If no products exist, the admin inventory page displays a friendly empty state (no table rows) rather than an error.
- [x] Responsiveness: Inventory table and inline edit controls render correctly on narrow viewports (mobile) and remain usable.
- [x] Unit tests: `InventoryServiceTest` runs locally — all tests pass (covers mapping, update logic, low-stock derivation, not-found behavior).
- [x] No sensitive data is exposed via the API (only admin email stored in `inventoryUpdatedBy` for audit).
- [x] DB persistence: Changes survive application restart (fields persisted in products table via JPA; migration note: `ddl-auto=update` will add columns if needed).

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-27 - Admin Order Management

**Branch:** `feature/SCRUM-27-admin-order-management`
**Tested by:** Maith-2004

### Test Cases
- [x] `GET /api/admin/orders?page=0&size=20` with valid ADMIN JWT → 200 OK and returns a paginated response. Each list item includes: orderId, createdAt, status, totalAmount, paymentStatus, and brief customer info suitable for listing.
- [x] `GET /api/admin/orders/{orderId}` with valid ADMIN JWT → 200 OK and returns `AdminOrderReviewResponse` including: order items (name, unitPrice, quantity, lineTotal), customer/delivery info, payment info, pricing summary, and statusHistory entries.
- [x] Admin Orders page (`/admin/orders`) loads correctly in the admin UI with a loading skeleton and displays the paginated list.
- [x] Order row columns render correctly: Order ID, Created, Status, Payment Status, Total, Actions (Review / Update).
- [x] Order review modal opens and displays full details: items, pricing, customer details, payment info, and chronological status history.
- [x] Status update workflow: opening the status correction control allows selecting a new status and (when required) entering a correction reason. Validation prevents submitting when a required `changeReason` is missing.
- [x] `PATCH /api/admin/orders/{orderId}/status` with valid ADMIN JWT and valid payload → 200 OK and response shows updated status and updated summary fields.
- [x] Successful status update persists: subsequent `GET /api/admin/orders/{orderId}` returns the new status and an appended `OrderStatusHistory` entry containing the changer and timestamp.
- [x] Payment preservation: status transitions that must not alter paymentStatus (e.g., CANCELLED vs PAID semantics) do not change paymentStatus unexpectedly. Verified by updating status on paid orders and re-checking paymentStatus.
- [x] Invalid transitions rejected: attempting a disallowed transition returns 400 Bad Request with a clear error (e.g., "Invalid order status transition"). Tested examples: DELIVERED → PROCESSING rejected.
- [x] Correction reason enforcement: when a transition requires a reason (business rule), a missing `changeReason` produces 400 with field-level error.
- [x] RBAC: GET or PATCH to admin endpoints with CUSTOMER/SUPPLIER/DELIVERY JWT → 403 Forbidden (role enforcement).
- [x] Auth: GET or PATCH without token → 401 Unauthorized.
- [x] UI protection: Direct navigation to `/admin/orders` without ADMIN role redirects to `/unauthorized` or shows the unauthorized page per app behavior.
- [x] UI feedback: success shows a success toast and updated list; errors show an error toast with backend message.
- [x] Empty state: If there are no orders, the admin orders page displays a friendly empty state, not an error.
- [x] Responsiveness: Orders list, review modal, and status-update controls render and remain usable on narrow viewports (mobile).
- [x] Server-side unit tests: `OrderServiceImplTest` passes locally — covers mapping, allowed transitions, invalid transitions, preservation of payment status, and history entries.
- [x] Security tests: `AdminOrderSecurityTest` passes locally (ensures 403 for non-admins).
- [x] DB persistence: Status/history changes persist in DB and survive application restart (persisted via JPA).
- [x] No sensitive data leakage: API responses contain order/customer information required for admin workflow only; no secrets or unnecessary PII are exposed beyond what admin role requires.

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-49 - Debounced Search & Rich Suggestions

**Branch:** `SCRUM-49/search-debounce-suggestions`
**Tested by:** Maith-2004

### Verification Checklist
- [x] **Debounce**: Rapid typing triggers a single suggestions request after ~300ms pause.
- [x] **Suggestions UI**: Rows show thumbnail (or placeholder), product name, formatted price, and unit (up to 8 suggestions).
- [x] **Out-of-Order Guard**: Late/out-of-order suggestion responses ignored (request-id guard prevents stale overrides).
- [x] **Click Navigation**: Clicking a suggestion routes to `/products/:id` (product detail) without triggering full catalogue fetch.
- [x] **Keyboard Navigation**: Arrow + Enter selects suggestion and navigates to product detail; Tab/Escape supported.
- [x] **Commit Behavior**: Pressing Enter or clicking Search commits search (writes search query param) and updates product grid.
- [x] **No Flicker**: While typing (before commit) the product grid does not reload or flicker; clearing input immediately restores full catalog.
- [x] **URL & History**: Empty search submission clears search query param; Back/Forward restore committed search state from URL.
- [x] **Auth Consistency**: Suggestion selection and search submission behave consistently for guest and authenticated users.
- [x] **Robustness**: Missing image/unit, delayed or failed suggestion responses handled gracefully (no crashes).
- [x] **Console & Accessibility**: No console errors observed; suggestion list uses ARIA (`role="listbox"`, `role="option"`, `aria-selected`) and supports keyboard-only flows.

### APIs Verified
- `GET /api/products/suggestions?q={query}` — lightweight suggestions endpoint (min 2 chars, up to 8 results)
- `GET /api/products` — catalogue driven by committed URL params
- `GET /api/products/{id}` — product detail target

### Edge Cases & Notes
- Rapid typing + immediate selection routes correctly.
- Very long inputs render safely.
- High-latency responses ignored; intermittent network failures do not break client-side routing.

**Verdict:** ✅ Approved and ready to merge into develop.
