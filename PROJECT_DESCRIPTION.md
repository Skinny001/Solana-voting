# Project Description

**Deployed Frontend URL:** https://voting-app-one-eta.vercel.app/

**Solana Program ID:** `68HyhDBMe8rSesE5YMpG1LZuJuL1s24tcC7knd3dHgQc`

## Project Overview

### Description
A decentralized voting application built on Solana that enables users to create polls and participate in voting. Each poll has a configurable time window (start and end times) during which users can cast their votes. The dApp demonstrates core Solana concepts including Program Derived Addresses (PDAs) for deterministic account creation, account state management, and time-based access control. Users can create polls with titles and descriptions, vote during the active voting period, and view real-time vote counts.

### Key Features
- **Create Polls**: Initialize new polls with custom titles, descriptions, and voting time windows
- **Vote on Polls**: Cast yes/no votes during the active voting period
- **Real-time Vote Counting**: View current yes/no vote counts for each poll
- **Time-based Access Control**: Polls automatically enforce start and end times - voting is only allowed during the active window
- **Vote History Tracking**: System prevents double voting by tracking which users have already voted
- **Poll Status Display**: Shows whether polls are upcoming, active, or ended with countdown timers

### How to Use the dApp
1. **Connect Wallet** - Connect your Solana wallet (devnet)
2. **View Polls** - See all created polls with their status and vote counts
3. **Create Poll** - Click "Create Poll" and fill in:
   - Poll title and description
   - Start time (when voting begins)
   - End time (when voting ends)
4. **Vote on Poll** - During the active voting period, click "Yes" or "No" to cast your vote
5. **Track Votes** - View real-time vote counts and see the countdown timer for upcoming/active polls

## Program Architecture
The Voting dApp uses a two-account architecture to manage polls and voter participation. The program uses PDAs to ensure deterministic, unique account creation for each poll and voter combination, preventing conflicts and enabling efficient account discovery. Time-based constraints are enforced at the instruction level to control when voting can occur.

### PDA Usage
The program uses Program Derived Addresses to create deterministic accounts for both polls and voters.

**PDAs Used:**
- **Poll PDA**: Derived from seeds `["poll", poll_id]` - ensures each poll has a unique account that maintains its state (votes, timing, etc.)
- **Voter PDA**: Derived from seeds `["voter", poll_id, voter_wallet_pubkey]` - tracks which users have voted on each poll, preventing double voting

### Program Instructions
**Instructions Implemented:**
- **Create Poll**: Initializes a new poll account with the provided title, description, and time window. Only accepts polls where start_time < end_time and start_time is in the future
- **Vote**: Records a vote (yes/no) on an active poll. Validates that:
  - The current time is within the poll's voting window
  - The voter hasn't already voted on this poll
  - Increments the appropriate vote counter (yes_votes or no_votes)
- **Close Poll**: Allows the poll creator to close a poll before it starts. Once a poll has started, only the creator can close it before the start time

### Account Structure
```rust
#[account]
pub struct Poll {
    pub poll_id: u64,           // Unique identifier for the poll
    pub creator: Pubkey,        // Wallet address of who created the poll
    pub title: String,          // Poll title (max 200 chars)
    pub description: String,    // Poll description (max 500 chars)
    pub yes_votes: u32,         // Count of yes votes
    pub no_votes: u32,          // Count of no votes
    pub created_at: i64,        // Unix timestamp when poll was created
    pub start_time: i64,        // Unix timestamp when voting begins
    pub end_time: i64,          // Unix timestamp when voting ends
}

#[account]
pub struct Voter {
    pub poll_id: u64,           // Which poll this voter record is for
    pub has_voted: bool,        // Whether this voter has cast their vote
}
```

## Testing

### Test Coverage
Comprehensive test suite covering all voting scenarios including happy path voting flows and error conditions to ensure program security.

**Happy Path Tests:**
- **Create Poll**: Successfully creates a new poll with correct initial state (0 votes, all metadata stored)
- **Vote Yes**: User can successfully vote yes during active voting window
- **Vote No**: User can successfully vote no during active voting window
- **Vote Counting**: Votes are correctly incremented in poll account

**Unhappy Path Tests:**
- **Double Vote Prevention**: User cannot vote twice on the same poll
- **Voting Before Start**: Fails when trying to vote before poll start time
- **Voting After End**: Fails when trying to vote after poll end time
- **Invalid Poll Time**: Fails when creating poll with end_time before start_time
- **Future-only Polls**: Fails when creating poll with start_time in the past

### Running Tests
```bash
cd anchor_project
yarn install    # install dependencies
anchor test     # run tests against local validator
```

### Additional Notes for Evaluators

**Key Implementation Highlights:**

1. **Time-based Access Control**: The program enforces strict time windows for voting. Each poll has configurable start and end times, and the program validates the current clock time against these windows on every vote instruction.

2. **Double-vote Prevention**: Uses PDAs with the voter's wallet address as part of the seed to create unique voter records. Checking the `has_voted` flag ensures users can only vote once per poll.

3. **Real-time Frontend Updates**: The React frontend displays polls with countdown timers that update every second, showing users how long until voting opens or closes. Vote counts update immediately after successful transactions.

4. **PDAs for Determinism**: Both Poll and Voter accounts use PDAs, enabling frontend code to derive the correct addresses without needing to query the blockchain, improving performance and UX.

5. **Solana Integration**: The frontend uses @solana/web3.js and @coral-xyz/anchor to interact with the deployed program on devnet, handling wallet connections, transaction signing, and account fetching.

**Learning Notes:**
This project deepened my understanding of Solana programs and the importance of PDAs for creating unique, deterministic accounts. The biggest challenge was ensuring vote counts remained accurate while preventing double voting - implementing the Voter PDA tracking system solved both issues elegantly.