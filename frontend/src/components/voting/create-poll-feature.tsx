import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useVotingProgram } from './voting-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'

export default function CreatePollFeature() {
  const { publicKey } = useWallet()
  const { createPoll, polls } = useVotingProgram()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    nftCollection: '',
    isNftGated: false,
  })

  // Auto-generate poll ID based on existing polls
  const nextPollId = useMemo(() => {

    // If no data yet, start at 0
    if (!polls.data) return BigInt(0)
    
    // If no polls exist, start at 0
    if (polls.data.length === 0) return BigInt(0)


    const maxId = BigInt(polls.data.length) + 1n;

    return maxId;
    
  }, [polls.data])

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Connect your wallet to create a new poll.
          </p>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.description || !formData.startTime || !formData.endTime) {
      toast.error('All fields are required')
      return
    }

    if (formData.isNftGated && !formData.nftCollection) {
      toast.error('NFT Collection address is required for gated polls')
      return
    }

    const startTime = BigInt(Math.floor(new Date(formData.startTime).getTime() / 1000))
    const endTime = BigInt(Math.floor(new Date(formData.endTime).getTime() / 1000))

    if (startTime >= endTime) {
      toast.error('Start time must be before end time')
      return
    }

    setLoading(true)
    try {
      await createPoll.mutateAsync({
        pollId: nextPollId,
        title: formData.title,
        description: formData.description,
        startTime,
        endTime,
        nftCollection: formData.isNftGated ? formData.nftCollection : null,
      })
      toast.success('Poll created successfully!')
      setFormData({ title: '', description: '', startTime: '', endTime: '', nftCollection: '', isNftGated: false })
    } catch (error) {
      console.error('Error creating poll:', error)
      toast.error(`Failed to create poll: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Poll</CardTitle>
          <CardDescription>Set up a new poll for your community to vote on</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Poll ID (Auto-generated) */}
            <div>
              <label className="block text-sm font-medium mb-2">Poll ID</label>
              <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
               <span className="font-bold ">{polls.data?.length || 0} </span>(Auto-generated )
                 {/* {nextPollId.toString()} */}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This ID is automatically assigned based on existing polls
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What should we vote on?"
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-black dark:text-white"
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide more details about the poll"
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-black dark:text-white"
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-black dark:text-white"
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">When voting should begin</p>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-black dark:text-white"
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">When voting should end</p>
            </div>

            {/* NFT Gating */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="isNftGated"
                  name="isNftGated"
                  checked={formData.isNftGated}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="isNftGated" className="text-sm font-medium">
                  Enable NFT-Gated Voting
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Restrict voting to holders of a specific NFT collection
              </p>
              {formData.isNftGated && (
                <div>
                  <label className="block text-sm font-medium mb-2">NFT Collection Address</label>
                  <input
                    type="text"
                    name="nftCollection"
                    value={formData.nftCollection}
                    onChange={handleChange}
                    placeholder="Enter NFT collection mint address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-black dark:text-white font-mono text-sm"
                    required={formData.isNftGated}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Only holders of this NFT collection can vote
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Poll...' : 'Create Poll'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
