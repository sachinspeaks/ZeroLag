import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ActionButtons from "./ActionButton";
import { addStream, type StreamsState } from "@/features/streamsSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import createPeerConnection from "@/utils/createPeerConnection";
import { updateCallStatus } from "@/features/callStatusSlice";
import useSocket from "@/hooks/useSocket";
import proSocketListeners from "@/utils/proSocketListeners";

const ProMainVideoPage = () => {
  const [searchParams] = useSearchParams();
  const callStatus = useAppSelector((state) => state.callStatus);
  const streams = useAppSelector((state) => state.streams);
  const dispatch = useAppDispatch();
  const smallFeedRef = useRef<HTMLVideoElement>(null);
  const largeFeedRef = useRef<HTMLVideoElement>(null);
  const pendingCandidates = useRef<string[]>([]);
  const [haveGottenIce, setHaveGottenIce] = useState(false);
  const streamsRef = useRef<StreamsState | null>(null);

  const token = searchParams.get("token");
  const { socketRef, isReady } = useSocket("https://localhost:3001", token);

  const addIceCandidateToPc = (iceC: RTCIceCandidate) => {
    //add an ice candidate from the remote to, the pc
    for (const s in streamsRef.current) {
      if (s != "localStream") {
        const pc = streamsRef.current[s].peerConnection;
        pc?.addIceCandidate(iceC);
      }
    }
  };

  useEffect(() => {
    if (socketRef && socketRef.current) {
      const cleanup = proSocketListeners.proVideoSocketListener(
        socketRef.current,
        addIceCandidateToPc,
      );
      return cleanup;
    }
  }, [isReady]);

  useEffect(() => {
    if (!socketRef || !socketRef.current) return;
    const cleanup = proSocketListeners.proDashboardSocketListener(
      socketRef.current,
      () => {},
      dispatch,
    );
    return cleanup;
  }, [isReady]);

  useEffect(() => {
    setHaveGottenIce(false);
  }, [callStatus.offer]);

  const sendIce = (candidate: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      pendingCandidates.current.push(candidate);
      return;
    }
    socket.emit("iceToServer", {
      candidate,
      who: "professional",
      uuid: searchParams.get("uuid"),
    });
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const flush = () => {
      for (const c of pendingCandidates.current)
        socket.emit("iceToServer", {
          candidate: c,
          who: "professional",
          uuid: searchParams.get("uuid"),
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
    if (streams.remote1) {
      streamsRef.current = streams;
    }
  }, [streams]);

  useEffect(() => {
    const setAsyncOffer = async () => {
      for (const s in streams) {
        if (s !== "localStream") {
          const pc = streams[s].peerConnection;
          await pc?.setRemoteDescription(callStatus.offer);
        }
      }
    };
    if (callStatus.offer && streams.remote1 && streams.remote1.peerConnection)
      setAsyncOffer();
  }, [callStatus.offer, streams.remote1]);

  useEffect(() => {
    const createAnswerAsync = async () => {
      //we have audio and video and can make an answer and setLocalDescription
      for (const s in streams) {
        if (s !== "localStream") {
          const pc = streams[s].peerConnection;
          const answer = await pc?.createAnswer();
          await pc?.setLocalDescription(answer);
          dispatch(
            updateCallStatus({ prop: "haveCreatedAnswer", value: true }),
          );
          dispatch(updateCallStatus({ prop: "answer", value: answer }));
          if (socketRef.current) {
            //send the answer to the socket server
            const uuid = searchParams.get("uuid");
            socketRef.current.emit("newAnswer", { answer, uuid });
          }
        }
      }
    };
    if (
      callStatus.audio === "enabled" &&
      callStatus.video === "enabled" &&
      !callStatus.haveCreatedAnswer &&
      callStatus.offer
    ) {
      createAnswerAsync();
    }
  }, [
    callStatus.audio,
    callStatus.video,
    callStatus.haveCreatedAnswer,
    isReady,
    callStatus.offer,
  ]);

  useEffect(() => {
    if (!socketRef.current) return;
    const getIceAsync = async () => {
      const iceCandidates = await socketRef.current?.emitWithAck(
        "getIce",
        searchParams.get("uuid"),
        "professional",
      );
      iceCandidates.forEach((ice: RTCIceCandidate) => {
        for (const s in streams) {
          if (s !== "localStream") {
            const pc = streams[s].peerConnection;
            pc?.addIceCandidate(ice);
          }
        }
      });
    };
    if (streams.remote1 && callStatus.offer && !haveGottenIce) {
      setHaveGottenIce(true);
      getIceAsync();
    }
  }, [isReady, streams, haveGottenIce, callStatus.offer]);

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
        {(callStatus.audio === "off" || callStatus.video === "off") && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#cacaca] bg-[#222] p-3 sm:p-5 w-[90vw] sm:w-auto">
            <h1 className="text-white text-sm sm:text-base">
              {searchParams.get("client")} is in the waiting room.
              <br />
              Call will start once you enable audio or video.
            </h1>
          </div>
        )}
      </div>
      <ActionButtons
        smallFeedEl={smallFeedRef}
        largeFeedEl={largeFeedRef}
      />
    </div>
  );
};

export default ProMainVideoPage;
