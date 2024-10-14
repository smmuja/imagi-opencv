import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

import { Button } from "@/components/base";
import styles from "@/features/UploadImage/styles";
import { useApplyGrayscale, useApplyCrop } from "@/features/UploadImage/hooks";
import { getAdjustedFileName } from "@/features/UploadImage/utils";

import { GrPowerReset } from "react-icons/gr";
import { MdCrop } from "react-icons/md";
import { FaCircleHalfStroke } from "react-icons/fa6";
import { IoMdDownload } from "react-icons/io";

export function UploadImageWrapper() {
  const [file, setFile] = useState<string | undefined>();
  const [originalFile, setOriginalFile] = useState<string | null>();
  const [fileName, setFileName] = useState<string>("");
  const [sizeLimitError, setSizeLimitError] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | undefined>();

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
      setCroppedImage(null);
    }
  }

  return (
    <>
      <Script
        src="https://docs.opencv.org/4.x/opencv.js"
        onLoad={() => {
          console.log("OpenCV.js loaded");
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
              onTouchStart={startCrop}
              onTouchMove={cropMove}
              onTouchEnd={endCrop}
            ></canvas>
          </div>

          <img src={file} ref={imgRef} alt="" style={{ display: "none" }} />

          <Button onClick={resetImage} color="orange">
            Reset <GrPowerReset />
          </Button>
          <Button onClick={applyCrop} color="green">
            Crop <MdCrop />
          </Button>
          <Button onClick={applyGrayscale} color="gray">
            Grayscale <FaCircleHalfStroke />
          </Button>

          {(grayscaleImage || croppedImage) && (
            <>
              <Button color="blue">
                <a href={editedImage} download={getAdjustedFileName(fileName)}>
                  Download
                </a>{" "}
                <IoMdDownload />
              </Button>
            </>
          )}
        </>
      )}
    </>
  );
}
