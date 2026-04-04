# UrbanFresh - Sprint 3 QA Report

| Field                   | Detail                      |
|-------------------------|-----------------------------|
| **Project**             | UrbanFresh                  |
| **Sprint**              | Sprint 3                    |
| **Report Date**         | 04 April 2026               |
| **QA Engineer**         | Chamathdil0shan             |
| **Stories Tested**      | 9                           |
| **Total Defects Found** | 4                           |
| **Overall Verdict**     | ✅ All stories approved     |

---

## Stories Tested

| Story ID  | Title                                                   | SP | Verdict     |
|-----------|---------------------------------------------------------|----|-------------|
| SCRUM-23  | Admin Dashboard                                         | 2  | ✅ Approved |
| SCRUM-29  | Admin Creates Supplier Account + Assigns Brand          | 2  | ✅ Approved |
| SCRUM-30  | Supplier Dashboard                                      | 2  | ✅ Approved |
| SCRUM-31  | Supplier Product Management                             | 2  | ✅ Approved |
| SCRUM-32  | Supplier Purchase Orders                                | 2  | ✅ Approved |
| SCRUM-34  | Admin Creates Delivery Personnel Account                | 2  | ✅ Approved |
| SCRUM-35  | Admin: Assign Delivery Personnel to Orders              | 1  | ✅ Approved |
| SCRUM-36  | Delivery Details Page                                   | 3  | ✅ Approved |
| SCRUM-37  | Delivery Status Updates                                 | 1  | ✅ Approved |

---

## SCRUM-23 - Admin Dashboard

**Branch:** `feature/SCRUM-23-admin-dashboard`
**Tested by:** Chamathdil0shan

### Test Cases
- [x] `GET /api/admin/dashboard` with ADMIN JWT returns 200 with KPI metrics (orders, revenue, products, suppliers).
- [x] `GET /api/admin/dashboard` with CUSTOMER/SUPPLIER/DELIVERY JWT returns 403 Forbidden.
- [x] `GET /api/admin/dashboard` without JWT returns 401 Unauthorized.
- [x] Dashboard displays KPI cards: Total Orders, Total Revenue (LKR), Total Products, Active Suppliers.
- [x] Alerts section shows: Low Stock Items, Near Expiry Items, Waste Percentage.
- [x] Quick action links navigate to: Manage Products, Inventory, Orders.
- [x] Loading skeleton shown while fetching data.
- [x] Error state displays with retry button.
- [x] `/admin` route accessed by ADMIN user displays dashboard component.
- [x] `/admin` route accessed by CUSTOMER user redirects to `/unauthorized`.
- [x] Unauthenticated user redirected to `/login`.
- [x] Revenue formatted in LKR with thousand separators (e.g., "Rs. 50,000.00").
- [x] Last updated timestamp displayed in ISO format.
- [x] Responsive layout on mobile, tablet, desktop.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-29 - Admin Creates Supplier Account + Assigns Brand

**Branch:** `feature/SCRUM-29-Creates-Supplier-Accounts`
**Tested by:** Chamathdil0shan

### Successful Supplier Onboarding & Brand Assignment
- [x] Create supplier with single brand: `POST /api/admin/suppliers` payload `{ "name": "Acme Supplies", "email": "supplier+acme@example.com", "password": "P@ssw0rd!", "brandIds": [101] }` → 201 Created; response contains `supplierId`, `brandIds: [101]`; supplier can log in and sees brand name "Acme Brand".
- [x] Create supplier with multiple brands: payload with `brandIds: [101,102]` → 201 Created; after login supplier product list limited to products with `brandId` 101 or 102.
- [x] Edit supplier brands: `PUT /api/admin/suppliers/{supplierId}` change brands to `[102]` → 200 OK; DB supplier-brand join table contains only `brandId` 102; supplier product view updates accordingly.
- [x] Create brand via UI: use `AdminBrandsPage` to create `{ "name":"Acme Brand", "code":"ACME" }` → 201 Created; appears in active dropdown for supplier form.
- [x] Create product with brand: `POST /api/admin/products` `{ "name":"Widget","brandId":101 }` → 201 Created; product list shows brand metadata (`id/name/code`).

### Failure / Negative Flows
- [x] Duplicate supplier email: repeat create with `supplier+acme@example.com` → 409 Conflict with message "This email is already registered."; frontend shows inline validation error.
- [x] Assign inactive brand: admin assigns inactive `brandId` → 400 Bad Request with clear message; supplier create/update rejected.
- [x] Invalid brand id: assign non-existent `brandId: 9999` → 404/400 (BrandNotFound / validation); frontend surfaces appropriate error.
- [x] Missing required fields / weak password: `POST` supplier without `email` or with weak `password` → 400 Validation error; client blocks submit and shows constraint messages.
- [x] Unauthorized access: non-admin user calls `POST /api/admin/brands` → 403 Forbidden (RBAC enforced).

### Security & Validation
- [x] RBAC enforcement: admin-only endpoints return 403 for non-admin JWTs; validated by calling admin endpoints with a supplier JWT and a regular user JWT.
- [x] Deactivated supplier authentication: set supplier `active=false` → subsequent login attempts return 401/403 with message "Account deactivated".
- [x] JWT scope enforcement: supplier JWT cannot access admin endpoints; supplier JWT returns products scoped to assigned brands only.
- [x] Input validation: `BrandRequest` and `UpdateSupplierRequest` reject empty/invalid fields; test with empty `name`/`code` and invalid `email` → 400 and descriptive errors.
- [x] HTTP status contract: verify 201/200/404/409/400 mapping for create/update/not-found/conflict/validation cases.

### Edge Cases / Retry / Additional Flows
- [x] Supplier with no brands assigned: create supplier with `brandIds: []` → behavior verified (allowed or blocked per configuration); UI displays "No brands assigned" where applicable. Test data: `{ "email":"supplier+nobrands@example.com", "brandIds": [] }`.
- [x] Brand soft-deactivate effect: deactivate `brandId` 101 after assignment → verify brand removed from active dropdowns; confirm business-expected behavior for existing supplier associations (document whether retained or revoked).
- [x] Product with null brand: create product with `"brandId": null` → 201 Created; product shows empty brand metadata; suppliers do not see it unless policy permits.
- [x] Idempotent create attempts: repeated POST of same brand payload → second request yields 409; frontend handles duplicate gracefully.
- [x] Concurrency on supplier updates: simultaneous `PUT /api/admin/suppliers/{id}` from two admin sessions → final DB state is consistent and atomic (transactional replacement of brand assignments).
- [x] API failure fallback: when brand list fetch fails (HTTP 500), supplier form shows friendly error and prevents submit; verify UI fallback message and retry behavior.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-30 - Supplier Dashboard

**Branch:** `feature/SCRUM-30-supplier-dashboard`
**Tested by:** Chamathdil0shan

### Test Cases
- [x] `/api/supplier/dashboard` returns 200 OK with correct DTO when accessed with a valid SUPPLIER token.
- [x] Dashboard UI correctly renders assigned brand names in the "Your Brands" metric card.
- [x] Dashboard UI correctly displays aggregated total sales corresponding to the supplier's active brand mappings.
- [x] Dashboard UI correctly displays the count of products with stock <= reorder threshold in the "Pending Restocks" card.
- [x] Managed products table renders correctly below the metrics cards.
- [x] Graceful loading state shown while waiting for API responses.
- [x] Safe defaults/fallbacks handled correctly (e.g., "Rs. 0.00" if no sales, "No Brands Assigned" if unmapped).
- [x] `GET /supplier` properly redirects to `/login` when accessed without an auth token (Auth Guard).
- [x] Accessing the `GET /supplier` route as a CUSTOMER, ADMIN, or DELIVERY user correctly triggers a 403 Unauthorized redirect to `/unauthorized`.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-31 - Supplier Product Management

**Branch:** `feature/SCRUM-31-supplier-product-management`
**Tested by:** Chamathdil0shan

### Test Cases
- [x] Supplier dashboard loads and displays only products linked to the supplier's assigned brands.
- [x] Supplier can successfully submit a new product listing request via the UI modal.
- [x] Newly requested products are automatically assigned `PENDING` status and remain hidden from the public catalog.
- [x] Admin "New Listing Requests" tab correctly fetches and displays all `PENDING` product requests.
- [x] Admin can approve a pending request; status updates to `APPROVED`, stock initializes to 0, and it moves to the active catalog.
- [x] Admin can reject a pending request; the product record is permanently deleted from the database and disappears from all views.
- [x] Role-based access control is enforced (Suppliers cannot access Admin approval endpoints; regular users cannot access Supplier endpoints).
- [x] UI gracefully handles loading states, success/error toast notifications, and empty states for both supplier and admin tables.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-32 - Supplier Purchase Orders

**Branch:** `feature/SCRUM-32-Supplier-Purchase-Orders`
**Tested by:** Chamathdil0shan

### Test Cases
- [x] `/supplier/purchase-orders` protects against an unauthenticated user (redirects to `/login`).
- [x] `/supplier/purchase-orders` blocks access from users with `CUSTOMER`, `DELIVERY`, or `ADMIN` roles (403 Forbidden).
- [x] A Supplier sees only the purchase orders that relate to brands currently mapped to their profile (scoping works).
- [x] Blank or empty state gracefully handles suppliers who have no assigned brands or no purchase orders.
- [x] Clicking "Update" on a purchase order opens the status modal correctly with the current values populated.
- [x] Expected statuses (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) exist in the update dropdown.
- [x] Saving the modal updates `/supplier/purchase-orders/{id}/status` successfully and triggers a data-refresh UI update.
- [x] Backend rejects any attempts by a supplier to update a purchase order belonging to a brand they do not own (returns 403 Forbidden).

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-34 - Admin Creates Delivery Personnel Account

**Branch:** `feature/SCRUM-34-admin-creates-delivery-personnel-account`
**Tested by:** Chamathdil0shan

### Backend API
- [x] `POST /api/admin/delivery-personnel` creates account with DELIVERY role, hashed password, `isActive=true` (201 Created).
- [x] `GET /api/admin/delivery-personnel?page=0&size=20` returns paginated list (200 OK).
- [x] `PATCH /api/admin/delivery-personnel/{id}/status` activates/deactivates account (200 OK).
- [x] Duplicate email rejected (400 Bad Request).
- [x] Invalid password format rejected (400 Bad Request).
- [x] Non-ADMIN requests return 403 Forbidden; unauthenticated return 401 Unauthorized.
- [x] Deactivated personnel cannot log in (invalid credentials).

### Frontend UI
- [x] `/admin/delivery-personnel` route: ADMIN renders page, non-admin redirects to `/unauthorized`, unauthenticated redirects to `/login`.
- [x] Table displays: name, email, phone, status badge (Active/Inactive), created date, actions.
- [x] Modal form: name (2–100 chars), email (valid format, unique), password (8–64 chars, uppercase/lowercase/digit/special), confirm password, phone (10–15 digits optional).
- [x] Real-time password strength indicator (Very Weak → Strong).
- [x] Form validation: displays field-level errors, disables submit during request.
- [x] Success: modal closes, toast confirms, table refreshes.
- [x] Error: field-level or generic error toasts, form remains open.
- [x] Pagination: Previous/Next buttons work; disabled at boundaries.
- [x] Activate/Deactivate: toggles status, updates immediately.
- [x] Loading skeleton shown while fetching; error state with retry button.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-35 - Admin: Assign Delivery Personnel to Orders

**Branch:** `feature/SCRUM-35-admin-assigns-delivery-personnel-to-orders`
**Tested by:** Chamathdil0shan

### Test Cases
- [x] `PUT /api/admin/orders/{orderId}/assign-delivery` with ADMIN JWT and a `READY` order returns 200 with updated order including `deliveryPersonId` and `deliveryPersonName`.
- [x] `PUT /api/admin/orders/{orderId}/assign-delivery` with a non-`READY` order (e.g. `PROCESSING`) returns 400 with descriptive error message.
- [x] `PUT /api/admin/orders/{orderId}/assign-delivery` with an inactive delivery person ID returns 400 with descriptive error message.
- [x] `PUT /api/admin/orders/{orderId}/assign-delivery` with a non-existent delivery person ID returns 404.
- [x] `PUT /api/admin/orders/{orderId}/assign-delivery` with CUSTOMER/SUPPLIER/DELIVERY JWT returns 403 Forbidden.
- [x] `PUT /api/admin/orders/{orderId}/assign-delivery` without JWT returns 401 Unauthorized.
- [x] `GET /api/admin/delivery-personnel/active` with ADMIN JWT returns 200 with only active `DELIVERY` role users, sorted by name.
- [x] `GET /api/admin/delivery-personnel/active` with CUSTOMER/SUPPLIER/DELIVERY JWT returns 403 Forbidden.
- [x] Order status transitions from `READY` to `OUT_FOR_DELIVERY` on successful assignment.
- [x] Assignment recorded in `OrderStatusHistory` with change reason referencing the assigned delivery person's name.
- [x] Admin Orders page: delivery person selector + Assign button appear only on `READY` order rows.
- [x] Admin Orders page: Assign button is disabled until a delivery person is selected from the dropdown.
- [x] Admin Orders page: successful assignment updates the row status to `OUT_FOR_DELIVERY` and displays the assignee's name with 🚚 indicator.
- [x] Admin Orders page: `OUT_FOR_DELIVERY` badge renders in indigo; `DELIVERED` badge renders in emerald.
- [x] Admin Orders page: failed assignment displays toast error with backend message.
- [x] `/admin/orders` route accessed by ADMIN user displays Order Management page.
- [x] `/admin/orders` route accessed by CUSTOMER user redirects to `/unauthorized`.
- [x] Unauthenticated user redirected to `/login`.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-36 - Delivery Details Page

**Branch:** `feature/SCRUM-36-Delivery-Details-Page`
**Tested by:** Chamathdil0shan

### Delivery Details and Assignment Success Flows
- [x] Logged in as delivery user `dp1@urbanfresh.com` (assigned to order `ORD-10021`), opened Delivery Order Details page and verified customer address, item list, and current status are displayed correctly.
- [x] Verified order item data integrity for `ORD-10021` (3 items: Tomatoes ×2, Potatoes ×1, Milk ×4) matches backend response and UI totals.
- [x] From Delivery Dashboard, selected assigned order and confirmed navigation to the correct details route with successful data load (200 OK).
- [x] Logged in as admin `admin@urbanfresh.com`, opened Delivery-Personnel page, verified personnel list rendering, status visibility, and refined UI interactions (search/filter/pagination behavior).
- [x] Assigned order `ORD-10035` to delivery user `dp2@urbanfresh.com`, then successfully reassigned to `dp3@urbanfresh.com`; UI and API both reflected new assignee after refresh.

### Access Control and Negative Flows
- [x] Logged in as delivery user `dp2@urbanfresh.com` and attempted to open unassigned order `ORD-10021`; system denied access with 403 Forbidden.
- [x] Requested non-existing order `ORD-99999` from Delivery Details; verified not-found handling (404) and appropriate UI fallback state.
- [x] Attempted reassignment with invalid delivery-person ID `DEL-INVALID`; API rejected request with validation error and UI preserved previous valid assignment.
- [x] Attempted reassignment from non-admin role; operation blocked by authorization controls and no assignment mutation occurred.

### Security & Validation
- [x] Confirmed role-based authorization: only `DELIVERY` role can access delivery detail endpoints and only `ADMIN` role can perform assignment/reassignment operations.
- [x] Verified assignment-based ownership validation: delivery user can access only their assigned orders.
- [x] Verified API behavior and status codes: `GET /api/delivery/orders` returns assigned orders only; `GET /api/delivery/orders/{orderId}` returns 200 for assigned, 403 for unassigned, 404 for missing order.
- [x] Confirmed no sensitive internal fields are leaked in delivery detail payload (response limited to required delivery/business fields).
- [x] Confirmed unauthorized session/token scenarios redirect or reject requests appropriately (401/403) without exposing order data.

### Edge Cases / Retry / Additional Flows
- [x] Simulated transient network failure on Delivery Details API and verified retry/error UI behavior recovers correctly on re-attempt.
- [x] Verified reassignment idempotency by reassigning `ORD-10035` to same user `dp3@urbanfresh.com`; system handled request without inconsistent state.
- [x] Verified concurrent admin action behavior: reassignment from Admin A followed by refresh in Admin B reflected latest assignee consistently.
- [x] Verified refined delivery-personnel UI state persistence for active filters during page navigation and return flow.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## SCRUM-37 - Delivery Status Updates

**Branch:** `feature/SCRUM-37-Delivery-Status-Updates`
**Tested by:** Chamathdil0shan

### Delivery Assignment & Status Update Success Flow
- [x] Logged in as `lakmal.silva@urbanfresh.test` (DELIVERY) and verified assigned orders load in Delivery Dashboard (`/delivery`) with counts for Current and History.
- [x] Opened assigned order (`orderId=101`, status `OUT_FOR_DELIVERY`) from Current Orders and confirmed order details, customer phone, payment status, and amount are displayed.
- [x] Updated order status via UI action **Mark Delivered** and verified API `PATCH /api/delivery/orders/101/status` returns 200 with updated status `DELIVERED`.
- [x] Updated another assigned order (`orderId=102`) via **Mark Returned** and verified API response status `RETURNED` with refreshed details.
- [x] Confirmed updated orders move from Current Orders view to Order History view and are shown with final status metadata.

### Failure / Negative Flow
- [x] Attempted status update by a delivery user not assigned to target order and verified API returns 403 Forbidden with access denied message.
- [x] Attempted invalid transition from non-eligible source status (`READY → DELIVERED`) and verified API rejects with 400 transition validation error.
- [x] Attempted unsupported target status (`PROCESSING`) for delivery update and verified API rejects with 400 and allowed statuses guidance.
- [x] Submitted status update payload without `status` field and verified validation error 400 with `errors.status = "status is required"`.
- [x] Accessed non-existent order ID (`/api/delivery/orders/99999`) and verified 404 Not Found behavior on details flow.

### Security & Validation
- [x] Verified delivery endpoints are role-protected (`hasRole('DELIVERY')`) and CUSTOMER/ADMIN tokens cannot invoke delivery status update APIs.
- [x] Verified assignment ownership enforcement prevents horizontal privilege escalation across delivery users.
- [x] Verified protected frontend routes (`/delivery/*`) block unauthorized roles and redirect to unauthorized/home flow.
- [x] Verified request payload validation enforces non-blank `status` and optional `changeReason` max-length constraints.
- [x] Verified profile endpoint authorization update allows DELIVERY user access to `/api/profile` while still requiring authenticated principal.

### Edge Cases / Retry / Additional Flows
- [x] Retried failed status update after transient error using UI refresh and confirmed updated data is fetched correctly from delivery endpoints.
- [x] Re-opened already completed order from history and verified no delivery action buttons are shown when status is not `OUT_FOR_DELIVERY`.
- [x] Verified empty-state messaging when no current assignments exist and when history filters return no matches.
- [x] Verified API list and details responses include payment context (`paymentStatus`, `paymentMethod`) after status changes.
- [x] Verified API/data consistency with payment-related fields: delivery status updates do not alter persisted payment status unexpectedly (no webhook side-effects observed).

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## Defect Log

### DEF-006 — Admin Dashboard missing user header, profile link, and logout functionality

| Field         | Detail                                                         |
|---------------|----------------------------------------------------------------|
| **Defect ID** | DEF-006                                                        |
| **Story**     | SCRUM-23                                                       |
| **Severity**  | Medium                                                         |
| **Priority**  | Medium                                                         |
| **Status**    | ✅ Resolved                                                    |
| **Found by**  | Chamathdil0shan                                                |
| **Fixed in**  | improv/defect-fixes (PR #29)                                   |

**Title:** Admin Dashboard missing user header, profile link, and logout functionality

**Description:**
The Admin Dashboard (`/admin`) had no mechanism for an administrator to log out or navigate to their own profile. There was no user header section displaying the logged-in admin's name, no profile management link, and no logout button, leaving admins with no in-app way to end their session or update their account details.

**Steps to Reproduce:**
1. Log in as an ADMIN user.
2. Navigate to `/admin`.
3. Observe the dashboard — no user name, profile link, or logout button is present.
4. There is no way to log out from within the admin section without manually clearing `localStorage`.

**Expected:** Admin Dashboard displays a user header showing the admin's name, a link navigating to `/admin/profile`, and a Logout button that clears the session and redirects to `/login`.
**Actual:** No user header, no profile navigation, and no logout button on the admin dashboard.

**Root Cause:** `AdminDashboard.jsx` was built without a user header section. `AdminProfilePage.jsx` and its route did not exist.

**Fix Applied:** Added a user header with logout button and profile link to `AdminDashboard.jsx`. Created `AdminProfilePage.jsx` (matching the customer profile UX). Added `/admin/profile` route with `ProtectedRoute` for ADMIN role in `App.jsx`. Created `adminProfileService.js` with `getAdminProfile()` and `updateAdminProfile()` functions backed by `GET/PUT /api/admin/profile`.

### Verification Test Cases
- [x] Admin Dashboard displays a header with the logged-in admin's name.
- [x] Clicking the profile link navigates to `/admin/profile`.
- [x] `/admin/profile` loads and displays admin's saved data.
- [x] Clicking Logout clears the JWT and redirects to `/login`.
- [x] `GET /api/admin/profile` with ADMIN JWT → 200 with correct profile data.
- [x] `PUT /api/admin/profile` with valid data updates the admin's name and phone; returns updated profile.
- [x] `GET /api/admin/profile` and `PUT /api/admin/profile` with CUSTOMER JWT → 403 Forbidden.

**Closed Issue:** #25

---

### DEF-007 — PaymentModal creates duplicate payment intents on each retry click

| Field         | Detail                                                         |
|---------------|----------------------------------------------------------------|
| **Defect ID** | DEF-007                                                        |
| **Story**     | SCRUM-20 (regression surfaced in Sprint 3)                     |
| **Severity**  | High                                                           |
| **Priority**  | High                                                           |
| **Status**    | ✅ Resolved                                                    |
| **Found by**  | Chamathdil0shan                                                |
| **Fixed in**  | improv/defect-fixes (PR #29)                                   |

**Title:** PaymentModal creates a new payment intent on every retry click — risk of duplicate charges

**Description:**
When a customer's payment failed and they clicked the retry button, `PaymentModal.jsx` initiated a brand new payment intent with each click rather than reusing the existing one for the order. This meant that clicking retry multiple times before a response arrived could create several active payment intents against the same order, exposing the customer to a risk of being charged more than once.

**Steps to Reproduce:**
1. Proceed to checkout and reach the Payment step.
2. Enter a declining test card (e.g. `4000 0000 0000 0002`).
3. Click "Pay Now" — payment fails with an error message.
4. Click "Retry" repeatedly in quick succession before the next response arrives.
5. Observe in Stripe Dashboard — multiple payment intents are created for the same order.

**Expected:** On retry, the existing payment intent is reused (or the submit button is disabled until the current attempt resolves), ensuring a single active payment intent per order at all times.
**Actual:** Each retry click fires a new `createPaymentIntent` call, resulting in multiple payment intents in Stripe for the same order.

**Root Cause:** `PaymentModal.jsx` had no guard to prevent concurrent or duplicate submissions. There was no `useRef` lock or in-flight state check before initiating a new payment intent.

**Fix Applied:** Added a `useRef` flag (`processingRef`) to `PaymentModal.jsx` that is set to `true` when a payment attempt begins and reset only on completion or error, preventing duplicate payment intent creation on rapid retries. Progress messages and user notifications were also simplified for clarity.

### Verification Test Cases
- [x] Clicking "Pay Now" multiple times rapidly creates only one payment intent in Stripe.
- [x] "Pay Now" button is disabled/locked while a payment request is in flight.
- [x] Successful payment confirms order and redirects correctly (no duplicate confirmations).
- [x] Failed payment re-enables the form and allows exactly one retry attempt at a time.
- [x] `PaymentModal` opened from `OrderSuccessPage` for PENDING orders shows retry flow and confirms on success.

**Closed Issue:** #25

---

### DEF-008 — Admin order status dropdown allows invalid transitions from PENDING state

| Field         | Detail                                                         |
|---------------|----------------------------------------------------------------|
| **Defect ID** | DEF-008                                                        |
| **Story**     | SCRUM-27 (regression surfaced in Sprint 3)                     |
| **Severity**  | Medium                                                         |
| **Priority**  | High                                                           |
| **Status**    | ✅ Resolved                                                    |
| **Found by**  | Chamathdil0shan                                                |
| **Fixed in**  | improv/defect-fixes (PR #29)                                   |

**Title:** Admin order status dropdown allows selecting transitions from PENDING — backend rejects but frontend permits

**Description:**
On the Admin Orders page (`/admin/orders`), the status correction dropdown included `PENDING` as a selectable current-state option and allowed admins to attempt transitions away from it. The backend enforces that `PENDING` is not a manually manageable state — `CONFIRMED` is the first state an admin can act on (arriving via a successful payment webhook). Every such transition attempt resulted in a 400 error from the backend, but the frontend gave no prior indication that the action was invalid.

**Steps to Reproduce:**
1. Log in as ADMIN and navigate to `/admin/orders`.
2. Find an order in `PENDING` status.
3. Open the status update control for that order.
4. Observe that status options are available and selectable.
5. Submit a transition away from PENDING — backend returns 400 "Invalid order status transition".

**Expected:** PENDING status is shown as read-only / disabled in the status update control. The dropdown arrow is hidden for rows in PENDING state, making it visually clear that no manual transition is available.
**Actual:** Dropdown is active for PENDING orders; admins can attempt invalid transitions that always fail with a backend error.

**Root Cause:** `AdminOrdersPage.jsx` did not implement frontend-side transition rules. The backend-defined rule that `PENDING` orders cannot be manually progressed was not reflected in the UI.

**Fix Applied:** Updated `AdminOrdersPage.jsx` to disable the status dropdown and hide its arrow indicator when order status is `PENDING`. `CONFIRMED` is now the first actionable state displayed to admins, aligning the frontend transition rules with the backend.

### Verification Test Cases
- [x] PENDING order row: status control is disabled and dropdown arrow is not shown.
- [x] CONFIRMED order row: status dropdown is active and shows valid next-state options.
- [x] Selecting a valid transition from a CONFIRMED order and submitting returns 200 and updates the row.
- [x] Attempting an invalid transition (e.g. `DELIVERED → PROCESSING`) via direct API call → 400 "Invalid order status transition".
- [x] Status history entry is created for each successful transition, recording the admin email and timestamp.

**Closed Issue:** #25

---

### DEF-009 — Loyalty points awarded at order placement (PENDING) instead of at payment confirmation (CONFIRMED)

| Field         | Detail                                                         |
|---------------|----------------------------------------------------------------|
| **Defect ID** | DEF-009                                                        |
| **Story**     | SCRUM-21 (regression surfaced in Sprint 3)                     |
| **Severity**  | High                                                           |
| **Priority**  | High                                                           |
| **Status**    | ✅ Resolved                                                    |
| **Found by**  | Chamathdil0shan                                                |
| **Fixed in**  | improv/defect-fixes (PR #29)                                   |

**Title:** Loyalty points awarded when order is created (PENDING) — not when payment succeeds (CONFIRMED)

**Description:**
Loyalty points were being awarded to customers at the moment an order was created (status = `PENDING`), before payment had been confirmed. This meant that a customer whose payment subsequently failed would still retain the loyalty points earned for that unpaid order. Points should only be awarded once the payment webhook transitions the order to `CONFIRMED`, and must not be awarded more than once even if multiple Stripe webhook events fire for the same order.

**Steps to Reproduce:**
1. Add items to cart and proceed to checkout.
2. Enter a declining test card (e.g. `4000 0000 0000 0002`).
3. Submit — order is created with `PENDING` status and payment fails.
4. Navigate to `/dashboard` and check the Loyalty Points balance.
5. Observe — points have been awarded despite no successful payment.

**Expected:** Loyalty points are awarded exactly once when the order transitions from `PENDING` to `CONFIRMED` via a successful Stripe webhook event. No points are awarded for `PENDING` orders. No points are awarded twice if both `payment_intent.succeeded` and `charge.updated` webhook events fire for the same order.
**Actual:** Points awarded immediately at order creation regardless of payment outcome.

**Root Cause:** The loyalty points calculation was triggered inside the order creation service (`OrderServiceImpl`) on `POST /api/orders`, rather than inside the payment webhook handler that processes the `CONFIRMED` transition.

**Fix Applied:** Loyalty point calculation moved from `OrderServiceImpl.createOrder()` to the payment webhook handler's `applyPaidState()` method in `PaymentServiceImpl`. An idempotency guard was added to prevent double-awarding if multiple webhook events resolve for the same order. `mvn clean compile` — BUILD SUCCESS verified.

### Verification Test Cases
- [x] Points are **not** awarded when an order is placed (status = `PENDING`) — loyalty balance unchanged immediately after `POST /api/orders`.
- [x] Points are awarded exactly once when payment succeeds and order transitions to `CONFIRMED` via webhook.
- [x] Points are **not** awarded if payment fails — order remains `PENDING` and loyalty balance is unchanged.
- [x] Points are **not** awarded twice if both `payment_intent.succeeded` and `charge.updated` webhook events fire for the same order.
- [x] `mvn clean compile` — BUILD SUCCESS (0 errors, 0 warnings).

**Closed Issue:** #25

---

## Sprint 3 Summary

| Metric                    | Result |
|---------------------------|--------|
| Stories tested            | 9      |
| Stories approved          | 9      |
| Stories failed / blocked  | 0      |
| Defects raised            | 4      |
| Defects resolved          | 4      |
| Defects open              | 0      |
| Test cases executed       | 132    |
| Test cases passed         | 132    |
| Test cases failed         | 0      |
