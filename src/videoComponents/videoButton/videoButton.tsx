import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import startLocalVideoStream from "../../utils/startVideoStream";
import { updateCallStatus } from "@/features/callStatusSlice";
import getDevices from "@/utils/getDevices";
import { addStream } from "@/features/streamsSlice";
import Dropdown from "../dropDown";

interface videoButtonPropType {
  smallFeedEl: React.RefObject<HTMLVideoElement | null>;
}

const VideoButton = ({ smallFeedEl }: videoButtonPropType) => {
  const callStatus = useAppSelector((state) => state.callStatus);
  const streams = useAppSelector((state) => state.streams);
  const dispatch = useAppDispatch();
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [caretOpen, setCaretOpen] = useState<boolean>(false);
  const skipNextDeviceApply = useRef(false);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>(
    callStatus.videoDevice,
  );
  const [videoDeviceList, setVideoDeviceList] = useState<MediaDeviceInfo[]>([]);
  const buttonWrapperClass =
    "relative inline-flex flex-col items-center justify-center w-[80px] h-[70px] cursor-pointer hover:bg-[#555] rounded-md px-2";
  const btnTextClass = "text-white text-xs text-center mt-1";

  const startStopVideo = () => {
    if (callStatus.video === "enabled") {
      dispatch(updateCallStatus({ prop: "video", value: "disabled" }));
      const tracks = streams.localStream.stream.getVideoTracks();
      tracks.forEach((t) => (t.enabled = false));
    } else if (callStatus.video === "disabled") {
      dispatch(updateCallStatus({ prop: "video", value: "enabled" }));
      const tracks = streams.localStream.stream.getVideoTracks();
      tracks.forEach((t) => (t.enabled = true));
    } else if (callStatus.haveMedia && smallFeedEl.current) {
      smallFeedEl.current.srcObject = streams.localStream.stream;

      startLocalVideoStream(streams, dispatch);
    } else {
      setPendingUpdate(true); //we dont have the media yet but this will make it available in the useeffect when media is present(callStatus.havemedia).
    }
  };

  useEffect(() => {
    if (!callStatus.videoDevice || callStatus.videoDevice === "default") return;
    setSelectedVideoDevice((prev) => {
      if (prev === callStatus.videoDevice) return prev;
      skipNextDeviceApply.current = true;
      return callStatus.videoDevice;
    });
  }, [callStatus.videoDevice]);

  useEffect(() => {
    if (pendingUpdate && callStatus.haveMedia) {
      if (smallFeedEl.current && streams.localStream) {
        smallFeedEl.current.srcObject = streams.localStream.stream;
        startLocalVideoStream(streams, dispatch);
      }
      setPendingUpdate(false);
    }
  }, [pendingUpdate, callStatus.haveMedia, smallFeedEl, streams]);

  useEffect(() => {
    const getDevicesAsync = async () => {
      if (caretOpen) {
        const devices = await getDevices();
        setVideoDeviceList(devices.videoDevices);
      }
    };
    getDevicesAsync();
  }, [caretOpen]);

  useEffect(() => {
    if (!selectedVideoDevice || selectedVideoDevice === "default") return;
    if (skipNextDeviceApply.current) {
      skipNextDeviceApply.current = false;
      return;
    }
    const setNewDevice = async () => {
      const newConstraints: MediaStreamConstraints = {
        audio:
          callStatus.audioDevice === "default"
            ? true
            : { deviceId: { exact: callStatus.audioDevice } },
        video: { deviceId: { exact: selectedVideoDevice } },
      };
      const newStream =
        await navigator.mediaDevices.getUserMedia(newConstraints);

      dispatch(
        updateCallStatus({
          prop: "videoDevice",
          value: selectedVideoDevice,
        }),
      );
      dispatch(updateCallStatus({ prop: "video", value: "enabled" }));

      if (smallFeedEl.current) smallFeedEl.current.srcObject = newStream;

      dispatch(addStream({ who: "localStream", stream: newStream }));

      // const tracks = newStream.getVideoTracks(); //stop the old tracks add new tracks i.e. re negotiation
    };
    setNewDevice();
  }, [selectedVideoDevice, callStatus.audioDevice]);

  return (
    <div className={buttonWrapperClass} onClick={startStopVideo}>
      <Dropdown
        options={videoDeviceList}
        selected={selectedVideoDevice}
        open={caretOpen}
        setSelected={setSelectedVideoDevice}
        setOpen={setCaretOpen}
        type="video"
      />
      <Video className="text-[#ccc]" size={22} />
      <span className={btnTextClass}>
        {callStatus.video === "enabled" ? "Stop" : "Start"} Video
      </span>
    </div>
  );
};
export default VideoButton;
