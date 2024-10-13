import { useRef, useState } from "react";

export type useApplyCropProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgRef: React.RefObject<HTMLImageElement>;

  setEditedImage: (image: string | undefined) => void;
};

export function useApplyCrop(props: useApplyCropProps) {
  const { setEditedImage, canvasRef, imgRef } = props;

  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [cropping, setCropping] = useState(false);
  const [cropRegion, setCropRegion] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Track mouse start position
  const startX = useRef(0);
  const startY = useRef(0);

  function getEventCoordinates(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    if ("touches" in e) {
      // Touch event
      const touch = e.touches[0];
      return { x: touch.clientX, y: touch.clientY };
    } else {
      // Mouse event
      return { x: e.clientX, y: e.clientY };
    }
  }

  function startCrop(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!canvas || !rect) return;

    const { x: clientX, y: clientY } = getEventCoordinates(e);

    // Calculate the scaling factors between the canvas's CSS size and its internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate the starting coordinates relative to the canvas
    startX.current = (clientX - rect.left) * scaleX;
    startY.current = (clientY - rect.top) * scaleY;

    // Set initial crop region to zero width/height
    setCropping(true);
    setCropRegion({
      x: startX.current,
      y: startY.current,
      width: 0,
      height: 0,
    });
  }

  function cropMove(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    if (!cropping || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const { x: clientX, y: clientY } = getEventCoordinates(e);

    // Calculate the scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (clientX - rect.left) * scaleX;
    const currentY = (clientY - rect.top) * scaleY;

    // Calculate new width and height based on mouse movement
    const width = currentX - startX.current;
    const height = currentY - startY.current;

    // Update crop region without causing flickering
    setCropRegion({
      x: startX.current,
      y: startY.current,
      width: Math.max(width, 0),
      height: Math.max(height, 0),
    });

    // Use requestAnimationFrame for smooth drawing
    requestAnimationFrame(() =>
      drawCrop(canvas, startX.current, startY.current, width, height)
    );
  }

  function drawCrop(
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;

    if (!ctx || !img) return;

    // Clear the canvas and redraw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw the crop rectangle
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function endCrop() {
    setCropping(false);
    // Optionally finalize the crop region
    setCropRegion((prev) => {
      if (prev && prev.width > 0 && prev.height > 0) {
        return { ...prev }; // Keep valid crop region
      }
      return null; // Reset if invalid
    });
  }

  function applyCrop() {
    if (!cropRegion) return;

    const canvas = canvasRef.current;

    if (!canvas) {
      console.error("Canvas is not available");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imgRef.current;

    if (!img) {
      console.error("Image is not available");
      return;
    }

    // Clear the canvas and redraw the image WITHOUT the red crop rectangle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const src = cv.imread(canvas);
    const dst = new cv.Mat();

    const rect = new cv.Rect(
      cropRegion.x,
      cropRegion.y,
      cropRegion.width,
      cropRegion.height
    );
    const cropped = src.roi(rect);

    cv.imshow(canvas, cropped);

    // Create a Blob from the cropped image
    const croppedImageUrl = canvas.toDataURL("image/png");
    setCroppedImage(croppedImageUrl);

    fetch(croppedImageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const croppedBlob = new Blob([blob], { type: "image/png" });
        const url = URL.createObjectURL(croppedBlob);
        setEditedImage(url); // Set the edited image URL for download
      });

    src.delete();
    cropped.delete();
    dst.delete();
  }

  return {
    cropping,
    startCrop,
    cropMove,
    cropRegion,
    drawCrop,
    endCrop,
    applyCrop,
    croppedImage,
    setCroppedImage,
  };
}
