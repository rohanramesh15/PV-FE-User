import { Box, Button, Text } from '@chakra-ui/react'
import { useState } from 'react'
import CameraFeed from './CameraFeed';

// Type declaration for html2canvas
declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

const API_BASE_URL = "https://44b46f3c84f1.ngrok-free.app/api"
//'https://pv-be-q7m9.onrender.com/api'
//http://127.0.0.1:5000

function App() {
  const [capturing, setCapturing] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);



  // Minimum swipe distance (in px) to trigger action
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;

    if (isUpSwipe && !capturing) {
      takeScreenshot();
    }
  };

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
    setCapturing(true);
    setError(null);
    setUploadResponse(null);

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

  /*
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
  } */

  return (
    <Box
      position="relative"
      width="100vw"
      height="100vh"
      overflow="hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <CameraFeed />

      {/* Error message */}
      {error && (
        <Box
          position="absolute"
          top={4}
          left={4}
          right={4}
          bg="red.100"
          p={4}
          borderRadius="md"
          borderWidth={1}
          borderColor="red.500"
          zIndex={10}
        >
          <Text color="red.800">{error}</Text>
        </Box>
      )}

      {/* Success message */}
      {uploadResponse && (
        <Box
          position="absolute"
          top={4}
          left={4}
          right={4}
          bg="green.100"
          p={4}
          borderRadius="md"
          borderWidth={1}
          borderColor="green.500"
          zIndex={10}
        >
          <Text color="green.800">Screenshot uploaded successfully!</Text>
        </Box>
      )}

      {/* Bottom UI */}
      <Box
        position="absolute"
        bottom={8}
        left={4}
        right={4}
        zIndex={10}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={3}
      >
        {/* Swipe up indicator */}
        {!capturing && (
          <Text color="white" fontSize="sm" fontWeight="bold" textShadow="0 2px 4px rgba(0,0,0,0.5)">
            ↑ Swipe Up or Tap Button
          </Text>
        )}

        {/* Capturing indicator */}
        {capturing && (
          <Text color="white" fontSize="lg" fontWeight="bold" textShadow="0 2px 4px rgba(0,0,0,0.5)">
            Capturing...
          </Text>
        )}

        {/* Button */}
        {!capturing && (
          <Button
            colorScheme="blue"
            size="lg"
            onClick={() => takeScreenshot()}
            width="full"
          >
            Send Cheers
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default App