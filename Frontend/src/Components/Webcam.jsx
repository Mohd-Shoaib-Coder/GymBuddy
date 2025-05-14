import React, { useEffect, useRef, useState } from 'react';
import * as mpPose from '@mediapipe/pose';
import * as tf from '@tensorflow/tfjs';

const PoseDetection = () => {
  const videoRef = useRef(null); // Ref for video element
  const canvasRef = useRef(null); // Ref for canvas element to draw pose landmarks
  const [hasPermission, setHasPermission] = useState(true); // Track permission state
  const [isLoaded, setIsLoaded] = useState(false); // Track if TensorFlow.js is loaded

  useEffect(() => {
    const loadPoseModel = async () => {
      // Load TensorFlow.js model
      await tf.ready();
      setIsLoaded(true);

      // Create the MediaPipe Pose instance
      const pose = new mpPose.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      // Set up the Pose detector
      pose.onResults(drawPose);

      // Start webcam
      startWebcam(pose);
    };

    loadPoseModel();

    return () => {
      // Cleanup: stop the webcam and release the resources
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async (pose) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      // Set the video source to the webcam stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          detectPose(pose);
        };
      }
    } catch (err) {
      console.error("Error accessing the webcam:", err);
      setHasPermission(false); // If there's an error (e.g., user denied permission)
    }
  };

  const detectPose = (pose) => {
    // Continuously send frames for pose detection
    setInterval(() => {
      if (videoRef.current) {
        pose.send({ image: videoRef.current });
      }
    }, 100); // Process every 100ms
  };

  const drawPose = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.width;
    canvas.height = videoRef.current.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.poseLandmarks) {
      // Draw landmarks and skeleton
      mpPose.drawConnectors(ctx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4,
      });
      mpPose.drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {!hasPermission && (
        <p className="text-red-500 mb-4">Permission denied! Please allow camera access.</p>
      )}
      {isLoaded ? (
        <>
          <div className="relative mb-4">
            <video
              ref={videoRef}
              autoPlay
              muted
              width="640"
              height="480"
              className="border-2 border-black rounded-lg"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 z-10 rounded-lg"
            />
          </div>
        </>
      ) : (
        <p>Loading TensorFlow.js...</p>
      )}
    </div>
  );
};

export default PoseDetection;
