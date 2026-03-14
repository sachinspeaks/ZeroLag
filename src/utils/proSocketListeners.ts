import { updateCallStatus } from "@/features/callStatusSlice";
import type { apptInfoType } from "@/types/globalTypes";
import type { Socket } from "socket.io-client";

const proSocketListeners = (
  socket: Socket,
  setApptInfo: React.Dispatch<React.SetStateAction<apptInfoType[]>>,
  dispatch: any,
) => {
  socket.on("apptData", (apptData) => {
    alert("apptdata" + JSON.stringify(apptData));
    setApptInfo(apptData);
  });
  socket.on("newOfferWaiting", (offerData: any) => {
    // dispatch the offer to redux so that it is available for later
    dispatch(updateCallStatus({ prop: "offer", value: offerData.offer }));
    dispatch(updateCallStatus({ prop: "myRole", value: "answerer" }));
  });
};
export default proSocketListeners;
