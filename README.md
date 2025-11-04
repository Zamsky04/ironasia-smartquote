# 🧠 Smart Quote v1.1 — IronAsia Marketplace

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38BDF8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Edge%20DB-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

Smart Quote **v1.1** is the intelligent quotation system for **IronAsia Marketplace** — a next-generation B2B procurement platform that matches and ranks supplier responses based on **product completeness**, **quantity accuracy**, and **price competitiveness**.

> 🆕 Version **1.1.0 (Nov 2025)** introduces **IronAsia Token with eWallet and Transaction System** — allowing secure token-based actions for Top-Up and Get Contact.

---

## 🚀 Key Features

### 💡 Smart Quotation Workflow
- Multi-area request handling  
- Product-based itemization (free-text supported)  
- Ranking algorithm based on:
  - Product name normalization
  - Quantity match
  - Lowest price scoring  
- Supplier contact reveal system (with token balance deduction)

### 💰 IronAsia Token System (v1.1)
- 1 Token = Rp 1.000  
- `/api/tokens/add` → Top-Up tokens (add to eWallet)  
- `/api/tokens/consume` → Spend tokens when revealing contact  
- `/api/tokens/balance` → Retrieve user token balance  
- `/api/tokens/transaction` → Record transaction history (Top-Up or Get Contact)  
- Secure balance control to prevent negative tokens  
- Confirmation modals for every token spending  

### 🧩 Modular Components
- **`ConfirmSpendModal.tsx`** – Confirmation before spending tokens  
- **`TopUpModal.tsx`** – Token recharge with preview balance  
- **`ItemTable.tsx`** – Smart item rehydration without page reload  
- **`ResultSQPage.tsx`** – Dynamic area & product ranking visualization  

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js 16 (App Router) |
| Styling | TailwindCSS 4.1 |
| Language | TypeScript 5.6 |
| Backend | Go Echo API (integration ready) |
| Database | PostgreSQL |
| ORM / Query | Raw SQL + CTE-based optimization |
| Hosting | Vercel / Supabase / Railway (recommended) |

---

## 🧮 Database Schema Highlights

**Core Tables:**
- `tbl_smart_quotation`
- `tbl_smart_quotation_item`
- `tbl_smart_quotation_response`
- `tbl_token`
- `tbl_user`
- 🆕 `tbl_ewallet`
- 🆕 `tbl_transaction`

**Functions:**
- `insert_smart_quotation_item()`
- `update_token_balance()`
- `next_subject_help_code()` (utility)

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
| /api/results | GET | Fetch ranked supplier responses |
| /api/results/mark-contact | PUT | Mark supplier contact as revealed |
| /api/tokens/add | POST | Add token balance |
| /api/tokens/consume | POST | Deduct token balance |
| /api/tokens/balance | GET | Retrieve user token balance |
| /api/tokens/transaction | GET | Get transaction history |
| /api/smart-quotes/list | GET | Get quotation list |
| /api/smart-quotes/[id]/items | GET/POST | Manage quotation items |

---

## 🧾 Versioning

| Version | Date | Description |
|----------|------|-------------|
| **v1.0.0** | Nov 2025 | Initial full release with token economy, multi-area, and free-text product support. |
| **v1.1.0** | Nov 2025 | Added eWallet + Transaction System for IronAsia Token (1 token = Rp 1.000). |

---

## 🧑‍💼 Author

**Zamsky04 (Sky)**  
Junior Web Developer | IronAsia  
> Building modular B2B marketplace ecosystems with Next.js and PostgreSQL.
