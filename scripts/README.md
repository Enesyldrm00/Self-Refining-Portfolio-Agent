# Self-Refining Portfolio Agent - Scripts

This folder contains deployment scripts and agent automation tasks.

## Structure

```
scripts/
├── deploy/
│   ├── deploy-contracts.sh     # Deploy Soroban contracts to Stellar
│   ├── setup-database.js       # Initialize PostgreSQL schema
│   └── deploy-frontend.sh      # Deploy Next.js to production
├── agents/
│   ├── train-model.py          # Train AI portfolio optimization model
│   ├── backtest-strategy.py    # Backtest trading strategies
│   └── monitor-performance.js  # Monitor agent performance
└── utils/
    ├── seed-data.js            # Seed test data
    └── backup-db.sh            # Database backup utility
```

## Usage

### Deployment
```bash
# Deploy contracts to Stellar testnet
./scripts/deploy/deploy-contracts.sh

# Setup PostgreSQL database
node scripts/deploy/setup-database.js

# Deploy frontend to Vercel
./scripts/deploy/deploy-frontend.sh
```

### Agent Tasks
```bash
# Train AI model
python scripts/agents/train-model.py

# Run backtesting
python scripts/agents/backtest-strategy.py

# Monitor live performance
node scripts/agents/monitor-performance.js
```

## Development

Coming soon: Automation scripts for deployment and AI agent tasks.
