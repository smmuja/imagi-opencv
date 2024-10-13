"use client";
import { UploadImageWrapper } from "@/features";

export default function Home() {
  return (
    <>
      <header className="font-semibold text-2xl mb-4 p-4 text-blue-950">
        Welcome to Imagi OpenCV
      </header>
      <UploadImageWrapper />
    </>
  );
}
