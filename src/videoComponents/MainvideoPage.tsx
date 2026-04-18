import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CallInfo from "./CallInfo";
import ActionButtons from "./ActionButton";
import { addStream, type StreamsState } from "@/features/streamsSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import createPeerConnection from "@/utils/createPeerConnection";
// import useSocket from "@/hooks/useSocket";
import { updateCallStatus } from "@/features/callStatusSlice";
import useSocket from "@/hooks/useSocket";
import type { apptInfoType } from "@/types/globalTypes";
import axios from "axios";
import ClientSocketListeners from "@/utils/clientSocketListeners";

const MainVideoPage = () => {
  // const socket = useSocket("https://localhost:5173");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const callStatus = useAppSelector((state) => state.callStatus);
  const streams = useAppSelector((state) => state.streams);
  const dispatch = useAppDispatch();
  const smallFeedRef = useRef<HTMLVideoElement>(null);
  const largeFeedRef = useRef<HTMLVideoElement>(null);
  const [showCallInfo, setShowCallInfo] = useState(true);
  const { socketRef, isReady } = useSocket("https://localhost:3001", token);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);
  const uuidRef = useRef<string>(null);
  const streamsRef = useRef<StreamsState | null>(null);

  const [apptInfo, setApptInfo] = useState<apptInfoType[]>([]);

  useEffect(() => {
    //grab the token var out of the query string
    const token = searchParams.get("token");
    const fetchDecodedToken = async () => {
      const resp = await axios.post(
        "https://localhost:3001/api/validate-link",
        { token },
      );
      setApptInfo([resp.data]);
      uuidRef.current = resp.data.uuid;
    };
    fetchDecodedToken();
  }, []);

  const addIceCandidateToPc = (iceC: RTCIceCandidate) => {
    //add an ice candidate from the remote to, the pc

    for (const s in streamsRef.current) {
      if (s != "localStream") {
        const pc = streamsRef.current[s].peerConnection;
        pc?.addIceCandidate(iceC);
        setShowCallInfo(false);
      }
    }
  };

  useEffect(() => {
    if (socketRef.current) {
      const cleanUp = ClientSocketListeners.ClientSocketListenerForIce(
        socketRef.current,
        addIceCandidateToPc,
      );
      return cleanUp;
    }
  }, [isReady]);

  const sendIce = (candidate: RTCIceCandidate) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      pendingCandidates.current.push(candidate);
      return;
    }
    socket.emit("iceToServer", {
      candidate,
      who: "client",
      uuid: uuidRef.current,
    });
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const flush = () => {
      for (const candidate of pendingCandidates.current)
        socket.emit("iceToServer", {
          candidate,
          who: "client",
          uuid: uuidRef.current,
        });
      pendingCandidates.current = [];
    };

    if (socket.connected) flush();

    socket.on("connect", flush);

    return () => {
      socket.off("connect", flush);
    };
  }, [isReady]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        dispatch(updateCallStatus({ prop: "haveMedia", value: true }));
        dispatch(addStream({ who: "localStream", stream }));
        const videoDeviceId = stream.getVideoTracks()[0].getSettings().deviceId;

        if (videoDeviceId) {
          dispatch(
            updateCallStatus({
              prop: "videoDevice",
              value: videoDeviceId,
            }),
          );
        }

        const { peerConnection, remoteStream } = createPeerConnection(sendIce);

        if (!remoteStream) return;
        dispatch(
          addStream({ who: "remote1", stream: remoteStream, peerConnection }),
        );
        if (largeFeedRef.current) {
          largeFeedRef.current.srcObject = remoteStream;
        }
      } catch {
        // media device error
      }
    };
    fetchMedia();
  }, []);

  useEffect(() => {
    if (!isReady || !callStatus.answer || !socketRef.current) return;
    const fetchBufferedIce = async () => {
      const iceCandidates = await socketRef.current?.emitWithAck(
        "getIce",
        uuidRef.current,
        "client",
      );
      iceCandidates.forEach((ice: RTCIceCandidate) => {
        for (const s in streamsRef.current) {
          if (s !== "localStream") {
            streamsRef.current[s].peerConnection?.addIceCandidate(ice);
          }
        }
      });
    };
    fetchBufferedIce();
  }, [isReady, callStatus.answer]);

  useEffect(() => {
    //we cannot update streamsRef untill we know redux is finished
    if (streams.remote1) {
      streamsRef.current = streams;
    }
  }, [streams]);

  useEffect(() => {
    const createOfferAsync = async () => {
      if (!socketRef || !socketRef.current || !streamsRef.current) return;
      if (!socketRef.current.connected) return;
      // after we have video or audio lets createa an offer
      for (const s in streamsRef.current) {
        if (s !== "localStream") {
          try {
            const pc = streamsRef.current[s].peerConnection;
            const offer = await pc?.createOffer();
            await pc?.setLocalDescription(offer);
            dispatch(
              updateCallStatus({
                prop: "offer",
                value: { ...callStatus.offer, offer },
              }),
            );
            socketRef.current.emit("newOffer", {
              offer,
              apptInfo: apptInfo[0],
            });
            // ClientSocketListeners.ClientSocketListenerForAnswer(
            //   socketRef.current,
            //   dispatch,
            // );
          } catch {
            // offer creation error
          }
        }
      }
      dispatch(updateCallStatus({ prop: "haveCreatedOffer", value: true }));
    };

    if (
      callStatus.video === "enabled" &&
      callStatus.audio === "enabled" &&
      !callStatus.haveCreatedOffer &&
      isReady &&
      apptInfo.length
    )
      createOfferAsync();
  }, [
    callStatus.video,
    callStatus.audio,
    callStatus.haveCreatedOffer,
    apptInfo,
    isReady,
  ]);
  useEffect(() => {
    if (socketRef.current) {
      return ClientSocketListeners.ClientSocketListenerForAnswer(
        socketRef.current,
        dispatch,
      );
    }
  }, [isReady]);

  useEffect(() => {
    if (!socketRef.current) return;
    const handler = async () => {
      if (!streamsRef.current) return;
      dispatch(updateCallStatus({ prop: "answer", value: null }));
      for (const s in streamsRef.current) {
        if (s !== "localStream") {
          const pc = streamsRef.current[s].peerConnection;
          if (!pc) continue;
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          socketRef.current?.emit("newOffer", { offer, apptInfo: apptInfo[0] });
        }
      }
    };
    socketRef.current.on("proReconnected", handler);
    return () => {
      socketRef.current?.off("proReconnected", handler);
    };
  }, [isReady, apptInfo]);

  //useEffect to set remote desc when callStatus has a answer from the server
  useEffect(() => {
    const asyncAddAnswer = async () => {
      for (const s in streams) {
        if (s !== "localStream") {
          const pc = streams[s].peerConnection;
          await pc?.setRemoteDescription(callStatus.answer);
        }
      }
    };
    if (callStatus.answer) asyncAddAnswer();
  }, [callStatus.answer]);

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-t from-gray-600 to-black">
        <video
          ref={largeFeedRef}
          id="large-feed"
          autoPlay
          playsInline
          className="h-screen w-screen -scale-x-100"
        />
        <video
          ref={smallFeedRef}
          id="own-feed"
          autoPlay
          playsInline
          className="absolute border border-white right-3 top-3 sm:right-8 sm:top-8 md:right-12.5 md:top-12.5 rounded-[10px] w-[120px] sm:w-[200px] md:w-[320px]"
        />
        {showCallInfo && apptInfo.length && <CallInfo apptInfo={apptInfo[0]} />}
      </div>
      <ActionButtons smallFeedEl={smallFeedRef} largeFeedEl={largeFeedRef} />
    </div>
  );
};

export default MainVideoPage;
