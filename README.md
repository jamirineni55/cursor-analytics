# Cursor Analytics Dashboard

A comprehensive analytics dashboard for Cursor teams using the [Cursor Admin API](https://docs.cursor.com/en/account/teams/admin-api) and [AI Code Tracking API](https://docs.cursor.com/en/account/teams/ai-code-tracking-api).

## Features

### 🔐 Secure Authentication
- API key management with local storage
- No server-side data persistence
- Browser-only analytics processing

### 📊 Unified Dashboard
- Key metrics and insights at a glance
- Interactive usage analytics with charts
- Request type breakdown (Composer, Chat, Agent)
- Code generation trends and statistics
- Group-based filtering and analysis
- CSV export capabilities

### 👥 Team Management
- Member roles and permissions
- Activity monitoring
- Usage patterns analysis
- Group management and organization
- Email domain-based auto-grouping

### ⚙️ Settings & Configuration
- API key management
- Data export and backup
- Group configuration
- Security and privacy settings

## Tech Stack

- **Frontend**: React 19.1.1 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

### Prerequisites

1. **Cursor Admin API Key**: Get your API key from [Cursor Dashboard](https://cursor.com/dashboard) → Settings → Cursor Admin API Keys

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### API Key Setup

1. Navigate to your [Cursor Dashboard](https://cursor.com/dashboard)
2. Go to **Settings** → **Cursor Admin API Keys**
3. Click **Create New API Key** and give it a descriptive name
4. Copy the generated key (format: `key_xxxxxxx...`)
5. Enter the API key in the dashboard login screen

## Available APIs

### Admin API Endpoints
- `GET /teams/members` - Team member information
- `POST /teams/daily-usage-data` - Daily usage metrics
- `POST /teams/filtered-usage-events` - Detailed usage events


## Security & Privacy

- **No Server**: All analytics processing happens in your browser
- **Local Storage**: API keys stored locally, never sent to third parties
- **HTTPS Only**: All API communication uses secure HTTPS connections
- **No Persistence**: Data is not saved or cached beyond browser session

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard views and layout
│   └── ui/            # shadcn/ui components
├── services/          # API client and utilities
├── stores/           # Zustand state management
├── types/            # TypeScript type definitions
└── lib/              # Utility functions
```

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint with React rules
- Prettier formatting
- shadcn/ui component library

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Deployment

Optimized for deployment on Vercel with the included `vercel.json` configuration.

```bash
# Build and deploy
npm run build
```

## Contributing

1. Follow the TypeScript and React best practices defined in `.cursorrules`
2. Use the existing component patterns and state management approach
3. Ensure all new features maintain security and privacy standards
4. Test with real API data before submitting changes

## License

This project is private and proprietary.
