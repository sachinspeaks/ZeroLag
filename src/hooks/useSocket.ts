import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const useSocket = (url: string) => {
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const socket = io(url, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socketRef.current.on("connect", () => {
      console.log("socket connected... ", socketRef.current?.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("socket disconnected...");
    });

    return () => {
      socket?.disconnect();
    };
  }, [url]);

  return socketRef;
};

export default useSocket;
