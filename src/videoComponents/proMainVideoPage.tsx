import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChatWindow from "./ChatWindow";
import ActionButtons from "./ActionButton";
import { addStream } from "@/features/streamsSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import createPeerConnection from "@/utils/createPeerConnection";
// import useSocket from "@/hooks/useSocket";
import { updateCallStatus } from "@/features/callStatusSlice";
import type { apptInfoType } from "@/types/globalTypes";
import axios from "axios";

const ProMainVideoPage = () => {
  // const socket = useSocket("https://localhost:5173");
  const [searchParams] = useSearchParams();
  const callStatus = useAppSelector((state) => state.callStatus);
  const streams = useAppSelector((state) => state.streams);
  const dispatch = useAppDispatch();
  const smallFeedRef = useRef<HTMLVideoElement>(null);
  const largeFeedRef = useRef<HTMLVideoElement>(null);

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

        const { peerConnection, remoteStream } = createPeerConnection();
        if (!remoteStream) return;
        dispatch(
          addStream({ who: "remote1", stream: remoteStream, peerConnection }),
        );
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    fetchMedia();
  }, []);

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
        {(callStatus.audio === "off" || callStatus.video === "off") && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#cacaca] bg-[#222] p-2.5">
            <h1 className="text-white">
              {searchParams.get("client")} is in the waiting room.
              <br />
              Call will start once you enable audio or video.
            </h1>
          </div>
        )}
        <ChatWindow />
      </div>
      <ActionButtons smallFeedEl={smallFeedRef} openCloseChat={console.log} />
    </div>
  );
};

export default ProMainVideoPage;
