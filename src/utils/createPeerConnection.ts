import peerConfiguration from "./stunServers";

const createPeerConnection = (): {
  peerConnection: RTCPeerConnection | null;
  remoteStream: MediaStream | null;
} => {
  const peerConnection = new RTCPeerConnection(peerConfiguration);
  const remoteStream = new MediaStream();

  peerConnection.addEventListener("signalingstatechange", (e) => {
    console.log("signalling state changed.");
    console.log(e);
  });
  peerConnection.addEventListener("icecandidate", (e) => {
    console.log("ice candidate found.");
    if (e.candidate) {
      // emit to signalling server
    }
  });

  return { peerConnection, remoteStream };
};

export default createPeerConnection;
