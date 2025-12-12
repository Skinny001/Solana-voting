import { getVotingProgram, getVotingProgramId } from '@/lib/voting-exports'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { useTransactionToast } from '@/components/use-transaction-toast'
import BN from 'bn.js'

export function useVotingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const provider = useAnchorProvider()
  const transactionToast = useTransactionToast()
  const programId = useMemo(() => getVotingProgramId(cluster.network as Cluster), [cluster])
  const program: any = useMemo(() => getVotingProgram(provider, programId), [provider, programId])

  const polls = useQuery({
    queryKey: ['voting', 'polls', { cluster }],
    queryFn: async () => {
      try {
        const allAccounts = await (program.account as any).poll.all()
        return allAccounts.map((account: any) => ({
          publicKey: account.publicKey,
          ...account.account,
        }))
      } catch (error) {
        console.error('Error fetching polls:', error)
        return []
      }
    },
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createPoll = useMutation({
    mutationKey: ['voting', 'create-poll', { cluster }],
    mutationFn: async ({
      pollId,
      title,
      description,
      startTime,
      endTime,
      nftCollection,
    }: {
      pollId: bigint
      title: string
      description: string
      startTime: bigint
      endTime: bigint
      nftCollection?: string | null
    }) => {
      // Convert bigint to BN for Anchor
      const pollIdBN = new BN(pollId.toString())
      const startTimeBN = new BN(startTime.toString())
      const endTimeBN = new BN(endTime.toString())

      // Create the poll ID as little-endian bytes (matching the Rust program)
      const pollIdBuffer = Buffer.alloc(8)
      pollIdBuffer.writeBigUInt64LE(BigInt(pollId), 0)

      const [pollPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('poll'), pollIdBuffer],
        programId
      )

      // Convert nftCollection to PublicKey or null
      const nftCollectionPubkey = nftCollection ? new PublicKey(nftCollection) : null

      const tx = await program.methods
        .createPoll(pollIdBN, title, description, startTimeBN, endTimeBN, nftCollectionPubkey)
        .accounts({
          creator: provider.publicKey,
          poll: pollPda,
          systemProgram: new PublicKey('11111111111111111111111111111111'),
        })
        .rpc()

      return tx
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
      await polls.refetch()
    },
  })

  const vote = useMutation({
    mutationKey: ['voting', 'vote', { cluster }],
    mutationFn: async ({
      pollId,
      voteType,
    }: {
      pollId: bigint
      voteType: boolean
    }) => {
      const pollIdBN = new BN(pollId.toString())

      // Create poll ID as little-endian bytes
      const pollIdBuffer = Buffer.alloc(8)
      pollIdBuffer.writeBigUInt64LE(BigInt(pollId), 0)

      const [pollPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('poll'), pollIdBuffer],
        programId
      )

      const [voterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('voter'), pollIdBuffer, provider.publicKey.toBuffer()],
        programId
      )

      const tx = await program.methods
        .vote(pollIdBN, voteType)
        .accounts({
          poll: pollPda,
          voter: voterPda,
          voterSigner: provider.publicKey,
          systemProgram: new PublicKey('11111111111111111111111111111111'),
        })
        .rpc()

      return tx
    },
    onSuccess: async (tx) => {
      transactionToast(tx)
      await polls.refetch()
    },
  })

  return {
    program,
    programId,
    polls,
    getProgramAccount,
    createPoll,
    vote,
    checkUserVoted: async (pollId: bigint) => {
      try {
        // Create the Voter PDA using the same logic as the vote instruction
        const pollIdBuffer = Buffer.alloc(8)
        pollIdBuffer.writeBigUInt64LE(BigInt(pollId), 0)

        const [voterPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('voter'), pollIdBuffer, provider.publicKey.toBuffer()],
          programId
        )

        // Try to fetch the voter account using connection
        const accountInfo = await connection.getAccountInfo(voterPda)
        
        // If account doesn't exist, user hasn't voted
        if (!accountInfo) {
          return false
        }
        
        // Account exists, user has voted
        return true
      } catch (error) {
        console.error('Error checking voter status:', error)
        return false
      }
    },
  }
}
