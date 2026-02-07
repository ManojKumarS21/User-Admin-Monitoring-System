"use client";

import { useEffect } from "react";

export default function CursorSparkles() {
  useEffect(() => {
    const createSparkle = (e: MouseEvent) => {
      const sparkle = document.createElement("div");

      sparkle.className = "sparkle";
      sparkle.style.left = e.pageX + "px";
      sparkle.style.top = e.pageY + "px";

      document.body.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 600);
    };

    window.addEventListener("mousemove", createSparkle);

    return () => {
      window.removeEventListener("mousemove", createSparkle);
    };
  }, []);

  return null;
}
