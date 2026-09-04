"use client";

import { useEffect } from "react";

const backgroundImages = [
  "/meomeo.jpg",
  "/anh1.jpg",
  "/anh2.jpg",
  "/anh3.jpg",
  "/anh4.jpg",
  "/anh5.jpg",
  "/anh7.jpg",
  "/anh8.jpg",
  "/anh9.jpg",
];

export default function BackgroundRotator() {
  useEffect(() => {
    let imageIndex = 0;

    const changeBackground = () => {
      imageIndex = (imageIndex + 1) % backgroundImages.length;
      document.body.style.setProperty("--background-image", `url('${backgroundImages[imageIndex]}')`);
    };

    document.body.style.setProperty("--background-image", `url('${backgroundImages[imageIndex]}')`);
    const interval = window.setInterval(changeBackground, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}