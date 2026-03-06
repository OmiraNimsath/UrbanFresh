# UrbanFresh - Sprint 1 QA Report

| Field                   | Detail                     |
|-------------------------|----------------------------|
| **Project**             | UrbanFresh                 |
| **Sprint**              | Sprint 1                   |
| **Report Date**         | 05 March 2026              |
| **QA Engineer**         | OmiraNK - IT24103437       |
| **Stories Tested**      | 9                          |
| **Total Defects Found** | 5                          |
| **Overall Verdict**     | ✅ All stories approved    |

---

## Stories Tested

| Story ID  | Title                                        | SP | Verdict     |
|-----------|----------------------------------------------|----|-------------|
| SCRUM-2   | Customer Registration with Secure Validation | 2  | ✅ Approved |
| SCRUM-3   | Login and JWT Token Issuance                 | 2  | ✅ Approved |
| SCRUM-6   | Logout + Session Expiry Handling             | 1  | ✅ Approved |
| SCRUM-10  | Public Landing Page                          | 1  | ✅ Approved |
| SCRUM-11  | Product Listing Page                         | 3  | ✅ Approved |
| SCRUM-4   | Role-Based Access Control                    | 3  | ✅ Approved |
| SCRUM-24  | Admin Product Management                     | 2  | ✅ Approved |
| SCRUM-12  | Product Detail Page                          | 1  | ✅ Approved |
| SCRUM-5   | Customer Profile Management                  | 1  | ✅ Approved |

---

## SCRUM-2 - Customer Registration with Secure Validation

**Branch:** feature/SCRUM-2-customer-registration  
**Tested by:** OmiraNK

### Test Cases
- [x] mvnw compile – BUILD SUCCESS
- [x] Frontend-backend integration verified (fields, error shape, status codes, CORS)
- [x] Duplicate email → 409 response, inline error under email field reads "Email already registered"
- [x] Password missing uppercase/digit/special character → frontend checklist item unmarked, submit blocked
- [x] Phone with 9 or 16 digits → 400 with phone field error; empty phone accepted (optional)
- [x] All required fields empty on submit → all inline errors appear simultaneously
- [x] BCrypt hash verified in DB - password column starts with `$2a$`, raw password not stored

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-3 - Login and JWT Token Issuance

**Branch:** feature/SCRUM-3-login-jwt  
**Tested by:** OmiraNK

### Test Cases
- [x] Login with valid CUSTOMER credentials → 200, JWT returned, redirect to `/dashboard`
- [x] Login with valid ADMIN credentials → 200, JWT returned, redirect to `/admin`
- [x] Login with wrong password → 401 error banner displayed
- [x] Login with unregistered email → 401 error banner displayed
- [x] Access `/admin` as CUSTOMER → redirected to `/unauthorized`
- [x] Access protected route without token → redirected to `/login`
- [x] Logout clears token and redirects to `/login`
- [x] JWT expiration verified (24 h)
- [x] Backend rejects requests without Bearer token → 403

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-6 - Logout + Session Expiry Handling

**Branch:** feature/SCRUM-6-logout-session-expiry  
**Tested by:** OmiraNK

### Test Cases
- [x] Login → wait for JWT expiry → auto-redirect to `/login?expired=true` with amber banner
- [x] Login → click Logout → redirected to `/login`, token cleared from localStorage
- [x] Delete `uf_token` from localStorage → refresh → redirected to `/login`
- [x] Send request with expired token → backend returns JSON 401 (not HTML) → session-expired redirect
- [x] Access protected route without login → redirected to `/login` (no expired banner)
- [x] Expired banner does not reappear after successful login
- [x] Backend returns JSON 401 for unauthorized access (no HTML leakage)

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-10 - Public Landing Page

**Branch:** feature/SCRUM-10-landing-page  
**Tested by:** OmiraNK

### Test Cases
- [x] `/` loads without a JWT - no 401
- [x] Featured products section renders product cards correctly
- [x] Near-expiry section renders cards with expiry date badge
- [x] Loading skeletons visible on slow network before cards appear
- [x] Empty state message shown when API returns no products
- [x] Section-level error shown when one API call fails; other section unaffected
- [x] `/dashboard` without token redirects to `/login` (auth guard intact)
- [x] Login and Register links in nav and hero navigate to correct pages

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-11 - Product Listing Page

**Branch:** feature/SCRUM-11-product-listing  
**Tested by:** OmiraNK

### Test Cases
- [x] `GET /api/products` (no params) returns first page + pagination fields
- [x] Search by `search` param filters results (case-insensitive)
- [x] `GET /api/products?category=Dairy` returns only products in that category
- [x] `GET /api/products?sortBy=price_asc` returns products ordered by price ascending
- [x] `GET /api/products?sortBy=price_desc` returns products ordered by price descending
- [x] `GET /api/products/categories` returns sorted list of unique category strings
- [x] `/products` loads without a JWT - no 401
- [x] Typing in search bar and submitting shows matching products; grid updates
- [x] Changing sort dropdown re-orders grid correctly
- [x] Empty state message shown when search returns no results
- [x] Pagination controls appear; Prev/Next navigate pages; current page label updates
- [x] Near-expiry badge shown on cards with `expiryDate` within 7 days

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-4 - Role-Based Access Control for APIs and Pages

**Branch:** feature/SCRUM-4-Role-Based-Access-Control-for-APIs-and-Pages  
**Tested by:** OmiraNK

### Test Cases
- [x] `GET /api/admin/stats` with CUSTOMER JWT → 403 Forbidden
- [x] `GET /api/admin/stats` with ADMIN JWT → 200 OK with `totalUsers` and `totalProducts`
- [x] `GET /api/admin/stats` with no token → 401 Unauthorized
- [x] `GET /api/admin/stats` 403 response body is JSON (no HTML leakage)
- [x] `GET /api/supplier/**` with non-SUPPLIER JWT → 403 Forbidden
- [x] `GET /api/delivery/**` with non-DELIVERY JWT → 403 Forbidden
- [x] Navigating to `/admin` as CUSTOMER → redirected to `/unauthorized`
- [x] Navigating to `/supplier` as CUSTOMER → redirected to `/unauthorized`
- [x] Navigating to `/delivery` as CUSTOMER → redirected to `/unauthorized`
- [x] `/unauthorized` page shows 403 message with user's current role
- [x] `/unauthorized` back link: ADMIN → `/admin`, SUPPLIER → `/supplier`, DELIVERY → `/delivery`, CUSTOMER → `/dashboard`
- [x] `/unauthorized` back link for unauthenticated user → `/login`
- [x] All existing public endpoints (`/api/products`, `/api/auth/**`) unaffected - no 401/403

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-24 - Admin Product Management

**Branch:** feature/SCRUM-24-admin-product-management  
**Tested by:** OmiraNK

### Test Cases
- [x] `GET /api/admin/products` (no params) returns first page + pagination fields
- [x] `GET /api/admin/products?page=1&size=5` returns correct page slice
- [x] `GET /api/admin/products/{id}` returns correct product for a valid ID
- [x] `GET /api/admin/products/{id}` returns 404 for a non-existent ID
- [x] `POST /api/admin/products` creates product and returns 201 + body
- [x] `POST /api/admin/products` with missing required fields returns 400 validation error
- [x] `PUT /api/admin/products/{id}` replaces all fields and returns updated product
- [x] `DELETE /api/admin/products/{id}` removes product and returns 204
- [x] All five endpoints return 403 with non-ADMIN JWT
- [x] All five endpoints return 401 with no JWT
- [x] `/admin/products` loads correctly when logged in as ADMIN
- [x] `/admin/products` redirects to `/unauthorized` for non-ADMIN roles
- [x] Product table displays name, category, price, stock, featured flag, and expiry date
- [x] Stock quantity shown in red when value is 0
- [x] "Add Product" button opens modal in create mode (form empty)
- [x] Edit button opens modal pre-filled with selected product's current values
- [x] Submitting edit form updates product and refreshes table with success toast
- [x] Delete button removes product and refreshes table with success toast
- [x] Deleting the last item on page > 1 steps back to previous page
- [x] Admin dashboard "Manage Products" card navigates to `/admin/products`

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-12 - Product Detail Page

**Branch:** feature/SCRUM-12-product-details-page  
**Tested by:** OmiraNK

### Test Cases
- [x] `GET /api/products/{id}` returns 200 with correct product fields for a valid ID
- [x] `GET /api/products/{id}` returns 404 with error message for a non-existent ID
- [x] `GET /api/products/{id}` returns 200 with no Authorization header (public endpoint)
- [x] `GET /api/products/abc` returns 400 Bad Request for a non-numeric ID
- [x] `GET /api/products/{id}` returns correct `expiryDate` for a perishable product
- [x] `GET /api/products/{id}` returns `"expiryDate": null` for a non-perishable product
- [x] `/products/:id` loads correctly when navigating from the product listing page
- [x] `/products/:id` loads correctly when URL is entered directly in the browser
- [x] Product detail page displays name, category, price, description, and image
- [x] Amber near-expiry banner shown when `expiryDate` is within 7 days, with correct days-left label
- [x] Near-expiry banner shows "(today!)" when `expiryDate` equals today
- [x] Near-expiry banner shows "(tomorrow)" when `expiryDate` equals tomorrow
- [x] "Best before: …" line shown when `expiryDate` is more than 7 days away; no amber banner
- [x] No expiry info shown when `expiryDate` is null
- [x] "✓ In Stock" label and "Add to Cart" button visible when `inStock = true`
- [x] "Out of Stock" label shown and "Add to Cart" button absent when `inStock = false`
- [x] Not-found card with 🔍 icon and "Browse All Products" link shown for an invalid product ID
- [x] Red error banner shown when network is unavailable
- [x] Loading skeleton visible during fetch on a throttled connection
- [x] "← Back to Products" link navigates back to `/products`
- [x] Product image renders correctly when a valid image URL is present
- [x] Clicking any product card on `/products` navigates to the correct `/products/:id`

**Verdict:** ✅ Approved and ready to merge into develop.

---

## SCRUM-5 - Customer Profile Management

**Branch:** feature/SCRUM-5-customer-profile-management  
**Tested by:** OmiraNK

### Test Cases
- [x] `GET /api/profile` returns correct profile (name, email, phone, address, role) for authenticated customer
- [x] `GET /api/profile` returns 401 when no JWT is provided
- [x] `GET /api/profile` returns 403 when JWT belongs to a non-CUSTOMER role
- [x] `PUT /api/profile` with valid data updates name, phone, and address; returns updated profile
- [x] `PUT /api/profile` with blank name returns 400 with inline field error
- [x] `PUT /api/profile` with invalid phone format returns 400 with inline field error
- [x] `PUT /api/profile` with null phone/address leaves existing values unchanged
- [x] `PUT /api/profile` returns 401 when no JWT is provided
- [x] `/profile` page loads and displays saved profile data for authenticated customer
- [x] Email field is read-only and cannot be edited
- [x] Saving valid changes shows success toast and updates navbar name immediately
- [x] Inline validation error shown under each field on 400 response
- [x] Generic error toast shown on network/server failure
- [x] Save button shows "Saving…" and is disabled while request is in flight
- [x] Back to Dashboard link navigates correctly
- [x] `/profile` route redirects unauthenticated users to login
- [x] `address` column present in users table in MySQL

**Verdict:** ✅ Approved and ready to merge into develop.

---

## Defect Log

### DEF-001 - LandingPage and ProductListingPage do not reflect session state

| Field         | Detail                                              |
|---------------|-----------------------------------------------------|
| **Defect ID** | DEF-001                                             |
| **Story**     | SCRUM-10 / SCRUM-11 (surfaced post SCRUM-6)         |
| **Severity**  | Medium                                              |
| **Priority**  | High                                                |
| **Status**    | ✅ Resolved                                         |
| **Found by**  | OmiraNK                                             |
| **Fixed in**  | feature/fix-navbar-auth-context                     |

**Title:** LandingPage and ProductListingPage do not reflect session state - always show Log In / Register

**Description:**
After SCRUM-6 was completed, SCRUM-10 and SCRUM-11 were implemented by a separate developer. Both `LandingPage` and `ProductListingPage` contained duplicated nav markup that never consumed `AuthContext`. An authenticated user visiting `/` or `/products` always saw the guest nav (Log In / Register) regardless of their active session. The hero CTAs on the landing page were also unaware of auth state.

**Steps to Reproduce:**
1. Register and log in as a CUSTOMER.
2. Navigate to `/` (Landing Page).
3. Observe the navbar - "Log In" and "Register" links shown instead of "Welcome back, {name}" / "My Dashboard" / "Log Out".
4. Repeat on `/products`.

**Expected:** Navbar reflects authenticated session - welcome message, dashboard link, and logout button.  
**Actual:** Navbar always shows guest links (Log In / Register).

**Root Cause:** Duplicated nav markup in both pages was never wired to `AuthContext`. No shared `Navbar` component existed at the time these pages were built.

**Fix Applied:** Extracted `src/components/Navbar.jsx` reading `isAuthenticated`, `user`, and `logout` from `AuthContext`; updated both pages to use `<Navbar />`; hero CTAs on LandingPage made auth-aware; duplicated markup removed (DRY).

---

### DEF-002 - Admin product form accepts image URL only - no file upload or drag-and-drop support

| Field         | Detail                                              |
|---------------|-----------------------------------------------------|
| **Defect ID** | DEF-002                                             |
| **Story**     | SCRUM-24                                            |
| **Severity**  | Medium                                              |
| **Priority**  | Medium                                              |
| **Status**    | ✅ Resolved                                         |
| **Found by**  | OmiraNK                                             |
| **Fixed in**  | improv/defect-fixes                                 |

**Title:** Admin product form accepts image URL only - no file upload or drag-and-drop support

**Description:**
The `imageUrl` field in `ProductFormModal` is a plain `<input type="text">`. Admins must source and paste an externally hosted URL. There is no way to upload an image file directly or drag and drop one onto the form. Any image must already be publicly accessible online before it can be associated with a product, which is impractical for day-to-day store management and increases the risk of broken image links from third-party hosts.

**Expected:** Drag-and-drop zone and click-to-browse button in the modal; image uploaded to the server on submit; `imageUrl` populated automatically from the upload response.  
**Actual:** Plain URL text field only.

**Fix Applied:** `POST /api/admin/products/upload-image` endpoint added (ADMIN-only, JPG/PNG/WebP up to 5 MB, saves to `uploads/products/`, returns public URL). `ProductFormModal.jsx` replaced plain URL input with drag-and-drop zone with inline preview and validation errors. `GET /uploads/**` whitelisted in `SecurityConfig`. Modal also capped at 90 vh with internal scroll so Cancel/Save buttons are never cropped.

### Verification Test Cases
- [x] Drag a JPG onto the upload zone - preview renders, upload fires, `imageUrl` populated automatically
- [x] Click-to-browse selects a PNG - same result as drag
- [x] File over 5 MB → inline error shown, upload not fired
- [x] Non-image file (e.g. `.pdf`) → inline error shown
- [x] `POST /api/admin/products/upload-image` with valid file → 200 + `{ url }` returned
- [x] `POST /api/admin/products/upload-image` with no JWT → 401
- [x] `POST /api/admin/products/upload-image` with CUSTOMER JWT → 403
- [x] Uploaded image served via `GET /uploads/products/{filename}` with no token → 200 (public)
- [x] Modal scrollable on a short screen - Cancel and Save buttons always visible
- [x] Create product with uploaded image - image renders on product listing and detail pages

**Closed Issue:** #11

---

### DEF-003 - Products display prices in USD and support quantity units only

| Field         | Detail                                              |
|---------------|-----------------------------------------------------|
| **Defect ID** | DEF-003                                             |
| **Story**     | SCRUM-10 / SCRUM-11 / SCRUM-12 / SCRUM-24          |
| **Severity**  | High                                                |
| **Priority**  | High                                                |
| **Status**    | ✅ Resolved                                         |
| **Found by**  | OmiraNK                                             |
| **Fixed in**  | improv/defect-fixes                                 |

**Title:** Products display prices in USD and support quantity units only - add LKR currency and per-weight pricing

**Description:**
All product prices across `ProductListingPage`, `ProductDetailPage`, `LandingPage`, and `AdminProductsPage` hard-code the `$` prefix. UrbanFresh operates in Sri Lanka and should display prices in Sri Lankan Rupees (Rs. / LKR). Additionally, the `Product` entity has no `unit` field - all products are implicitly priced per item with no support for per kg, per g, per L, or per ml, which is essential for a fresh-produce catalogue.

**Affected files:** `model/Product.java`, `ProductRequest`, `ProductResponse`, `AdminProductResponse`, `ProductListingPage.jsx`, `ProductDetailPage.jsx`, `LandingPage.jsx`, `AdminProductsPage.jsx`, `ProductFormModal.jsx`.

**Expected:** Prices rendered as `Rs. X,XXX.00`; `unit` enum (`PER_ITEM | PER_KG | PER_G | PER_L | PER_ML`) on the product model; unit shown alongside price on all surfaces; unit dropdown in admin form.  
**Actual:** `$` prefix everywhere; no unit field or selector.

**Fix Applied:** `PricingUnit` enum (`PER_ITEM | PER_KG | PER_G | PER_L | PER_ML`) added to backend model and exposed through all DTOs. `utils/priceUtils.js` added with `formatPrice(price, unit)` rendering `Rs. X,XXX.00 / kg` etc. All four frontend pages updated to use `formatPrice`. Unit dropdown added to `ProductFormModal`; Unit column added to admin products table.

### Verification Test Cases
- [x] Product with `PER_ITEM` → displays `Rs. X,XXX.00` on listing, detail, landing, and admin pages
- [x] Product with `PER_KG` → displays `Rs. X,XXX.00 / kg`
- [x] Product with `PER_G` → displays `Rs. X,XXX.00 / g`
- [x] Product with `PER_L` → displays `Rs. X,XXX.00 / L`
- [x] Product with `PER_ML` → displays `Rs. X,XXX.00 / mL`
- [x] No `$` prefix visible on any page
- [x] Unit dropdown present in Add Product modal with all five options
- [x] Unit dropdown pre-filled correctly in Edit Product modal
- [x] `POST /api/admin/products` without `unit` field defaults to `PER_ITEM`
- [x] Unit column visible in admin products table
- [x] `GET /api/products` and `GET /api/products/{id}` responses include `unit` field

**Closed Issue:** #12

---

### DEF-004 - Product cards on Landing Page are not clickable

| Field         | Detail                                              |
|---------------|-----------------------------------------------------|
| **Defect ID** | DEF-004                                             |
| **Story**     | SCRUM-10 (surfaced post SCRUM-12)                   |
| **Severity**  | Medium                                              |
| **Priority**  | High                                                |
| **Status**    | ✅ Resolved                                         |
| **Found by**  | OmiraNK                                             |
| **Fixed in**  | improv/defect-fixes                                 |

**Title:** Product cards on Landing Page are not clickable - no navigation to product detail page

**Description:**
Product cards in the Featured Products and Near-Expiry Offers sections on the Landing Page (`/`) are not wrapped in a link. Clicking them produces no navigation. On the Product Listing Page (`/products`) every card correctly navigates to `/products/:id` (implemented in SCRUM-12) - the Landing Page cards should behave identically.

**Steps to Reproduce:**
1. Navigate to `/` as either a guest or authenticated user.
2. Click any product card in the Featured Products or Near-Expiry Offers section.
3. Observe - nothing happens.

**Expected:** Clicking a product card navigates to `/products/:id`.  
**Actual:** Click is a dead end; no navigation occurs.

**Root Cause:** When SCRUM-12 wrapped card elements with `<Link to="/products/${id}">` in `ProductListingPage.jsx`, the equivalent change was not applied to the card markup inside `LandingPage.jsx`.

**Fix Applied:** Outer `<div>` of each product card in `LandingPage.jsx` (Featured Products and Near-Expiry Offers sections) replaced with `<Link to={\`/products/${product.id}\`}>`. Behaviour now matches `ProductListingPage.jsx`.

### Verification Test Cases
- [x] Click Featured Products card as guest → navigates to `/products/:id`
- [x] Click Near-Expiry Offers card as guest → navigates to `/products/:id`
- [x] Click Featured Products card as authenticated CUSTOMER → navigates to `/products/:id`
- [x] Correct product detail page loads for the clicked card
- [x] Product cards on `/products` still navigate correctly (regression check)
- [x] Back to Products link on detail page returns to `/products`

**Closed Issue:** #13

---

### DEF-005 — Product listing search bar re-fetches on every keystroke

| Field         | Detail                                              |
|---------------|-----------------------------------------------------|
| **Defect ID** | DEF-005                                             |
| **Story**     | SCRUM-11                                            |
| **Severity**  | Medium                                              |
| **Priority**  | Medium                                              |
| **Status**    | 🔵 Open - carried to Sprint 2                       |
| **Found by**  | Client feedback                                     |
| **Fixed in**  | -                                                   |

**Title:** Product listing search bar triggers a new API call on every keystroke - page refreshes as user types

**Description:**
On the Product Listing Page (`/products`), typing in the search bar fires a new `GET /api/products` request for every single character entered. This causes the product grid to flicker and reload continuously while the user is still composing their search term, resulting in a poor user experience and unnecessary server load.

**Steps to Reproduce:**
1. Navigate to `/products`.
2. Click the search bar and begin typing a keyword character by character.
3. Observe the product grid - it reloads after each individual character.

**Expected:** The search request fires only when the user submits the form (presses Enter or clicks the search button), or after a short debounce delay (e.g. 400 ms) with no further input.
**Actual:** A new API request is sent and the grid re-renders on every `onChange` keystroke.

**Root Cause:** The `search` state is bound directly to the `fetchProducts` `useCallback` dependency array. Any state change - including mid-word typing - triggers the `useEffect` and immediately fires a new request.

**Suggested Fix:** Add a debounce (e.g. `setTimeout` / `useDebounce` hook, ~400 ms) to the search input, or restrict fetching to explicit form submission only and separate the controlled input value from the committed search term.

**Suggested Labels:** `bug` `frontend` `UX` `performance` `Sprint 2`

---

## Sprint 1 Summary

| Metric                    | Result |
|---------------------------|--------|
| Stories tested            | 9      |
| Stories approved          | 9      |
| Stories failed / blocked  | 0      |
| Defects raised            | 5      |
| Defects resolved          | 4      |
| Defects open              | 1      |
| Test cases executed       | 124    |
| Test cases passed         | 124    |
| Test cases failed         | 0      |

**Overall Sprint 1 QA Verdict: ✅ All stories approved and ready to merge into develop. DEF-002, DEF-003, and DEF-004 resolved in Sprint 2 (branch: `improv/defect-fixes`). DEF-005 remains open and carried forward as a Sprint 2 action item.**
