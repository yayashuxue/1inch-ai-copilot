#!/bin/bash

echo "🚀 测试 1inch AI Copilot"
echo "======================"

echo -e "\n1. 检查状态..."
./copilot status

echo -e "\n2. 测试 Swap 命令 (干跑模式)..."
echo "测试: swap 1 eth to usdc"
./copilot swap "swap 1 eth to usdc" --dry-run

echo -e "\n测试: 2 eth to usdt on polygon"
./copilot swap "2 eth to usdt on polygon" --dry-run

echo -e "\n3. 测试 Stop Order 命令..."
echo "测试: sell 100 uni if price >= 15 usd"
./copilot stop "sell 100 uni if price >= 15 usd" --dry-run

echo -e "\n测试: buy 50 eth if price <= 2500 usd"
./copilot stop "buy 50 eth if price <= 2500 usd" --dry-run

echo -e "\n4. 测试 Trending 命令..."
echo "测试: Base 链热门代币"
./copilot trending --chain base --limit 5

echo -e "\n5. 显示帮助信息..."
./copilot --help

echo -e "\n✅ 测试完成！"

