# PRD — Pockt

## Overview

Pockt is a self-hosted personal finance application designed to simplify everyday money management.

Unlike traditional accounting software, Pockt focuses on answering a single question:

> **"After paying everything I owe, how much money do I actually have left?"**

Pockt intentionally avoids accounting concepts such as double-entry bookkeeping, ledgers, journals, and chart of accounts. Instead, it provides a clean, fast interface for tracking income, expenses, bills, and personal debts.

The application is built primarily for individuals who want complete ownership of their financial data while keeping the experience lightweight and intuitive.

---

# Vision

Create a finance application that feels as simple as a notes app while being powerful enough to replace manual calculations, scattered notes, and spreadsheets.

Pockt should become the user's daily financial dashboard.

---

# Design Philosophy

Pockt is not accounting software.

Pockt is not an ERP.

Pockt is not a budgeting framework.

Pockt is simply a personal financial companion.

Every feature should answer one of these questions:

* How much money do I currently have?
* What do I still need to pay?
* Who do I owe money to?
* How much can I safely spend today?

If a feature doesn't help answer those questions, it probably doesn't belong in the application.

---

# Goals

The application should allow users to:

* Record income
* Record expenses
* Manage recurring monthly bills
* Track personal debts
* Calculate remaining disposable income automatically
* Access the same data from desktop and mobile
* Self-host the application with minimal setup

---

# Non Goals

The following are explicitly out of scope:

* Double-entry bookkeeping
* Journal entries
* Chart of accounts
* Inventory
* Business accounting
* Payroll
* Tax reporting
* Banking integrations
* Investment portfolios
* Cryptocurrency tracking
* Invoice management
* AI financial advisor

---

# Core Principles

## Self Hosted

Pockt is designed to run on the user's own infrastructure.

No subscriptions.

No vendor lock-in.

Complete ownership of data.

---

## Offline Friendly

Desktop clients should continue working during temporary network outages.

Changes synchronize automatically once connectivity returns.

---

## Mobile Accessible

A dedicated mobile app is unnecessary.

Instead, Pockt provides a responsive web interface that works well on phones and tablets.

---

## Fast

Recording an expense should take less than ten seconds.

Opening the dashboard should immediately answer the user's financial status.

---

# Target Users

Primary audience:

* Individuals
* Freelancers
* Students
* Developers
* Anyone currently managing finances with notes or spreadsheets

Not intended for:

* Businesses
* Accounting teams
* Finance departments

---

# Platforms

## Backend

Fastify REST API.

Responsible for:

* authentication
* synchronization
* recurring bill generation
* reporting
* database access

---

## Desktop

Primary client.

Built with Tauri.

Supports offline usage.

Optimized for keyboard-first workflows.

---

## Web

Responsive SvelteKit application.

Optimized for:

* checking balances
* recording expenses
* paying bills
* updating debts

No feature disparity between desktop and web.

---

# Core Modules

## Dashboard

The homepage of the application.

Displays:

* Current Balance
* Monthly Income
* Monthly Expenses
* Outstanding Bills
* Outstanding Debt
* Remaining Disposable Income

---

## Income

Purpose:

Track incoming money.

Fields:

* Title
* Amount
* Date
* Notes

Examples:

* Salary
* Freelance
* Bonus
* Refund

---

## Expenses

Purpose:

Track money spent.

Fields:

* Title
* Amount
* Category
* Date
* Notes

Categories are completely user-defined.

---

## Bills

Purpose:

Manage recurring monthly obligations.

Examples:

* Rent
* Internet
* Electricity
* Spotify
* Netflix
* Insurance

Fields:

* Name
* Amount
* Due Date
* Paid Status
* Notes

Bills automatically reset every month.

---

## Debts

Purpose:

Track money owed to other people.

Fields:

* Person
* Remaining Amount
* Due Date
* Notes

Actions:

* Record Payment
* Mark as Paid

---

# Dashboard

```
Current Balance

Rp 3,500,000

────────────────────────

Income

Rp 5,000,000

Expenses

Rp 1,200,000

Bills

Rp 650,000

Debt

Rp 300,000

────────────────────────

Free to Spend

Rp 2,850,000
```

---

# Payday View

One of Pockt's signature features.

Whenever salary is received, the application automatically generates a monthly financial overview.

```
Salary Received

Rp 5,000,000

────────────────────────

Bills

Rp 1,250,000

Debt Due

Rp   500,000

Spent

Rp   800,000

────────────────────────

Free to Spend

Rp 2,450,000
```

This screen becomes the primary monthly planning view.

---

# Synchronization

Desktop and web clients communicate with the same backend.

Desktop maintains a local cache.

Changes are synchronized automatically.

Conflict resolution is timestamp-based.

---

# Authentication

Initial version:

* Single user
* Username + password
* Session authentication

Future versions:

* Multiple users
* OAuth
* Passkeys

---

# Data Storage

Server

* SQLite
* better-sqlite3

Backups

* Manual database export
* Scheduled automatic backups

---

# Tech Stack

### Frontend

* SvelteKit
* Tailwind CSS
* shadcn-svelte

### Desktop

* Tauri v2

### Backend

* Fastify

### Database

* SQLite
* better-sqlite3

### ORM

* Drizzle ORM

### Validation

* Zod

### State Management

* TanStack Query

### Charts

* Chart.js

---

# Deployment

Designed primarily for self-hosting.

Supported deployment methods:

* Docker Compose
* Native Node.js
* Linux
* Windows

Recommended architecture:

```
Cloudflare
      │
HTTPS + SSL
      │
Cloudflare Tunnel
      │
Reverse Proxy
      │
Pockt Backend
      │
SQLite
```

Desktop and web clients connect to the same backend.

---

# MVP Features

* Dashboard
* Income Management
* Expense Management
* Bills
* Debts
* Monthly Summary
* Search
* Dark Mode
* CSV Export
* Database Backup

---

# Future Features

* Installment debt tracking
* Savings goals
* Calendar view
* Monthly analytics
* Receipt attachments
* Notifications
* PWA support
* Multi-wallet support
* Tags
* Custom dashboard widgets

---

# UX Principles

* Keyboard-first interactions on desktop
* Mobile-friendly responsive layout
* One-click common actions
* Minimal visual noise
* High information density
* Clear typography
* Monochrome interface with selective accent colors
* No unnecessary animations

---

# Success Metrics

The MVP is considered successful when:

* Users stop using note-taking apps to track debts.
* Users stop manually calculating monthly balances.
* Recording an expense takes less than 10 seconds.
* Users can determine their available spending amount immediately after opening the dashboard.
* The application is used daily for at least one month without reverting to spreadsheets or manual calculations.

---

# Product Identity

**Name:** Pockt

**Tagline:**

> **Your money. Your pocket. Your rules.**

Alternative taglines:

* **Know what's left to spend.**
* **Simple personal finance without the accounting.**
* **Track money, not paperwork.**
* **Self-hosted personal finance that stays out of your way.**

---

One thing I'd add that isn't common in other personal finance apps is a **"Timeline"** as the default home view instead of a traditional transaction list. Imagine a chronological feed where salary, bills, expenses, and debt payments all appear together. Combined with the summary cards at the top, you'd immediately see not only *where your money is now*, but also *how it got there*. It feels more like reading your financial story than managing an accounting database—and I think that aligns well with the simplicity you're aiming for.
