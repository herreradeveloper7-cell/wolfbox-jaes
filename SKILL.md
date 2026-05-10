---
name: WolfBox Project Skill
description: Expertise for working with the WolfBox package management system
---

# WolfBox Project Skill

## Project Overview
WolfBox is a comprehensive package tracking and management system for international shipping logistics. The project combines a Node.js/Express backend with a React/TypeScript frontend, utilizing Tailwind CSS for styling.

## Architecture

### Backend (Node.js/Express)
- **Main entry**: `index.js`
- **Key components**:
  - `controllers/`: Business logic for various domains
  - `routes/`: API endpoints organized by feature
  - `config/`: Configuration files for database and environment
  - Database: MSSQL (using `mssql` npm package)

### Frontend (React/TypeScript/Vite)
- **Location**: `frontend-wolfbox/`
- **Stack**: React 18+ with TypeScript, Tailwind CSS, Vite
- **UI Components**: Located in `src/components/`
- **Styling**: Tailwind CSS with custom animations and responsive design

## Key Features
1. **Package Management**: Track packages with HAWB, tracking numbers, weight, and insured values
2. **Recipient Management**: Manage destinatarios (recipients) by customer code
3. **Currency Conversion**: TRM (Tasa Representativa del Mercado) for USD/COP conversion
4. **Additional Charges**: Support for various cargo types with automatic currency conversion
5. **Request Management**: Edit and update shipment requests with packages and charges

## Common Components & Patterns

### Forms & Modals
- Modal dialogs use **`fixed inset-0 bg-black/40 backdrop-blur-sm`** for overlays
- Form inputs use **Tailwind classes**: `border p-2 rounded-lg focus:ring-2 focus:ring-red-300`
- Primary button color: `bg-[#5a0c0c]` (burgundy)
- Secondary buttons: `bg-gray-600`, `bg-blue-800`
- Animations: `animate-fade-in`, `animate-scale-in`, `animate-slide-up`, `animate-fade-out`

### API Integration
- Base URL: `http://localhost:3000/api/`
- Common endpoints:
  - `/solicitudes/` - Request management
  - `/paquetes/` - Package operations
  - `/destinatarios/` - Recipient management
  - `/cargos/` - Charge/fee management
  - `/trm/actual` - Current exchange rate

### Data Handling
- Client codes: `codigoCasillero`, `codigo`, or `codigo_casillero`
- Numeric formatting: `toLocaleString("es-CO", { minimumFractionDigits: 2 })`
- Input validation: Numeric inputs use regex `/^\d*\.?\d*$/` for validation

### State Management
- Uses React hooks: `useState`, `useEffect`
- Local component state for forms (not Redux or Context)
- Async data fetching with Axios

## Common Tasks & Solutions

### Adding a New Modal Form
1. Create new component in `src/components/[domain]/Modal[Action].tsx`
2. Follow the ModalEditarSolicitud pattern:
   - Props: data object, `onClose`, `onUpdated` callbacks
   - Use Tailwind classes for consistent styling
   - Include loading states and error handling with SweetAlert2
   - Call API via axios and handle responses

### Modifying API Responses
- Always check for optional/nullable properties: `data.solicitud?.destinatario ?? null`
- Use array fallbacks: `data.paquetes || []`
- Handle edge cases (missing codes, invalid IDs)

### Form Input Validation
- Currency inputs: Allow digits, decimal point, optional negation
- Percentage/numeric: Allow digits and decimal
- Prevent non-numeric entries early with regex testing

### Styling Guidelines
- Use consistent color scheme: Burgundy (`#5a0c0c`) for primary actions
- Responsive grid layouts: `grid-cols-5` for desktop, adjust for mobile
- Use hover states: `hover:bg-blue-900 transition`
- Add animations for UX: fade-in on mount, slide-up on list items

## Development Tips
- Hot reload available with Vite: changes reflect immediately
- SweetAlert2 is used for all confirmation dialogs and notifications
- Axios interceptors can be configured for global error handling
- Environment variables in `env.js` or `.env`
- Mock data helpful for UI development without full backend

## Dependencies Overview
- **Backend**: express, cors, body-parser, bcrypt, mssql, multer, pdfkit, jsbarcode, json2csv
- **Frontend**: react, typescript, tailwindcss, axios, sweetalert2, vite, @headlessui/react
- **Document Generation**: jspdf, jspdf-autotable, pdfkit
- **Barcode/QR**: jsbarcode, qrcode.react, bwip-js

## File Organization
```
wolfBox_jaes/
├── index.js                 # Express server entry
├── config/                  # Database & app config
├── controllers/             # API logic
├── routes/                  # Route definitions
├── frontend-wolfbox/        # React app
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
└── uploads/                 # Server file uploads
```

## When to Ask for Clarification
- Exact database schema or field names
- Specific business logic requirements
- Integration with external services
- Performance optimization needs
- Testing strategy or coverage expectations
