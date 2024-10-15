import cv from "@techstark/opencv-js";

declare global {
  interface Window {
    cv: typeof cv;
  }
}

window.cv = cv;
