import { updateCallStatus } from "@/features/callStatusSlice";
import type { Socket } from "socket.io-client";

const ClientSocketListenerForAnswer = (socket: Socket, dispatch: Function) => {
  socket.on("answerToClient", (answer) => {
    console.log("answer received");
    dispatch(updateCallStatus({ prop: "answer", value: answer }));
    dispatch(updateCallStatus({ prop: "myRole", value: "offerer" }));
  });
};

const ClientSocketListenerForIce = (
  socket: Socket,
  addIceCandidateToPc: Function,
) => {
  socket.on("iceToClient", (iceC) => {
    addIceCandidateToPc(iceC);
  });
};
export default { ClientSocketListenerForAnswer, ClientSocketListenerForIce };
