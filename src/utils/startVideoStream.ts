// updates all peerConnections (addTracks) and update redux callStatus

import type { AppDispatch } from "@/app/store";
import { updateCallStatus } from "@/features/callStatusSlice";
import type { StreamsState } from "@/features/streamsSlice";

const startLocalVideoStream = (
  streams: StreamsState,
  dispatch: AppDispatch,
) => {
  const localStream = streams.localStream;
  for (const s in streams) {
    if (s !== "localStream") {
      const curStream = streams[s];
      localStream.stream.getVideoTracks().forEach((t) => {
        curStream.peerConnection?.addTrack(t, streams.localStream.stream);
      });
      dispatch(updateCallStatus({ prop: "video", value: "enabled" }));
    }
  }
};
export default startLocalVideoStream;
