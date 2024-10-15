import { useApplyCrop, useApplyGrayscale } from "@/features/UploadImage/hooks";
import { useEffect } from "react";
import cv from "@techstark/opencv-js";

export type useImageProcessingParams = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgRef: React.RefObject<HTMLImageElement>;

  setEditedImage: (image: string | undefined) => void;
};

export function useImageProcessing(params: useImageProcessingParams) {
  const { canvasRef, imgRef, setEditedImage } = params;

  const img = imgRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");

  useEffect(() => {
    if (cv) {
      cv["onRuntimeInitialized"] = () => {
        console.log("OpenCV.js is ready");
      };
    }
  }, []);

  const { applyGrayscale, grayscaleImage, setGrayscaleImage } =
    useApplyGrayscale({
      canvasRef,
      setEditedImage,
    });

  const {
    applyCrop,
    startCrop,
    cropMove,
    endCrop,
    croppedImage,
    setCroppedImage,
  } = useApplyCrop({
    canvasRef,
    imgRef,
    setEditedImage,
  });

  function resetImage() {
    if (img && canvas && ctx) {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);

      setGrayscaleImage(null);
      setCroppedImage(null);
    }
  }
  return {
    applyCrop,
    startCrop,
    cropMove,
    endCrop,
    croppedImage,
    setCroppedImage,
    applyGrayscale,
    grayscaleImage,
    setGrayscaleImage,
    resetImage,
  };
}
