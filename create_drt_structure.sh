#!/bin/bash

echo "🚀 Starting dApp and Monitoring Service setup for drt-pREWA..."

# 1. Create all directories using mkdir -p for safety
# -p flag ensures that parent directories are created if they don't exist.
echo ">> Creating directory structure..."

# Monitoring Service Directories
mkdir -p monitoring/src/listeners
mkdir -p monitoring/src/notifiers

# Frontend dApp Directories
mkdir -p src/app/'(admin)'/access-control
mkdir -p src/app/'(admin)'/emergency
mkdir -p src/app/'(admin)'/parameters
mkdir -p src/app/'(admin)'/upgrades
mkdir -p src/app/'(main)'/dashboard
mkdir -p src/app/'(main)'/liquidity
mkdir -p src/app/'(main)'/stake
mkdir -p src/app/api

mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/components/web3/liquidity
mkdir -p src/components/web3/staking

mkdir -p src/config
mkdir -p src/constants
mkdir -p src/contracts/abis
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/providers
mkdir -p src/styles

echo ">> Directory structure created successfully."

# 2. Create all empty files using touch
echo ">> Creating empty files..."

# Root Files
touch .env.example .gitignore .prettierrc next.config.mjs package.json postcss.config.js README.md tailwind.config.ts tsconfig.json

# Monitoring Service Files
touch monitoring/.env.example \
      monitoring/package.json \
      monitoring/tsconfig.json \
      monitoring/src/config.ts \
      monitoring/src/index.ts \
      monitoring/src/listeners/emergencyControllerListener.ts \
      monitoring/src/listeners/proxyAdminListener.ts \
      monitoring/src/listeners/securityModuleListener.ts \
      monitoring/src/notifiers/email.ts \
      monitoring/src/notifiers/telegram.ts

# Frontend dApp Files
touch src/app/favicon.ico \
      src/app/layout.tsx \
      src/app/'(admin)'/layout.tsx \
      src/app/'(admin)'/access-control/page.tsx \
      src/app/'(admin)'/emergency/page.tsx \
      src/app/'(admin)'/parameters/page.tsx \
      src/app/'(admin)'/upgrades/page.tsx \
      src/app/'(main)'/layout.tsx \
      src/app/'(main)'/page.tsx \
      src/app/'(main)'/dashboard/page.tsx \
      src/app/'(main)'/liquidity/page.tsx \
      src/app/'(main)'/stake/page.tsx \
      src/components/layout/Footer.tsx \
      src/components/layout/Navbar.tsx \
      src/components/ui/Button.tsx \
      src/components/ui/Card.tsx \
      src/components/ui/Input.tsx \
      src/components/ui/Modal.tsx \
      src/components/ui/Spinner.tsx \
      src/components/web3/ConnectWalletButton.tsx \
      src/components/web3/ConnectWalletMessage.tsx \
      src/components/web3/NetworkSwitcher.tsx \
      src/components/web3/UserBalance.tsx \
      src/components/web3/liquidity/AddLiquidityForm.tsx \
      src/components/web3/liquidity/LiquidityManagerDashboard.tsx \
      src/components/web3/liquidity/RemoveLiquidityForm.tsx \
      src/components/web3/staking/StakingDashboard.tsx \
      src/components/web3/staking/StakingForm.tsx \
      src/components/web3/staking/UserStakingSummary.tsx \
      src/config/chains.ts \
      src/config/wagmi.ts \
      src/constants/index.ts \
      src/contracts/addresses.ts \
      src/contracts/abis/AccessControl.json \
      src/contracts/abis/ContractRegistry.json \
      src/contracts/abis/EmergencyController.json \
      src/contracts/abis/EmergencyTimelockController.json \
      src/contracts/abis/ILiquidityManager.json \
      src/contracts/abis/ILPStaking.json \
      src/contracts/abis/ITokenStaking.json \
      src/contracts/abis/LiquidityManager.json \
      src/contracts/abis/LPStaking.json \
      src/contracts/abis/OracleIntegration.json \
      src/contracts/abis/PREWAToken.json \
      src/contracts/abis/PriceGuard.json \
      src/contracts/abis/ProxyAdmin.json \
      src/contracts/abis/SecurityModule.json \
      src/contracts/abis/TokenStaking.json \
      src/contracts/abis/VestingFactory.json \
      src/contracts/abis/VestingImplementation.json \
      src/hooks/useDebounce.ts \
      src/hooks/useLiquidity.ts \
      src/hooks/useStaking.ts \
      src/hooks/useTokenApproval.ts \
      src/lib/utils.ts \
      src/lib/web3-utils.ts \
      src/providers/Web3Provider.tsx \
      src/styles/globals.css

echo ">> Empty files created successfully."
echo ""
echo "✅ Setup complete!"
echo ""
echo "--- Next Steps ---"
echo "1. IMPORTANT: Add your smart contracts as a Git submodule:"
echo "   git submodule add https://github.com/TerraDharitri/drt-pREWA.git contracts"
echo ""
echo "2. Install dependencies for both projects:"
echo "   npm install"
echo "   cd monitoring && npm install && cd .."
echo ""
echo "3. Populate the .env.example files with your keys and rename them to .env"
echo "4. Start developing your dApp:"
echo "   npm run dev"
echo "------------------"
