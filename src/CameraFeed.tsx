import { useRef, useEffect } from 'react';

const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
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
      width: '100%', 
      maxWidth: '400px', 
      margin: '0 auto',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  );
};

export default CameraFeed;