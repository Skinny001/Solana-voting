# Voting dApp Frontend

A React-based frontend for the Solana Voting dApp, built with Vite, TypeScript, and Tailwind CSS.

## Overview

This frontend provides a user-friendly interface for interacting with the Solana voting program deployed on devnet. Users can connect their wallets, create polls, vote on active polls, and view real-time vote counts with countdown timers.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **React Query (TanStack Query)** - Data fetching and state management
- **@solana/web3.js** - Solana blockchain interaction
- **@coral-xyz/anchor** - Anchor client for program interaction
- **Sonner** - Toast notifications

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── voting/              # Voting feature components
│   │   │   ├── voting-feature.tsx       # Main voting display
│   │   │   ├── voting-data-access.tsx   # React Query hooks
│   │   │   └── create-poll-feature.tsx  # Poll creation form
│   │   ├── account/             # Wallet/account components
│   │   │   ├── account-ui.tsx
│   │   │   ├── account-data-access.tsx
│   │   │   └── account-feature.tsx
│   │   └── ui/                  # Shadcn UI components
│   ├── lib/
│   │   ├── voting-exports.ts    # Program IDL and types
│   │   └── (utility functions)
│   ├── app.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Solana wallet (e.g., Phantom, Solflare)
- Solana devnet SOL for gas fees

### Installation

```bash
cd frontend
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview production build locally:

```bash
npm run preview
```

## Features

### 1. Wallet Connection

Connect your Solana wallet to the dApp. Supported wallets include Phantom, Solflare, and other standard Solana wallets.

### 2. View Polls

- **Poll List**: Display all created polls with their current status
- **Status Badges**: 
  - 🟡 **Upcoming** (voting hasn't started yet)
  - 🟢 **Active** (voting in progress)
  - 🔴 **Ended** (voting is closed)
- **Vote Counts**: Real-time yes/no vote displays
- **Countdown Timers**: Shows time until voting starts or ends

### 3. Create Polls

Click "Create Poll" to:
1. Enter poll title and description
2. Set start time (when voting begins)
3. Set end time (when voting ends)
4. Submit to create the poll on-chain

The system automatically assigns sequential poll IDs.

### 4. Vote on Polls

During the active voting period:
- Click "Yes" or "No" button to cast your vote
- Buttons are disabled for inactive polls
- Transaction confirmations shown via toasts
- Vote counts update immediately after voting

## Key Components

### voting-feature.tsx

Main component displaying the poll list with real-time status updates.

**Features:**
- Fetches all polls from the blockchain
- Real-time countdown timers (updates every second)
- Status detection based on current time
- Conditional vote button display
- Vote casting with confirmation

### create-poll-feature.tsx

Form component for creating new polls.

**Features:**
- Form validation
- Automatic poll ID generation
- Datetime input for start/end times
- Transaction confirmation

### voting-data-access.tsx

React Query hooks for blockchain interaction.

**Hooks:**
- `useVotingProgram()` - Main hook providing:
  - `polls` - Query for all polls
  - `vote()` - Mutation for voting
  - `createPoll()` - Mutation for poll creation
  - `checkUserVoted()` - Check if user has voted

## Configuration

### Program Settings

The program ID and IDL are configured in `src/lib/voting-exports.ts`:

```typescript
export const VOTING_PROGRAM_ID = "68HyhDBMe8rSesE5YMpG1LZuJuL1s24tcC7knd3dHgQc";
```

### Solana RPC

The app uses the default Solana devnet RPC endpoint. To use a custom endpoint, update the connection in the respective component.

## Environment Variables

Create a `.env.local` file if needed:

```env
# Optional: Custom RPC endpoint
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
npm run test      # Run tests (if configured)
```

## Contributing

See the root repository [README.md](../README.md) for contribution guidelines.

## License

This project is built by 0xblackadam for Ackee Blockchain Security Bootcamp.