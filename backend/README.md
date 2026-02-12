# Self-Refining Portfolio Agent - Backend

This folder contains the Node.js backend logic and PostgreSQL database integration.

## Structure

```
backend/
├── src/
│   ├── api/           # Express API routes
│   ├── database/      # PostgreSQL connection and models
│   ├── agents/        # AI agent logic
│   ├── blockchain/    # Stellar blockchain integration
│   └── utils/         # Helper functions
├── package.json
└── tsconfig.json
```

## Features

- RESTful API for frontend communication
- PostgreSQL database for transaction history and analytics
- AI agent logic for portfolio optimization
- Stellar blockchain integration
- Real-time websocket updates

## Setup

Prerequisites:
- Node.js >= 18
- PostgreSQL database
- Environment variables (.env)

## Environment Variables

Create a `.env` file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio_agent
STELLAR_NETWORK=testnet
PORT=3001
```

## Development

Coming soon: Backend implementation with Express, PostgreSQL, and Stellar SDK.
