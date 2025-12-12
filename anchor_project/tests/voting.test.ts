import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token'
import { Voting } from '../target/types/voting'

describe('voting', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Voting as Program<Voting>

  const pollId = new anchor.BN(1)
  let pollPda: PublicKey
  let pollBump: number

  beforeAll(async () => {
    // Derive poll PDA
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('poll'), pollId.toBuffer('le', 8)],
      program.programId
    )
    pollPda = pda
    pollBump = bump
  })

  it('Create Poll', async () => {
    const blockTime = await provider.connection.getBlockTime(await provider.connection.getSlot())
    let startTime = new anchor.BN(blockTime + 2)  // Start in 2 seconds
    const endTime = new anchor.BN(startTime.toNumber() + 3600) // End in 1 hour

    await program.methods
      .createPoll(pollId, 'Should we implement feature X?', 'A poll about implementing feature X', startTime, endTime, null)
      .accounts({
        creator: payer.publicKey,
        poll: pollPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const poll = await program.account.poll.fetch(pollPda)

    expect(poll.title).toEqual('Should we implement feature X?')
    expect(poll.yesVotes).toEqual(0)
    expect(poll.noVotes).toEqual(0)
    expect(poll.startTime).toEqual(startTime)
  })

  it('Vote Yes', async () => {
    const [voterPda] = await PublicKey.findProgramAddress(
      [Buffer.from('voter'), pollId.toBuffer('le', 8), payer.publicKey.toBuffer()],
      program.programId
    )
    // wait 3 seconds to ensure poll is active
    await new Promise(resolve => setTimeout(resolve, 3000));

    await program.methods
      .vote(pollId, true)
      .accounts({
        poll: pollPda,
        voter: voterPda,
        voterSigner: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const poll = await program.account.poll.fetch(pollPda)


    expect(poll.yesVotes).toEqual(1)
    expect(poll.noVotes).toEqual(0)
  })

  it('Vote No', async () => {
    const voter2 = Keypair.generate()

    // wait 3 seconds to ensure poll is active
    await new Promise(resolve => setTimeout(resolve, 3000));


    // Fund the voter2
    const tx = await provider.connection.requestAirdrop(voter2.publicKey, 1000000000)
    await provider.connection.confirmTransaction(tx)

    const [voterPda] = await PublicKey.findProgramAddress(
      [Buffer.from('voter'), pollId.toBuffer('le', 8), voter2.publicKey.toBuffer()],
      program.programId
    )

    await program.methods
      .vote(pollId, false)
      .accounts({
        poll: pollPda,
        voter: voterPda,
        voterSigner: voter2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter2])
      .rpc()

    const poll = await program.account.poll.fetch(pollPda)

    expect(poll.yesVotes).toEqual(1)
    expect(poll.noVotes).toEqual(1)
  })

  it('Should throw an error if closing a poll that is active', async () => {

    console.log("the poll data before closing", await program.account.poll.fetch(pollPda))

    expect (async () => {
      await program.methods
        .closePoll()
        .accounts({
          signer: payer.publicKey,
          poll: pollPda,
        })
        .rpc()
    }).rejects.toThrow()
  })

  // NFT-Gated Voting Tests
  describe('NFT-Gated Voting', () => {
    let nftMint: PublicKey
    let nftGatedPollId: anchor.BN
    let nftGatedPollPda: PublicKey
    let voterWithNft: Keypair
    let voterWithoutNft: Keypair
    let voterWithNftTokenAccount: any
    let voterWithoutNftTokenAccount: any

    beforeAll(async () => {
      nftGatedPollId = new anchor.BN(100)
      const [pda] = await PublicKey.findProgramAddress(
        [Buffer.from('poll'), nftGatedPollId.toBuffer('le', 8)],
        program.programId
      )
      nftGatedPollPda = pda

      // Create NFT mint (collection)
      nftMint = await createMint(
        provider.connection,
        payer.payer,
        payer.publicKey,
        payer.publicKey,
        0 // 0 decimals for NFT
      )

      // Create voters
      voterWithNft = Keypair.generate()
      voterWithoutNft = Keypair.generate()

      // Fund voters
      const airdrop1 = await provider.connection.requestAirdrop(voterWithNft.publicKey, 2000000000)
      await provider.connection.confirmTransaction(airdrop1)
      
      const airdrop2 = await provider.connection.requestAirdrop(voterWithoutNft.publicKey, 2000000000)
      await provider.connection.confirmTransaction(airdrop2)

      // Give NFT to voterWithNft
      voterWithNftTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        payer.payer,
        nftMint,
        voterWithNft.publicKey
      )

      await mintTo(
        provider.connection,
        payer.payer,
        nftMint,
        voterWithNftTokenAccount.address,
        payer.publicKey,
        1 // Mint 1 NFT
      )

      // Create token account for voterWithoutNft but don't mint
      voterWithoutNftTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        payer.payer,
        nftMint,
        voterWithoutNft.publicKey
      )
    })

    it('Create NFT-Gated Poll', async () => {
      const blockTime = await provider.connection.getBlockTime(await provider.connection.getSlot())
      const startTime = new anchor.BN(blockTime + 2)
      const endTime = new anchor.BN(startTime.toNumber() + 3600)

      await program.methods
        .createPoll(
          nftGatedPollId,
          'NFT Holders: Which feature next?',
          'Exclusive poll for NFT holders',
          startTime,
          endTime,
          nftMint
        )
        .accounts({
          creator: payer.publicKey,
          poll: nftGatedPollPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      const poll = await program.account.poll.fetch(nftGatedPollPda)

      expect(poll.title).toEqual('NFT Holders: Which feature next?')
      expect(poll.nftCollection).toEqual(nftMint)
      expect(poll.yesVotes).toEqual(0)
      expect(poll.noVotes).toEqual(0)
    })

    it('Should allow voting with valid NFT', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000))

      const [voterPda] = await PublicKey.findProgramAddress(
        [Buffer.from('voter'), nftGatedPollId.toBuffer('le', 8), voterWithNft.publicKey.toBuffer()],
        program.programId
      )

      await program.methods
        .voteWithNft(nftGatedPollId, true)
        .accounts({
          poll: nftGatedPollPda,
          voter: voterPda,
          voterSigner: voterWithNft.publicKey,
          nftTokenAccount: voterWithNftTokenAccount.address,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voterWithNft])
        .rpc()

      const poll = await program.account.poll.fetch(nftGatedPollPda)
      expect(poll.yesVotes).toEqual(1)
    })

    it('Should reject voting without NFT (zero balance)', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const [voterPda] = await PublicKey.findProgramAddress(
        [Buffer.from('voter'), nftGatedPollId.toBuffer('le', 8), voterWithoutNft.publicKey.toBuffer()],
        program.programId
      )

      try {
        await program.methods
          .voteWithNft(nftGatedPollId, false)
          .accounts({
            poll: nftGatedPollPda,
            voter: voterPda,
            voterSigner: voterWithoutNft.publicKey,
            nftTokenAccount: voterWithoutNftTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([voterWithoutNft])
          .rpc()
        
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.toString()).toContain('InsufficientNftBalance')
      }
    })

    it('Should reject voting on NFT-gated poll with wrong NFT collection', async () => {
      // Create a new voter who hasn't voted yet
      const voterWithWrongNft = Keypair.generate()
      const airdrop = await provider.connection.requestAirdrop(voterWithWrongNft.publicKey, 2000000000)
      await provider.connection.confirmTransaction(airdrop)

      // Create a different NFT mint
      const wrongNftMint = await createMint(
        provider.connection,
        payer.payer,
        payer.publicKey,
        payer.publicKey,
        0
      )

      const wrongNftAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        payer.payer,
        wrongNftMint,
        voterWithWrongNft.publicKey
      )

      await mintTo(
        provider.connection,
        payer.payer,
        wrongNftMint,
        wrongNftAccount.address,
        payer.publicKey,
        1
      )

      const [voterPda] = await PublicKey.findProgramAddress(
        [Buffer.from('voter'), nftGatedPollId.toBuffer('le', 8), voterWithWrongNft.publicKey.toBuffer()],
        program.programId
      )

      try {
        await program.methods
          .voteWithNft(nftGatedPollId, true)
          .accounts({
            poll: nftGatedPollPda,
            voter: voterPda,
            voterSigner: voterWithWrongNft.publicKey,
            nftTokenAccount: wrongNftAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([voterWithWrongNft])
          .rpc()
        
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.toString()).toContain('InvalidNftCollection')
      }
    })

    it('Should prevent double voting on NFT-gated poll', async () => {
      const [voterPda] = await PublicKey.findProgramAddress(
        [Buffer.from('voter'), nftGatedPollId.toBuffer('le', 8), voterWithNft.publicKey.toBuffer()],
        program.programId
      )

      try {
        await program.methods
          .voteWithNft(nftGatedPollId, false)
          .accounts({
            poll: nftGatedPollPda,
            voter: voterPda,
            voterSigner: voterWithNft.publicKey,
            nftTokenAccount: voterWithNftTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([voterWithNft])
          .rpc()
        
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.toString()).toContain('AlreadyVoted')
      }
    })
  })
})
