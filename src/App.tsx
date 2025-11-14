import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

interface Scores {
  team1: number
  team2: number
}

function App() {
  const [scores, setScores] = useState<Scores>({ team1: 0, team2: 0 })
  const [loading, setLoading] = useState<string | null>(null)

  const incrementScore = async (team: 'team1' | 'team2') => {
    setLoading(team)
    try {
      const response = await fetch(`${API_BASE_URL}/scores/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team }),
      })

      if (!response.ok) {
        throw new Error('Failed to increment score')
      }

      const data = await response.json()
      setScores(data.allScores)
    } catch (error) {
      console.error('Error incrementing score:', error)
      alert('Failed to update score. Make sure the backend is running.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Stack gap={8}>
        <Heading size="2xl" textAlign="center">
          Team Score Controller
        </Heading>

        <Stack direction="row" gap={10}>
          {/* Team 1 */}
          <Box
            p={8}
            borderWidth="2px"
            borderRadius="lg"
            borderColor="blue.400"
            bg="blue.50"
            minW="300px"
          >
            <Stack gap={4}>
              <Heading size="lg" color="blue.600">
                Team 1
              </Heading>
              <Text fontSize="4xl" fontWeight="bold" color="blue.700">
                {scores.team1}
              </Text>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => incrementScore('team1')}
                disabled={loading === 'team1'}
                width="full"
              >
                {loading === 'team1' ? 'Adding...' : '+ Add Point'}
              </Button>
            </Stack>
          </Box>

          {/* Team 2 */}
          <Box
            p={8}
            borderWidth="2px"
            borderRadius="lg"
            borderColor="red.400"
            bg="red.50"
            minW="300px"
          >
            <Stack gap={4}>
              <Heading size="lg" color="red.600">
                Team 2
              </Heading>
              <Text fontSize="4xl" fontWeight="bold" color="red.700">
                {scores.team2}
              </Text>
              <Button
                colorScheme="red"
                size="lg"
                onClick={() => incrementScore('team2')}
                disabled={loading === 'team2'}
                width="full"
              >
                {loading === 'team2' ? 'Adding...' : '+ Add Point'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Container>
  )
}

export default App
