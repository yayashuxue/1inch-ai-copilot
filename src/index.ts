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
 * Setup CLI program
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

  // Swap command
  program
    .command('swap')
    .description('Execute token swaps with natural language')
    .argument('<command>', 'Natural language swap command (e.g., "swap 1 eth to usdc")')
    .option('-c, --chain <chain>', 'Target blockchain (base, ethereum, polygon)', 'base')
    .option('-s, --slippage <percent>', 'Maximum slippage percentage', '1.0')
    .option('-d, --deadline <minutes>', 'Transaction deadline in minutes', '20')
    .option('--dry-run', 'Simulate the swap without executing')
    .action(async (command: string, options: SwapOptions) => {
      await handleSwapCommand(command, options);
    });

  // Stop order command
  program
    .command('stop')
    .description('Create conditional stop orders triggered by price')
    .argument('<command>', 'Natural language stop command (e.g., "sell 100 uni if price >= 12 usd")')
    .option('-c, --chain <chain>', 'Target blockchain', 'base')
    .option('--dry-run', 'Simulate the stop order without executing')
    .action(async (command: string, options: StopOptions) => {
      await handleStopCommand(command, options);
    });

  // Trending command
  program
    .command('trending')
    .description('Show trending tokens by volume and price movement')
    .option('-c, --chain <chain>', 'Target blockchain', 'base')
    .option('-l, --limit <number>', 'Number of tokens to show', '10')
    .option('-s, --sort-by <criteria>', 'Sort by: volume, price, marketcap, score', 'volume')
    .action(async (options: TrendingOptions) => {
      await handleTrendingCommand(options);
    });

  // Status command
  program
    .command('status')
    .description('Check API connectivity and configuration')
    .action(async () => {
      await handleStatusCommand();
    });

  return program;
}

/**
 * Handle swap command
 */
async function handleSwapCommand(command: string, options: SwapOptions) {
  const spinner = ora('Parsing swap command...').start();
  
  try {
    // Parse the natural language command
    const draft = await parse(command);
    draft.chain = parseChain(options.chain || 'base');
    draft.slippage = parseFloat(String(options.slippage || '1.0'));
    draft.deadline = parseInt(String(options.deadline || '20'));
    
    spinner.text = 'Validating parameters...';
    
    // Validate the draft
    const validation = validateDraft(draft);
    if (!validation.valid) {
      spinner.fail('Invalid parameters');
      validation.errors.forEach(error => console.log(chalk.red(`❌ ${error}`)));
      return;
    }

    spinner.text = 'Estimating gas costs...';
    
    // Show parsed parameters
    spinner.stop();
    console.log(chalk.green('✅ Command parsed successfully:'));
    console.log(chalk.blue(`   Mode: ${draft.mode}`));
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
    spinner.fail(`Failed to process swap: ${error}`);
    console.log(chalk.red(`Error details: ${error}`));
  }
}

/**
 * Handle stop order command
 */
async function handleStopCommand(command: string, options: StopOptions) {
  const spinner = ora('Parsing stop order command...').start();
  
  try {
    // Parse the natural language command
    const draft = await parse(command);
    draft.chain = parseChain(options.chain || 'base');
    
    if (draft.mode !== TradingMode.STOP) {
      spinner.fail('Invalid command for stop order');
      console.log(chalk.red('❌ Command does not appear to be a stop order'));
      return;
    }

    spinner.text = 'Validating stop order parameters...';
    
    // Validate the draft
    const validation = validateDraft(draft);
    if (!validation.valid) {
      spinner.fail('Invalid parameters');
      validation.errors.forEach(error => console.log(chalk.red(`❌ ${error}`)));
      return;
    }

    spinner.stop();
    console.log(chalk.green('✅ Stop order parsed successfully:'));
    console.log(chalk.blue(`   Action: ${draft.src !== 'USDC' ? 'SELL' : 'BUY'} ${draft.amount} ${draft.src !== 'USDC' ? draft.src : draft.dst}`));
    console.log(chalk.blue(`   Trigger: Price ${draft.src !== 'USDC' ? '<=' : '>='} $${draft.trigger}`));
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
    spinner.fail(`Failed to process stop order: ${error}`);
    console.log(chalk.red(`Error details: ${error}`));
  }
}

/**
 * Handle trending command
 */
async function handleTrendingCommand(options: TrendingOptions) {
  const chainId = parseChain(options.chain || 'base');
  const limit = parseInt(String(options.limit || '10'));
  const sortBy = options.sortBy as 'volume' | 'price' | 'marketcap' | 'score' || 'volume';
  
  const spinner = ora(`Fetching trending tokens on ${getChainName(chainId)}...`).start();
  
  try {
    const trendingTokens = await getTopTrending(chainId, limit, sortBy);
    
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
    console.log(chalk.gray(`Data sorted by: ${sortBy}`));
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