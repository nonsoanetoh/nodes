"use client";
import { useState, useEffect as useEffectHook } from "react";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffectHook(() => {
    const checkIsDesktop = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isNotDesktop = /mobile|tablet|android|iphone|ipad|ipod/.test(
        userAgent
      );
      setIsDesktop(!isNotDesktop);
    };

    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  return isDesktop;
}

export default function Unsupported() {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1>Unsupported Device</h1>
        <p>
          Sorry, this application is only supported on laptop and desktop
          devices. Please switch to a compatible device to continue.
        </p>
      </div>
    );
  }

  return null;
}
