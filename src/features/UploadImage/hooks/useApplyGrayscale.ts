import { useState, RefObject } from "react";

export type useGrayscaleProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  setEditedImage: (image: string | undefined) => void;
};
export function useApplyGrayscale(props: useGrayscaleProps) {
  const { canvasRef, setEditedImage } = props;
  const [grayscaleImage, setGrayscaleImage] = useState<string | null>(null);

  function applyGrayscale() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const src = cv.imread(canvas);
    const dst = new cv.Mat();

    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.imshow(canvas, dst);

    const grayscaleImageUrl = canvas.toDataURL("image/png");
    setGrayscaleImage(grayscaleImageUrl);

    // Create a Blob from the grayscale image URL
    fetch(grayscaleImageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const grayscaleBlob = new Blob([blob], { type: "image/png" });
        const url = URL.createObjectURL(grayscaleBlob);
        setEditedImage(url); // Set edited image URL for download
      })
      .catch((error) => {
        console.error("Error creating Blob from grayscale image:", error);
      });

    src.delete();
    dst.delete();
  }

  return {
    applyGrayscale,
    grayscaleImage,
    setGrayscaleImage,
  };
}
