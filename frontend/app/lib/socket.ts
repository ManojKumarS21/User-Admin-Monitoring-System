/*let socket: WebSocket | null = null;

export function getSocket() {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket("ws://localhost:5000");
  }
  return socket;
} */

let socket: WebSocket | null = null;

export function getSocket() {

  if (!socket || socket.readyState > 1) {
    // 2 = CLOSING, 3 = CLOSED
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";
    socket = new WebSocket(wsUrl);
  }

  return socket;
}

