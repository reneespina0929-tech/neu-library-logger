// src/components/QrScanner.jsx
import { useEffect, useRef, useState } from "react";

export default function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      // Check BarcodeDetector support first
      if (!("BarcodeDetector" in window)) {
        setError("QR scanning requires Chrome on Android or a Chromium-based desktop browser. Try opening this page in Chrome.");
        return;
      }
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
        scanLoop();
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permission in your browser settings and try again.");
      } else {
        setError("Could not start camera. Make sure no other app is using it.");
      }
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    detector.detect(canvas)
      .then(barcodes => {
        if (barcodes.length > 0) {
          stopCamera();
          onScan(barcodes[0].rawValue);
        } else {
          animFrameRef.current = requestAnimationFrame(scanLoop);
        }
      })
      .catch(() => {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      });
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={handleClose}
    >
      <div
        style={{ background: "white", borderRadius: 16, overflow: "hidden", width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "var(--navy)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "var(--gold)", fontWeight: 600, fontSize: 15, fontFamily: "'Poppins', sans-serif" }}>Scan Student QR Code</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Point camera at the student's QR code</div>
          </div>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {error ? (
            <div style={{ background: "#fff0f0", border: "1px solid #fcc", borderRadius: 10, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
              <p style={{ color: "var(--red)", fontSize: 13, lineHeight: 1.6 }}>{error}</p>
              <button onClick={handleClose} style={{ marginTop: 14, padding: "8px 20px", background: "var(--navy)", color: "white", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Close</button>
            </div>
          ) : (
            <>
              <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000", lineHeight: 0 }}>
                <video ref={videoRef} muted playsInline style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover" }} />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Corner guides */}
                {ready && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ position: "relative", width: 180, height: 180 }}>
                      {[
                        { top: 0, left: 0, borderTop: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)", borderRadius: "6px 0 0 0" },
                        { top: 0, right: 0, borderTop: "3px solid var(--gold)", borderRight: "3px solid var(--gold)", borderRadius: "0 6px 0 0" },
                        { bottom: 0, left: 0, borderBottom: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)", borderRadius: "0 0 0 6px" },
                        { bottom: 0, right: 0, borderBottom: "3px solid var(--gold)", borderRight: "3px solid var(--gold)", borderRadius: "0 0 6px 0" },
                      ].map((s, i) => <div key={i} style={{ position: "absolute", width: 22, height: 22, ...s }} />)}
                    </div>
                  </div>
                )}

                {!ready && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                    <div style={{ color: "white", fontSize: 13 }}>Starting camera...</div>
                  </div>
                )}
              </div>
              <p style={{ textAlign: "center", color: "var(--gray-400)", fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
                Hold the QR code steady inside the frame
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}