import { updateCallStatus } from "@/features/callStatusSlice";
import type { Socket } from "socket.io-client";

const ClientSocketListenerForAnswer = (socket: Socket, dispatch: Function) => {
  const handler = (answer: any) => {
    dispatch(updateCallStatus({ prop: "answer", value: answer }));
    dispatch(updateCallStatus({ prop: "myRole", value: "offerer" }));
  };
  socket.on("answerToClient", handler);
  return () => {
    socket.off("answerToClient", handler);
  };
};

const ClientSocketListenerForIce = (
  socket: Socket,
  addIceCandidateToPc: Function,
) => {
  const handler = (iceC: RTCIceCandidate) => addIceCandidateToPc(iceC);
  socket.on("iceToClient", handler);
  return () => {
    socket.off("iceToClient", handler);
  };
};
export default { ClientSocketListenerForAnswer, ClientSocketListenerForIce };
