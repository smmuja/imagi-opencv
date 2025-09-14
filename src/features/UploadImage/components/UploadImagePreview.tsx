import previewImg from "@/assets/img/preview-img.png";
import previewImgGrayscale from "@/assets/img/preview-img-grayscale.png";

import Image from "next/image";

export function UploadImagePreview() {
  return (
    <>
      <div className="flex justify-center items-center p y-5 gap-3 w-full max-w-4xl">
        <Image
          src={previewImg}
          alt="Preview Image"
          className="rounded-xl w-1/2 h-auto object-cover"
        />
        <Image
          src={previewImgGrayscale}
          alt="Preview Image"
          className="rounded-xl w-1/2 h-auto object-cover"
        />
      </div>
    </>
  );
}
