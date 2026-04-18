# UrbanFresh - Sprint 4 QA Report

| Field | Detail |
|---|---|
| **Project** | UrbanFresh |
| **Sprint** | Sprint 4 |
| **Report Date** | 17 April 2026 |
| **QA Engineer** | IT24103439 |
| **Stories Tested** | 9 |
| **Total Defects Found** | 0 (No blocking defects) |
| **Overall Verdict** | ✅ Conditionally Approved for merge/release |

---

## Evidence Summary

- Postman regression execution evidence: **129 tests**, **129 passed**, **0 failed**, **0 errors**.
- Story-level backend unit/security tests reported passing in PR evidence:
  - SCRUM-26: 12 unit tests (expiry buckets)
  - SCRUM-39: 24 unit tests (discount + loyalty interactions)
  - SCRUM-40: 5 service-layer unit tests (loyalty redemption)
  - SCRUM-41: 4 unit tests (recommendations)
  - SCRUM-47: targeted backend tests (18 tests, 0 failures)
- Frontend production validation evidence:
  - SCRUM-48: `npm run build` successful
- Azure deployment and production hardening evidence:
  - SCRUM-51: frontend live at `https://www.urbanfresh.live`, backend live at `https://api.urbanfresh.live`, apex redirect (`urbanfresh.live` -> `https://www.urbanfresh.live`) verified
  - SCRUM-51: SSL validity confirmed for all custom domains, SPA route refresh behavior validated, and production pages load without console errors
  - SCRUM-51: CI/CD workflows validated for backend and frontend deployment paths (push on `main` and `workflow_dispatch`)

---

## Stories Tested

| Story ID | Title | Verdict |
|---|---|---|
| SCRUM-26 | Expiry Dashboard + Near-Expiry Detection | ✅ Approved |
| SCRUM-39 | Admin Applies Discounts to Near-Expiry Products | ✅ Approved |
| SCRUM-40 | Apply Loyalty Points in Cart/Checkout  | ✅ Approved (with noted test-scope limitation) |
| SCRUM-41 | Habit-Based Recommendations  | ✅ Approved |
| SCRUM-43 | Waste Report Dashboard | ✅ Approved |
| SCRUM-45 | In-App Notifications for Order Status Updates | ✅ Approved |
| SCRUM-47 | Security Audit: Endpoint Access + Validation Pass | ✅ Approved |
| SCRUM-48 | UI Polish and Bug Bash  | ✅ Approved |
| SCRUM-51 | Deploy UrbanFresh to Azure | ✅ Approved |

---

## Detailed Test Cases

## SCRUM-26 - Expiry Dashboard + Near-Expiry Detection

### Test Cases
- [x] `GET /api/admin/expiry/buckets` with ADMIN token returns grouped non-overlapping buckets (`within1Day`, `within7Days`, `within30Days`) and `totalNearExpiryCount`.
- [x] Bucket boundary validation for 0, 1, 2, 7, 8, 30 days maps to correct urgency bucket.
- [x] Mixed product set partitions correctly across all three buckets in a single response.
- [x] Empty data set returns all empty arrays and `totalNearExpiryCount = 0`.
- [x] `daysUntilExpiry` value is accurate across month boundaries (ChronoUnit-based fix validated).
- [x] Admin dashboard near-expiry alert card is wired to real count (within 7 days).
- [x] Admin dashboard low-stock alert card is wired to real threshold logic.
- [x] Expiry page shows three urgency sections with correct color coding and labels.
- [x] Expiry tables show name/category/brand/price/stock/expiry/days-left columns.
- [x] Loading skeleton renders before API completion.
- [x] Error state renders with retry action on failure.
- [x] ADMIN route access allowed; non-admins blocked by protected route and backend RBAC.

**Verdict:** ✅ Approved.

---

## SCRUM-39 - Admin Applies Discounts to Near-Expiry Products

### Test Cases
- [x] Admin applies manual discount (0-100) to near-expiry product; value persisted.
- [x] Admin one-click suggested discount action applies computed suggestion successfully.
- [x] Invalid discount (<0 or >100) rejected by validation.
- [x] `GET /api/products` and `GET /api/products/{id}` include `discountPercentage`.
- [x] Product listing shows original price strike-through + discounted price + `X% OFF` badge.
- [x] Product detail shows matching discounted price presentation and near-expiry cues.
- [x] Cart line item unit pricing uses discounted unit price formula.
- [x] Order line totals and overall subtotal use discounted price computation.
- [x] Order item snapshots retain discount percentage used at purchase time.
- [x] Loyalty calculations/redemption cap use discounted subtotal, not original subtotal.
- [x] Discount endpoint remains admin-only (non-admin access denied).
- [x] Unit test suites for discount calculation/admin management/cart integration pass as reported.

**Verdict:** ✅ Approved.

---

## SCRUM-40 - Apply Loyalty Points in Cart/Checkout

### Test Cases
- [x] Customer sees available loyalty points in cart.
- [x] Customer can apply valid points up to balance and order-total cap.
- [x] Cart displays applied loyalty discount row and reduced payable total.
- [x] `pointsToRedeem` propagates through checkout flow and is sent in order request.
- [x] Backend computes redemption server-side (`1 point = LKR 5`) and never trusts client discount amount.
- [x] Pessimistic locking prevents concurrent double-spend behavior.
- [x] Discount capped at order total; no negative payable totals.
- [x] `discountAmount` and `pointsRedeemed` persisted on order and returned in API response.
- [x] Loyalty ledger records redemption transaction.
- [x] Checkout address step shows projected discount.
- [x] Confirmation/success page shows final discount breakdown.
- [x] Order history details show discount and redeemed points when applicable.
- [x] Redeeming more than available points returns `400 Bad Request`.
- [x] Service-layer redemption tests pass (5 tests).
- [ ] Integration test suite for redemption not executed in this story scope.

**Verdict:** ✅ Approved with low residual risk (integration coverage deferred).

---

## SCRUM-41 - Habit-Based Recommendations

### Test Cases
- [x] `GET /api/customer/recommendations` returns up to 5 items for authenticated customer.
- [x] Recommendations are ordered by highest total quantity purchased first.
- [x] Hidden products excluded from recommendation result.
- [x] Out-of-stock products excluded from recommendation result.
- [x] Orders with `PENDING`, `CANCELLED`, `RETURNED` statuses excluded.
- [x] Empty purchase history returns empty list.
- [x] Dashboard renders Buy Again section only when list non-empty.
- [x] API failure for recommendations is silent; dashboard core sections still render.
- [x] Add to Cart on recommendation card adds quantity 1 and confirms with toast.
- [x] Backend build and 4 service tests pass.

**Verdict:** ✅ Approved.

---

## SCRUM-43 - Waste Report Dashboard

### Test Cases
- [x] `GET /api/admin/waste-report` with ADMIN token returns aggregate report payload.
- [x] Report includes total waste value, total wasted units, and overall waste percentage.
- [x] Monthly summaries grouped and sorted chronologically.
- [x] Monthly summary percentage represents share of overall waste value.
- [x] Top wasted products list sorted by waste value descending and capped to top 10.
- [x] Query scope includes only APPROVED expired products with remaining stock.
- [x] Overall waste percentage uses approved inventory value denominator with zero-division guard.
- [x] Dashboard KPI cards show value, units, and percentage accurately.
- [x] Monthly chart renders with valid values.
- [x] Waste report quick-action navigation from admin dashboard works.
- [x] Non-admin route/API access denied via frontend and backend RBAC.

**Verdict:** ✅ Approved.

---

## SCRUM-45 - In-App Notifications for Order Status Updates

### Test Cases
- [x] Notification entity persists with customer ownership, message, read flag, and timestamp.
- [x] Status update by admin creates customer notification.
- [x] Status update by delivery personnel creates customer notification.
- [x] Assignment transition `READY -> OUT_FOR_DELIVERY` creates notification.
- [x] Payment confirmation flow creates CONFIRMED notification.
- [x] `GET /api/notifications` returns only authenticated customer's notifications in newest-first order.
- [x] `GET /api/notifications/unread-count` returns accurate unread total.
- [x] `PATCH /api/notifications/{id}/read` marks owned notification as read; already-read is safe no-op.
- [x] `POST /api/notifications/read-all` marks all owned notifications read using bulk update.
- [x] Notification ownership enforcement blocks cross-customer access.
- [x] Non-customer access to `/api/notifications/**` denied (URL layer + method-level checks).
- [x] Navbar bell shows unread badge and dropdown list.
- [x] Dashboard notification section shows read/unread styling and timestamps.
- [x] Mark single read and mark all read update UI without full reload (optimistic flow).

**Verdict:** ✅ Approved.

---

## SCRUM-47 - Security Audit: Endpoint Access + Validation Pass

### Test Cases
- [x] Validation errors return unified `ApiErrorResponse` with `status`, `message`, `timestamp`, and field `errors`.
- [x] Malformed JSON returns unified 400 error contract.
- [x] Type mismatch in path/query returns unified 400 error contract.
- [x] Missing required header/parameter returns unified 400 error contract.
- [x] Unsupported media type returns unified 415 contract.
- [x] Security 401 (`JwtAuthEntryPoint`) uses same API error shape.
- [x] Security 403 (`RoleAccessDeniedHandler`) uses same API error shape.
- [x] Public endpoint security/data-exposure tests included and passing in targeted run.
- [x] Product schema/data alignment fix (`approval_status`) supports repository queries.
- [x] Startup schema drift risk reduced with Hibernate `ddl-auto=none`.
- [x] Frontend lazy route loading via `React.lazy` + `Suspense` works.
- [x] Vite manual chunk splitting produces stable vendor chunks and avoids empty/circular outputs.

**Verdict:** ✅ Approved.

---

## SCRUM-48 - UI Polish and Bug Bash

### Test Cases
- [x] Delivery profile summary endpoint available and returns aggregate counters for delivery user.
- [x] Supplier role can access/update own profile endpoint under RBAC.
- [x] Supplier purchase-order item metadata includes batch/date data required by UI.
- [x] Redesigned UI patterns applied across auth/customer/admin/delivery/supplier key flows.
- [x] Route protection and unauthorized redirects are role-aware and consistent.
- [x] Shared API error normalization utility provides consistent user-facing error messages.
- [x] Refined empty states display actionable guidance in order/account views.
- [x] Backend security contract test updated for supplier profile access behavior.
- [x] Frontend production build passes (`npm run build`).

**Verdict:** ✅ Approved.

---

## SCRUM-51 - Deploy UrbanFresh to Azure

### Test Cases
- [x] Frontend production site `https://www.urbanfresh.live` loads correctly.
- [x] Backend API endpoint `https://api.urbanfresh.live` responds correctly.
- [x] Apex domain `urbanfresh.live` redirects to `https://www.urbanfresh.live` with `301`.
- [x] SSL certificates are valid across `urbanfresh.live`, `www.urbanfresh.live`, and `api.urbanfresh.live`.
- [x] Production pages load without browser console errors.
- [x] Azure App Service (`urbanfresh-backend`) contains all required app settings (DB, JWT, Stripe, CORS, upload directory, base URL).
- [x] `APP_UPLOAD_DIR=/home/uploads` works in production; product images upload and serve successfully.
- [x] `CORS_ALLOWED_ORIGIN=https://www.urbanfresh.live` allows successful cross-origin API calls.
- [x] `application-local.properties` is excluded from git and absent in remote repository.
- [x] `.env.local` is excluded from git and absent in remote repository.
- [x] Direct navigation to `/products` resolves correctly in production (no SPA routing `404`).
- [x] Browser refresh on `/cart`, `/orders`, and `/admin/dashboard` resolves correctly.
- [x] Non-existent routes correctly show error/`404` page.
- [x] iOS Safari input tapping does not trigger viewport zoom.
- [x] Auth pages render on mobile without horizontal scroll or blob overflow.
- [x] Product form modal behavior is responsive: bottom-sheet with internal scroll on mobile and standard modal on desktop.
- [x] Admin product image uploads persist after refresh and are served from `/home/uploads`.
- [x] Missing/broken product image URLs render emoji fallback instead of broken image icon.
- [x] GitHub Actions: backend changes (`backend/**` on `main`) trigger `Deploy Backend to Azure` workflow successfully.
- [x] GitHub Actions: frontend changes (`frontend/**` on `main`) trigger `Deploy Frontend to Azure Static Web Apps` workflow successfully.
- [x] Manual `workflow_dispatch` trigger works for both deployment workflows.
- [x] Loyalty refactor verification passes: `LoyaltyRedemptionServiceTest` (5 tests), over-redemption rejection, and redeemed-points ledger persistence.
- [x] Postman smoke coverage passes for login JWT issuance, product retrieval with production `imageUrl`, order creation with loyalty redemption, protected endpoint `401` behavior, and production CORS success.
- [x] Build verification passes: backend `mvn clean package -DskipTests` and frontend `npm run build` with production API base URL.

**Verdict:** ✅ Approved and ready to merge into `develop`.

---

## Defect and Risk Summary

### Defects
- Blocking defects: **0**
- Major defects: **0**
- Minor defects: **0**

### Residual Risks / Follow-ups
- SCRUM-40: Integration tests for loyalty redemption flow were intentionally out of scope; recommend adding CI/staging integration coverage for concurrent redemption scenarios.
- SCRUM-48: Recommend full backend regression and cross-role staging smoke run after broad frontend redesign merge.

---

## Final Sprint 4 QA Verdict

Sprint 4 scope is **QA approved** with no blocking defects and strong test evidence across API contracts, RBAC, pricing/loyalty correctness, expiry/waste analytics, notifications, recommendations, frontend redesign stability, and production Azure deployment readiness.

**Release Recommendation:** ✅ Proceed to merge/release with the two follow-up test actions tracked as non-blocking hardening tasks.
