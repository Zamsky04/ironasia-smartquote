# 🧠 Smart Quote v1.2.1 — IronAsia Marketplace

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38BDF8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Edge%20DB-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

---

> **Smart Quote** is the intelligent quotation and supplier ranking engine for **IronAsia Marketplace** —  
> a next-generation B2B procurement platform operating on **item-level precision** using `item_id` for  
> quotation, supplier response, and ranking logic.

---

## 🚀 Highlights in v1.2.1 (Nov 2025)

### 🧩 Functional Enhancements
- Combined `tbl_transaction` and `tbl_ewallet` data for unified Token and Balance display.
- Fixed incorrect or missing `amount` (NaN) issues on the transaction page.
- Improved search, filtering, and manual refresh behavior on transaction pages.
- Added clean user-friendly labels for description types (`Get Contact`, `Supplier Response`, etc.).
- Refined `/api/tokens/transactions` for consistent result handling.

### 🎨 UI/UX Improvements
- Redesigned **Smart Quote**, **Supplier**, and **ResultSQ** pages for professional visual hierarchy.
- Unified typography, spacing, and layout with TailwindCSS 4.1 standards.
- Added card-based structure and light-mode readability improvements.
- Removed 5s auto-refresh; now data reloads on-demand with better performance.

### ⚙️ Backend Updates
- Optimized API join logic (`tbl_transaction` + `tbl_ewallet`) for cleaner responses.
- Standardized API structure under `/api/tokens/*` and `/api/smart-quotes/*`.
- Improved error handling and database consistency across endpoints.

---

## 🧮 Core System Overview

### 💼 Smart Quote Workflow
1. **Customer** creates a Smart Quotation (SQ) with product items, area, and quantity.  
2. **System** “blasts” requests to matching suppliers based on area & category.  
3. **Suppliers** respond with offers (price + quantity).  
4. **ResultSQ** ranks responses automatically (price & quantity scoring).  
5. **Customer** can reveal supplier contact using tokens.

### 💰 Token System
- Controlled via eWallet (`tbl_ewallet`, `tbl_transaction`)
- Actions like “Get Contact” consume tokens (with confirmation)
- “Top Up” updates token balance seamlessly via `/api/tokens/add`

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router) |
| **Styling** | TailwindCSS 4.1 |
| **Language** | TypeScript 5.6 |
| **Backend** | Go (Echo Framework) — integration ready |
| **Database** | PostgreSQL |
| **ORM / Query** | Raw SQL + CTE Optimization |
| **Hosting** | Vercel / Supabase / Railway |

---

## 📦 Database Schema Highlights

### 🗃 Core Tables
| Table | Description |
|--------|--------------|
| `tbl_smart_quotation` | Header of each quotation |
| `tbl_smart_quotation_item` | Product items under SQ |
| `tbl_smart_quotation_response` | Supplier responses |
| `tbl_transaction` | Token transaction logs |
| `tbl_ewallet` | Token balances |
| `tbl_user` | User metadata (supplier, customer, admin) |

### ⚙️ Core Functions
- `insert_smart_quotation_item()`  
- `update_token_balance()`  
- `insert_smart_quotation_response()`  
- `next_subject_help_code()`

---

## 🧭 API Routes Overview

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/results` | `GET` | Fetch ranked supplier responses per item |
| `/api/results/mark-contact` | `PUT` | Mark supplier contact as revealed |
| `/api/tokens/add` | `POST` | Add token balance |
| `/api/tokens/consume` | `POST` | Deduct token on contact reveal |
| `/api/tokens/balance` | `GET` | Retrieve user token balance |
| `/api/tokens/transactions` | `GET` | Fetch combined transaction + wallet data |
| `/api/smart-quotes/responses` | `GET/POST` | Handle supplier responses |
| `/api/blast` | `POST` | Blast quotations per item |
| `/api/supplier/inbox` | `GET` | Fetch supplier’s pending requests |

---

## 🧑‍💻 Developer Setup

```bash
# 1. Clone Repository
git clone https://github.com/Zamsky04/ironasia-smartquote.git
cd ironasia-smartquote

# 2. Install Dependencies
npm install

# 3. Configure Environment
echo "DATABASE_URL=postgresql://username:password@localhost:5432/ironasia_test" > .env.local
echo "NEXT_PUBLIC_API_BASE=/api" >> .env.local

# 4. Run Development Server
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

---

## 🧑‍💼 Author

**Zamsky04 (Sky)**  
Junior Web Developer | IronAsia  
> Building modular B2B marketplace ecosystems with Next.js and PostgreSQL.
