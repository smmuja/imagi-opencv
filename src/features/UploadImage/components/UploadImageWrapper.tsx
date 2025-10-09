import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/base";
import styles from "@/features/UploadImage/styles";
import { useImageProcessing } from "@/features/UploadImage/hooks";
import { getAdjustedFileName } from "@/features/UploadImage/utils";

import { GrPowerReset } from "react-icons/gr";
import { MdCrop } from "react-icons/md";
import { FaCircleHalfStroke } from "react-icons/fa6";
import { IoMdDownload } from "react-icons/io";
import { UploadImagePreview, UploadDragDrop } from "@/features";

export function UploadImageWrapper() {
  const [file, setFile] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string>("");
  const [sizeLimitError, setSizeLimitError] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | undefined>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const {
    applyCrop,
    startCrop,
    cropMove,
    endCrop,
    croppedImage,
    applyGrayscale,
    grayscaleImage,
    applyPinkGreen,
    pinkGreenImage,
    resetImage,
  } = useImageProcessing({
    canvasRef,
    imgRef,
    setEditedImage,
  });

  // Load image on canvas once uploaded
  useEffect(() => {
    if (file) {
      const img = new window.Image();
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

      // Reset all filters when new image is uploaded (after setting the new file)
      resetImage();
    }
  }

  return (
    <>
      <div className="flex flex-col items-center my-4">
        <label className="font-semibold my-4 text-2xl">
          Upload Image for editing
        </label>
        {!file && <input type="file" onChange={handleChange} />}
        {file && (
          <UploadDragDrop
            onFileSelect={handleChange}
            buttonLabel="Change Image"
          />
        )}
        {sizeLimitError && <p className="text-red-500">{sizeLimitError}</p>}
      </div>

      {/* Upload Area */}
      {!file && (
        <div className="flex justify-center">
          <div className="flex flex-col items-center justify-center border border-gray-300 rounded-xl p-8 bg-gray-50 w-full max-w-4xl min-h-[250px]">
            <UploadImagePreview />
            <UploadDragDrop onFileSelect={handleChange} />
          </div>
        </div>
      )}

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
            <p className="text-orange-700">*Draw a rectangle to crop image</p>
          </div>

          <img
            src={file}
            ref={imgRef}
            alt={fileName}
            style={{ display: "none" }}
          />

          <Button onClick={resetImage} color="orange">
            Reset <GrPowerReset />
          </Button>
          <Button onClick={applyCrop} color="green">
            Crop <MdCrop />
          </Button>
          <Button onClick={applyGrayscale} color="gray">
            Grayscale <FaCircleHalfStroke />
          </Button>
          <Button
            onClick={applyPinkGreen}
            color="pinkgreen"
            disabled={!!pinkGreenImage}
          >
            Pink-Green <FaCircleHalfStroke />
          </Button>

          {(grayscaleImage || croppedImage || pinkGreenImage) && (
            <Button color="blue">
              <a href={editedImage} download={getAdjustedFileName(fileName)}>
                Download
              </a>{" "}
              <IoMdDownload />
            </Button>
          )}
        </>
      )}
    </>
  );
}
