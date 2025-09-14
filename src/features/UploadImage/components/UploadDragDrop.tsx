import React, { useRef } from "react";
import { Button } from "@/components/base";

export function UploadDragDrop({
  onFileSelect,
  buttonLabel = "Upload Image",
}: {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  buttonLabel?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mt-6 w-full max-w-md"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length) {
          const fileInputEvent = {
            target: { files: dt.files } as unknown as HTMLInputElement,
          } as React.ChangeEvent<HTMLInputElement>;
          onFileSelect(fileInputEvent);
        }
      }}
    >
      <p className="text-gray-600">Drag & drop or upload a file</p>
      <Button
        color="blue"
        className="mt-3"
        onClick={() => fileInputRef.current?.click()}
      >
        {buttonLabel}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={onFileSelect}
      />
    </div>
  );
}
