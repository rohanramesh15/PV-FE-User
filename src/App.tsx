import { Box, Button, Text } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CameraFeed from './CameraFeed';

const MotionBox = motion.create(Box)

// Type declaration for html2canvas
declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

const MAX_VOTES = 20;

function App() {
  const [capturing, setCapturing] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [votesRemaining, setVotesRemaining] = useState(MAX_VOTES);
  const [showVoteCast, setShowVoteCast] = useState(false);
  const [lightPhase, setLightPhase] = useState<'idle' | 'rotating' | 'shooting'>('idle');

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [practiceAnimating, setPracticeAnimating] = useState(false);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [showPracticeSuccess, setShowPracticeSuccess] = useState(false);

  const handlePracticeVote = () => {
    if (practiceAnimating) return;
    setPracticeAnimating(true);
    setTimeout(() => {
      setPracticeAnimating(false);
      setShowPracticeSuccess(true);
      setTimeout(() => {
        setShowPracticeSuccess(false);
        setPracticeComplete(true);
      }, 800);
    }, 1000);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  // Auto-hide vote cast message
  useEffect(() => {
    if (showVoteCast) {
      const timer = setTimeout(() => setShowVoteCast(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showVoteCast]);

  // Trigger shooting animation when upload succeeds
  useEffect(() => {
    if (uploadResponse) {
      setLightPhase('shooting');
      const timer = setTimeout(() => {
        setLightPhase('idle');
        setShowVoteCast(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [uploadResponse]);

  const dataURLtoBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const takeScreenshot = async () => {
    if (votesRemaining <= 0) {
      setError('No votes remaining');
      return;
    }

    setCapturing(true);
    setError(null);
    setUploadResponse(null);
    setLightPhase('rotating');

    try {
      // Load html2canvas from CDN
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Capture the entire document body
      const canvas = await window.html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false
      });

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/png');

      try {
        const blob = dataURLtoBlob(imageDataUrl);

        const formData = new FormData();
        const timestamp = Date.now();
        formData.append('image', blob, `screenshot-${timestamp}.png`);
        formData.append('description', `Screenshot captured at ${new Date().toLocaleString()}`);

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        });


        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUploadResponse(data);
        setVotesRemaining(prev => prev - 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        console.error('Upload error:', err);
      }



    } catch (err) {
      setError('Failed to capture screenshot: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Screenshot error:', err);
    } finally {
      setCapturing(false);
    }
  };

  // Onboarding screens
  if (showOnboarding) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="gray.900"
        overflow="hidden"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Rules */}
          {onboardingStep === 1 && (
            <MotionBox
              key="step1"
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              px={6}
              textAlign="center"
              bg="linear-gradient(180deg, rgba(88, 28, 135, 0.3) 0%, rgba(15, 23, 42, 1) 50%, rgba(15, 23, 42, 1) 100%)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative glow */}
              <Box
                position="absolute"
                top="-20%"
                left="50%"
                transform="translateX(-50%)"
                w="300px"
                h="300px"
                bg="radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)"
                pointerEvents="none"
              />

              {/* Title */}
              <Text
                color="white"
                fontSize="3xl"
                fontWeight="bold"
                mb={1}
                letterSpacing="tight"
              >
                Dance Battle
              </Text>

              <Text
                color="purple.300"
                fontSize="xs"
                mb={12}
                letterSpacing="widest"
                textTransform="uppercase"
                fontWeight="medium"
              >
                Live voting
              </Text>

              {/* Vote count - the hero element */}
              <Box position="relative" mb={4}>
                {/* Glow behind number */}
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="150px"
                  h="150px"
                  bg="radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)"
                  pointerEvents="none"
                />
                <Text
                  color="white"
                  fontSize="8xl"
                  fontWeight="black"
                  lineHeight="1"
                  position="relative"
                >
                  {MAX_VOTES}
                </Text>
              </Box>

              <Text
                color="whiteAlpha.800"
                fontSize="lg"
                fontWeight="semibold"
                mb={10}
              >
                votes to use
              </Text>

              {/* Instructions - two-tier hierarchy */}
              <Box maxW="300px" mb={12}>
                <Text
                  color="white"
                  fontSize="md"
                  fontWeight="medium"
                  mb={4}
                  lineHeight="tall"
                >
                  Vote for the moves you love as they happen.
                </Text>

                <Text
                  color="whiteAlpha.500"
                  fontSize="sm"
                  lineHeight="tall"
                >
                  Pace yourself — run out early, and you can't vote for the other dancer if they start killing it.
                </Text>
              </Box>

              {/* CTA Button */}
              <Button
                onClick={() => setOnboardingStep(2)}
                px={14}
                py={7}
                fontSize="md"
                fontWeight="semibold"
                bg="white"
                color="gray.900"
                borderRadius="full"
                boxShadow="0 4px 24px rgba(255, 255, 255, 0.2)"
                _hover={{
                  transform: "scale(1.02)",
                  boxShadow: "0 6px 32px rgba(255, 255, 255, 0.3)",
                }}
                _active={{
                  transform: "scale(0.98)",
                }}
                transition="all 0.2s ease"
              >
                Let's go
              </Button>

              {/* Step indicators */}
              <Box display="flex" gap={3} mt={10}>
                <Box w={8} h={1.5} borderRadius="full" bg="white" />
                <Box w={8} h={1.5} borderRadius="full" bg="whiteAlpha.300" />
              </Box>
            </MotionBox>
          )}

          {/* Step 2: Practice */}
          {onboardingStep === 2 && (
            <MotionBox
              key="step2"
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Camera feed */}
              <CameraFeed />

              {/* Dark gradient overlay matching theme */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="linear-gradient(180deg, rgba(88, 28, 135, 0.6) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0.8) 100%)"
                zIndex={1}
                pointerEvents="none"
              />

              {/* Decorative glow at top */}
              <Box
                position="absolute"
                top="-10%"
                left="50%"
                transform="translateX(-50%)"
                w="300px"
                h="300px"
                bg="radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)"
                pointerEvents="none"
                zIndex={2}
              />

              {/* Practice success flash */}
              <AnimatePresence>
                {showPracticeSuccess && (
                  <>
                    <MotionBox
                      position="fixed"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      zIndex={300}
                      bg="radial-gradient(circle, rgba(168, 85, 247, 0.9) 0%, rgba(88, 28, 135, 0.8) 100%)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.8, 1, 0] }}
                      transition={{ duration: 0.6, times: [0, 0.1, 0.3, 0.5, 1] }}
                      pointerEvents="none"
                    />
                    <MotionBox
                      position="fixed"
                      top="50%"
                      left="50%"
                      zIndex={301}
                      initial={{ opacity: 0, scale: 0.1, x: '-50%', y: '-50%' }}
                      animate={{ opacity: [0, 1, 1, 0], scale: [0.1, 1.2, 1, 1.5], x: '-50%', y: '-50%' }}
                      transition={{ duration: 0.8, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
                      pointerEvents="none"
                    >
                      <Text
                        fontSize="5xl"
                        fontWeight="bold"
                        color="white"
                        textAlign="center"
                        textShadow="0 0 60px rgba(168, 85, 247, 0.8)"
                      >
                        Nice!
                      </Text>
                    </MotionBox>
                  </>
                )}
              </AnimatePresence>

              {/* Instruction at top */}
              <Box
                position="absolute"
                top={10}
                left={4}
                right={4}
                zIndex={10}
                textAlign="center"
              >
                <Text
                  color="purple.300"
                  fontSize="xs"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  fontWeight="medium"
                  mb={2}
                >
                  Practice
                </Text>
                <Text
                  color="white"
                  fontSize="xl"
                  fontWeight="bold"
                  mb={2}
                >
                  Try voting
                </Text>
                <Text
                  color="whiteAlpha.600"
                  fontSize="sm"
                >
                  Point at a dancer, then tap the button
                </Text>
              </Box>

              {/* Bottom UI */}
              <Box
                position="absolute"
                bottom={10}
                left={4}
                right={4}
                zIndex={200}
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={6}
              >
                {/* Practice Vote Button */}
                <Box position="relative">
                  {/* Rotating animation */}
                  <AnimatePresence>
                    {practiceAnimating && (
                      <>
                        <MotionBox
                          position="absolute"
                          top="50%"
                          left="50%"
                          width="160px"
                          height="160px"
                          borderRadius="full"
                          border="3px solid"
                          borderColor="purple.400"
                          initial={{ rotate: 0, x: '-50%', y: '-50%', opacity: 0.8 }}
                          animate={{ rotate: 360, x: '-50%', y: '-50%', opacity: 0.8 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          boxShadow="0 0 30px rgba(168, 85, 247, 0.5)"
                        />
                        <MotionBox
                          position="absolute"
                          top="50%"
                          left="50%"
                          width="180px"
                          height="180px"
                          borderRadius="full"
                          bg="transparent"
                          initial={{ scale: 1, opacity: 0.5, x: '-50%', y: '-50%' }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3], x: '-50%', y: '-50%' }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                          boxShadow="0 0 60px rgba(168, 85, 247, 0.6)"
                        />
                      </>
                    )}
                  </AnimatePresence>

                  {!practiceComplete && !practiceAnimating && (
                    <Button
                      onClick={handlePracticeVote}
                      width="120px"
                      height="120px"
                      borderRadius="full"
                      bg="white"
                      color="gray.900"
                      fontSize="md"
                      fontWeight="semibold"
                      boxShadow="0 4px 24px rgba(255, 255, 255, 0.2), 0 0 60px rgba(168, 85, 247, 0.3)"
                      _hover={{
                        transform: "scale(1.05)",
                        boxShadow: "0 6px 32px rgba(255, 255, 255, 0.3), 0 0 80px rgba(168, 85, 247, 0.4)",
                      }}
                      _active={{
                        transform: "scale(0.95)",
                      }}
                      transition="all 0.2s ease"
                    >
                      Vote
                    </Button>
                  )}

                  {practiceAnimating && (
                    <Box width="120px" height="120px" />
                  )}
                </Box>

                {/* Start Voting button */}
                {practiceComplete && (
                  <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      onClick={completeOnboarding}
                      px={14}
                      py={7}
                      fontSize="md"
                      fontWeight="semibold"
                      bg="white"
                      color="gray.900"
                      borderRadius="full"
                      boxShadow="0 4px 24px rgba(255, 255, 255, 0.2)"
                      _hover={{
                        transform: "scale(1.02)",
                        boxShadow: "0 6px 32px rgba(255, 255, 255, 0.3)",
                      }}
                      _active={{
                        transform: "scale(0.98)",
                      }}
                      transition="all 0.2s ease"
                    >
                      Start voting
                    </Button>
                  </MotionBox>
                )}

                {/* Step indicators - matching page 1 */}
                <Box display="flex" gap={3} mt={4}>
                  <Box w={8} h={1.5} borderRadius="full" bg="whiteAlpha.300" />
                  <Box w={8} h={1.5} borderRadius="full" bg="white" />
                </Box>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      width="100vw"
      height="100vh"
      overflow="hidden"
    >
      <CameraFeed />

      {/* Dark gradient overlay matching theme */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="linear-gradient(180deg, rgba(88, 28, 135, 0.5) 0%, rgba(0, 0, 0, 0.4) 30%, rgba(0, 0, 0, 0.6) 100%)"
        zIndex={1}
        pointerEvents="none"
      />

      {/* Decorative glow at top */}
      <Box
        position="absolute"
        top="-10%"
        left="50%"
        transform="translateX(-50%)"
        w="300px"
        h="300px"
        bg="radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)"
        pointerEvents="none"
        zIndex={2}
      />

      {/* Error message */}
      {error && (
        <Box
          position="absolute"
          top={4}
          left={4}
          right={4}
          bg="rgba(220, 38, 38, 0.9)"
          backdropFilter="blur(10px)"
          p={4}
          borderRadius="xl"
          zIndex={10}
        >
          <Text color="white" fontWeight="medium">{error}</Text>
        </Box>
      )}

      {/* Vote Cast - Full screen flash */}
      <AnimatePresence>
        {showVoteCast && (
          <>
            {/* Flash overlay - purple theme */}
            <MotionBox
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={199}
              bg="radial-gradient(circle, rgba(168, 85, 247, 0.95) 0%, rgba(88, 28, 135, 0.9) 100%)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 1, 0] }}
              transition={{ duration: 0.6, times: [0, 0.1, 0.3, 0.5, 1] }}
              pointerEvents="none"
            />
            {/* Radial burst */}
            <MotionBox
              position="fixed"
              top="50%"
              left="50%"
              width="100vw"
              height="100vw"
              borderRadius="full"
              zIndex={199}
              bg="radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(168, 85, 247, 0.5) 30%, transparent 70%)"
              initial={{ scale: 0, x: '-50%', y: '-50%', opacity: 1 }}
              animate={{ scale: 3, x: '-50%', y: '-50%', opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              pointerEvents="none"
            />
            {/* Text */}
            <MotionBox
              position="fixed"
              top="50%"
              left="50%"
              zIndex={200}
              initial={{ opacity: 0, scale: 0.1, x: '-50%', y: '-50%' }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.1, 1.2, 1, 1.5], x: '-50%', y: '-50%' }}
              transition={{ duration: 0.8, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
              pointerEvents="none"
            >
              <Text
                fontSize="6xl"
                fontWeight="bold"
                color="white"
                textAlign="center"
                textShadow="0 0 60px rgba(168, 85, 247, 0.8)"
              >
                Voted!
              </Text>
            </MotionBox>
          </>
        )}
      </AnimatePresence>

      {/* Top bar with instruction and votes */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={10}
        pt={12}
        pb={6}
        px={5}
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        {/* Instruction text */}
        <Box>
          <Text
            color="purple.300"
            fontSize="xs"
            letterSpacing="widest"
            textTransform="uppercase"
            fontWeight="medium"
            mb={1}
          >
            Live
          </Text>
          <Text
            color="white"
            fontSize="md"
            fontWeight="semibold"
          >
            Point and vote
          </Text>
        </Box>

        {/* Votes remaining counter */}
        <Box textAlign="right">
          <Text
            color="white"
            fontSize="3xl"
            fontWeight="bold"
            lineHeight="1"
          >
            {votesRemaining}
          </Text>
          <Text
            color="whiteAlpha.600"
            fontSize="xs"
            fontWeight="medium"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            votes left
          </Text>
        </Box>
      </Box>

      {/* Bottom UI */}
      <Box
        position="absolute"
        bottom={10}
        left={4}
        right={4}
        zIndex={10}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={3}
      >
        {/* Vote Button with light animation */}
        <Box position="relative">
          {/* Rotating light - purple theme */}
          <AnimatePresence>
            {lightPhase === 'rotating' && (
              <>
                {/* Spinning ring */}
                <MotionBox
                  position="absolute"
                  top="50%"
                  left="50%"
                  width="160px"
                  height="160px"
                  borderRadius="full"
                  border="3px solid"
                  borderColor="purple.400"
                  initial={{ rotate: 0, x: '-50%', y: '-50%', opacity: 0.8 }}
                  animate={{ rotate: 360, x: '-50%', y: '-50%', opacity: 0.8 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  boxShadow="0 0 30px rgba(168, 85, 247, 0.5)"
                />
                {/* Pulsing glow */}
                <MotionBox
                  position="absolute"
                  top="50%"
                  left="50%"
                  width="180px"
                  height="180px"
                  borderRadius="full"
                  bg="transparent"
                  initial={{ scale: 1, opacity: 0.5, x: '-50%', y: '-50%' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3], x: '-50%', y: '-50%' }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  boxShadow="0 0 60px rgba(168, 85, 247, 0.6)"
                />
              </>
            )}
          </AnimatePresence>

          {/* Shooting light - purple theme */}
          <AnimatePresence>
            {lightPhase === 'shooting' && (
              <>
                {/* Main shooting orb */}
                <MotionBox
                  position="fixed"
                  bottom="calc(40px + 60px)"
                  left="50%"
                  width="40px"
                  height="40px"
                  borderRadius="full"
                  bg="radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(168, 85, 247, 1) 100%)"
                  boxShadow="0 0 40px rgba(168, 85, 247, 0.8), 0 0 80px rgba(168, 85, 247, 0.6)"
                  initial={{ x: '-50%', y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: '-50%',
                    y: 'calc(-50vh + 60px)',
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 0.6, ease: 'easeIn' }}
                />
                {/* Trail particles */}
                {[0, 1, 2].map((i) => (
                  <MotionBox
                    key={i}
                    position="fixed"
                    bottom="calc(40px + 60px)"
                    left="50%"
                    width="20px"
                    height="20px"
                    borderRadius="full"
                    bg={['#a855f7', '#c084fc', '#e9d5ff'][i]}
                    boxShadow={`0 0 30px ${['#a855f7', '#c084fc', '#e9d5ff'][i]}`}
                    initial={{ x: '-50%', y: 0, scale: 1, opacity: 0.8 }}
                    animate={{
                      x: '-50%',
                      y: 'calc(-50vh + 60px)',
                      scale: 0,
                      opacity: 0
                    }}
                    transition={{ duration: 0.6, ease: 'easeIn', delay: i * 0.08 }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* The actual button */}
          {!capturing && (
            <Button
              onClick={() => takeScreenshot()}
              width="120px"
              height="120px"
              borderRadius="full"
              bg="white"
              color="gray.900"
              fontSize="md"
              fontWeight="semibold"
              boxShadow="0 4px 24px rgba(255, 255, 255, 0.2), 0 0 60px rgba(168, 85, 247, 0.3)"
              _hover={{
                transform: "scale(1.05)",
                boxShadow: "0 6px 32px rgba(255, 255, 255, 0.3), 0 0 80px rgba(168, 85, 247, 0.4)",
              }}
              _active={{
                transform: "scale(0.95)",
              }}
              transition="all 0.2s ease"
            >
              Vote
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default App
