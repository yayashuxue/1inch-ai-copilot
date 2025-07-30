# Intent Copilot MVP v0.3

> **Goal:** Turn natural‑language trading commands into fully‑formed 1inch Intents or Limit‑Order predicates, sign locally, push to 1inch APIs and stream execution status — **now with stop‑order (price trigger) & trending‑token widgets**.

---

## 1 Quick Demo

```bash
# 0 Install deps & set env
pnpm install && cp .env.sample .env  # fill 1INCH_API_KEY & RPCs

# 1 One‑liner — single‑chain Fusion swap
./copilot swap "2 eth to usdc on polygon low slippage"

# 2 Cross‑chain Fusion+ intent
./copilot swap "5 eth from mainnet to arbitrum, <0.3% loss, finish <6m"

# 3 Stop‑order predicate (UNI ≥ 12 USD sell 100 UNI)
./copilot stop "sell 100 uni if price >= 12 usd"

# 4 Show trending memecoins (24h volume top‑10)
./copilot trending --chain polygon
```

---

## 2 Directory layout

```text
intent-copilot-mvp/
├─ src/
│  ├─ index.ts                # CLI entry
│  ├─ ai/intentParser.ts      # LLM prompt → draft params
│  ├─ ai/paramEngine.ts       # σ / gas / finality calculators (TODO)
│  ├─ core/predicateBuilder.ts# NEW: build Chainlink predicate bytes
│  ├─ core/gridEngine.ts      # grid/TWAP utils (stub)
│  ├─ core/trendingFetcher.ts # NEW: top‑N trending tokens by vol/∆px
│  ├─ core/orderBuilder.ts    # Limit‑Order & Intent constructors
│  ├─ core/keeper.ts          # (optional) cron for TWAP
│  └─ types.ts
├─ .env.sample
├─ README.md  (this file)
└─ package.json
```

---

## 3 Install & Run

```bash
pnpm i
# swap demo
NETWORK=mainnet ./copilot swap "0.1 eth to usdt on arbitrum"
# stop‑order demo (mainnet)
./copilot stop "sell 50 uni if price >= 12 usd"
# trending demo (polygon)
./copilot trending --chain polygon --limit 10
```

---

## 4 Key Files

### 4.1 `src/ai/intentParser.ts` (excerpt)

```ts
export async function parse(text: string): Promise<Draft> {
  // regex & openai chat‑completion to extract token, amount, targetPrice …
  // returns {mode: 'swap' | 'stop', src, dst, amount, trigger, chain}
}
```

### 4.2 `src/core/predicateBuilder.ts`  **NEW**

```ts
import { AbiCoder } from 'ethers';
// Build predicate: Chainlink priceFeed >= targetUsd
export function buildGtPrice(feed: string, targetUsd: number): string {
  const selector = '0x3b3...9a4d';   // gt(uint256,uint256)
  const priceUint = BigInt(Math.round(targetUsd * 1e8)); // 8 decimals
  return AbiCoder.defaultAbiCoder().encode([
    'bytes4', 'uint256', 'uint256'
  ], [selector, BigInt(feed), priceUint]);
}
```

### 4.3 `src/core/trendingFetcher.ts`  **NEW**

```ts
import axios from 'axios';
export async function topTrending(chainId: number, limit=10) {
  const { data } = await axios.get(
    `https://api.1inch.dev/token/v1.2/${chainId}/tokens`,
    { headers: { Authorization: `Bearer ${process.env.API_KEY}` }});
  return Object.values<Token>(data.tokens)
    .filter(t => t.volume24h && t.priceChange24h)
    .sort((a,b) => b.volume24h - a.volume24h)
    .slice(0, limit);
}
```

### 4.4 `src/core/orderBuilder.ts` (predicate flow)

```ts
if (draft.mode === 'stop') {
  const predicate = buildGtPrice(feedAddr, draft.trigger);
  const order  = builder.buildLimitOrder({ ...base, predicate });
  const sig    = await builder.buildOrderSignature(wallet, order);
  await pushToOrderbook(order, sig);
}
```

---

## 5 Five‑Day Iteration Plan

| Day | Feature                                             | Status |
| --- | --------------------------------------------------- | ------ |
| D‑5 | Chat parser, basic swap (CLI)                       | ✅      |
| D‑4 | **Stop‑order predicate** (CLI)                      | ✅      |
| D‑3 | Trending widget (CLI)                               | ✅      |
| D‑2 | **🌐 Web App front‑end scaffold** (Next.js + wagmi) | 🔜     |
| D‑1 | σ / gas / finality paramEngine + Demo video         | 🔜     |

---

## 6 Web App — AI‑Native Next.js Scaffold

> **Switch:** adopt a minimal **Next.js 14 + Privy (embedded‑wallet) + LangChain.js** stack.  No Solidity hot‑reload; focus on AI orchestration & API proxies.

### 6.1 Why AI‑centric Next.js?

| Need                                | AI‑Native Stack Win                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Natural‑language parsing & RAG      | LangChain.js + OpenAI functions built into `/lib/ai` hooks                      |
| Zero‑friction wallet for Web2 users | **Privy** social‑login + embedded wallet; wagmi v7 under the hood               |
| Edge‑function proxies               | Next.js App Router API routes deployable to Vercel Edge (shields 1inch API key) |
| Fast shipping                       | `npx create-next-app` ≤ 30 s; no Hardhat overhead                               |

### 6.2 Bootstrap

```bash
npx create-next-app@latest intent-copilot-ai --typescript --tailwind
cd intent-copilot-ai && pnpm i @privy-io/react-auth wagmi viem langchain openai
```

1. **Privy config**

   ````tsx // app/providers.tsx
   <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}>…```
   ````
2. **Add Copilot modules**

   ```bash
   cp -r ../intent-copilot-mvp/src/core ./lib/copilot-core
   cp -r ../intent-copilot-mvp/src/ai   ./lib/copilot-ai
   ```
3. **API proxy** `/app/api/intent/route.ts`

   ```ts
   export async function POST(req: Request){
     const body = await req.json();
     const r = await fetch('https://api.1inch.dev/orderbook/v5.0/1/limitOrder',{
       method:'POST', headers:{'Content-Type':'application/json',
       Authorization:`Bearer ${process.env.ONEINCH_KEY}`}, body:JSON.stringify(body)});
     return Response.json(await r.json());
   }
   ```
4. **Run**  `pnpm dev` ➜ [http://localhost:3000](http://localhost:3000)

### 6.3 Folder Map

```text
app/
 ├─ page.tsx            # Chat + Trending UI
 ├─ api/
 │   └─ intent/route.ts # 1inch proxy
 └─ components/
      ├─ Chat.tsx       # uses langchain & intentParser
      ├─ Trending.tsx   # calls trendingFetcher
      └─ Status.tsx     # live order status
lib/
 ├─ copilot-core/…      # predicateBuilder, orderBuilder
 └─ copilot-ai/…        # intentParser, paramEngine (todo)
```

### 6.4 Iteration Adjustments

| Day    | Task                                         | Status |
| ------ | -------------------------------------------- | ------ |
| D‑2 AM | **Next.js + Privy scaffold**, wallet connect | 🔜     |
| D‑2 PM | Port Chat / Trending / Status components     | 🔜     |
| D‑1    | Edge proxy + order status SSE ➜ Sepolia demo | 🔜     |

---

## 7 API cheat‑sheet API cheat‑sheet API cheat‑sheet API cheat‑sheet

* **Swap / Intent** `POST /swap/v6.0/{chain}/intent`
* **Orderbook** `POST /orderbook/v5.0/{chain}/limitOrder`
* **Token API** `GET /token/v1.2/{chain}/tokens`
* **Spot‑Price** `GET /quote/v1.1/{chain}/tokens/{address}`

---

## 7 Security & TODO

* 🔒 Store private key via wallet provider only; server never touches key.
* 🛑 Predicate flow depends on Chainlink oracle uptime.
* 🚧 paramEngine (EWMA σ + gas) planned for v0.4.
