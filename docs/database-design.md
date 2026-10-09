# FoodRescue — MongoDB Database Design & Viva Handbook

This document provides a technical breakdown of the database architecture, schema design choices, index strategies, aggregation pipelines, and standard answers for the **College Viva Examination**.

---

## 1. Schema Design Overview

### Collection 1: `users`
- **Purpose**: Stores platform users (Donors, NGOs, Volunteers, Admins).
- **Index**: Unique index on `email`.

### Collection 2: `donations` (MAIN COLLECTION)
- **Embedded Document**: `foodItems[]` (Name, quantity, unit)
- **Embedded Array**: `statusHistory[]` (Timestamped status changes)
- **GeoJSON Location**: `{ type: "Point", coordinates: [longitude, latitude] }`
- **Indexes**: `status`, `expiryAt`, compound `(status + expiryAt)`, `2dsphere` on `location`.

### Collection 3: `ngos`
- **GeoJSON Location**: `{ type: "Point", coordinates: [longitude, latitude] }`
- **Indexes**: `2dsphere` on `location`.

### Collection 4: `volunteers`
- **GeoJSON Location**: `{ type: "Point", coordinates: [longitude, latitude] }`
- **Indexes**: `2dsphere` on `location`.

### Collection 5: `pickups`
- **Application-Level References**: `donationId`, `ngoId`, `volunteerId`.
- **Purpose**: Tracks delivery workflow (`ASSIGNED` → `PICKED_UP` → `DELIVERED`).

### Collection 6: `feedback`
- **Application-Level References**: `donationId`, `fromUserId`.
- **Fields**: `rating` (1-5), `comment`. Used for MongoDB Aggregation `$avg`.

---

## 2. Viva Evaluation Questions & Standard Answers

### Q1: Why MongoDB?
**Answer**: MongoDB is a NoSQL document database that stores data in flexible, JSON-like BSON documents. It allows schema flexibility, native support for embedded arrays, built-in 2dsphere geospatial indexing for location queries, and high read performance without SQL joins.

### Q2: Why not MySQL?
**Answer**: In relational databases like MySQL, storing variable food items inside a donation requires a separate `food_items` table with foreign key joins. MongoDB allows embedding the `foodItems[]` array directly inside the `donations` document, fetching all donation details in a single atomic read operation. MongoDB also provides native GeoJSON `2dsphere` spherical distance queries out-of-the-box.

### Q3: Why did you embed FoodItem?
**Answer**: `FoodItem` has a strong 1-to-few relationship with `Donation`. Food items belong exclusively to one donation and are always retrieved together when displaying food details. Embedding eliminates multi-table SQL joins and ensures atomic document updates.

### Q4: Why did you use references for Pickup?
**Answer**: Unlike food items, NGOs, Volunteers, and Donations are independent entities with their own lifecycles and frequent independent updates. Using application-level references (`donationId`, `ngoId`, `volunteerId`) in the `pickups` collection avoids data duplication and maintains a clean document design.

### Q5: What is a document?
**Answer**: A document in MongoDB is a record consisting of key-value pairs (similar to JSON objects). Documents support primitive types, nested objects (embedded documents), and arrays.

### Q6: What is a collection?
**Answer**: A collection is a grouping of MongoDB documents, analogous to a table in relational databases. Unlike SQL tables, collections do not enforce a fixed rigid schema across all documents.

### Q7: What is a 2dsphere index?
**Answer**: A `2dsphere` index supports queries that calculate geometries on an earth-like sphere. It indexes GeoJSON `Point` fields specified in `[longitude, latitude]` format, enabling `$nearSphere` geospatial distance searches.

### Q8: Why do we need an index?
**Answer**: Without an index, MongoDB must perform a collection scan (inspecting every single document). An index builds a data structure (B-tree or spatial R-tree) that allows MongoDB to rapidly locate documents matching a query condition, reducing query execution time from O(N) to O(log N).

### Q9: What is a compound index?
**Answer**: A compound index is an index on multiple fields (e.g., `status + expiryAt`). It speeds up queries that filter on both status and expiry time simultaneously (e.g., finding available donations expiring within 3 hours).

### Q10: What is aggregation?
**Answer**: MongoDB Aggregation is a framework for data processing and analysis. Data passes through a multi-stage pipeline where each stage transforms the document stream (filtering, grouping, unwinding arrays, calculating averages or sums).

### Q11: What is `$match`?
**Answer**: `$match` is an aggregation stage that filters document stream to pass only documents matching specified criteria, similar to SQL `WHERE`.

### Q12: What is `$group`?
**Answer**: `$group` is an aggregation stage that groups input documents by a specified identifier (`_id`) and computes accumulator expressions (`$sum`, `$avg`, `$count`), similar to SQL `GROUP BY`.

### Q13: What is `$sort`?
**Answer**: `$sort` orders the document stream by specified fields in ascending (`1`) or descending (`-1`) order.

### Q14: What is `$sum`?
**Answer**: `$sum` is an accumulator operator used inside `$group` or `$project` to calculate the total sum of numerical values or count documents (`$sum: 1`).

### Q15: What is the difference between embedding and referencing?
**Answer**:
- **Embedding**: Nested data inside the parent document. Best for 1-to-1 or 1-to-few bounded data read together frequently.
- **Referencing**: Storing object IDs pointing to another collection. Best for 1-to-many or many-to-many relationships where entities exist independently.

### Q16: How does nearby donation search work?
**Answer**:
1. NGO inputs latitude, longitude, and maximum distance.
2. Spring Data MongoDB creates a GeoJSON `Point` and distance metric.
3. MongoDB uses the `2dsphere` index on `donations.location` to execute a `$nearSphere` search.
4. Returns all available donations within the specified radius sorted by physical distance.

### Q17: What happens when a donation is completed?
**Answer**:
1. Volunteer marks pickup as `DELIVERED`.
2. `PickupService` updates `pickups.status = "DELIVERED"`.
3. `DonationService` updates `donations.status = "COMPLETED"` and appends `{ status: "COMPLETED", time: Instant.now() }` to `statusHistory[]`.
4. Volunteer `completedPickups` count is incremented and status is reset to `AVAILABLE`.

### Q18: Why is MongoDB suitable for this project?
**Answer**:
1. Naturally models real-world food items as embedded arrays.
2. Native GeoJSON `2dsphere` geospatial indexing for proximity matching.
3. Powerful Aggregation Pipelines for administrative statistics.
4. Flexible schema adapts easily as features evolve.

### Q19: How is priority automatically updated based on expiry time?
**Answer**:
The system calculates remaining time until `expiryAt`:
- **> 3 hours**: `NORMAL`
- **1 - 3 hours**: `HIGH`
- **30 - 60 minutes**: `URGENT`
- **< 30 minutes**: `CRITICAL`
- **Expired**: `EXPIRED`
