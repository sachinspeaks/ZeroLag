import { updateCallStatus } from "@/features/callStatusSlice";
import type { apptInfoType } from "@/types/globalTypes";
import type { Socket } from "socket.io-client";

const proDashboardSocketListener = (
  socket: Socket,
  setApptInfo: React.Dispatch<React.SetStateAction<apptInfoType[]>>,
  dispatch: any,
) => {
  const apptHandler = (apptData: any) => {
    setApptInfo(apptData);
  };
  const offerHandler = (offerData: any) => {
    // dispatch the offer to redux so that it is available for later
    dispatch(updateCallStatus({ prop: "offer", value: offerData.offer }));
    dispatch(updateCallStatus({ prop: "myRole", value: "answerer" }));
    dispatch(updateCallStatus({ prop: "haveCreatedAnswer", value: false }));
  };
  socket.on("apptData", apptHandler);
  socket.on("newOfferWaiting", offerHandler);
  return () => {
    socket.off("apptData", apptHandler);
    socket.off("newOfferWaiting", offerHandler);
  };
};

const proVideoSocketListener = (
  socket: Socket,
  addIceCandidateToPc: Function,
) => {
  const handler = (iceC: RTCIceCandidate) => {
    addIceCandidateToPc(iceC);
  };
  socket.on("iceToProfessional", handler);
  return () => {
    socket.off("iceToProfessional", handler);
  };
};

export default { proDashboardSocketListener, proVideoSocketListener };
