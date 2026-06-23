"use client";

import { useEffect, useRef } from "react";

interface Candle {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
  bullish: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export default function FinanceBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Candlesticks ─────────────────────────────────────────────
    const CW = 7, GAP = 12, STEP = CW + GAP;
    let candleBase = 0;
    const candles: Candle[] = [];
    let scrollX = 0;

    const newCandle = (x: number): Candle => {
      if (!candleBase) candleBase = H * 0.62;
      const bullish = Math.random() > 0.42;
      const body = Math.random() * 28 + 8;
      const open = candleBase;
      const close = bullish ? open - body : open + body;
      candleBase = Math.max(H * 0.25, Math.min(H * 0.82, close));
      const top = Math.min(open, close);
      const bot = Math.max(open, close);
      return {
        x, open, close,
        high: top - Math.random() * 12,
        low:  bot + Math.random() * 12,
        bullish,
      };
    };

    const initCandles = () => {
      candles.length = 0;
      candleBase = H * 0.62;
      for (let x = -STEP; x < W + STEP * 2; x += STEP) candles.push(newCandle(x));
    };
    initCandles();
    window.addEventListener("resize", initCandles);

    // ── Price line (random walk) ──────────────────────────────────
    const linePoints: number[] = [];
    let lineY = H * 0.45;
    let lineOff = 0;

    const initLine = () => {
      linePoints.length = 0;
      lineY = H * 0.45;
      for (let i = 0; i < 120; i++) {
        lineY += (Math.random() - 0.48) * 14;
        lineY = Math.max(H * 0.1, Math.min(H * 0.75, lineY));
        linePoints.push(lineY);
      }
    };
    initLine();
    window.addEventListener("resize", initLine);

    // ── Particles ─────────────────────────────────────────────────
    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.35 + 0.08,
      opacity: Math.random() * 0.35 + 0.05,
    }));

    // ── Draw loop ─────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.028)";
      for (let x = 0; x < W; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Candles
      scrollX += 0.4;
      if (scrollX >= STEP) {
        scrollX -= STEP;
        candles.forEach((c) => (c.x -= STEP));
        candles.shift();
        candles.push(newCandle(candles[candles.length - 1].x + STEP));
      }

      candles.forEach((c) => {
        const x = c.x - scrollX;
        if (x < -STEP || x > W + STEP) return;
        const top = Math.min(c.open, c.close);
        const bot = Math.max(c.open, c.close);
        const h   = Math.max(bot - top, 2);

        // Wick
        ctx.strokeStyle = c.bullish ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + CW / 2, c.high);
        ctx.lineTo(x + CW / 2, c.low);
        ctx.stroke();

        // Body
        ctx.fillStyle = c.bullish ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.17)";
        ctx.fillRect(x, top, CW, h);
      });

      // Price line scroll
      lineOff += 0.7;
      if (lineOff >= 1) {
        lineOff -= 1;
        lineY += (Math.random() - 0.48) * 16;
        lineY = Math.max(H * 0.08, Math.min(H * 0.78, lineY));
        linePoints.push(lineY);
        linePoints.shift();
      }

      // Draw line with glow
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.8;

      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0,   "rgba(16,185,129,0)");
      grad.addColorStop(0.2, "rgba(16,185,129,0.5)");
      grad.addColorStop(0.8, "rgba(16,185,129,0.6)");
      grad.addColorStop(1,   "rgba(16,185,129,0.1)");
      ctx.strokeStyle = grad;

      ctx.beginPath();
      linePoints.forEach((y, i) => {
        const x = (i / (linePoints.length - 1)) * W;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill under line
      ctx.beginPath();
      linePoints.forEach((y, i) => {
        const x = (i / (linePoints.length - 1)) * W;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const fillG = ctx.createLinearGradient(0, H * 0.1, 0, H);
      fillG.addColorStop(0, "rgba(16,185,129,0.07)");
      fillG.addColorStop(1, "rgba(16,185,129,0)");
      ctx.fillStyle = fillG;
      ctx.fill();

      // Particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${p.opacity})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", initCandles);
      window.removeEventListener("resize", initLine);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
