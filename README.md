# 🧠 Smart Quote v1.3.0 — IronAsia Marketplace

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38BDF8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Edge%20DB-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

---

> **Smart Quote** is the intelligent quotation and supplier ranking engine for **IronAsia Marketplace** —  
> a next-generation **B2B procurement ecosystem** built for precision, transparency, and scalability.

---

## 🚀 Highlights in v1.3.0 (Nov 2025)

### ✨ **UI/UX Overhaul**
- **Home Page Revamp** with glassmorphism & gradient mesh design.  
- Integrated **auth-gated sections** for *Top Ranking*, *Hot Deals*, and *New Arrivals*.  
- Introduced **standalone Login Modal** (`src/app/components/LoginModal.tsx`) for modular reuse.  
- Responsive grid layout optimized for all breakpoints (desktop, tablet, mobile).  
- Added **modular UI primitives** (`button`, `card`, `dialog`, `input`, etc.) for consistent styling.  

### 🧩 **Functional Enhancements**
- Unified **Category Cards** with dynamic “Show More” behavior.  
- Added **auth check triggers** on all gated actions (Shop Now, View More).  
- Extracted **Topbar** into a reusable component with search, logo, and profile entry points.  
- Improved accessibility (`aria-modal`, focus ring, input label semantics).  

### 🎨 **Visual & Experience**
- Enhanced layout spacing and readability for enterprise look.  
- Animated hover states and interactive button tooltips (Indonesian hints).  
- Refined image optimization using `Next/Image` adaptive rendering.  

---

## 🧮 Core System Overview

### 💼 Smart Quote Workflow
1. **Customer** creates a Smart Quotation (SQ) with product, quantity, and area details.  
2. **System** auto-blasts suppliers by matching category + area.  
3. **Suppliers** respond with price & quantity offers.  
4. **ResultSQ** ranks responses by price competitiveness and fulfillment ratio.  
5. **Customer** can reveal supplier contact using tokens.

### 💰 Token System
- Centralized via `tbl_ewallet` and `tbl_transaction`.  
- “Get Contact” consumes tokens (requires confirmation).  
- “Top Up” replenishes balance via `/api/tokens/add`.  
- Full token logic available under `/api/tokens/*` routes.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router) |
| **Styling** | TailwindCSS 4.1 |
| **Language** | TypeScript 5.6 |
| **Backend** | Go (Echo Framework) |
| **Database** | PostgreSQL |
| **Realtime / Edge** | Supabase |
| **Hosting** | Vercel / Railway |

---

## 🗃 Database Schema (Core Tables)

| Table | Description |
|--------|--------------|
| `tbl_smart_quotation` | Smart Quote headers |
| `tbl_smart_quotation_item` | Quotation items |
| `tbl_smart_quotation_response` | Supplier responses |
| `tbl_blast` | SQ distribution record per supplier |
| `tbl_transaction` | Token transaction history |
| `tbl_ewallet` | Token wallet |
| `tbl_user` | Account roles (Customer / Supplier / Admin) |

---

## 🧭 API Routes Overview

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/results` | `GET` | Fetch ranked supplier responses |
| `/api/results/mark-contact` | `PUT` | Mark supplier contact as revealed |
| `/api/tokens/add` | `POST` | Add token balance |
| `/api/tokens/consume` | `POST` | Deduct tokens for contact reveal |
| `/api/tokens/balance` | `GET` | Retrieve user token balance |
| `/api/tokens/transactions` | `GET` | Fetch combined transaction + wallet data |
| `/api/smart-quotes/responses` | `GET/POST` | Manage supplier responses |
| `/api/blast` | `POST` | Blast SQ to suppliers by area/category |
| `/api/supplier/inbox` | `GET` | Supplier’s pending quotation requests |

---

## 🧑‍💻 Developer Setup

```bash
# 1️⃣ Clone Repository
git clone https://github.com/Zamsky04/ironasia-smartquote.git
cd ironasia-smartquote

# 2️⃣ Install Dependencies
npm install

# 3️⃣ Configure Environment
echo "DATABASE_URL=postgresql://username:password@localhost:5432/ironasia_test" > .env.local
echo "NEXT_PUBLIC_API_BASE=/api" >> .env.local

# 4️⃣ Run Development Server
npm run dev

# App will be available at:
http://localhost:3000


```

## 🧭 API Routes Overview

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/results` | GET | Fetch ranked supplier responses per item |
| `/api/results/mark-contact` | PUT | Mark supplier contact as revealed |
| `/api/tokens/add` | POST | Add token balance |
| `/api/tokens/consume` | POST | Deduct token balance (on contact reveal) |
| `/api/tokens/balance` | GET | Retrieve user token balance |
| `/api/smart-quotes/responses` | GET/POST | Handle supplier responses per item_id |
| `/api/blast` | POST | Blast quotations to suppliers per item |
| `/api/supplier/inbox` | GET | Fetch pending supplier requests |

---

## 🧾 Versioning

| Version | Date | Description |
|----------|------|-------------|
| **v1.0.0** | Nov 2025 | Initial release with multi-area and free-text product support. |
| **v1.1.0** | Nov 2025 | Introduced eWallet + Transaction System for IronAsia Token. |
| **v1.2.0** | Nov 2025 | Migrated to item_id-based operations, redesigned ResultSQ UI, and improved token logic. |
| **v1.3.0** | Nov 2025 | Complete Home Revamp + Modular UI Components + Auth Gating. |

---

## 🧑‍💼 Author

**Zamsky04 (Sky)**  
Junior Web Developer | IronAsia  
> Building modular B2B marketplace ecosystems with Next.js and PostgreSQL.
