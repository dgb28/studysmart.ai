"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
}

const NODE_COUNT = 55;
const CONNECTION_DISTANCE = 160;
const MOUSE_REPEL_RADIUS = 120;
const MOUSE_REPEL_FORCE = 0.35;

export default function AnimatedBackdrop() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // ── Resize handler ────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Initialise nodes ────────────────────────────────────────────
    nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2.5 + 1.5,
      opacity: Math.random() * 0.5 + 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // ── Mouse tracking ───────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    // ── Draw loop ────────────────────────────────────────────────────
    let tick = 0;
    const draw = () => {
      tick++;
      const isDark = resolvedTheme === "dark";
      const W = canvas.width;
      const H = canvas.height;

      // Theme-aware colors
      const nodeFill     = isDark ? "rgba(16, 185, 129," : "rgba(5, 150, 105,";
      const lineColor    = isDark ? "rgba(52, 211, 153," : "rgba(16, 185, 129,";
      const bgColor      = isDark ? "#0f1117" : "#f3f9f6";
      const glowColor    = isDark ? "rgba(16, 185, 129, 0.06)" : "rgba(5, 150, 105, 0.04)";

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      // Subtle radial glow in center
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const nodes = nodesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update node positions
      for (const n of nodes) {
        // Mouse repulsion
        const dx = n.x - mx;
        const dy = n.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
          const force = (MOUSE_REPEL_RADIUS - dist) / MOUSE_REPEL_RADIUS * MOUSE_REPEL_FORCE;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }

        // Gentle velocity damping
        n.vx *= 0.98;
        n.vy *= 0.98;

        // Speed clamp
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 1.5) { n.vx *= 1.5 / speed; n.vy *= 1.5 / speed; }

        n.x += n.vx;
        n.y += n.vy;

        // Soft boundary bounce
        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
        if (n.x > W) { n.x = W; n.vx = -Math.abs(n.vx); }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
        if (n.y > H) { n.y = H; n.vy = -Math.abs(n.vy); }

        n.pulsePhase += 0.02;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DISTANCE) {
            const alpha = (1 - d / CONNECTION_DISTANCE) * 0.35;
            ctx.beginPath();
            ctx.strokeStyle = lineColor + alpha + ")";
            ctx.lineWidth = 0.8;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = Math.sin(n.pulsePhase) * 0.2 + 0.8; // 0.6–1.0
        const r = n.radius * pulse;
        const alpha = n.opacity * pulse;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = nodeFill + alpha * 0.15 + ")";
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = nodeFill + alpha + ")";
        ctx.fill();
      }

      // Mouse highlight: brighten nodes near cursor
      for (const n of nodes) {
        const dx = n.x - mx;
        const dy = n.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_REPEL_RADIUS) {
          const strength = 1 - d / MOUSE_REPEL_RADIUS;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = nodeFill + strength * 0.5 + ")";
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [mounted, resolvedTheme]);

  if (!mounted) {
    return <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background)]" />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ display: "block" }}
    />
  );
}
