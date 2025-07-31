# Intent Copilot MVP

> **Goal:** Turn natural‑language trading commands into fully‑formed 1inch Intents or Limit‑Order predicates, sign locally, push to 1inch APIs and stream execution status.

A modern web application that leverages AI to parse natural language trading commands and execute them through the 1inch protocol using Intents, Limit Orders, and price-triggered predicates. **Now fully implemented with Base chain support and mobile-responsive UI!**

---

## 📋 TODO List

### 🔄 High Priority (Next Sprint)

- [ ] **Fix markdown formatting in AI assistant chat messages** - Improve readability of AI responses with proper markdown rendering
- [ ] **Add conversation memory/context** - AI assistant should remember previous messages in the conversation
- [ ] **Implement actual transaction initiation** - Connect to 1inch API and enable real wallet transactions
- [ ] **Refactor into modular components** - Improve code maintainability and extensibility

### 📋 Medium Priority

- [ ] **Make CLI subset of webapp capabilities** - CLI should use the same core functionality as webapp
- [ ] **Add Chainlink predicates** - Price feed integration for conditional orders
- [ ] **Implement advanced strategies** - Grid trading, TWAP, DCA features

### ✅ Completed

- [x] **Mobile-responsive design** - Complete mobile optimization for all screen sizes
- [x] **Privy wallet authentication** - Working wallet connection and environment setup
- [x] **Web frontend development** - Beautiful React app with AI chat interface
- [x] **Base chain integration** - Full 1inch API integration and trending tokens

---

## 🚀 Quick Start

### Web Frontend (Recommended)

```bash
# Setup frontend
cd frontend
pnpm install

# Environment setup (use root .env file)
# Edit .env to add your PRIVY_APP_ID and API keys

# Start development server
pnpm dev

# Open http://localhost:3000 in your browser
```

### CLI Version

```bash
# Clone and setup
git clone <repository-url>
cd intent-copilot-mvp
pnpm install

# Copy environment template and configure your API keys
cp .env.sample .env
# Edit .env to add your 1INCH_API_KEY and ANTHROPIC_API_KEY

# Build the project
pnpm build

# Test the CLI
./copilot status

# Try some commands (works without API keys in dry-run mode)
./copilot swap "swap 1 eth to usdc on base" --dry-run
./copilot stop "sell 100 uni if price >= 12 usd" --dry-run
./copilot trending --chain base
```

---

## 📁 Project Structure

```
intent-copilot-mvp/
├── frontend/                    # React web application
│   ├── app/                     # Next.js app directory
│   ├── components/              # Reusable React components
│   │   ├── TradingInterface.tsx # Main chat interface
│   │   ├── TrendingTokens.tsx   # Trending tokens display
│   │   └── ConnectWallet.tsx    # Wallet connection
│   └── lib/                     # Utility libraries
├── src/                         # CLI application
│   ├── index.ts                 # CLI entry point with commander.js
│   ├── ai/
│   │   └── intentParser.ts      # Natural language → trading parameters
│   ├── core/
│   │   ├── predicateBuilder.ts  # Chainlink predicate constructors
│   │   ├── orderBuilder.ts      # 1inch order & intent builders
│   │   ├── trendingFetcher.ts   # Top trending tokens by volume
│   │   └── gridEngine.ts        # Grid/TWAP utilities (stubs)
│   └── types.ts                 # TypeScript definitions
├── dist/                        # Compiled JavaScript
├── copilot                      # Executable script
├── .env                         # Environment variables (main config)
├── package.json
└── README.md
```

---

## 🎯 Features

### ✅ Implemented

- **Natural Language AI Chat**: Beautiful web interface with AI-powered trading commands
- **Mobile-Responsive Design**: Perfect experience on all devices (phone, tablet, desktop)
- **Base Chain Support**: Full integration with Base network (8453)
- **Wallet Integration**: Privy authentication with multi-wallet support
- **Real-time Trending**: Live trending tokens with price data and volume metrics
- **Multi-chain UI**: Base, Ethereum, Polygon, Arbitrum support
- **CLI Interface**: Command-line interface for power users
- **Swap Commands**: Parse "swap X token to Y token" commands
- **Stop Orders**: Parse "sell X token if price >= Y" conditional orders
- **Dry Run Mode**: Test commands without executing transactions

### 🔄 In Progress

- **Transaction Execution**: Connecting AI commands to real 1inch transactions
- **Context Memory**: AI assistant remembering conversation history
- **Markdown Formatting**: Improved chat message rendering

### 📋 Planned

- **Chainlink Predicates**: Price feed integration for conditional orders
- **Advanced Strategies**: Grid trading, TWAP, DCA automation
- **Portfolio Management**: Track and manage multiple positions

---

## 🛠️ Usage Examples

### Swap Commands

```bash
# Basic swap
./copilot swap "swap 1 eth to usdc"

# With chain specification
./copilot swap "swap 0.5 eth to usdc on base"

# With slippage control
./copilot swap "swap 2 eth to usdc low slippage" --slippage 0.5

# Dry run (no execution)
./copilot swap "swap 1 eth to usdc" --dry-run
```

### Stop Orders

```bash
# Sell when price drops
./copilot stop "sell 100 uni if price <= 10 usd"

# Buy when price rises
./copilot stop "buy 50 uni if price >= 15 usd"

# Dry run stop order
./copilot stop "sell 100 uni if price >= 12 usd" --dry-run
```

### Trending Tokens

```bash
# Top 10 trending tokens on Base
./copilot trending --chain base

# Top 5 by volume
./copilot trending --chain base --limit 5 --sort-by volume

# Sort by price change
./copilot trending --chain polygon --sort-by price
```

### System Status

```bash
# Check configuration and API connectivity
./copilot status
```

---

## 🔧 Technical Architecture

### Natural Language Processing

- **Regex Parsing**: Fast pattern matching for common commands
- **AI Fallback**: Model-agnostic AI with Vercel AI SDK for complex command interpretation
- **Token Normalization**: Automatic symbol and chain name resolution

> **Why Vercel AI SDK?** We use Vercel's AI SDK for model-agnostic AI integration. This allows switching between Claude, GPT, Gemini, or other models without code changes. Currently optimized for Claude 3.5 Sonnet's superior DeFi reasoning capabilities.

### Blockchain Integration

- **1inch Protocol**: Fusion swaps and Limit Order protocol integration
- **Multi-chain**: Base (primary), Ethereum, Polygon, Arbitrum support
- **Token Discovery**: Real-time token data and trending analysis

### API Integration

```typescript
// Example: Parsing a swap command
const draft = await parse("swap 1 eth to usdc on base");
// Result: { mode: 'swap', src: 'ETH', dst: 'USDC', amount: '1', chain: 8453 }

// Example: Building a price predicate
const predicate = createTakeProfitPredicate("UNI", 15.0, ChainId.BASE);
```

---

## 📚 Configuration

### Environment Variables

```bash
# Required for full functionality
ONEINCH_API_KEY=your_1inch_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here

# RPC Endpoints (Base is primary)
BASE_RPC=https://mainnet.base.org
MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/your-key

# Default settings
DEFAULT_CHAIN=8453
DEFAULT_SLIPPAGE=1.0
```

### API Keys Setup

1. **1inch API**: Get your API key from [1inch Developer Portal](https://portal.1inch.dev/)
2. **AI Provider**: Choose your preferred AI provider:
   - **Anthropic**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
   - **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/)
   - **Google**: Get your API key from [Google AI Studio](https://makersuite.google.com/)

---

## 🎛️ CLI Commands

### Global Options

- `--dry-run`: Simulate operations without executing
- `--verbose`: Enable detailed logging
- `--help`: Show command help

### Available Commands

- `swap <command>`: Execute token swaps
- `stop <command>`: Create conditional stop orders
- `trending`: Show trending tokens
- `status`: Check system status

### Command Options

- `--chain <name>`: Target blockchain (base, ethereum, polygon, arbitrum)
- `--slippage <percent>`: Maximum slippage percentage
- `--limit <number>`: Number of results to show

---

## 🚧 Development Roadmap

| Phase      | Feature                                         | Status        |
| ---------- | ----------------------------------------------- | ------------- |
| ✅ Phase 1 | CLI foundation & natural language parser        | **Completed** |
| ✅ Phase 2 | Base chain integration & trending tokens        | **Completed** |
| ✅ Phase 3 | Web UI with Privy wallet integration            | **Completed** |
| 🔄 Phase 4 | Full wallet integration & transaction execution | In Progress   |
| 📋 Phase 5 | Chainlink predicates & stop orders              | Planned       |
| 📋 Phase 6 | Advanced strategies (grid, TWAP, DCA)           | Planned       |

---

## 🧪 Testing

```bash
# Build and test CLI
pnpm build
pnpm test

# Test CLI without API keys
./copilot swap "swap 1 eth to usdc" --dry-run
./copilot stop "sell 100 uni if price >= 12" --dry-run

# Test with API keys (set in .env)
./copilot trending --chain base
./copilot status

# Build and test frontend
cd frontend
pnpm install
pnpm build
pnpm dev
```

---

## 🔒 Security Considerations

- **Private Keys**: Never stored on disk, wallet integration uses secure providers
- **API Keys**: Stored in environment variables, never committed to git
- **Input Validation**: Comprehensive validation of all parsed commands
- **Oracle Dependency**: Chainlink price feeds for reliable price data

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Usage

### Quick Help

```bash
./copilot --help              # Show all commands
./copilot swap --help         # Show swap command options
./copilot status              # Check system configuration
```

### Common Issues

- **Missing API keys**: Copy `.env.sample` to `.env` and add your keys
- **Command not found**: Make sure you ran `pnpm build` first
- **Parse errors**: Try simpler commands or check the examples above

---

_Built with ❤️ for the DeFi community. Focused on Base chain for the best trading experience._
