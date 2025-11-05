# 🧠 Smart Quote v1.2 — IronAsia Marketplace

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38BDF8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Edge%20DB-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

Smart Quote **v1.2** is the intelligent quotation and ranking engine for **IronAsia Marketplace** — a next-generation B2B procurement platform that now operates on **item-level precision** using `item_id` instead of `sq_id`, delivering cleaner blast logic, more accurate supplier responses, and a smoother user experience.

> 🆕 Version **1.2.0 (Nov 2025)** introduces:
> - **Item-based blast and response logic (using `item_id`)**  
> - **Refined ResultSQ UI with request/response breakdown**  
> - **Optimized token behavior for Get Contact (no double charges)**  

---

## 🚀 Key Updates in v1.2

### ⚙️ Backend Improvements
- Refactored all related APIs (`/api/blast`, `/api/supplier/inbox`, `/api/smart-quotes/responses`, etc.)  
  → Now operate based on `item_id` for higher data accuracy per product item.
- Optimized join logic in queries for more efficient supplier ranking.

### 🧩 ResultSQ Page Redesign
- Added **Product Request** and **Product Response** columns with visual note separation.  
- Introduced better grouping per area and product.  
- Clearer ranking layout with badges (`🥇`, `🥈`, `🥉`) and improved readability.  
- **“Best Price”** tag now applied per product item instead of per SQ group.

### 💰 Token Behavior Update
- Clicking **“Get Contact”** now opens the contact modal **immediately** (no token deduction).  
- Token confirmation (`ConfirmSpendModal`) appears **only when the user checks “Tampilkan kontak”**.  
- Once a supplier contact is revealed, **no additional tokens** are consumed on reaccess.

---

## 💡 Core Features

- Multi-area and multi-product quotation management  
- Smart ranking algorithm based on:
  - Product name normalization  
  - Quantity matching score  
  - Price competitiveness scoring  
- Token-based eWallet system for controlled supplier contact reveals  
- Modular and responsive UI with Tailwind 4.1

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js 16 (App Router) |
| Styling | TailwindCSS 4.1 |
| Language | TypeScript 5.6 |
| Backend | Go Echo API (integration ready) |
| Database | PostgreSQL |
| ORM / Query | Raw SQL + CTE Optimization |
| Hosting | Vercel / Supabase / Railway |

---

## 🧮 Database Schema Highlights

**Core Tables:**
- `tbl_smart_quotation`
- `tbl_smart_quotation_item`
- `tbl_smart_quotation_response`
- `tbl_token`
- `tbl_ewallet`
- `tbl_transaction`
- `tbl_user`

**Core Functions:**
- `insert_smart_quotation_item()`
- `update_token_balance()`
- `insert_smart_quotation_response()`
- `next_subject_help_code()`

---

## 🧑‍💻 Developer Setup

```bash
# 1. Clone Repository
git clone https://github.com/Zamsky04/ironasia-smartquote.git
cd ironasia-smartquote

# 2. Install Dependencies
npm install

# 3. Setup Environment
# Create file: .env.local
# Then add your database credentials:
echo "DATABASE_URL=postgresql://username:password@localhost:5432/ironasia_test" > .env.local
echo "NEXT_PUBLIC_API_BASE=/api" >> .env.local

# 4. Run Development Server
npm run dev

App will be available at:
👉 http://localhost:3000

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
