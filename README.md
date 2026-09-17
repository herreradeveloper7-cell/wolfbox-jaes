# Wolfbox JAES 📦

Full-stack logistics management platform developed for **JAES Cargo Internacional** to centralize shipment operations, customer management and internal logistics workflows.

Wolfbox is an active production application designed to support day-to-day logistics operations through a centralized web platform.

---

## Overview

Wolfbox provides operational tools for managing packages, customers, shipments, dispatches and related logistics processes.

The platform combines a REST API, a web-based frontend and a SQL Server database to support internal administrative workflows and customer-facing operations.

---

## Key Features

- 📦 Package and shipment management
- 👥 Customer and user management
- 🚚 Dispatch and carrier management
- 🧾 Shipping guide management
- 📍 Recipient and destination management
- 🔔 Operational notifications
- 📊 Dashboard and business data visualization
- 🧮 Reconciliation workflows
- 📑 PDF and document generation
- 📈 Excel export capabilities
- 🏷️ Barcode and QR code generation
- 📢 Pre-alerts and promotional workflows
- 🗂️ Catalog management for offices, services, locations and related business entities

---

## Tech Stack

### Backend

- Node.js 22
- Express.js
- JavaScript ES Modules
- Microsoft SQL Server
- JWT
- bcrypt
- Zod
- Helmet
- CORS
- Redis
- express-rate-limit
- PDFKit
- Azure Blob Storage

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion
- Headless UI
- ExcelJS
- jsPDF
- QR Code generation
- Barcode generation

### Infrastructure & Tools

- Docker
- Linux / Ubuntu
- Vercel
- Git
- GitHub
- pnpm

---

## Architecture

The project follows a modular full-stack architecture.

### Backend structure

The API is separated into dedicated modules for:

- Authentication
- Packages
- Customers
- Shipping guides
- Users
- Requests
- Recipients
- Dispatches
- Carriers
- Reconciliation
- Notifications
- Promotions
- Pre-alerts
- Catalogs
- Dashboard

Backend responsibilities are separated across controllers, routes, middleware, validators, configuration modules and database migrations.

### Frontend structure

The frontend is a React and TypeScript application built with Vite.

It consumes the backend API and provides the operational interface used to manage logistics workflows, customers, packages and administrative processes.

---

## Security & Reliability

Wolfbox includes several production-focused security and reliability measures:

- JWT-based authentication
- Password hashing with bcrypt
- HTTP security headers with Helmet
- Restricted CORS configuration
- Distributed API rate limiting with Redis
- Request and mutation auditing
- Input validation with Zod
- Database health checks
- Slow-request monitoring
- Environment-based configuration
- SQL Server connection pooling
- Database keep-alive and warm-up logic

---

## Database

The platform uses **Microsoft SQL Server** as its primary relational database.

The backend includes configurable connection pooling, request timeouts, health checks and keep-alive mechanisms to improve production reliability.

---

## My Role

I am responsible for the development and technical maintenance of Wolfbox, including:

- Backend architecture and REST API development
- Frontend development and API integration
- SQL Server integration
- Database migrations
- Authentication and access control
- Security improvements
- Production deployments
- Infrastructure configuration
- Performance optimization
- Debugging and production issue resolution
- Ongoing maintenance and feature development

---

## Production

Wolfbox is an active production system developed for **JAES Cargo Internacional**.

🌐 **Live Application:**  
https://wolfbox-jaes.vercel.app

---

## Project Structure

```text
wolfbox-jaes/
├── config/
├── controllers/
├── frontend-wolfbox/
├── middleware/
├── migrations/
├── routes/
├── scripts/
├── tests/
├── utils/
├── validators/
├── Dockerfile
├── index.js
└── package.json
