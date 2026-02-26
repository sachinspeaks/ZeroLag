import { io, Socket } from "socket.io-client";

export const socket: Socket = io("https://localhost:3000", {
  autoConnect: false,
});
