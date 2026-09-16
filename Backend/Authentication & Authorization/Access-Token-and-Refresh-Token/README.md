# 🔑 Access Token & Refresh Token

> Guide to token lifecycles, dual-token authentication flows, and token refresh mechanisms.

---

## 1. Access Token

### Definition
An **Access Token** is a short-lived token used by a client to access **protected resources/APIs** after successful authentication.

> **Simple words:** An Access Token proves to the server that the user is authenticated and permitted to access protected APIs.

### Example Flow
```text
Login
  ↓
Email + Password verified
  ↓
Access Token generated
  ↓
Client receives token
  ↓
Client uses token for protected APIs
```

Example request:
```http
GET /api/users/me
Authorization: Bearer <access_token>
```

### Characteristics
* Short-lived token (usually valid for a few minutes).
* Used specifically to access protected APIs.
* Becomes invalid once expired.
* Frequently used across client requests.

---

## 2. Refresh Token

### Definition
A **Refresh Token** is a long-lived token used to obtain a **new Access Token** when the current Access Token expires.

> **Simple words:** The primary job of a Refresh Token is to obtain a new Access Token.

### Example Flow
```text
Access Token expires
        ↓
Client sends Refresh Token
        ↓
Server verifies Refresh Token
        ↓
New Access Token generated
        ↓
Client can access APIs again
```

Example endpoint:
```http
POST /api/auth/refresh
```

### Characteristics
* Long-lived token (valid much longer than the Access Token).
* Not used for normal API requests.
* Used strictly on the refresh endpoint to generate new Access Tokens.
* Must be stored securely.

---

## 3. Access Token vs Refresh Token

| Access Token | Refresh Token |
| :--- | :--- |
| Used for API access | Used to obtain new Access Tokens |
| Short-lived (e.g., 15 minutes) | Long-lived (e.g., 7 days) |
| Frequently used across requests | Occasionally used upon expiration |
| Sent to protected resource routes | Sent exclusively to refresh endpoint |
| Expires quickly | Expires relatively late |

---

## 4. End-to-End Sequence Diagram (Full Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Client as 📱 Client (App / Browser)
    participant Server as 🖥️ Express Backend
    participant DB as 🗄️ MongoDB

    rect rgb(240, 248, 255)
    Note over Client,DB: 1. Initial Login & Dual-Token Issuance
    Client->>Server: POST /api/auth/login (email, password)
    Server->>DB: User.findOne({ email })
    DB-->>Server: User record found
    Server->>Server: Verify password with bcrypt.compare()
    Server->>Server: Generate Access Token (15m) & Refresh Token (7d)
    Server->>DB: Save refreshToken in user document
    DB-->>Server: Saved successfully
    Server-->>Client: 200 OK (accessToken, refreshToken)
    end

    rect rgb(245, 255, 250)
    Note over Client,DB: 2. Normal Authenticated Requests
    Client->>Server: GET /api/users/me (Bearer AccessToken)
    Server->>Server: jwt.verify(accessToken, ACCESS_SECRET)
    Server-->>Client: 200 OK (User Data)
    end

    rect rgb(255, 250, 240)
    Note over Client,DB: 3. Token Expiration & Silent Refresh
    Client->>Server: GET /api/users/me (Expired AccessToken)
    Server->>Server: jwt.verify fails (TokenExpiredError)
    Server-->>Client: 401 Unauthorized (Access token expired)
    Client->>Server: POST /api/auth/refresh (refreshToken)
    Server->>Server: jwt.verify(refreshToken, REFRESH_SECRET)
    Server->>DB: User.findById(decoded.userId)
    DB-->>Server: User found & compare refreshToken
    Server->>Server: Generate NEW Access Token (15m)
    Server-->>Client: 200 OK (new accessToken)
    Client->>Server: GET /api/users/me (Bearer NEW AccessToken)
    Server-->>Client: 200 OK (User Data)
    end

    rect rgb(255, 240, 245)
    Note over Client,DB: 4. Logout / Invalidation
    Client->>Server: POST /api/auth/logout (refreshToken)
    Server->>DB: Set user.refreshToken = null
    DB-->>Server: Updated
    Server-->>Client: 200 OK (Logout successful)
    end
```

---

## 5. Complete Authentication Flow (Architecture Map)

```mermaid
flowchart TD
    classDef startNode fill:#4F46E5,stroke:#3730A3,stroke-width:2px,color:#fff;
    classDef tokenNode fill:#0EA5E9,stroke:#0284C7,stroke-width:2px,color:#fff;
    classDef successNode fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef warningNode fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#fff;
    classDef dangerNode fill:#EF4444,stroke:#DC2626,stroke-width:2px,color:#fff;

    Login["🔐 User Submits Credentials<br/>(Email + Password)"]:::startNode
    Verify{"Server Verifies<br/>Password"}
    
    IssueAccess["⚡ Access Token<br/>(Short-lived: 15 mins)"]:::tokenNode
    IssueRefresh["🔄 Refresh Token<br/>(Long-lived: 7 days)"]:::tokenNode
    
    ApiCall["📡 Access Protected API<br/>(Authorization: Bearer Token)"]
    TokenCheck{"Access Token<br/>Valid?"}
    
    Success["✅ 200 OK Response<br/>(Resource Delivered)"]:::successNode
    Expired["⚠️ 401 Unauthorized<br/>(Token Expired)"]:::warningNode
    
    RefreshEndpoint["🔁 Call POST /api/auth/refresh<br/>(Send Refresh Token)"]
    RefreshCheck{"Refresh Token<br/>Valid in DB?"}
    
    NewAccessToken["✨ Issue New Access Token<br/>(15 mins)"]:::successNode
    ReLogin["❌ Must Log In Again<br/>(Session Terminated)"]:::dangerNode

    Login --> Verify
    Verify -->|Password Matched| IssueAccess
    Verify -->|Password Matched| IssueRefresh
    
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

## 6. Why Do We Need Both?

If only a **long-lived Access Token** is used:
```text
Access Token ──► Valid for 7 days
```
If this token is intercepted or leaked, an attacker has unrestricted access for the entire 7 days.

Therefore, the dual-token pattern is used:
```text
Short-lived Access Token (15m) + Long-lived Refresh Token (7d)
```
This minimizes the attack window of the Access Token while keeping the user logged in without repeatedly prompting for credentials.

---

## 7. Frontend Auto-Refresh (Silent Refresh)

* When the backend detects an invalid or expired Access Token, it returns `401 Unauthorized`.
* The frontend intercepts this response, calls the `/api/auth/refresh` endpoint using the stored Refresh Token, receives a new Access Token, and retries the original failed request seamlessly.
