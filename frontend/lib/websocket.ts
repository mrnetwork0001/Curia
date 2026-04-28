/* ---- WebSocket hook for real-time trial event streaming ---- */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CuriaMessage, WSEvent } from "./types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<CuriaMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>("filing");
  const [trialActive, setTrialActive] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setConnected(true);
        console.log("[WS] Connected to Curia server");
      };

      ws.onmessage = (event) => {
        try {
          const wsEvent: WSEvent = JSON.parse(event.data);

          if (wsEvent.type === "message") {
            const msg = wsEvent.data as unknown as CuriaMessage;
            setMessages((prev) => [...prev, msg]);
          } else if (wsEvent.type === "phase_change") {
            const phase = (wsEvent.data as { phase: string }).phase;
            setCurrentPhase(phase);
          } else if (wsEvent.type === "trial_start") {
            setTrialActive(true);
            setMessages([]);
            setCurrentPhase("opening");
          } else if (wsEvent.type === "trial_end") {
            setTrialActive(false);
          }
        } catch (err) {
          console.error("[WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("[WS] Disconnected. Reconnecting in 3s...");
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // Connection to remote host may fail transiently - REST polling is the fallback
        console.warn("[WS] Connection error - will retry. REST polling active as fallback.");
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[WS] Connection failed:", err);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    connected,
    messages,
    currentPhase,
    trialActive,
    clearMessages,
  };
}
