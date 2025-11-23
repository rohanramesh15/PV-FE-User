import { useRef, useEffect } from 'react';

const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Try to use back camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" } // Use back camera on mobile
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing back camera, trying default:', error);
        // Fallback to default camera if back camera is not available
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment" // Prefer back camera without exact constraint
            },
            audio: false
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (fallbackError) {
          console.error('Error accessing camera:', fallbackError);
        }
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 0
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
};

export default CameraFeed;