#!/bin/bash

echo "🤖 Testing Intelligent AI Copilot - Single Natural Language Interface"
echo "======================================================================"

echo -e "\n🧠 AI Intent Detection Tests:"
echo "No need to specify command types - AI automatically detects your intent!"

echo -e "\n1. Smart Swap Detection 💱"
echo "Test: 1 eth to usdc"
./copilot "1 eth to usdc" --dry-run

echo -e "\nTest: I want to trade my 0.5 weth for dai with minimal slippage"
./copilot "I want to trade my 0.5 weth for dai with minimal slippage" --dry-run

echo -e "\nTest: convert 1000 usdc to ethereum please"
./copilot "convert 1000 usdc to ethereum please" --dry-run

echo -e "\n2. Smart Stop Order Detection 🎯"
echo "Test: sell 100 uni when price hits 15 dollars"
./copilot "sell 100 uni when price hits 15 dollars" --dry-run

echo -e "\nTest: dump all my 500 MATIC if it reaches 0.80 cents"
./copilot "dump all my 500 MATIC if it reaches 0.80 cents" --dry-run

echo -e "\n3. Smart Trending Detection 📈"
echo "Test: what's trending on base"
./copilot "what's trending on base"

echo -e "\nTest: show me hot tokens on polygon"
./copilot "show me hot tokens on polygon"

echo -e "\n4. System Status Check ⚙️"
./copilot status

echo -e "\n🎉 Revolutionary Upgrade Complete!"
echo "Now you can talk to AI in completely natural language:"
echo "  ✅ 'trade my ETH for USDC'"
echo "  ✅ 'sell UNI when it hits 15 dollars'"  
echo "  ✅ 'show trending tokens on Base'"
echo "  ✅ 'I want to convert my tokens with low slippage'"
echo ""
echo "AI automatically understands your intent and routes to the right function! 🚀"

