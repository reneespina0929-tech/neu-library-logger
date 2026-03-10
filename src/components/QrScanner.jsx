// src/components/QrScanner.jsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scannerId = "qr-scanner-box";
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        // Stop scanner after successful scan
        scanner.stop().catch(() => {});
        onScan(decodedText);
      },
      () => {} // ignore per-frame errors
    )
      .then(() => setStarted(true))
      .catch((err) => {
        setError("Camera access denied. Please allow camera permission and try again.");
        console.error(err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: "white", borderRadius: 16, overflow: "hidden",
        width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{
          background: "var(--navy)", padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "var(--gold)", fontWeight: 600, fontSize: 15, fontFamily: "'Poppins', sans-serif" }}>
              Scan Student QR Code
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
              Point camera at the student's QR code
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
            color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Scanner area */}
        <div style={{ padding: 20 }}>
          {error ? (
            <div style={{
              background: "#fff0f0", border: "1px solid #fcc", borderRadius: 10,
              padding: 16, textAlign: "center", color: "var(--red)", fontSize: 13,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
              {error}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Scanner viewport */}
              <div
                id="qr-scanner-box"
                style={{ width: "100%", borderRadius: 10, overflow: "hidden", background: "#000" }}
              />
              {/* Overlay corners */}
              {started && (
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ position: "relative", width: 220, height: 220 }}>
                    {[
                      { top: 0, left: 0, borderTop: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)", borderRadius: "8px 0 0 0" },
                      { top: 0, right: 0, borderTop: "3px solid var(--gold)", borderRight: "3px solid var(--gold)", borderRadius: "0 8px 0 0" },
                      { bottom: 0, left: 0, borderBottom: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)", borderRadius: "0 0 0 8px" },
                      { bottom: 0, right: 0, borderBottom: "3px solid var(--gold)", borderRight: "3px solid var(--gold)", borderRadius: "0 0 8px 0" },
                    ].map((s, i) => (
                      <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p style={{ textAlign: "center", color: "var(--gray-400)", fontSize: 12, marginTop: 14 }}>
            The student ID will be filled in automatically after scanning
          </p>
        </div>
      </div>
    </div>
  );
}