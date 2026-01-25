# Vista | Production Management System

![Vista Banner](https://i.ibb.co/jvkPgrRH/Vista-1.png)

Vista is a high-end, minimalist production management platform designed for modern manufacturing. It streamlines complex formulation processes, manages multi-tier inventory, and provides real-time financial analytics for liquid-based product businesses (e.g., Skin Care and Hair Care).

## Key Features

### Precision Formula Engine
- **Dynamic Costing**: Automatically calculate the cost of a finished unit based on current market prices of raw ingredients.
- **Complexity Tracking**: Monitor the number of ingredients and resource distribution for every SKU.
- **Margin Analysis**: Real-time margin projections during the formula creation stage.

### Intelligent Production Hub
- **Dual-Mode Production**: Execute runs by "Unit Count" (bottles) or "Total Batch Weight" (kg/L).
- **Auto-Deduction**: Real-time inventory sync that consumes raw ingredients and packaging materials upon production completion.
- **Constraint Simulation**: Visual alerts for insufficient stock before a production run begins.

### Integrated Inventory Management
- **Ingredients & Packaging**: Separate, dedicated modules for raw materials and containers.
- **Market Price Sync**: Update market prices globally to reflect in all associated formula costs.
- **Low-Stock Alerts**: Automated dashboard alerts when resources dip below operational thresholds.

### Financial Analytics
- **Projected Profitability**: Calculate potential revenue based on current sellable stock.
- **Inventory Valuation**: Monitor the total capital tied up in raw materials vs. finished goods.
- **SKU Performance**: Identify top-performing products by inventory value and margin.

## Tech Stack

- **Frontend**: React 19 (ES6+ Modules)
- **Styling**: Tailwind CSS (Sophisticated Dark/Light mode support)
- **Backend/Auth**: Supabase (Authentication & Profile Management)
- **Intelligence**: Google Gemini API (Strategic Marketing & Insights)
- **Icons**: Custom SVG-based UI library

## Getting Started

### Prerequisites
- A modern browser with ES module support.
- A Supabase project for authentication.
- A Google Gemini API key (for marketing features).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/vista-production.git
   ```
2. Navigate to the project root:
   ```bash
   cd vista-production
   ```
3. Set up your environment variables:
   - `process.env.API_KEY`: Your Gemini API Key.
   - Configure `lib/supabaseClient.ts` with your project URL and key.

4. Open `index.html` via a local development server (e.g., Live Server or Vite).

## Project Structure

```text
├── components/          # Modular UI components
│   ├── ProductionView.tsx
│   ├── IngredientsView.tsx
│   ├── DashboardView.tsx
│   └── ...
├── store/               # Centralized state management
│   └── StoreContext.tsx
├── context/             # Auth & Global providers
├── lib/                 # Third-party service clients (Supabase)
├── types.ts             # TypeScript interfaces and enums
└── constants.ts         # Initial mock data and config
```

## Design System

Vista utilizes a "Modern Noir" aesthetic:
- **Primary Background**: `#000000` (Dark) / `#FFFFFF` (Light)
- **Accent**: `#ebcd54` (Vista Gold)
- **Typography**: Inter (Clean, sans-serif)

---

&copy; 2025 Vista Management Systems. Built for clarity and precision.