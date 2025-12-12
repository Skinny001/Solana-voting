// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'

// Complete Voting IDL from anchor_project/target/idl/voting.json
const VOTING_IDL_DATA = {
  address: '2jP9HpT3ghFkPqYZbsPqdpmxhEFRJBkY4WzC8F56xpV9',
  metadata: {
    name: 'voting',
    version: '0.1.0',
    spec: '0.1.0',
    description: 'Voting Program built with Anchor',
  },
  instructions: [
    {
      name: 'close_poll',
      discriminator: [139, 213, 162, 65, 172, 150, 123, 67],
      accounts: [
        { name: 'signer', writable: true, signer: true },
        { name: 'poll', writable: true },
      ],
      args: [],
    },
    {
      name: 'create_poll',
      discriminator: [182, 171, 112, 238, 6, 219, 14, 110],
      accounts: [
        { name: 'creator', writable: true, signer: true },
        { name: 'poll', writable: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'poll_id', type: 'u64' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'start_time', type: 'i64' },
        { name: 'end_time', type: 'i64' },
        { name: 'nft_collection', type: { option: 'pubkey' } },
      ],
    },
    {
      name: 'vote',
      discriminator: [227, 110, 155, 23, 136, 126, 172, 25],
      accounts: [
        { name: 'poll', writable: true },
        { name: 'voter', writable: true },
        { name: 'voter_signer', writable: true, signer: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'poll_id', type: 'u64' },
        { name: 'vote_type', type: 'bool' },
      ],
    },
    {
      name: 'vote_with_nft',
      discriminator: [227, 176, 202, 155, 157, 128, 179, 32],
      accounts: [
        { name: 'poll', writable: true },
        { name: 'voter', writable: true },
        { name: 'voter_signer', writable: true, signer: true },
        { name: 'nft_token_account', docs: ['NFT token account owned by the voter'] },
        { name: 'system_program', address: '11111111111111111111111111111111' },
        { name: 'token_program', address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      ],
      args: [
        { name: 'poll_id', type: 'u64' },
        { name: 'vote_type', type: 'bool' },
      ],
    },
  ],
  accounts: [
    { name: 'Poll', discriminator: [110, 234, 167, 188, 231, 136, 153, 111] },
    { name: 'Voter', discriminator: [241, 93, 35, 191, 254, 147, 17, 202] },
  ],
  errors: [
    { code: 6000, name: 'AlreadyVoted', msg: 'This voter has already voted on this poll' },
    { code: 6001, name: 'Unauthorized', msg: 'Unauthorized to close this poll' },
    { code: 6002, name: 'InvalidPollTime', msg: 'Invalid poll time settings' },
    { code: 6003, name: 'PollMismatch', msg: 'Poll ID mismatch' },
    { code: 6004, name: 'VotingNotActive', msg: 'Voting is not currently active for this poll' },
    { code: 6005, name: 'PollNotStarted', msg: 'Poll has not started yet' },
    { code: 6006, name: 'PollEnded', msg: 'Poll has already ended' },
    { code: 6007, name: 'PollAlreadyStarted', msg: 'Poll has already started and can only be closed by admin' },
    { code: 6008, name: 'MissingNftTokenAccount', msg: 'NFT token account is required for NFT-gated polls' },
    { code: 6009, name: 'InvalidNftOwner', msg: 'NFT token account owner does not match voter' },
    { code: 6010, name: 'InsufficientNftBalance', msg: 'Insufficient NFT balance - at least 1 NFT required' },
    { code: 6011, name: 'InvalidNftCollection', msg: 'NFT does not belong to the required collection' },
    { code: 6012, name: 'NftGatedPoll', msg: 'This is an NFT-gated poll, use vote_with_nft instruction' },
    { code: 6013, name: 'PollNotNftGated', msg: 'This poll is not NFT-gated' },
  ],
  types: [
    {
      name: 'Poll',
      type: {
        kind: 'struct',
        fields: [
          { name: 'poll_id', type: 'u64' },
          { name: 'creator', type: 'pubkey' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'yes_votes', type: 'u32' },
          { name: 'no_votes', type: 'u32' },
          { name: 'created_at', type: 'i64' },
          { name: 'start_time', type: 'i64' },
          { name: 'end_time', type: 'i64' },
          { name: 'is_nft_gated', type: 'bool' },
          { name: 'nft_collection', type: { option: 'pubkey' } },
        ],
      },
    },
    {
      name: 'Voter',
      type: {
        kind: 'struct',
        fields: [
          { name: 'poll_id', type: 'u64' },
          { name: 'has_voted', type: 'bool' },
        ],
      },
    },
  ],
}

// Re-export IDL
export const VotingIDL = VOTING_IDL_DATA

// The programId is imported from the program IDL.
export const VOTING_PROGRAM_ID = new PublicKey(VOTING_IDL_DATA.address)

// Voting type
export type Voting = any

// This is a helper function to get the Voting Anchor program.
export function getVotingProgram(provider: AnchorProvider, address?: PublicKey): Program<Voting> {
  const programAddress = address || VOTING_PROGRAM_ID
  return new Program({ ...VOTING_IDL_DATA, address: programAddress.toBase58() } as Voting, provider)
}

// This is a helper function to get the program ID for the Voting program depending on the cluster.
export function getVotingProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
      return new PublicKey('2jP9HpT3ghFkPqYZbsPqdpmxhEFRJBkY4WzC8F56xpV9')
    case 'testnet':
      return new PublicKey('2jP9HpT3ghFkPqYZbsPqdpmxhEFRJBkY4WzC8F56xpV9')
    case 'mainnet-beta':
    default:
      return VOTING_PROGRAM_ID
  }
}
