# Intent Copilot MVP

> **Goal:** Turn natural‑language trading commands into fully‑formed 1inch Intents or Limit‑Order predicates, sign locally, push to 1inch APIs and stream execution status.

A CLI and web application that leverages AI to parse natural language trading commands and execute them through the 1inch protocol using Intents, Limit Orders, and price-triggered predicates.

---

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd intent-copilot-mvp
pnpm install

# Copy environment template
cp .env.sample .env
# Edit .env to add your 1INCH_API_KEY and RPC endpoints

# Example commands (once implemented)
./copilot swap "2 eth to usdc on polygon low slippage"
./copilot stop "sell 100 uni if price >= 12 usd"
./copilot trending --chain polygon
```

---

## 📁 Project Structure

```
intent-copilot-mvp/
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── ai/
│   │   ├── intentParser.ts      # LLM prompt → draft params
│   │   └── paramEngine.ts       # Volatility/gas/finality calculators
│   ├── core/
│   │   ├── predicateBuilder.ts  # Chainlink predicate constructors
│   │   ├── orderBuilder.ts      # Limit Order & Intent builders
│   │   ├── trendingFetcher.ts   # Top trending tokens by volume
│   │   └── gridEngine.ts        # Grid/TWAP utilities
│   ├── web/                     # Next.js web application
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── types.ts                 # Shared TypeScript definitions
├── .env.sample
├── package.json
└── README.md
```

---

## 🎯 Features

### Core Functionality
- **Natural Language Parsing**: Convert plain English to trading parameters
- **1inch Integration**: Direct integration with 1inch Fusion and Limit Orders
- **Price Triggers**: Stop-loss and take-profit orders using Chainlink oracles
- **Cross-chain Swaps**: Seamless trading across multiple networks
- **Trending Tokens**: Real-time trending token discovery

### Supported Commands
- `swap` - Execute immediate swaps with custom parameters
- `stop` - Create price-triggered conditional orders
- `trending` - Display trending tokens by volume and price movement
- `status` - Check order execution status

---

## 🛠️ Development Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | CLI foundation & natural language parser | 🔄 In Progress |
| Phase 2 | 1inch Fusion integration | 📋 Planned |
| Phase 3 | Stop-order predicates with Chainlink | 📋 Planned |
| Phase 4 | Trending token widget | 📋 Planned |
| Phase 5 | Web UI with Privy wallet integration | 📋 Planned |
| Phase 6 | Advanced parameter engine (volatility, gas optimization) | 📋 Planned |

---

## 🔧 Technical Architecture

### AI Integration
- **LLM Provider**: OpenAI GPT-4 for natural language understanding
- **Intent Parsing**: Regex + AI completion for parameter extraction
- **Parameter Optimization**: ML-based gas and slippage calculation

### Blockchain Integration
- **1inch Protocol**: Fusion swaps and Limit Order protocol
- **Chainlink Oracles**: Price feeds for conditional orders
- **Multi-chain Support**: Ethereum, Polygon, Arbitrum, and more

### API Integration
```typescript
// Example: Building a price-triggered predicate
import { buildGtPrice } from './core/predicateBuilder';

const predicate = buildGtPrice(
  "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // ETH/USD feed
  2000 // $2000 trigger price
);
```

---

## 🌐 Web Application

The web interface will feature:
- **Chat Interface**: Natural language command input
- **Wallet Integration**: Privy embedded wallets for Web2 users
- **Real-time Status**: Live order tracking and execution updates
- **Trending Dashboard**: Market insights and token discovery

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Wallet**: Privy + wagmi for wallet connectivity
- **AI**: LangChain.js for in-browser AI orchestration
- **Deployment**: Vercel Edge Functions

---

## 📚 API Reference

### 1inch API Endpoints
- **Fusion Swaps**: `POST /swap/v6.0/{chain}/intent`
- **Limit Orders**: `POST /orderbook/v5.0/{chain}/limitOrder`
- **Token Data**: `GET /token/v1.2/{chain}/tokens`
- **Price Quotes**: `GET /quote/v1.1/{chain}/tokens/{address}`

### Environment Variables
```bash
# Required
ONEINCH_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here

# RPC Endpoints
MAINNET_RPC=https://...
POLYGON_RPC=https://...
ARBITRUM_RPC=https://...

# Web App (when implemented)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

---

## 🔒 Security Considerations

- **Private Key Management**: Keys never leave the client environment
- **Oracle Dependency**: Predicate execution relies on Chainlink uptime
- **API Key Protection**: Server-side proxy shields 1inch API credentials
- **Input Validation**: Comprehensive sanitization of natural language inputs

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: [Wiki](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

*Built with ❤️ for the DeFi community*
