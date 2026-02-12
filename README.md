# Self-Refining Portfolio Agent

An AI-driven cryptocurrency portfolio management system built on the Stellar blockchain with self-refining strategies.

## 🚀 Features

- **AI-Powered Trading**: Autonomous portfolio management with continuous strategy refinement
- **Stellar Integration**: Native support for Stellar (XLM) and Soroban smart contracts
- **Real-time Analytics**: Live portfolio tracking and performance metrics
- **Cyber-FinTech UI**: Modern, beautiful dashboard with cyberpunk aesthetics
- **PostgreSQL Backend**: Robust data storage and transaction history

## 🏗️ Project Structure

```
.
├── app/                    # Next.js 14 App Router frontend
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   ├── AgentStatus.tsx    # AI agent status display
│   ├── PortfolioMetrics.tsx  # Portfolio visualization
│   └── TransactionHistory.tsx # Transaction list
├── contracts/             # Soroban Rust smart contracts
├── backend/               # Node.js + PostgreSQL backend
├── scripts/               # Deployment and automation scripts
└── public/                # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** (Cyber-FinTech theme)

### Backend
- **Node.js**
- **PostgreSQL**
- **Express.js**

### Blockchain
- **Stellar Blockchain**
- **Soroban Smart Contracts** (Rust)

## 📦 Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL database
- Rust (for smart contracts)
- Stellar CLI

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Design Philosophy

The dashboard features a **Cyber-FinTech** aesthetic with:
- Dark cyberpunk color scheme
- Neon glow effects and animations
- Glassmorphism UI elements
- Smooth transitions and micro-interactions
- Real-time data visualization

## 📊 Features Roadmap

- [x] Beautiful Cyber-FinTech dashboard
- [x] Agent status monitoring
- [x] Portfolio metrics visualization
- [x] Transaction history
- [ ] Stellar wallet integration
- [ ] Soroban smart contracts
- [ ] PostgreSQL backend API
- [ ] AI strategy refinement engine
- [ ] Real-time market data
- [ ] Automated trading execution

## 🔐 Security

This project handles cryptocurrency transactions. Please ensure:
- Never commit `.env` files
- Use testnet for development
- Audit smart contracts before mainnet deployment
- Implement proper authentication

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Built with ❤️ using Next.js, Stellar, and AI
