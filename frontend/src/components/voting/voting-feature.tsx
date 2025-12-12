import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useVotingProgram } from './voting-data-access'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function VotingFeature() {
  const { publicKey } = useWallet()
  const { polls, vote, checkUserVoted } = useVotingProgram()
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))
  const [votingPollId, setVotingPollId] = useState<string | null>(null)
  const [userVotedPolls, setUserVotedPolls] = useState<Set<string>>(new Set())

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Check voted status ONLY once when polls first load
  useEffect(() => {
    if (!polls.data || polls.data.length === 0) return

    const checkVotedOnce = async () => {
      const votedSet = new Set<string>()
      for (const poll of polls.data) {
        const pollIdStr = poll.pollId?.toString() ?? String(polls.data.indexOf(poll))
        try {
          const hasVoted = await checkUserVoted(BigInt(pollIdStr))
          if (hasVoted) {
            votedSet.add(pollIdStr)
          }
        } catch (error) {
          console.error('Error checking voted status:', error)
        }
      }
      setUserVotedPolls(votedSet)
    }

    checkVotedOnce()
  }, [polls.isLoading]) // Only re-check when loading state changes, not continuously

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Connect your wallet to get started and view all available polls.
          </p>
        </div>
      </div>
    )
  }

  const pollsData = polls.data || []

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return 'Starting now...'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${mins}m`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const handleVote = async (pollId: bigint, voteType: boolean) => {
    try {
      setVotingPollId(`${pollId}-${voteType}`)
      await vote.mutateAsync({
        pollId,
        voteType,
      })
      toast.success(voteType ? 'Voted Yes!' : 'Voted No!')
    } catch (error) {
      console.error('Error voting:', error)
      toast.error(`Failed to vote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setVotingPollId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Available Polls</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and vote on active polls
          </p>
        </div>
        <Button onClick={() => polls.refetch()} disabled={polls.isLoading}>
          {polls.isLoading ? 'Loading...' : 'Refresh Polls'}
        </Button>
      </div>

      {pollsData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {polls.isLoading ? 'Loading polls...' : 'No polls available yet. Check back soon!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pollsData.map((poll: any, index: number) => {
            // Safely get poll_id with fallback
            const pollId = poll.pollId !== undefined && poll.pollId !== null ? poll.pollId : BigInt(index)
            
            // Get poll times from camelCase properties and convert BN to number
            let startTime = 0
            let endTime = 0
            
            // Extract startTime (it's a BN object)
            if (poll.startTime) {
              if (poll.startTime.toNumber) {
                startTime = poll.startTime.toNumber()
              } else if (typeof poll.startTime === 'bigint') {
                startTime = Number(poll.startTime)
              } else if (typeof poll.startTime === 'number') {
                startTime = poll.startTime
              }
            }
            
            // Extract endTime (it's a BN object)
            if (poll.endTime) {
              if (poll.endTime.toNumber) {
                endTime = poll.endTime.toNumber()
              } else if (typeof poll.endTime === 'bigint') {
                endTime = Number(poll.endTime)
              } else if (typeof poll.endTime === 'number') {
                endTime = poll.endTime
              }
            }
            
            // Determine poll status
            const hasNotStarted = currentTime < startTime
            const isActive = currentTime >= startTime && currentTime <= endTime
            const hasEnded = currentTime > endTime
            
            const timeUntilStart = startTime - currentTime
            
            let statusLabel = 'Upcoming'
            let statusBadgeColor = 'bg-gray-200 dark:bg-gray-700'
            
            if (hasNotStarted) {
              statusLabel = `Starts in ${formatCountdown(timeUntilStart)}`
              statusBadgeColor = 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            } else if (isActive) {
              statusLabel = 'Voting Active'
              statusBadgeColor = 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
            } else if (hasEnded) {
              statusLabel = 'Voting Ended'
              statusBadgeColor = 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
            }
            
            return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{poll.title}</CardTitle>
                      {poll.isNftGated && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                          🔒 NFT Required
                        </span>
                      )}
                    </div>
                    <CardDescription>{poll.description}</CardDescription>
                    {poll.isNftGated && poll.nftCollection && (
                      <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/10 rounded-md border border-purple-200 dark:border-purple-800">
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Required NFT Collection:</p>
                        <code className="text-xs text-purple-600 dark:text-purple-300 font-mono break-all">
                          {poll.nftCollection.toString()}
                        </code>
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Poll ID</p>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{pollId.toString()}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400">Yes Votes</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-300">{poll.yesVotes || 0}</p>
                    </div>
                    <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs font-medium text-red-700 dark:text-red-400">No Votes</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-300">{poll.noVotes || 0}</p>
                    </div>
                  </div>
                  {hasNotStarted && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Voting starts in {formatCountdown(timeUntilStart)}
                      </p>
                    </div>
                  )}
                  {isActive && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => handleVote(pollId, true)}
                        disabled={votingPollId === `${pollId}-true` || userVotedPolls.has(pollId.toString())}
                      >
                        {votingPollId === `${pollId}-true` ? 'Voting...' : userVotedPolls.has(pollId.toString()) ? 'Already Voted' : 'Vote Yes'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleVote(pollId, false)}
                        disabled={votingPollId === `${pollId}-false` || userVotedPolls.has(pollId.toString())}
                      >
                        {votingPollId === `${pollId}-false` ? 'Voting...' : userVotedPolls.has(pollId.toString()) ? 'Already Voted' : 'Vote No'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
