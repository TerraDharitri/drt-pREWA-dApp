# drt-pREWA dApp

This is the official frontend and monitoring service for the drt-pREWA Protocol.

## Overview

This repository is a monorepo containing two main packages:
1.  **`src/`**: A Next.js application that serves as the user-facing dApp for interacting with the pREWA smart contracts.
2.  **`monitoring/`**: A Node.js service for off-chain event monitoring and alerting.

The smart contracts for this project are included as a Git submodule in the `/contracts` directory.

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- pnpm, yarn, or npm
- Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/drt-pREWA-dApp.git
    cd drt-pREWA-dApp
    ```

2.  **Initialize and update the smart contracts submodule:**
    ```bash
    git submodule init
    git submodule update
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    - Create a `.env.local` file in the root directory by copying `.env.example`.
    - Fill in the required variables, such as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
    - Create a `.env` file in the `/monitoring` directory by copying `/monitoring/.env.example`.
    - Fill in the required variables for the monitoring service.

### Running the dApp (Development)

```bash
npm run dev