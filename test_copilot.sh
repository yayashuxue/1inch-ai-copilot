#!/bin/bash

echo "🤖 测试智能AI Copilot - 单一自然语言界面"
echo "============================================="

echo -e "\n🧠 AI智能意图检测测试:"
echo "现在不需要指定命令类型，AI会自动检测你的意图！"

echo -e "\n1. 智能Swap检测 💱"
echo "测试: 1 eth to usdc"
./copilot "1 eth to usdc" --dry-run

echo -e "\n测试: I want to trade my 0.5 weth for dai with minimal slippage"
./copilot "I want to trade my 0.5 weth for dai with minimal slippage" --dry-run

echo -e "\n测试: convert 1000 usdc to ethereum please"
./copilot "convert 1000 usdc to ethereum please" --dry-run

echo -e "\n2. 智能Stop Order检测 🎯"
echo "测试: sell 100 uni when price hits 15 dollars"
./copilot "sell 100 uni when price hits 15 dollars" --dry-run

echo -e "\n测试: dump all my 500 MATIC if it reaches 0.80 cents"
./copilot "dump all my 500 MATIC if it reaches 0.80 cents" --dry-run

echo -e "\n3. 智能Trending检测 📈"
echo "测试: what's trending on base"
./copilot "what's trending on base"

echo -e "\n测试: show me hot tokens on polygon"
./copilot "show me hot tokens on polygon"

echo -e "\n4. 系统状态检查 ⚙️"
./copilot status

echo -e "\n🎉 革命性升级完成！"
echo "现在你可以用完全自然的语言与AI对话："
echo "  ✅ '交易我的ETH换USDC'"
echo "  ✅ '当UNI涨到15美元时卖掉'"  
echo "  ✅ '显示Base链上的热门代币'"
echo "  ✅ 'I want to convert my tokens with low slippage'"
echo ""
echo "AI会自动理解你的意图并路由到正确的功能！🚀"

