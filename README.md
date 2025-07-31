# Intent Copilot MVP

> **Goal:** Turn natural‑language trading commands into fully‑formed 1inch Intents or Limit‑Order predicates, sign locally, push to 1inch APIs and stream execution status.

A CLI application that leverages AI to parse natural language trading commands and execute them through the 1inch protocol using Intents, Limit Orders, and price-triggered predicates. **Now fully implemented with Base chain support!**

---

## 🚀 Quick Start

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
├── src/
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
├── .env.sample                  # Environment variables template
├── package.json
└── README.md
```

---

## 🎯 Features

### ✅ Implemented

- **Natural Language Parsing**: Regex + AI parsing for trading commands
- **Base Chain Support**: Full integration with Base network (8453)
- **CLI Interface**: Beautiful command-line interface with help and validation
- **Swap Commands**: Parse "swap X token to Y token" commands
- **Stop Orders**: Parse "sell X token if price >= Y" conditional orders
- **Trending Tokens**: Fetch trending tokens by volume from 1inch API
- **Dry Run Mode**: Test commands without executing transactions
- **Multi-chain Support**: Base, Ethereum, Polygon, Arbitrum

### 🔄 In Progress

- **1inch Integration**: API integration ready, needs wallet connection
- **Chainlink Predicates**: Price feed integration for conditional orders
- **Transaction Execution**: Wallet integration and signing

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
- **AI Fallback**: Claude 3.5 Sonnet for complex command interpretation
- **Token Normalization**: Automatic symbol and chain name resolution

> **Why Claude?** We use Anthropic's Claude 3.5 Sonnet model for its superior reasoning capabilities in parsing complex DeFi trading commands and its excellent JSON output formatting for structured data extraction.

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
2. **Anthropic API**: Get your API key from [Anthropic Console](https://console.anthropic.com/)

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

| Phase      | Feature                                    | Status        |
| ---------- | ------------------------------------------ | ------------- |
| ✅ Phase 1 | CLI foundation & natural language parser   | **Completed** |
| ✅ Phase 2 | Base chain integration & trending tokens   | **Completed** |
| 🔄 Phase 3 | Wallet integration & transaction execution | In Progress   |
| 📋 Phase 4 | Chainlink predicates & stop orders         | Planned       |
| 📋 Phase 5 | Web UI with Privy wallet integration       | Planned       |
| 📋 Phase 6 | Advanced strategies (grid, TWAP, DCA)      | Planned       |

---

## 🧪 Testing

```bash
# Build and test
pnpm build
pnpm test

# Test CLI without API keys
./copilot swap "swap 1 eth to usdc" --dry-run
./copilot stop "sell 100 uni if price >= 12" --dry-run

# Test with API keys (set in .env)
./copilot trending --chain base
./copilot status
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
