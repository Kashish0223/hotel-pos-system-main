# Hotel-POS - Management System

A comprehensive hotel and restaurant POS (Point of Sale) system built with modern web technologies.

## Features

- **Order Management** - Create, modify, and track customer orders with real-time status updates. Support for dine-in, takeout, and delivery orders with customizable modifiers and special instructions.

- **Inventory Tracking** - Monitor stock levels, set low stock alerts, and manage inventory across multiple outlets. Track supplier information and purchase history for better procurement decisions.

- **Staff Management** - Complete staff directory with role-based access control (Admin, Manager, Staff). Track employee performance, assign tasks, and manage staff schedules.

- **Kitchen Display System** - Real-time kitchen display screens showing incoming orders with preparation times. Automatic order status updates and kitchen workflow optimization.

- **Analytics & Reports** - Comprehensive business dashboards with sales trends, revenue analysis, popular items, and staff performance metrics. Export reports to PDF and Excel formats.

- **Customer Management** - Maintain customer profiles, loyalty program tracking, and feedback collection. QR-based feedback system for gathering customer reviews and ratings.

- **Bill Management** - Generate professional invoices with multiple payment options (Cash, Card, Digital). Print bills with customizable headers, footers, and itemized details. Support for split billing and discounts.

- **Multi-Outlet Support** - Centralized management system for multiple restaurant locations with individual outlet tracking, inventory separation, and location-specific analytics.

- **Expense & Settlement Management** - Track expenses, manage daily settlements, and reconcile cash with detailed transaction logs.

- **Tax & Discount Management** - Configure and apply category-specific taxes, seasonal discounts, and promotional offers.

- **Dark Mode Support** - User-friendly interface with dark mode option for extended hours operations.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: MongoDB
- **Styling**: TailwindCSS with custom components
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics
- **Cloud Storage**: AWS S3

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- AWS S3 credentials (optional)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Docker

```bash
docker compose up hotel-pos
```

## Project Structure

- `/app` - Next.js pages and routes
- `/components` - Reusable React components
- `/lib` - Utility functions and configurations
- `/context` - React context providers
- `/public` - Static assets

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private Project
