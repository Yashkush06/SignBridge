"use client";

/**
 * useWebcam — manages webcam access, permissions, and device selection.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { CameraState } from "@/lib/ml/types";

interface UseWebcamOptions {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
  deviceId?: string;
}

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraState: CameraState;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  devices: MediaDeviceInfo[];
  selectedDevice: string | null;
  setSelectedDevice: (id: string) => void;
}

export function useWebcam(options: UseWebcamOptions = {}): UseWebcamReturn {
  const {
    width = 640,
    height = 480,
    facingMode = "user",
    deviceId,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(
    deviceId || null
  );

  // Enumerate available video devices
  useEffect(() => {
    async function getDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
      } catch {
        // Permission might not be granted yet
      }
    }
    getDevices();
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState("starting");
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: selectedDevice ? undefined : facingMode,
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Re-enumerate devices after permission is granted
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);

      setCameraState("active");
    } catch (err: any) {
      setCameraState("error");
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera.");
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [width, height, facingMode, selectedDevice]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    cameraState,
    error,
    startCamera,
    stopCamera,
    devices,
    selectedDevice,
    setSelectedDevice,
  };
}
