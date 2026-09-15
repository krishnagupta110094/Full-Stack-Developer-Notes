# 🚀 Full-Stack Developer Notes

> A clean, production-grade, and scalable repository designed to master **Backend, Frontend, DevOps, System Design, and DSA**.
> Organized strictly with concepts, practical runnable examples, and exhaustive interview question banks.

---

## 🧭 Repository Structure Pattern

Every topic follows a strictly consistent 4-layer hierarchy:

```text
Category → Technology/Topic → Concept → README.md + Examples/ + Interview-Questions.md
```

Each concept includes:
- **`README.md`**: Core concept documentation with a 2-minute revision cheatsheet, architecture diagrams, best practices, and pitfalls.
- **`Examples/`**: Runnable, production-ready code snippets with dependencies and instructions.
- **`Interview-Questions.md`**: Curated question bank categorised into *Basic*, *Intermediate*, *Advanced*, *Cross-Questions*, *Tricky Edge Cases*, and *Real-World Scenarios*.

---

## 📚 Roadmap & Progress Dashboard

### 🟢 1. Backend Engineering

| Topic / Module | Concept | Status | Notes | Code Examples | Interview Q&A |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Authentication & Authorization** | **JWT (JSON Web Token)** | ✅ Completed | [Read Notes](Backend/Authentication%20&%20Authorization/JWT/README.md) | [View Code](Backend/Authentication%20&%20Authorization/JWT/Examples) | [Questions](Backend/Authentication%20&%20Authorization/JWT/Interview-Questions.md) |
| **Authentication & Authorization** | **Authentication (Login & Password)** | ✅ Completed | [Read Notes](Backend/Authentication%20&%20Authorization/Authentication/README.md) | [View Code](Backend/Authentication%20&%20Authorization/Authentication/Examples) | [Questions](Backend/Authentication%20&%20Authorization/Authentication/Interview-Questions.md) |
| **Authentication & Authorization** | **Authorization (Role-Based Access Control)** | ✅ Completed | [Read Notes](Backend/Authentication%20&%20Authorization/Authorization/README.md) | [View Code](Backend/Authentication%20&%20Authorization/Authorization/Examples) | [Questions](Backend/Authentication%20&%20Authorization/Authorization/Interview-Questions.md) |
| **Authentication & Authorization** | **Password Authentication (Hashing, Salt & Bcrypt)** | ✅ Completed | [Read Notes](Backend/Authentication%20&%20Authorization/Password-Authentication/README.md) | [View Code](Backend/Authentication%20&%20Authorization/Password-Authentication/Examples) | [Questions](Backend/Authentication%20&%20Authorization/Password-Authentication/Interview-Questions.md) |
| **Authentication & Authorization** | Refresh Token Rotation | 📌 Planned | — | — | — |
| **Authentication & Authorization** | OAuth 2.0 & OpenID Connect | 📌 Planned | — | — | — |
| **Node.js** | Event Loop & Worker Threads | 📌 Planned | — | — | — |
| **Node.js** | Streams & Buffers | 📌 Planned | — | — | — |
| **Express.js** | Middleware Pipeline | 📌 Planned | — | — | — |
| **REST API** | Idempotency & HTTP Methods | 📌 Planned | — | — | — |

---

### 🔵 2. Frontend Engineering

| Technology / Topic | Concept | Status | Notes | Code Examples | Interview Q&A |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **JavaScript** | Closures & Lexical Scope | 📌 Planned | — | — | — |
| **JavaScript** | Event Loop & Promises | 📌 Planned | — | — | — |
| **React.js** | Custom Hooks & Reconciliation | 📌 Planned | — | — | — |
| **Next.js** | Server vs Client Components | 📌 Planned | — | — | — |

---

### 🟠 3. DevOps & Cloud

| Technology / Topic | Concept | Status | Notes | Code Examples | Interview Q&A |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Docker** | Multi-Stage Dockerfile Optimization | 📌 Planned | — | — | — |
| **Docker** | Volumes & Networking | 📌 Planned | — | — | — |
| **Git & GitHub** | Merge vs Rebase & Cherry-Pick | 📌 Planned | — | — | — |
| **CI/CD** | GitHub Actions Pipeline | 📌 Planned | — | — | — |

---

### 🟣 4. System Design & Architecture

| Technology / Topic | Concept | Status | Notes | Code Examples | Interview Q&A |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Fundamentals** | Caching Strategies (Write-through, Cache-aside) | 📌 Planned | — | — | — |
| **Fundamentals** | Load Balancing Algorithms & Sticky Sessions | 📌 Planned | — | — | — |
| **High-Level Design** | Distributed Rate Limiter | 📌 Planned | — | — | — |

---

## 🛠️ How to Run Examples

Each concept directory containing an `Examples/` folder is completely self-contained. For example:

```bash
# 1. Test JWT Examples
cd "Backend/Authentication & Authorization/JWT/Examples"
npm install
node 01-basic-jwt.js

# 2. Test Authentication (Login & Password)
cd "../Authentication/Examples"
npm install
npm run start:login

# 3. Test Authorization (RBAC)
cd "../Authorization/Examples"
npm run start:rbac

# 4. Test Password Authentication (Bcrypt Hashing)
cd "../Password-Authentication/Examples"
npm install
npm run start:bcrypt
```

---

## 🤝 Scalability & Architecture Contract

This repository is designed to scale effortlessly across languages and stacks (Python, Go, Java, Spring Boot, etc.) while strictly respecting the 4-layer contract:

```text
Category/
└── Technology/
    └── Concept/
        ├── README.md
        ├── Examples/
        └── Interview-Questions.md
```

---

*Maintained with ❤️ by Krishna Gupta*
