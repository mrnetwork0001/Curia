"use client";

import { useEffect, useRef } from "react";
import styles from "./NetworkMesh.module.css";

interface Node {
  role: string;
  peer_id: string;
  axl_port: number;
  message_count: number;
  status: string;
}

interface Props {
  nodes: Record<string, Node>;
}

const ROLE_COLORS: Record<string, string> = {
  judge: "#D4A84B",
  prosecutor: "#E74C3C",
  defender: "#4A90D9",
  juror1: "#2ECC71",
  juror2: "#27AE60",
};

const ROLE_LABELS: Record<string, string> = {
  judge: "Judge",
  prosecutor: "Prosecutor",
  defender: "Defender",
  juror1: "Juror 1",
  juror2: "Juror 2",
};

export default function NetworkMesh({ nodes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const roleKeys = Object.keys(nodes);

    // Position nodes in a pentagon
    const getPositions = () => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(cx, cy) * 0.6;

      const positions: Record<string, { x: number; y: number }> = {};
      roleKeys.forEach((role, i) => {
        const angle = (i / roleKeys.length) * Math.PI * 2 - Math.PI / 2;
        positions[role] = {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        };
      });
      return { positions, cx, cy, radius };
    };

    let time = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const { positions } = getPositions();

      // Draw connections (mesh lines)
      roleKeys.forEach((role1, i) => {
        roleKeys.forEach((role2, j) => {
          if (j <= i) return;
          const p1 = positions[role1];
          const p2 = positions[role2];

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = "rgba(212, 168, 75, 0.08)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Animated particle
          const progress = ((time * 0.5 + i * 30 + j * 50) % 200) / 200;
          const particleX = p1.x + (p2.x - p1.x) * progress;
          const particleY = p1.y + (p2.y - p1.y) * progress;

          ctx.beginPath();
          ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 168, 75, ${0.3 + Math.sin(progress * Math.PI) * 0.5})`;
          ctx.fill();
        });
      });

      // Draw nodes
      roleKeys.forEach((role) => {
        const pos = positions[role];
        const color = ROLE_COLORS[role] || "#888";
        const node = nodes[role];

        // Glow
        const glowRadius = 30 + Math.sin(time * 0.03) * 5;
        const gradient = ctx.createRadialGradient(
          pos.x, pos.y, 0,
          pos.x, pos.y, glowRadius
        );
        gradient.addColorStop(0, color + "30");
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = color + "20";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.fillStyle = "#F0EDE6";
        ctx.font = "600 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ROLE_LABELS[role] || role, pos.x, pos.y + 30);

        // Port
        ctx.fillStyle = "#5A5762";
        ctx.font = "500 10px Inter, sans-serif";
        ctx.fillText(`:${node?.axl_port || ""}`, pos.x, pos.y + 43);

        // Peer ID
        if (node?.peer_id) {
          ctx.fillStyle = color + "80";
          ctx.font = "10px 'SF Mono', monospace";
          ctx.fillText(node.peer_id.slice(0, 12) + "...", pos.x, pos.y + 55);
        }
      });

      time++;
      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [nodes]);

  return (
    <div className={styles.wrapper} id="network-mesh">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
