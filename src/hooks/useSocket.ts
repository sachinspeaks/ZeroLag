import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const socketCache = new Map<string, Socket>();
const socketSubscribers = new Map<string, number>();

const getSocketKey = (url: string, token: string | null | undefined) =>
  token ? `${url}::${token}` : url;

const getOrCreateSocket = (
  url: string,
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>,
  token?: string | null,
) => {
  const key = getSocketKey(url, token);
  const existingSocket = socketCache.get(key);
  if (existingSocket) return existingSocket;

  const socket = io(url, {
    auth: token ? { token } : undefined,
    transports: ["websocket"],
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    setIsReady(true);
  });

  socket.on("disconnect", () => {
    setIsReady(false);
  });

  socketCache.set(key, socket);
  return socket;
};

const useSocket = (url: string, token?: string | null) => {
  alert(token);
  const socketRef = useRef<Socket | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const key = getSocketKey(url, token);
    socketRef.current = getOrCreateSocket(url, setIsReady, token);
    socketSubscribers.set(key, (socketSubscribers.get(key) ?? 0) + 1);

    return () => {
      const nextSubscribers = (socketSubscribers.get(key) ?? 1) - 1;
      if (nextSubscribers <= 0) {
        socketSubscribers.delete(key);
        const socket = socketCache.get(key);
        if (socket) {
          socket.disconnect();
          socketCache.delete(key);
        }
      } else {
        socketSubscribers.set(key, nextSubscribers);
      }
      setIsReady(false);
      socketRef.current = null;
    };
  }, [url, token]);

  return { socketRef, isReady };
};

export default useSocket;
