#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { Wallet, JsonRpcProvider } from 'ethers';
import { parse } from './ai/intentParser';
import { getTopTrending, getChainName, formatVolume, formatPriceChange } from './core/trendingFetcher';
import { executeIntent, validateDraft, estimateGasCost } from './core/orderBuilder';
import { ChainId, SwapOptions, StopOptions, TrendingOptions, TradingMode } from './types';

// Load environment variables
dotenv.config();

const program = new Command();

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                    🚀 Intent Copilot MVP                      ║
║           AI-Powered DeFi Trading with Natural Language       ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Global configuration
const config = {
  defaultChain: ChainId.BASE,
  defaultSlippage: 1.0,
  apiTimeout: 30000,
};

/**
 * Setup CLI program with intelligent single command
 */
function setupCLI() {
  program
    .name('copilot')
    .description('AI-powered DeFi trading assistant')
    .version('0.3.0')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--dry-run', 'Simulate operations without executing')
    .hook('preAction', () => {
      console.log(chalk.cyan(banner));
    });

  // Main intelligent command - AI detects intent automatically
  program
    .argument('[command...]', 'Natural language command (e.g., "1 eth to usdc", "sell uni at 15", "trending on base")')
    .option('-c, --chain <chain>', 'Target blockchain (base, ethereum, polygon)', 'base')
    .option('-s, --slippage <percent>', 'Maximum slippage percentage', '1.0')
    .option('-d, --deadline <minutes>', 'Transaction deadline in minutes', '20')
    .option('--dry-run', 'Simulate the operation without executing')
    .action(async (command: string[], options: any) => {
      if (command.length === 0) {
        console.log(chalk.yellow('💡 Usage examples:'));
        console.log(chalk.gray('  copilot "1 eth to usdc"'));
        console.log(chalk.gray('  copilot "sell 100 uni if price >= 15"'));
        console.log(chalk.gray('  copilot "what\'s trending on base"'));
        console.log(chalk.gray('  copilot "exchange 0.5 weth for dai with low slippage"'));
        console.log(chalk.gray('  copilot status'));
        return;
      }
      
      const input = command.join(' ');
      await handleIntelligentCommand(input, options);
    });

  // Keep status as a separate command since it's system-level
  program
    .command('status')
    .description('Check API connectivity and configuration')
    .action(async () => {
      await handleStatusCommand();
    });

  return program;
}

/**
 * Intelligent command handler - AI detects intent and routes accordingly
 */
async function handleIntelligentCommand(input: string, options: any) {
  const spinner = ora('🤖 AI analyzing your request...').start();
  
  try {
    // Let AI parse and detect intent
    const draft = await parse(input);
    
    spinner.stop();
    console.log(chalk.blue(`🎯 AI detected: ${draft.mode.toUpperCase()} operation`));
    
    // Route to appropriate handler based on AI detection
    switch (draft.mode) {
      case TradingMode.SWAP:
        await handleSwapIntent(draft, options);
        break;
      case TradingMode.STOP:
        await handleStopIntent(draft, options);
        break;
      case TradingMode.TRENDING:
        await handleTrendingIntent(input, options);
        break;
      default:
        console.log(chalk.red(`❌ Unsupported operation: ${draft.mode}`));
        console.log(chalk.yellow('💡 Try: "1 eth to usdc", "sell uni at 15", or "trending on base"'));
    }
    
  } catch (error) {
    spinner.fail(`Failed to process request: ${error}`);
    console.log(chalk.red(`Error details: ${error}`));
    
    // Helpful suggestions on error
    console.log(chalk.yellow('\n💡 Try these examples:'));
    console.log(chalk.gray('  "1 eth to usdc"'));
    console.log(chalk.gray('  "sell 100 uni when price hits 15"'));
    console.log(chalk.gray('  "trending tokens on base"'));
  }
}

/**
 * Handle swap intent detected by AI
 */
async function handleSwapIntent(draft: any, options: any) {
  try {
    // Apply CLI options if provided
    draft.chain = parseChain(options.chain || 'base');
    draft.slippage = parseFloat(String(options.slippage || '1.0'));
    draft.deadline = parseInt(String(options.deadline || '20'));
    
    // Validate the draft
    const validation = validateDraft(draft);
    if (!validation.valid) {
      console.log(chalk.red('❌ Invalid swap parameters:'));
      validation.errors.forEach(error => console.log(chalk.red(`   ${error}`)));
      return;
    }

    // Show parsed parameters
    console.log(chalk.green('✅ Swap details:'));
    console.log(chalk.blue(`   From: ${draft.amount} ${draft.src}`));
    console.log(chalk.blue(`   To: ${draft.dst}`));
    console.log(chalk.blue(`   Chain: ${getChainName(draft.chain)}`));
    console.log(chalk.blue(`   Slippage: ${draft.slippage}%`));
    console.log('');

    if (options.dryRun || program.opts().dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No transactions will be executed'));
      console.log(chalk.gray(`Would execute: ${JSON.stringify(draft, null, 2)}`));
      return;
    }

    // For now, show what would be executed since we don't have wallet setup
    console.log(chalk.yellow('⚠️  Wallet integration not implemented in this demo'));
    console.log(chalk.gray('To execute this swap, you would need to:'));
    console.log(chalk.gray('1. Set up a wallet connection'));
    console.log(chalk.gray('2. Approve token spending (if needed)'));
    console.log(chalk.gray('3. Execute the swap transaction'));
    
  } catch (error) {
    console.log(chalk.red(`❌ Swap processing failed: ${error}`));
  }
}

/**
 * Handle stop order intent detected by AI
 */
async function handleStopIntent(draft: any, options: any) {
  try {
    draft.chain = parseChain(options.chain || 'base');
    
    // Validate the draft
    const validation = validateDraft(draft);
    if (!validation.valid) {
      console.log(chalk.red('❌ Invalid stop order parameters:'));
      validation.errors.forEach(error => console.log(chalk.red(`   ${error}`)));
      return;
    }

    console.log(chalk.green('✅ Stop order details:'));
    console.log(chalk.blue(`   Action: ${draft.src !== 'USDC' ? 'SELL' : 'BUY'} ${draft.amount} ${draft.src !== 'USDC' ? draft.src : draft.dst}`));
    console.log(chalk.blue(`   Trigger: Price ${draft.src !== 'USDC' ? '>=' : '<='} $${draft.trigger}`));
    console.log(chalk.blue(`   Chain: ${getChainName(draft.chain)}`));
    console.log('');

    if (options.dryRun || program.opts().dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No orders will be created'));
      return;
    }

    console.log(chalk.yellow('⚠️  Stop orders require:'));
    console.log(chalk.gray('1. Wallet connection and signing'));
    console.log(chalk.gray('2. Chainlink price feed integration'));
    console.log(chalk.gray('3. 1inch Limit Order Protocol'));
    console.log(chalk.gray('This feature will be available in the next version.'));
    
  } catch (error) {
    console.log(chalk.red(`❌ Stop order processing failed: ${error}`));
  }
}

/**
 * Handle trending intent detected by AI
 */
async function handleTrendingIntent(input: string, options: any) {
  // Extract parameters from the natural language
  const chainId = parseChain(options.chain || extractChainFromText(input));
  const limit = parseInt(String(options.limit || extractLimitFromText(input) || '10'));
  
  const spinner = ora(`Fetching trending tokens on ${getChainName(chainId)}...`).start();
  
  try {
    const trendingTokens = await getTopTrending(chainId, limit, 'volume');
    
    spinner.stop();
    console.log(chalk.green(`🔥 Top ${limit} Trending Tokens on ${getChainName(chainId)}\n`));
    
    // Table header
    console.log(chalk.bold.blue('Rank  Symbol           Price      24h Change    Volume (24h)'));
    console.log(chalk.gray('─'.repeat(65)));
    
    trendingTokens.forEach((trending, index) => {
      const token = trending.token;
      const rank = chalk.yellow(`#${index + 1}`.padEnd(6));
      const symbol = chalk.white(token.symbol.padEnd(15));
      const price = token.price 
        ? chalk.green(`$${token.price.toFixed(6)}`.padEnd(11))
        : chalk.gray('N/A'.padEnd(11));
      const change = token.priceChange24h 
        ? (token.priceChange24h >= 0 
          ? chalk.green(formatPriceChange(token.priceChange24h).padEnd(12))
          : chalk.red(formatPriceChange(token.priceChange24h).padEnd(12)))
        : chalk.gray('N/A'.padEnd(12));
      const volume = token.volume24h 
        ? chalk.cyan(formatVolume(token.volume24h))
        : chalk.gray('N/A');
      
      console.log(`${rank} ${symbol} ${price} ${change} ${volume}`);
    });
    
    console.log('');
    console.log(chalk.gray(`Chain: ${getChainName(chainId)} (${chainId})`));
    
  } catch (error) {
    spinner.fail(`Failed to fetch trending tokens: ${error}`);
    if (String(error).includes('API')) {
      console.log(chalk.yellow('💡 Make sure your ONEINCH_API_KEY is set in .env'));
    }
  }
}

/**
 * Handle status command
 */
async function handleStatusCommand() {
  console.log(chalk.blue('🔍 Checking Intent Copilot Status...\n'));
  
  // Check environment variables
  const requiredVars = ['ONEINCH_API_KEY', 'ANTHROPIC_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(chalk.red('❌ Missing environment variables:'));
    missingVars.forEach(varName => {
      console.log(chalk.red(`   - ${varName}`));
    });
    console.log(chalk.yellow('\n💡 Copy .env.sample to .env and fill in your API keys'));
    return;
  }
  
  console.log(chalk.green('✅ Environment variables configured'));
  
  // Test API connectivity
  console.log(chalk.blue('\n🌐 Testing API connectivity...'));
  
  try {
    const { validateAPIKey } = await import('./core/trendingFetcher');
    const isValid = await validateAPIKey();
    
    if (isValid) {
      console.log(chalk.green('✅ 1inch API connection successful'));
    } else {
      console.log(chalk.red('❌ 1inch API connection failed'));
    }
  } catch (error) {
    console.log(chalk.red(`❌ API test failed: ${error}`));
  }
  
  // Show configuration
  console.log(chalk.blue('\n⚙️  Current Configuration:'));
  console.log(chalk.gray(`   Default Chain: ${getChainName(config.defaultChain)}`));
  console.log(chalk.gray(`   Default Slippage: ${config.defaultSlippage}%`));
  console.log(chalk.gray(`   API Timeout: ${config.apiTimeout}ms`));
  
  console.log(chalk.green('\n🎉 Intent Copilot is ready to use!'));
  console.log(chalk.gray('Try: copilot swap "1 eth to usdc on base"'));
}

/**
 * Parse chain name to ChainId
 */
function parseChain(chainName: string): ChainId {
  const chainMap: Record<string, ChainId> = {
    'ethereum': ChainId.ETHEREUM,
    'eth': ChainId.ETHEREUM,
    'mainnet': ChainId.ETHEREUM,
    'base': ChainId.BASE,
    'polygon': ChainId.POLYGON,
    'matic': ChainId.POLYGON,
    'arbitrum': ChainId.ARBITRUM,
    'arb': ChainId.ARBITRUM,
    'optimism': ChainId.OPTIMISM,
    'op': ChainId.OPTIMISM,
  };
  
  return chainMap[chainName.toLowerCase()] || ChainId.BASE;
}

/**
 * Extract chain name from natural language text
 */
function extractChainFromText(text: string): string {
  const lowerCaseText = text.toLowerCase();
  if (lowerCaseText.includes('ethereum') || lowerCaseText.includes('eth') || lowerCaseText.includes('mainnet')) {
    return 'ethereum';
  }
  if (lowerCaseText.includes('base')) {
    return 'base';
  }
  if (lowerCaseText.includes('polygon') || lowerCaseText.includes('matic')) {
    return 'polygon';
  }
  if (lowerCaseText.includes('arbitrum') || lowerCaseText.includes('arb')) {
    return 'arbitrum';
  }
  if (lowerCaseText.includes('optimism') || lowerCaseText.includes('op')) {
    return 'optimism';
  }
  return 'base'; // Default
}

/**
 * Extract limit from natural language text
 */
function extractLimitFromText(text: string): number | undefined {
  const lowerCaseText = text.toLowerCase();
  const match = lowerCaseText.match(/(\d+)\s*tokens?/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

/**
 * Main entry point
 */
async function main() {
  try {
    const cli = setupCLI();
    await cli.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red(`Fatal error: ${error}`));
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:', promise, 'reason:', reason));
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main();
}

export { main };