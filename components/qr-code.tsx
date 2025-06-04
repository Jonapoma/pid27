"use client"

import { useEffect, useRef } from "react"

interface QRCodeProps {
  data: string
  size?: number
  bgColor?: string
  fgColor?: string
  className?: string
}

export function QRCode({ data, size = 200, bgColor = "#ffffff", fgColor = "#000000", className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return

      try {
        // Dynamically import QRCode.js
        const QRCodeGenerator = (await import("qrcode")).default

        // Clear the canvas
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        // Generate QR code with specific options for better compatibility
        await QRCodeGenerator.toCanvas(canvas, data, {
          width: size,
          margin: 1,
          errorCorrectionLevel: "L", // Lower error correction for better compatibility with Serbian banking apps
          color: {
            dark: fgColor,
            light: bgColor,
          },
        })
      } catch (err) {
        console.error("Error generating QR code:", err)

        // Fallback: Draw a placeholder if QR code generation fails
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, size, size)
          ctx.strokeStyle = fgColor
          ctx.lineWidth = 2
          ctx.strokeRect(10, 10, size - 20, size - 20)
          ctx.font = "16px Arial"
          ctx.fillStyle = fgColor
          ctx.textAlign = "center"
          ctx.fillText("QR", size / 2, size / 2)
        }
      }
    }

    generateQRCode()
  }, [data, size, bgColor, fgColor])

  return <canvas ref={canvasRef} width={size} height={size} className={className} />
}

// Simple fallback component if QRCode.js fails to load
export function QRCodeFallback({ size = 200, className = "" }: { size?: number; className?: string; data?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width: size, height: size }}>
      <div className="text-4xl text-gray-400">QR</div>
    </div>
  )
}
