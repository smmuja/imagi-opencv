import { Button } from "@/components/base";
import { useEffect, useRef, useState } from "react";
import styles from "./uploadImage.module.css";
import Script from "next/script";

export function UploadImage() {
  const [opencvLoaded, setOpencvLoaded] = useState<boolean>(false);
  const [file, setFile] = useState<string | undefined>();
  const [originalFile, setOriginalFile] = useState<string | null>();
  const [fileName, setFileName] = useState<string>("");
  const [sizeLimitError, setSizeLimitError] = useState<string | null>(null);
  const [grayscaleImage, setGrayscaleImage] = useState<string | null>();
  const [editedImage, setEditedImage] = useState<string | undefined>();

  const [cropping, setCropping] = useState(false);
  const [cropRegion, setCropRegion] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.cv) {
      window.cv["onRuntimeInitialized"] = () => {
        console.log("OpenCV.js is ready");
      };
    }
  }, []);

  useEffect(() => {
    if (file) {
      const img = new Image();
      img.src = file;
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [file]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log(e.target.files);

    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      const fileSizeInMB = selectedFile.size / 1024 / 1024; // Convert bytes to MB
      const maxFileSize = 2; // MB

      if (fileSizeInMB > maxFileSize) {
        setSizeLimitError(
          "File size exceeds 2MB. Please upload a smaller file"
        );
        return;
      }

      const imageURL = URL.createObjectURL(selectedFile);
      setSizeLimitError(null);
      setFile(imageURL);
      setFileName(selectedFile.name);
      setOriginalFile(imageURL);
      setEditedImage(imageURL);
      setGrayscaleImage(undefined);

      const img = imgRef.current;
      if (!img) return;
      img.onload = function () {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      };
    }
  }

  function getAdjustedFileName(originalName: string) {
    const nameWithoutExtension = originalName.substring(
      0,
      originalName.lastIndexOf(".")
    );
    const extension = originalName.substring(originalName.lastIndexOf("."));
    return `${nameWithoutExtension}-adjusted${extension}`;
  }

  // Track mouse start position
  const startX = useRef(0);
  const startY = useRef(0);

  function startCrop(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!canvas || !rect) return;

    // Calculate the scaling factors between the canvas's CSS size and its internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate the starting coordinates relative to the canvas
    startX.current = (e.clientX - rect.left) * scaleX;
    startY.current = (e.clientY - rect.top) * scaleY;

    // Set initial crop region to zero width/height
    setCropping(true);
    setCropRegion({
      x: startX.current,
      y: startY.current,
      width: 0,
      height: 0,
    });
  }

  function cropMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!cropping || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

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
    ctx.lineWidth = 2;
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

  function applyGrayscale() {
    if (!opencvLoaded || !canvasRef.current) return;

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

  function resetImage() {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (img && canvas && ctx && originalFile) {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setFile(originalFile);

      ctx.drawImage(img, 0, 0);

      setEditedImage(originalFile);

      setGrayscaleImage(null);

      setCropRegion(null);
    }
  }

  return (
    <>
      <Script
        src="https://docs.opencv.org/4.x/opencv.js"
        onLoad={() => {
          console.log("OpenCV.js loaded");
          setOpencvLoaded(true);
        }}
      />

      <div className="flex flex-col items-center my-4">
        <label className="font-semibold my-4 text-2xl">
          Upload Image for editing
        </label>
        <input type="file" onChange={handleChange} />
      </div>
      {sizeLimitError && <p className="text-red-500">{sizeLimitError}</p>}

      {file && (
        <>
          <div className={`${styles.canvasContainer}`}>
            <canvas
              id="imageCanvas"
              ref={canvasRef}
              className={`${styles.imageCanvas}`}
              onMouseDown={startCrop}
              onMouseMove={cropMove}
              onMouseUp={endCrop}
              onMouseLeave={endCrop}
            ></canvas>
          </div>

          <img src={file} ref={imgRef} alt="" style={{ display: "none" }} />

          <Button onClick={resetImage} color="orange">
            Reset
          </Button>
          <Button onClick={applyCrop} color="green">
            Crop Image
          </Button>
          <Button onClick={applyGrayscale} color="gray">
            Convert to Grayscale
          </Button>

          {(grayscaleImage || cropRegion) && (
            <>
              <Button color="blue">
                <a href={editedImage} download={getAdjustedFileName(fileName)}>
                  Download image
                </a>
              </Button>
            </>
          )}
        </>
      )}
    </>
  );
}
