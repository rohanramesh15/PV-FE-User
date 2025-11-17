import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import CameraFeed from './CameraFeed';
import { Camera, Upload, CheckCircle, XCircle, Loader2, Monitor } from 'lucide-react';


const API_BASE_URL = 'https://pv-be-q7m9.onrender.com/api'

interface Scores {
  team1: number
  team2: number
}

function App() {
  const [scores, setScores] = useState<Scores>({ team1: 0, team2: 0 })
  const [loading, setLoading] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [error, setError] = useState(null);



  const dataURLtoBlob = (dataUrl) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
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

        const response = await fetch('http://localhost:5000/upload', {
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
      } finally {
        setUploading(false);
      }



    } catch (err) {
      setError('Failed to capture screenshot: ' + err.message);
      console.error('Screenshot error:', err);
    } finally {
      setCapturing(false);
    }
  };

  const uploadScreenshot = async () => {
    if (!screenshot) return;

    setUploading(true);
    setError(null);


  };

  const clearScreenshot = () => {
    setScreenshot(null);
    setUploadResponse(null);
    setError(null);
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
    <Container maxW="container.xl" py={10}>
      <Stack gap={8}>
        <Heading size="2xl" textAlign="center">
          Team Score Controller
        </Heading>

        <CameraFeed />
        <Button
          colorScheme="blue"
          size="lg"
          onClick={() => takeScreenshot()}
          disabled={loading === 'team1'}
          width="full"
        >
          {loading === 'team1' ? 'Cheering...' : 'Send Cheers'}
        </Button>

      </Stack>
    </Container>
  )
}

export default App