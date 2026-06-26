# Project Context: Tracker-Who-Owns-Whom

## 1. Project Overview
**Project Name:** Tracker-Who-Owns-Whom[cite: 2]  
**Description:** A cross-platform mobile application designed to track personal debts and shared expenses among friends[cite: 2]. The core philosophy of the app is mutual transparency: a debt entry created by one user must be explicitly confirmed by the counterparty before it is officially recorded and reflected in their respective balances[cite: 2]. This eliminates disputes and keeps both parties aligned[cite: 2].

---

## 2. Technology Stack & UI Architecture
### Frontend (shadcn focus)
- **Framework:** React Native (Cross-platform for iOS and Android)[cite: 2]
- **UI Library & Styling:** Strict adherence to **shadcn/ui** design patterns. Since this is React Native, use `react-native-reusables` (or similar shadcn ports for mobile) along with **Tailwind CSS** (via NativeWind).
- **Icons:** Lucide Icons (standard for shadcn).
- **State Management:** Context API or Redux Toolkit (to handle local states, active sessions, and active debts)[cite: 2]
- **Networking:** Axios or Fetch API for REST communication with the backend[cite: 2]
- **Authentication:** Google Sign-In SDK for React Native[cite: 2]

### Backend
- **Framework:** Spring Boot (Java)[cite: 2]
- **Security:** Spring Security configured with OAuth2 Resource Server to validate JWTs / Google ID tokens[cite: 2]
- **Database:** PostgreSQL (Recommended for relational data, transactional integrity, and strong consistency)[cite: 2]
- **File Storage:** AWS S3, Google Cloud Storage, or a local file storage abstraction (for storing optional receipt/invoice photos)[cite: 2]

---

## 3. Core Features & MVP Scope

### 3.1 Account Management & Authentication
- **Social Authentication:** Users can register and sign in exclusively via Google Sign-In[cite: 2].
- **User Profiles:** Upon first login, a user profile is automatically provisioned using their Google name, email, and profile picture[cite: 2].
- **Friend / Counterparty Identification:** Users can look up other registered users via their email addresses to establish debt connections[cite: 2].

### 3.2 Debt Management
- **Create Debt Record:** A user can log a new debt, specifying: Type ("I am owed" or "I owe"), Counterparty, Amount, Currency, Description/Notes, and Attachment[cite: 2].
- **Multi-Currency System:** Each debt maintains its native currency[cite: 2]. The system does not enforce auto-conversion in the MVP but displays summaries grouped by currency[cite: 2].

### 3.3 Two-Way Confirmation System (Sync & Trust)
- **State Machine for Debts:**
  - `PENDING_APPROVAL`: Created by User A, awaiting confirmation from User B[cite: 2].
  - `ACTIVE`: Confirmed by User B. It now fully updates balances for both users[cite: 2].
  - `REJECTED`: Declined by User B if details are incorrect[cite: 2].
  - `SETTLED`: Marked as fully repaid (requires confirmation if initiated by one party)[cite: 2].
- **Visibility:** When User A creates a debt involving User B, it immediately appears in User B's dashboard under a "Pending Approvals" section[cite: 2]. Until confirmed, the debt is not calculated into the cumulative net balance of either user[cite: 2].

### 3.4 Media Attachments
- **Optional Photos:** Users can take a photo or upload an image from their gallery when creating a debt[cite: 2]. Images are uploaded to the backend, which stores them securely and returns a URL to the frontend[cite: 2].

### 3.5 Exclusions (Out of Scope for MVP)
- No push notification system[cite: 2].
- No automatic expense splitting algorithms for large groups[cite: 2].
- No integrated payment gateways[cite: 2].

---

## 4. Proposed Database Schema (High-Level)
- **Users Table:** `id`, `email`, `display_name`, `profile_picture_url`, `created_at`[cite: 2]
- **Debts Table:** `id`, `creator_id`, `debtor_id`, `creditor_id`, `amount`, `currency`, `description`, `attachment_url`, `status`, `created_at`, `updated_at`[cite: 2]

---

## 5. Core REST API Endpoints (Spring Boot)
- `POST /api/v1/auth/google` — Accepts Google ID Token, validates it, provisions user if new, and establishes an application session/JWT[cite: 2].
- `POST /api/v1/debts` — Create a new debt entry (Status: `PENDING_APPROVAL`). Supports multipart form-data for optional photo attachments[cite: 2].
- `GET /api/v1/debts/dashboard` — Returns summary of active balances grouped by currency, along with recent activities[cite: 2].
- `GET /api/v1/debts/pending` — Lists all debts awaiting the current user's confirmation[cite: 2].
- `PUT /api/v1/debts/{id}/status` — Updates debt status (Action: `APPROVE`, `REJECT`, `SETTLE`)[cite: 2].

---

## 6. Guidelines for AI-Assisted Development (ANTIGRAVITY CLI)
- **Strict shadcn/ui Usage:** Always prioritize the generation and usage of `shadcn` mobile-equivalent components (e.g., `<Button>`, `<Card>`, `<Input>`, `<Dialog>`) instead of building UI elements from scratch. 
- **Styling Rules:** Use **Tailwind CSS** strictly. Do not write custom inline styles (`style={{...}}`) or standard React Native StyleSheet objects unless absolutely necessary for complex animations. Use the `cn()` utility for merging classes.
- **Backend Coding Rules:** Follow the classic Spring Boot layered architecture (`Controller` -> `Service` -> `Repository`)[cite: 2]. Use MapStruct for DTO-to-Entity mapping, validation annotations (`@NotNull`, `@Size`), and handle errors gracefully using a `@ControllerAdvice` global exception handler[cite: 2].
- **Security Check:** Ensure all backend queries verify that the authenticated user is either the `debtor` or `creditor` for any given debt resource to prevent unauthorized data leaks[cite: 2].