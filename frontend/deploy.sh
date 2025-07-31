#!/bin/bash

# Intent Copilot Frontend Deployment Script
# This script helps deploy the frontend to various platforms

set -e

echo "🚀 Intent Copilot Frontend Deployment"
echo "======================================"

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Parse command line arguments
PLATFORM=${1:-"vercel"}
BUILD_ONLY=${2:-false}

echo "📦 Installing dependencies..."
pnpm install

echo "🔍 Type checking..."
pnpm run type-check

echo "🧹 Linting..."
pnpm run lint

echo "🏗️  Building application..."
pnpm run build

if [ "$BUILD_ONLY" = "true" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build files are in the .next directory"
    exit 0
fi

case $PLATFORM in
    "vercel")
        echo "🚀 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
            echo "💡 Or deploy manually at https://vercel.com"
        fi
        ;;
    "netlify")
        echo "🚀 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=.next
        else
            echo "❌ Netlify CLI not found. Install with: npm i -g netlify-cli"
            echo "💡 Or deploy manually at https://netlify.com"
        fi
        ;;
    "static")
        echo "📦 Building static export..."
        pnpm run build
        echo "✅ Static files ready for deployment!"
        echo "📁 Deploy the .next directory to your hosting provider"
        ;;
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "💡 Supported platforms: vercel, netlify, static"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔗 Don't forget to:"
echo "   1. Set environment variables in your hosting platform"
echo "   2. Configure custom domain (if needed)"
echo "   3. Set up automatic deployments from Git"
echo ""
echo "📚 Environment variables needed:"
echo "   - NEXT_PUBLIC_PRIVY_APP_ID"
echo "   - ANTHROPIC_API_KEY"
echo "   - ONEINCH_API_KEY"