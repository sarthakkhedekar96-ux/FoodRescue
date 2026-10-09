# FoodRescue — Smart Food Waste Redistribution System

> **Advanced Database Microproject** demonstrating MongoDB Document Design, Embedded Arrays, 2dsphere Geospatial Indexing, Document References, CRUD Operations, and Aggregation Pipelines.

---

## 1. Problem Statement

Hotels, cafeterias, and event venues generate edible surplus food daily. Simultaneously, NGOs and volunteers are eager to collect and redistribute food to local communities in need. 

**FoodRescue** provides a simple, transparent platform where:
1. **Donors** register surplus food with embedded item lists and expiry times.
2. **NGOs** view available donations and discover nearby food using MongoDB **2dsphere geospatial search**.
3. **Pickups** are assigned to volunteers using application-level document references.
4. **Volunteers** update pickup statuses (`ASSIGNED` → `PICKED_UP` → `DELIVERED`).
5. **System Aggregation** computes metrics like total food saved, top donors, category breakdowns, and average ratings.

---

## 2. Technology Stack

- **Backend**: Java 17, Spring Boot 3.2, Spring Data MongoDB, Gradle
- **Database**: MongoDB (Atlas or Local MongoDB `mongodb://localhost:27017/foodrescue`)
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons

---

## 3. Database Architecture (6 Collections)

```
foodrescue (Database)
  ├── users          (Role-based users: DONOR, NGO, VOLUNTEER, ADMIN)
  ├── donations      (MAIN Collection with embedded foodItems[] & statusHistory[])
  ├── ngos           (NGO profiles with GeoJSON Location & accepted types)
  ├── volunteers     (Volunteer profiles with GeoJSON Location & availability)
  ├── pickups        (Workflows referencing donationId, ngoId, volunteerId)
  └── feedback       (Feedback ratings 1-5 used for aggregation $avg)
```

---

## 4. Key MongoDB Concepts Demonstrated

### 1. Embedded Documents & Arrays
- `donations.foodItems[]`: Stores name, quantity, and unit as an array inside the donation document.
- `donations.statusHistory[]`: Audit log of status transitions inside the donation document.

### 2. Document Referencing
- `pickups`: Stores application-level references (`donationId` → `donations._id`, `ngoId` → `ngos._id`, `volunteerId` → `volunteers._id`).

### 3. Indexes & Automatic Index Creation
- **Auto-Index Creation**: Configured via `spring.data.mongodb.auto-index-creation=true` in `application.properties` so all declared indexes are guaranteed to exist even on a brand-new or emptied database.
- **Geospatial 2dsphere Index**: Declared with `@GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)` on `donations.location`, `ngos.location`, and `volunteers.location`. This ensures geospatial endpoints like `/api/donations/nearby` work immediately without throwing `IndexNotFound` errors.
- **Unique Index**: `users.email` (`@Indexed(unique = true)`)
- **Single-Field Indexes**: `donations.status`, `donations.expiryAt`
- **Compound Index**: `donations (status + expiryAt)`

### 4. Geospatial Proximity Query
- `GET /api/donations/nearby?latitude=18.5204&longitude=73.8567&distance=5000`
- Uses GeoJSON `Point` `[longitude, latitude]` and Spring Data MongoDB `$nearSphere` spherical query.

### 5. Aggregation Pipelines
- **Aggregation 1**: Total number of donations count (`mongoTemplate.count`)
- **Aggregation 2**: Total donations by category (`$group` on category, `$count`, `$sort`)
- **Aggregation 3**: Top donors leaderboard (`$group` on donorId, `$sort`, `$limit`)
- **Aggregation 4**: Available vs completed vs expired donations (`$group` on status)
- **Aggregation 5**: Average feedback rating (`$group` on `$avg` rating)
- **Aggregation 6**: Total food quantity donated (`$unwind` foodItems, `$group` `$sum`)

---

## 5. How to Run the Application

### Step 1: Start MongoDB
Ensure local MongoDB is running on default port `27017` or provide your MongoDB Atlas URI in `backend/src/main/resources/application.properties`:
```properties
spring.data.mongodb.uri=mongodb+srv://<user>:<password>@cluster0.rvzejou.mongodb.net/foodrescue?retryWrites=true&w=majority
```

### Step 2: Start Spring Boot Backend
Navigate to the `backend` directory and run:
```bash
# Windows PowerShell
$env:MONGODB_PASSWORD="your_password"; .\gradlew.bat bootRun

# Linux / macOS
MONGODB_PASSWORD="your_password" ./gradlew bootRun
```

#### Sample Data Seeder (`DataInitializer`)
- **Disabled by default**: Controlled by `@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)`. The application starts with an empty/clean database state if you clear collections in MongoDB Compass.
- **To optionally enable seeding**: Set `app.seeder.enabled=true` in `backend/src/main/resources/application.properties` or launch with:
  ```bash
  .\gradlew.bat bootRun --args='--app.seeder.enabled=true'
  ```
- **What the seeder inserts (if enabled on an empty database)**:
  - **7 Users**: `U101`, `U102` (Donors), `U201`, `U202` (NGOs), `U301`, `U302` (Volunteers), `U401` (Admin)
  - **6 Donations**: `D1001` to `D1006` (2 Available, 1 Urgent, 1 Accepted, 1 Completed, 1 Expired)
  - **2 NGOs**: `N201` (Feeding India Pune), `N202` (Roti Bank Pune)
  - **2 Volunteers**: `V301` (Rahul Sharma), `V302` (Priya Verma)
  - **2 Pickups**: `P5001` (Assigned), `P5002` (Delivered)
  - **2 Feedback Entries**: `FB901`, `FB902` (5-star ratings for aggregation calculations)

### Step 3: Start React Frontend
Navigate to the `frontend` directory and run:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. Fully functional UI registration forms are provided for Donors, NGOs, and Volunteers so you can populate new entities directly from the interface.

---

---

## 6. Authentication & Role-Based Access Control (RBAC)

FoodRescue uses **Spring Security** and **JJWT** for stateless, token-based authentication and role authorization:

### Detailed Endpoint Permission Matrix
| Endpoint | Method | Public | DONOR | NGO | VOLUNTEER | ADMIN | Enforcement & Security Rules |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/api/auth/register` | `POST` | ✅ | ✅ | ✅ | ✅ | ❌ | Cannot register as `ADMIN`. Sub-profiles atomic rollback on failure. |
| `/api/auth/login` | `POST` | ✅ | ✅ | ✅ | ✅ | ✅ | Rate limited (email + remote IP). Identical generic message on bad credentials and lockout (429). |
| `/api/auth/me` | `GET` | ❌ | ✅ | ✅ | ✅ | ✅ | Reloads live user from MongoDB on every request. |
| `/health/db` | `GET` | ✅ | ✅ | ✅ | ✅ | ✅ | Public health status only reports `UP`/`DOWN` without leaking database name. |
| `/api/stats` | `GET` | ✅ | ✅ | ✅ | ✅ | ✅ | System-wide aggregated analytics metrics. |
| `/api/users` | `GET` | ❌ | ❌ | ❌ | ❌ | ✅ | Non-admins blocked (403). Non-admins cannot view user lists. |
| `/api/users/{id}` | `GET` | ❌ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ | Caller can only view own user profile (403 on other users). |
| `/api/users/{id}` | `PUT` | ❌ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ | Mass-assignment safe: uses `UserUpdateRequest` (ignores `role`, `passwordHash`, `id`, `email`). |
| `/api/users/{id}` | `DELETE` | ❌ | ❌ | ❌ | ❌ | ✅ | Admin only. Immediate revocation occurs on deleted user's next request (401). |
| `/api/ngos` | `GET` | ❌ | ✅ (min fields)| ✅ (min fields)| ✅ (min fields)| ✅ (all) | Authenticated callers can browse registered NGOs. Non-admins receive sanitized DTO with minimum fields (`organizationName`, `address`, `acceptedFoodTypes`). |
| `/api/ngos/{id}` | `GET` | ❌ | ✅ (min fields)| ✅ (min fields)| ✅ (min fields)| ✅ (all) | View NGO profile details. Non-admins receive sanitized DTO with minimum fields. |
| `/api/ngos/{id}` | `PUT` | ❌ | ❌ | ✅ (own) | ❌ | ✅ | Mass-assignment safe: uses `NgoUpdateRequest` (ignores `id`, `userId`). Only owner or ADMIN. |
| `/api/ngos/{id}` | `DELETE` | ❌ | ❌ | ❌ | ❌ | ✅ | Admin only (403 for non-admins). |
| `/api/volunteers` | `GET` | ❌ | ❌ | ✅ (assigned)| ❌ | ✅ | Restricted to ADMIN and NGOs with assigned pickups (403 for others). Non-admins receive sanitized DTO (no phone, email, userId, GPS coordinates). |
| `/api/volunteers/{id}` | `GET` | ❌ | ❌ | ✅ (assigned)| ✅ (own) | ✅ | Sanitized DTO for assigned NGO (no phone/email/GPS); full profile only for owner or ADMIN (403 for others). |
| `/api/volunteers/{id}` | `PUT` | ❌ | ❌ | ❌ | ✅ (own) | ✅ | Mass-assignment safe: uses `VolunteerUpdateRequest` (ignores `id`, `userId`, `completedPickups`). |
| `/api/volunteers/{id}` | `DELETE` | ❌ | ❌ | ❌ | ❌ | ✅ | Admin only (403 for non-admins). |
| `/api/donations` | `POST` | ❌ | ✅ | ❌ | ❌ | ✅ | Non-admin `donorId` strictly derived from token; NGOs/Volunteers blocked (403). |
| `/api/donations` | `GET` | ❌ | ✅ (own) | ✅ (avail+own)| ✅ (avail+own)| ✅ (all) | Donors scoped to own; NGOs/Volunteers view AVAILABLE plus own claimed pickups. Donor phone/email/exact address masked until claimed. |
| `/api/donations/{id}` | `GET` | ❌ | ✅ (own) | ✅ (avail/own)| ✅ (avail/own)| ✅ | Donors blocked from reading other donors' donations (403). NGOs/Volunteers restricted to AVAILABLE or own claimed pickups. Donor phone/email/exact address masked until claimed. |
| `/api/donations/{id}` | `PUT` | ❌ | ✅ (own) | ❌ | ❌ | ✅ | Modifiable only while `status == AVAILABLE` and no pickup exists (403 otherwise). |
| `/api/donations/{id}` | `DELETE` | ❌ | ✅ (own) | ❌ | ❌ | ✅ | Deletable by donor only while `status == AVAILABLE` and no pickup exists (403 otherwise). Admin can delete any. |
| `/api/donations/nearby` | `GET` | ❌ | ❌ | ✅ (avail+own)| ✅ (avail+own)| ✅ | 2dsphere proximity search restricted to NGOs, Volunteers, and Admins. Donor address/phone/email hidden until claimed. |
| `/api/donations/available` | `GET` | ❌ | ✅ (own) | ✅ (avail+own)| ✅ (avail+own)| ✅ | Donors scoped to own; NGOs/Volunteers view AVAILABLE plus own claimed pickups. Contact/address hidden until claimed. |
| `/api/donations/expiring-soon` | `GET` | ❌ | ✅ (own) | ✅ (avail+own)| ✅ (avail+own)| ✅ | Donors scoped to own; NGOs/Volunteers view AVAILABLE plus own claimed pickups. Contact/address hidden until claimed. |
| `/api/donations/category/{cat}`| `GET` | ❌ | ✅ (own) | ✅ (avail+own)| ✅ (avail+own)| ✅ | Donors scoped to own; NGOs/Volunteers view AVAILABLE plus own claimed pickups. Contact/address hidden until claimed. |
| `/api/donations/donor/{id}` | `GET` | ❌ | ✅ (own) | ❌ | ❌ | ✅ | Donors blocked from querying other donors' records (403). |
| `/api/pickups` | `POST` | ❌ | ❌ | ✅ | ❌ | ✅ | NGOs claim donations. Donors and Volunteers blocked from creating pickups (403). |
| `/api/pickups` | `GET` | ❌ | ✅ (own don)| ✅ (own) | ✅ (assigned)| ✅ (all) | Scoped strictly to caller's role and identity. |
| `/api/pickups/{id}` | `GET` | ❌ | ✅ (own don)| ✅ (own) | ✅ (assigned)| ✅ | Cross-ownership isolation: 403 on other NGOs'/volunteers' pickups. |
| `/api/pickups/{id}/status` | `PUT` | ❌ | ❌ | ✅ (own) | ✅ (assigned)| ✅ | Status updates (`ASSIGNED` → `PICKED_UP` → `DELIVERED`). |
| `/api/pickups/ngo/{id}` | `GET` | ❌ | ❌ | ✅ (own) | ❌ | ✅ | Scoped strictly to matching NGO or ADMIN (403 for others). |
| `/api/pickups/volunteer/{id}` | `GET` | ❌ | ❌ | ❌ | ✅ (own) | ✅ | Scoped strictly to matching Volunteer or ADMIN (403 for others). |
| `/api/feedback` | `POST` | ❌ | ✅ (own don)| ✅ (involved)| ✅ (involved)| ✅ | Create feedback only for donations the caller donated or handled (403 otherwise). |
| `/api/feedback` | `GET` | ❌ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (all) | Feedback scoped to user's authored feedback and own donations. |
| `/api/feedback/{id}` | `PUT`/`DELETE`| ❌ | ✅ (author)| ✅ (author)| ✅ (author)| ✅ | Edit/delete only by author or ADMIN (403 otherwise). |

### Security Architecture & Implementation Highlights
1. **Live User Reloading in JWT Filter**: Rather than trusting stale JWT claims, `JwtAuthenticationFilter` reloads the user from MongoDB on every request. This ensures account deletions take effect immediately (HTTP 401) and role modifications or account suspensions apply instantly without waiting for token expiration.
2. **Mass Assignment Protections**: Endpoints `PUT /api/users/{id}`, `PUT /api/ngos/{id}`, and `PUT /api/volunteers/{id}` bind only to dedicated DTOs (`UserUpdateRequest`, `NgoUpdateRequest`, `VolunteerUpdateRequest`) with `@JsonIgnoreProperties(ignoreUnknown = true)`. Fields such as `role`, `passwordHash`, `id`, `userId`, `email`, and `completedPickups` cannot be modified via update requests.
3. **Anti-Enumeration Rate Limiting**: The sliding-window rate limiter keys on `email + remote IP` and deliberately returns the exact same generic error message (`Invalid email or password`) upon lockout (HTTP 429) as on invalid credentials (HTTP 401). Untrusted `X-Forwarded-For` headers are discarded unless `app.security.trusted-proxy=true`.
4. **Data Sanitization & Privacy**: `/health/db` reports only `UP`/`DOWN` without disclosing the database name. Volunteer phone numbers are masked for other non-admin users.

### Environment Variables
Configure the following environment variables in `.env` or your shell (use placeholders only in shared templates):
- `MONGODB_PASSWORD`: Password for MongoDB Atlas connection (`your_mongodb_atlas_password_here`).
- `JWT_SECRET`: Mandatory HMAC-SHA256 signing secret (`your_minimum_32_character_jwt_secret_key_here`). **Must be at least 32 characters (256 bits)**. The backend fails fast at startup if missing or shorter than 32 bytes.
- `ADMIN_EMAIL`: Email for the initial admin account (`your_admin_email_here`). Bootstrapped on startup if no ADMIN user exists.
- `ADMIN_PASSWORD`: Password for the initial admin account (`your_secure_admin_password_here`).
- `SEEDER_PASSWORD` (Optional): BCrypt password assigned to seeded demo users (`your_seeder_password_here`) when `app.seeder.enabled=true`.

### Running Automated Auth & RBAC Tests
With the Spring Boot backend running on `http://localhost:8080`, run the automated security verification suite:
```bash
# Windows PowerShell
cd backend
.\test-auth.ps1
```
The script validates 38 security and RBAC scenarios:
- Public health privacy (`/health/db` omits database name).
- Admin bootstrap authentication and omission of `passwordHash`.
- Prevention of registration with role `ADMIN` (HTTP 400).
- Legitimate entity registrations and `GET /api/auth/me` identity resolution.
- Brute-force anti-enumeration (identical error messages).
- Rate limiter lockout (HTTP 429 with identical generic error).
- Rejection of missing, tampered, and expired tokens (HTTP 401).
- Mass-assignment defense against role escalation (`{"role":"ADMIN"}`) and `passwordHash` overwrites.
- Prohibited cross-role operations: NGO creating a donation (403), Donor creating a pickup (403).
- Donor editing a non-AVAILABLE donation (403).
- Volunteer 2 vs Volunteer 1 pickup isolation (403).
- Cross-donor and cross-NGO resource isolation (403).
- Immediate access revocation upon user deletion (HTTP 401).
- Complete cleanup and confirmation that collection counts return exactly to baseline.

---

## 7. Viva Evaluation Page: "Database Insights"

Click on the **Database Insights (Viva Demo)** tab in the header navigation to present:
1. Raw MongoDB Collections & Document Samples
2. Embedded Documents vs References Comparison
3. Active Index Schema
4. Predefined Aggregation Pipelines & Executed Results

---

## 8. Viva Q&A Guide

See [`docs/database-design.md`](file:///c:/Users/Dell/OneDrive/Desktop/FoodRescue/docs/database-design.md) for complete answers to all 19 viva evaluation questions!

