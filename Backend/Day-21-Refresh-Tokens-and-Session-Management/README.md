# 🔄 Day 21: Refresh Tokens & Session Management

> Comprehensive guide to dual-token architecture (Access & Refresh Tokens), Refresh Token Rotation (RTR), session management, session store alternatives (Redis vs DB), and token revocation strategies.

---

## 1. Fundamentals of Dual-Token Architecture

In modern backend architectures, pairing a short-lived Access Token with a long-lived Refresh Token provides the optimal balance between **stateless performance** and **security**.

```mermaid
flowchart TD
    classDef startNode fill:#4F46E5,stroke:#3730A3,stroke-width:2px,color:#fff;
    classDef tokenNode fill:#0EA5E9,stroke:#0284C7,stroke-width:2px,color:#fff;
    classDef successNode fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef warningNode fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#fff;
    classDef dangerNode fill:#EF4444,stroke:#DC2626,stroke-width:2px,color:#fff;

    Login["🔐 User Submits Credentials<br/>(Email + Password)"]:::startNode
    Verify{"Server Verifies<br/>Credentials"}
    
    IssueAccess["⚡ Access Token<br/>(Short-lived: 15 mins)"]:::tokenNode
    IssueRefresh["🔄 Refresh Token<br/>(Long-lived: 7 days)"]:::tokenNode
    
    ApiCall["📡 Access Protected API<br/>(Authorization: Bearer Token)"]
    TokenCheck{"Access Token<br/>Valid?"}
    
    Success["✅ 200 OK Response<br/>(Resource Delivered)"]:::successNode
    Expired["⚠️ 401 Unauthorized<br/>(Token Expired)"]:::warningNode
    
    RefreshEndpoint["🔁 Call POST /api/auth/refresh<br/>(Send Refresh Token)"]
    RefreshCheck{"Refresh Token<br/>Valid & Matched in DB?"}
    
    NewAccessToken["✨ Issue New Access Token<br/>(15 mins)"]:::successNode
    ReLogin["❌ Must Log In Again<br/>(Session Terminated)"]:::dangerNode

    Login --> Verify
    Verify -->|Credentials Matched| IssueAccess
    Verify -->|Credentials Matched| IssueRefresh
    
    IssueAccess --> ApiCall
    ApiCall --> TokenCheck
    TokenCheck -->|Yes| Success
    TokenCheck -->|No / Expired| Expired
    
    Expired --> RefreshEndpoint
    IssueRefresh -.-> RefreshEndpoint
    RefreshEndpoint --> RefreshCheck
    RefreshCheck -->|Valid| NewAccessToken
    RefreshCheck -->|Expired / Revoked| ReLogin
    NewAccessToken --> ApiCall
```

---

## 2. Access Token vs Refresh Token

| Property | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Purpose** | Authorize access to protected APIs | Obtain a newly minted Access Token |
| **Lifespan** | Very short (e.g., 10 to 15 minutes) | Long (e.g., 7 to 30 days) |
| **Storage (Client)** | In-memory / HTTP Bearer header / Secure Cookie | Strictly in `HttpOnly`, `Secure` cookie or secure storage |
| **Storage (Server)** | Stateless (not stored in database) | Stateful (stored in MongoDB or Redis with user reference) |
| **Usage Frequency** | Sent with every authenticated API call | Sent strictly to `/api/auth/refresh` endpoint |
| **Revocation** | Difficult to revoke immediately (expires on its own) | Instantly revokable by deleting from database/Redis |

---

## 3. End-to-End Sequence Diagram (Full Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Client as 📱 Client (App / Browser)
    participant Server as 🖥️ Express Backend
    participant DB as 🗄️ Database / Redis

    rect rgb(240, 248, 255)
    Note over Client,DB: 1. Initial Login & Dual-Token Issuance
    Client->>Server: POST /api/auth/login (email, password)
    Server->>DB: Find user and verify password hash
    DB-->>Server: Credentials verified
    Server->>Server: Generate Access Token (15m) & Refresh Token (7d)
    Server->>DB: Save hashed refreshToken in user document/Redis
    DB-->>Server: Saved successfully
    Server-->>Client: Return 200 OK (accessToken in JSON, refreshToken in HttpOnly Cookie)
    end

    rect rgb(245, 255, 250)
    Note over Client,DB: 2. Protected Resource Access
    Client->>Server: GET /api/orders (Bearer <AccessToken>)
    Server->>Server: Verify signature locally (Zero DB calls)
    Server-->>Client: 200 OK (Order Data)
    end

    rect rgb(255, 250, 240)
    Note over Client,DB: 3. Token Expiration & Silent Refresh
    Client->>Server: GET /api/orders (Expired AccessToken)
    Server-->>Client: 401 Unauthorized (jwt expired)
    Client->>Server: POST /api/auth/refresh (Cookie: refreshToken)
    Server->>DB: Lookup stored refreshToken for user
    DB-->>Server: Token matches & active
    Server->>Server: Generate NEW Access Token (15m)
    Server-->>Client: 200 OK (New Access Token)
    Client->>Server: GET /api/orders (Bearer <NewAccessToken>)
    Server-->>Client: 200 OK (Order Data)
    end

    rect rgb(255, 240, 245)
    Note over Client,DB: 4. Logout / Immediate Revocation
    Client->>Server: POST /api/auth/logout (refreshToken)
    Server->>DB: Remove or invalidate refreshToken
    DB-->>Server: Deleted
    Server-->>Client: Clear-Cookie & 200 OK
    end
```

---

## 4. Refresh Token Rotation (RTR) & Reuse Detection

**Refresh Token Rotation (RTR)** is a security standard where the authorization server issues a **brand-new Refresh Token** every single time a Refresh Token is used to obtain a new Access Token. The old Refresh Token is immediately invalidated.

### Automatic Reuse Detection
If an attacker steals a Refresh Token:
1. The legitimate user or the attacker uses the token $\to$ Server issues Token Pair B.
2. The other party tries to reuse the already-spent Token Pair A.
3. The backend detects **token reuse**: `"A spent token was presented!"`.
4. **Immediate Action:** The server automatically purges the **entire token family** from the database, instantly terminating all active sessions for that user across all devices.

---

## 5. Session Management & Session Store Alternatives

In traditional and B2B web applications, **Stateful Sessions** are used instead of purely stateless tokens.

```text
Session ID (Opaque string: abc123xyz) ──► Stored in HttpOnly Cookie
                                                   │
                                                   ▼
                                        Resolved via Session Store:
                                        ├── MemoryStore (Local Dev only)
                                        ├── Redis (Production standard: Fast in-memory RAM)
                                        └── MongoDB / SQL (Persistent database collection)
```

### Session Store Comparison

| Session Store | Read/Write Latency | Persistence | Horizontal Scaling | Production Suitability |
| :--- | :--- | :--- | :--- | :--- |
| **In-Memory (RAM)** | Extremely fast ($<0.1$ms) | None (lost on restart) | ❌ Broken (requires sticky sessions) | ❌ Local development only |
| **Redis Store** | Ultra fast (1–2ms) | Configurable (AOF/RDB) | ✅ Shared cache across all server instances | ⭐ **Industry Gold Standard** |
| **MongoDB / SQL Store** | Slower (5–15ms) | High (durable on disk) | ✅ Centralized database | Suitable for low-to-medium traffic |

---

## 6. Secure Cookie Transport Checklist

Whether transporting a Session ID or a Refresh Token, cookies must enforce the following flags:

```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,  // Forbids JavaScript from reading document.cookie (anti-XSS)
  secure: true,    // Transmitted strictly over encrypted HTTPS connections
  sameSite: 'lax', // Defends against Cross-Site Request Forgery (CSRF)
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
});
```

---

## 7. Token Revocation Strategies Summary

1. **Database Delete / Invalidation:** Remove the user's `refreshToken` field in MongoDB or Redis on logout.
2. **`tokenVersion` Counter:** Increment `user.tokenVersion` in the database to instantly invalidate all previously issued tokens upon password reset.
3. **Redis Blacklist with TTL:** Add invalidated tokens to a Redis key-value store with an expiration matching the token's remaining lifespan.
