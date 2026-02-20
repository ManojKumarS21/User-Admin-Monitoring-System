
let socket: WebSocket | null = null;

export function getSocket() {
  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";
    console.log("🔌 Connecting WebSocket to:", wsUrl);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => console.log("✅ WebSocket Connected");
    socket.onclose = () => console.log("❌ WebSocket Disconnected");
    socket.onerror = (err) => console.error("⚠️ WebSocket Error:", err);
  }
  return socket;
}

