# 🧠 Smart Quote v1 — IronAsia Marketplace

Smart Quote v1 is the intelligent quotation system for **IronAsia Marketplace** — a next-generation B2B procurement platform that matches and ranks supplier responses based on **product completeness**, **quantity accuracy**, and **price competitiveness**.

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

### 💰 Token Economy System
- `/api/tokens/add` → Add customer tokens (Top-Up)
- `/api/tokens/consume` → Deduct tokens during contact reveal
- `/api/tokens/balance` → Retrieve current balance
- Live balance updates with confirmation modals

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

## 🧭 API Routes Overview

| Endpoint | Method | Description |
|-----------|---------|-------------|
| /api/results | GET | Fetch ranked supplier responses |
| /api/results/mark-contact | PUT | Mark supplier contact as revealed |
| /api/tokens/add | POST | Add token balance |
| /api/tokens/consume | POST | Deduct token balance |
| /api/tokens/balance | GET | Retrieve user token balance |
| /api/smart-quotes/list | GET | Get quotation list |
| /api/smart-quotes/[id]/items | GET/POST | Manage quotation items |

---

## 🧾 Versioning

| Version | Date | Description |
|----------|------|-------------|
| **v1.0.0** | Nov 2025 | Initial full release with token economy, multi-area, and free-text product support. |

---

## 🧑‍💼 Author

**Zamsky04 (Sky)**  
Junior Web Developer | IronAsia  
> Building modular B2B marketplace ecosystems with Next.js and PostgreSQL.
