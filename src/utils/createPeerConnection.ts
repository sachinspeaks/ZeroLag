import peerConfiguration from "./stunServers";

const createPeerConnection = (
  sendIce: Function,
): {
  peerConnection: RTCPeerConnection | null;
  remoteStream: MediaStream | null;
} => {
  const peerConnection = new RTCPeerConnection(peerConfiguration);
  const remoteStream = new MediaStream();

  peerConnection.addEventListener("icecandidate", (e) => {
    if (e.candidate) {
      // emit to signalling server
      sendIce(e.candidate);
    }
  });
  peerConnection.addEventListener("track", (e) => {
    //got a track from the remote
    e.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  });

  return { peerConnection, remoteStream };
};

export default createPeerConnection;
