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

| Technology / Topic | Concept | Status | Notes | Code Examples | Interview Q&A |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Authentication** | **JWT (JSON Web Token)** | ✅ Completed | [Read Notes](Backend/Authentication/JWT/README.md) | [View Code](Backend/Authentication/JWT/Examples) | [Questions](Backend/Authentication/JWT/Interview-Questions.md) |
| **Authentication** | Refresh Token Rotation | 📌 Planned | — | — | — |
| **Authentication** | OAuth 2.0 & OpenID Connect | 📌 Planned | — | — | — |
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

Each concept directory containing an `Examples/` folder is self-contained. For example, to run the **JWT** examples:

```bash
# Navigate to the concept's Examples folder
cd Backend/Authentication/JWT/Examples

# Install dependencies
npm install

# Run individual examples
node 01-basic-jwt.js
node 02-token-version.js
node 03-redis-blacklist.js
```

---

## 🤝 Contribution & Scalability

This repository is designed to scale effortlessly across languages and platforms (Python, Go, Java, Spring Boot, AWS, Kubernetes, etc.) without altering the directory contract:

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
