import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CallInfo from "./CallInfo";
import ChatWindow from "./ChatWindow";
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
  const [showCallInfo, _] = useState(true);
  const { socketRef, isReady } = useSocket("https://localhost:3001", token);
  const pendingCandidates = useRef<string[]>([]);
  const uuidRef = useRef<string>(null);
  const streamsRef = useRef<StreamsState | null>(null);

  const [apptInfo, setApptInfo] = useState<apptInfoType[]>([]);

  useEffect(() => {
    //grab the token var out of the query string
    const token = searchParams.get("token");
    console.log(token);
    const fetchDecodedToken = async () => {
      const resp = await axios.post(
        "https://localhost:3001/api/validate-link",
        { token },
      );
      setApptInfo(resp.data);
      uuidRef.current = resp.data.uuid;
    };
    fetchDecodedToken();
  }, []);

  const addIceCandidateToPc = (iceC: RTCIceCandidate) => {
    //add an ice candidate from the remote to, the pc

    for (const s in streamsRef.current) {
      if (s != "localStream") {
        const pc = streams[s].peerConnection;
        pc?.addIceCandidate(iceC);
      }
    }
  };

  useEffect(() => {
    if (socketRef && socketRef.current)
      ClientSocketListeners.ClientSocketListenerForIce(
        socketRef.current,
        addIceCandidateToPc,
      );
  }, [isReady]);

  const sendIce = (candidate: string) => {
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
        if (largeFeedRef.current) largeFeedRef.current.srcObject = remoteStream;
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    fetchMedia();
  }, []);

  useEffect(() => {
    //we cannot update streamsRef untill we know redux is finished
    if (streams.remote1) {
      streamsRef.current = streams;
    }
  }, [streams]);

  useEffect(() => {
    const createOfferAsync = async () => {
      if (!socketRef || !socketRef.current) return;
      // after we have video or audio lets createa an offer
      for (const s in streamsRef.current) {
        if (s !== "localStream") {
          try {
            const pc = streams[s].peerConnection;
            const offer = await pc?.createOffer();
            pc?.setLocalDescription(offer);
            socketRef.current.emit("newOffer", { offer, apptInfo });
            ClientSocketListeners.ClientSocketListenerForAnswer(
              socketRef.current,
              dispatch,
            );
          } catch (error) {
            console.log("error in creating offer ", error);
          }
        }
      }
      dispatch(updateCallStatus({ prop: "haveCreatedOffer", value: true }));
    };

    if (
      (callStatus.video === "enabled" || callStatus.audio === "enabled") &&
      !callStatus.haveCreatedOffer
    )
      createOfferAsync();
  }, [
    callStatus.video,
    callStatus.audio,
    callStatus.haveCreatedOffer,
    apptInfo,
    isReady,
  ]);

  //useEffect to set remote desc when callStatus has a answer from the server
  useEffect(() => {
    const asyncAddAnswer = async () => {
      for (const s in streams) {
        if (s !== "localStream") {
          const pc = streams[s].peerConnection;
          await pc?.setRemoteDescription(callStatus.answer);
          console.log(pc?.signalingState);
        }
      }
    };
    if (callStatus.answer) asyncAddAnswer();
  }, [callStatus.answer]);

  return (
    <div>
      <div className="relative overflow-hidden">
        <video
          ref={largeFeedRef}
          id="large-feed"
          autoPlay
          controls
          playsInline
          className="bg-black h-screen w-screen -scale-x-100"
        />
        <video
          ref={smallFeedRef}
          id="own-feed"
          autoPlay
          controls
          playsInline
          className="absolute border border-white right-12.5 top-12.5 rounded-[10px] w-[320px]"
        />
        {showCallInfo && apptInfo.length && <CallInfo apptInfo={apptInfo[0]} />}
        <ChatWindow />
      </div>
      <ActionButtons smallFeedEl={smallFeedRef} openCloseChat={console.log} />
    </div>
  );
};

export default MainVideoPage;
