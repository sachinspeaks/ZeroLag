// updates all peerConnections (addTracks) and update redux callStatus

import type { StreamsState } from "@/features/streamsSlice";

const startAudioStream = (streams: StreamsState) => {
  const localStream = streams.localStream;
  for (const s in streams) {
    if (s !== "localStream") {
      const curStream = streams[s];
      localStream.stream.getAudioTracks().forEach((t) => {
        curStream.peerConnection?.addTrack(t, streams.localStream.stream);
      });
    }
  }
};
export default startAudioStream;
