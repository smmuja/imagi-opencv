import { useState, RefObject } from "react";
import cv from "@techstark/opencv-js";

export type usePinkGreenParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  setEditedImage: (image: string | undefined) => void;
};

export function useApplyPinkGreen(params: usePinkGreenParams) {
  const { canvasRef, setEditedImage } = params;
  const [pinkGreenImage, setPinkGreenImage] = useState<string | null>(null);

  function applyPinkGreen() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const dst = new cv.Mat();

    // Convert to grayscale first (intensity basis for mapping)
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Create output with same size and 3 channels
    dst.create(src.rows, src.cols, cv.CV_8UC3);

    const pink = { r: 221, g: 121, b: 173 }; // #DD79AD
    const green = { r: 5, g: 123, b: 65 }; // #057B41

    // Optimized approach: Use LUT (Look-Up Table) for much faster processing
    // Create LUT for each channel - this is the fastest method
    const lutSize = 256;
    const rLut = new cv.Mat(1, lutSize, cv.CV_8U);
    const gLut = new cv.Mat(1, lutSize, cv.CV_8U);
    const bLut = new cv.Mat(1, lutSize, cv.CV_8U);

    // Pre-calculate all possible interpolations (only 256 iterations vs millions)
    for (let i = 0; i < lutSize; i++) {
      const intensity = i / 255.0; // normalized [0,1]

      // Linear interpolation between green (0) and pink (1) - SAME LOGIC as loop
      const r = Math.round(green.r * (1 - intensity) + pink.r * intensity);
      const g = Math.round(green.g * (1 - intensity) + pink.g * intensity);
      const b = Math.round(green.b * (1 - intensity) + pink.b * intensity);

      rLut.ucharPtr(0, i)[0] = Math.max(0, Math.min(255, r));
      gLut.ucharPtr(0, i)[0] = Math.max(0, Math.min(255, g));
      bLut.ucharPtr(0, i)[0] = Math.max(0, Math.min(255, b));
    }

    // Apply LUT to each channel (extremely fast - no loops!)
    const rChannel = new cv.Mat();
    const gChannel = new cv.Mat();
    const bChannel = new cv.Mat();

    cv.LUT(gray, rLut, rChannel);
    cv.LUT(gray, gLut, gChannel);
    cv.LUT(gray, bLut, bChannel);

    // Create MatVector for proper channel merging
    const channels = new cv.MatVector();
    channels.push_back(rChannel); // R channel first for RGB
    channels.push_back(gChannel); // G channel second
    channels.push_back(bChannel); // B channel third

    // Merge channels into RGB image
    cv.merge(channels, dst);

    cv.imshow(canvas, dst);

    const imageUrl = canvas.toDataURL("image/png");
    setPinkGreenImage(imageUrl);

    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const pinkGreenBlob = new Blob([blob], { type: "image/png" });
        const url = URL.createObjectURL(pinkGreenBlob);
        setEditedImage(url);
      })
      .catch((error) => {
        console.error("Error creating Blob from pink-green image:", error);
      });

    // Clean up all matrices
    src.delete();
    gray.delete();
    dst.delete();
    rLut.delete();
    gLut.delete();
    bLut.delete();
    rChannel.delete();
    gChannel.delete();
    bChannel.delete();
    channels.delete();
  }

  return {
    applyPinkGreen,
    pinkGreenImage,
    setPinkGreenImage,
  };
}
