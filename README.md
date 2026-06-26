
# ChummaOrder
> **Enterprise Campus Food Ordering Platform with Real-Time Order Synchronization, Role-Based Workflows, and Mobile-First User Experience**

![React](https://img.shields.io/badge/React-19-61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7)
![License](https://img.shields.io/badge/License-MIT-green)

---

# Executive Summary

ChummaOrder is a full-stack campus commerce platform designed to modernize food ordering inside educational institutions. The system enables students to discover campus food outlets, place pre-orders, and monitor order progress in real time, while providing outlet staff with a dedicated fulfillment dashboard to manage incoming requests efficiently.

Unlike traditional canteen operations that rely on physical queues and manual coordination, ChummaOrder digitizes the complete ordering workflow using a real-time event-driven architecture powered by Supabase Realtime and PostgreSQL.

---

# Problem Statement

Campus food courts typically experience:

- Long queues during peak hours
- Manual order management
- No visibility into order progress
- Inefficient communication between students and vendors
- Fragmented ordering across multiple outlets

ChummaOrder centralizes ordering into a single platform while synchronizing order state changes instantly across students and canteen staff.

---

# Core Features

- Multi-outlet ordering platform
- Secure authentication using Supabase Auth
- Role-based Student & Staff portals
- Real-time order synchronization
- Persistent order history
- Responsive mobile-first UI
- PostgreSQL-backed data persistence
- Event-driven order lifecycle
- Searchable digital menus
- Shopping cart and checkout workflow

---

# System Architecture

```text
                 Student Client
                       │
                 React Frontend
                       │
                 Supabase Auth
                       │
                       ▼
                 PostgreSQL Database
                       │
            Realtime Event Channels
              │                 │
              ▼                 ▼
      Student Dashboard    Staff Dashboard
              │                 │
              └──── Order State ────┘
```

---

# Order Lifecycle

```text
Menu Selection
      │
      ▼
Shopping Cart
      │
      ▼
Order Placement
      │
      ▼
Database Commit
      │
      ▼
Realtime Broadcast
      │
      ├──────────────► Student
      │
      └──────────────► Staff
                           │
                    PROCESSING
                           │
                         READY
                           │
                      COMPLETED
```

Every state transition is propagated immediately to subscribed clients through Supabase Realtime, eliminating manual refreshes.

---

# Student Portal

The student interface provides an end-to-end ordering experience.

Features include:

- Secure registration and authentication
- Browse all campus food outlets
- Dynamic menu rendering
- Shopping cart management
- Order confirmation
- Live order tracking
- Persistent order history
- Mobile-first responsive experience

---

# Staff Portal

Each outlet operates through an isolated fulfillment dashboard.

Staff can:

- Authenticate securely
- View outlet-specific orders
- Update order lifecycle states
- Process concurrent customer requests
- Synchronize status changes instantly with students

Role isolation ensures staff members only manage orders belonging to their assigned outlet.

---

# Real-Time Synchronization

Supabase Realtime serves as the event distribution layer.

Whenever an order changes state:

1. Database record updates.
2. Realtime channel broadcasts event.
3. Student dashboard refreshes automatically.
4. Staff dashboard remains synchronized.

This architecture provides near real-time visibility without polling.

---

# Database Design

Core entities include:

```text
Users
Profiles
Outlets
MenuItems
Orders
OrderItems
```

Relationships maintain transactional consistency while supporting multiple food outlets and concurrent users.

---

# Technology Stack

| Layer | Technologies |
|------|--------------|
| Frontend | React, HTML5, Tailwind CSS |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Deployment | Netlify |

---

# Project Structure

```text
ChummaOrder/

├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── contexts/
│   └── assets/
│
├── public/
├── supabase/
├── package.json
└── README.md
```

---

# Deployment

Frontend is deployed on Netlify.

Backend services, authentication, database, and realtime subscriptions are managed through Supabase.

---

# Future Roadmap

- Payment gateway integration
- Push notifications
- QR-code pickup verification
- Admin analytics dashboard
- Inventory management
- OTP verification
- Mobile application
- Campus-wide analytics
- Multi-campus deployment
- Recommendation engine

---

# Why ChummaOrder?

ChummaOrder demonstrates modern product engineering principles by combining responsive frontend development, secure authentication, relational database design, and realtime event synchronization into a unified ordering platform.

Instead of simply digitizing food ordering, the platform models the complete order fulfillment lifecycle, enabling scalable, low-latency communication between students and vendors while significantly improving the campus dining experience.
