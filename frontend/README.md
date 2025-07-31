# Intent Copilot Frontend

Beautiful, modern web interface for Intent Copilot - AI-powered DeFi trading with natural language commands.

## 🚀 Features

- **🎨 Modern UI**: Beautiful glassmorphism design with dark theme
- **🔗 Wallet Integration**: Seamless connection via Privy (embedded wallets + external)
- **🤖 AI Chat Interface**: Natural language trading commands
- **📈 Real-time Data**: Live trending tokens and market data
- **⚡ Multi-chain**: Base, Ethereum, Polygon, Arbitrum support
- **📱 Responsive**: Works perfectly on desktop and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Wallet**: Privy for authentication and wallet management
- **Blockchain**: Wagmi + Viem for Web3 interactions
- **Animations**: Framer Motion for smooth transitions
- **State**: React Query for data fetching
- **AI**: Anthropic Claude for natural language processing

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd intent-copilot-mvp/frontend

# Install dependencies
npm install
# or
pnpm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your API keys
```

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Required: Privy App ID (get from https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Required: AI API Key (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required: 1inch API Key (get from https://portal.1inch.dev)
ONEINCH_API_KEY=your_1inch_api_key_here

# Optional: Custom RPC endpoints
BASE_RPC=https://mainnet.base.org
MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/your-key
```

## 🚀 Development

```bash
# Start development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000 in your browser
```

## 🎯 Usage

1. **Connect Wallet**: Click "Connect Wallet" to authenticate via Privy
2. **Start Trading**: Use natural language commands like:
   - `"swap 1 ETH to USDC on base"`
   - `"sell 100 UNI if price >= 15 USD"`
   - `"show trending tokens"`
3. **View Trending**: Switch to the Trending tab for market data
4. **Execute Trades**: Follow AI recommendations and confirm transactions

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build
# or
pnpm build

# Start production server
npm start
# or
pnpm start
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/intent-copilot-mvp&project-name=intent-copilot&repository-name=intent-copilot-mvp)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify settings

## 🔒 Security

- **Private Keys**: Never exposed, handled securely by Privy
- **API Keys**: Server-side only, never sent to client
- **HTTPS**: Always use HTTPS in production
- **Wallet Security**: Privy handles secure wallet creation and management

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize the color scheme:

```js
theme: {
  extend: {
    colors: {
      primary: 'your-primary-color',
      secondary: 'your-secondary-color',
      // ...
    }
  }
}
```

### Branding

- Replace logo in `public/logo.png`
- Update metadata in `app/layout.tsx`
- Customize brand colors in CSS variables

## 📱 Mobile Experience

The app is fully responsive and optimized for mobile:

- Touch-friendly interface
- Optimized layouts for small screens
- PWA-ready (add to home screen)
- Fast loading with optimized assets

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build test
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the DeFi community. Powered by Base chain for optimal trading experience.