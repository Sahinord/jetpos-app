# Implementation Plan - SaaS Accounting & Product Management Desktop App (Supabase Edition)

This project aims to build a modern, premium desktop application using Electron and Next.js, powered by Supabase for the backend.

## Tech Stack
- **Framework**: Next.js 14 (App Router) + Electron.js.
- **Backend/Database**: Supabase (PostgreSQL, Auth, Real-time).
- **Styling**: Tailwind CSS + Framer Motion (Premium Aesthetics).
- **Icons**: Lucide Icons.

## Phase 1: Supabase Configuration
1.  [ ] Setup Supabase Project.
2.  [ ] Create `products` table with calculation triggers/functions.
3.  [ ] Create `categories` table.
4.  [ ] Setup RLS (Row Level Security) policies for multi-tenant SaaS.

## Phase 2: Desktop Environment
1.  [ ] Scaffold Next.js + Electron boilerplate.
2.  [ ] Create Auth screens (Login/Register) using Supabase Auth.

## Phase 3: Product Management & Automations
1.  [ ] Develop Product Dashboard with real-time stats.
2.  [ ] Implement Product CRUD with automated profit calculations.
3.  [ ] Add Barcode scanning & search logic.
4.  [ ] Dynamic Price Suggestion algorithm.

## Phase 4: Financial Tools
1.  [ ] VAT Calculation module.
2.  [ ] Profit/Loss Analysis charts.

## Supabase Schema (PostgreSQL)
```sql
-- Categories Table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  purchase_price DECIMAL(15, 2) DEFAULT 0.00,
  sale_price DECIMAL(15, 2) DEFAULT 0.00,
  vat_rate INTEGER CHECK (vat_rate IN (1, 8, 18, 20)),
  stock_quantity INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
