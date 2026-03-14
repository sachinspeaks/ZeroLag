import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { Mic } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Dropdown from "../dropDown";
import getDevices from "@/utils/getDevices";
import { updateCallStatus } from "@/features/callStatusSlice";
import { addStream } from "@/features/streamsSlice";
import startAudioStream from "@/utils/startAudioStream";

interface videoButtonPropType {
  smallFeedEl: React.RefObject<HTMLVideoElement | null>;
}

const AudioButton = ({ smallFeedEl }: videoButtonPropType) => {
  const callStatus = useAppSelector((state) => state.callStatus);
  const [caretOpen, setCaretOpen] = useState<boolean>(false);
  const skipFirstRender = useRef(false);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>(
    callStatus.audioDevice,
  );
  const dispatch = useAppDispatch();
  const [audioDeviceList, setAudioDeviceList] = useState<MediaDeviceInfo[]>([]);
  const streams = useAppSelector((state) => state.streams);

  let micText: string;
  if (callStatus.audio === "off") {
    micText = "Join Audio";
  } else if (callStatus.audio === "enabled") {
    micText = "Mute";
  } else {
    micText = "Unmute";
  }

  const buttonWrapperClass =
    "relative inline-flex flex-col items-center justify-center w-[80px] h-[70px] cursor-pointer hover:bg-[#555] rounded-md px-2";
  const btnTextClass = "text-white text-xs text-center mt-1";

  useEffect(() => {
    const getDevicesAsync = async () => {
      if (caretOpen) {
        const devices = await getDevices();
        setAudioDeviceList(
          devices.audioInputDevices.concat(devices.audioOutputDevices),
        );
      }
    };
    getDevicesAsync();
  }, [caretOpen]);

  const startStopAudio = () => {
    if (callStatus.audio === "enabled") {
      dispatch(updateCallStatus({ prop: "audio", value: "disabled" }));
      const tracks = streams.localStream.stream.getAudioTracks();
      tracks.forEach((t) => (t.enabled = false));
    } else if (callStatus.audio === "disabled") {
      dispatch(updateCallStatus({ prop: "audio", value: "enabled" }));
      const tracks = streams.localStream.stream.getVideoTracks();
      tracks.forEach((t) => (t.enabled = true));
    } else if (callStatus.audio === "off") {
      setSelectedAudioDevice("input-default");
      startAudioStream(streams);
    }
  };

  async function changeAudioDeviceHandler() {
    if (skipFirstRender.current === true) {
      skipFirstRender.current = false;
      return;
    }
    const [deviceType, deviceId] = selectedAudioDevice.split("-");

    if (deviceType === "output") {
      // update the output audio
      smallFeedEl.current?.setSinkId(deviceId);
    } else if (deviceType === "input") {
      const newConstraints: MediaStreamConstraints = {
        audio: { deviceId: { exact: deviceId } },
        video:
          callStatus.videoDevice === "default"
            ? true
            : { deviceId: { exact: callStatus.videoDevice } },
      };
      const newStream =
        await navigator.mediaDevices.getUserMedia(newConstraints);
      // update the redux states with new deviceid and status
      dispatch(updateCallStatus({ prop: "audioDevice", value: deviceId }));
      dispatch(updateCallStatus({ prop: "audio", value: "enabled" }));
      dispatch(addStream({ who: "localStream", stream: newStream }));

      // const tracks = newStream.getAudioTracks();
    }
  }

  useEffect(() => {
    changeAudioDeviceHandler();
  }, [selectedAudioDevice]);

  return (
    <div className={buttonWrapperClass} onClick={startStopAudio}>
      <Dropdown
        options={audioDeviceList}
        selected={selectedAudioDevice}
        open={caretOpen}
        setSelected={setSelectedAudioDevice}
        setOpen={setCaretOpen}
        type="audio"
      />
      <Mic className="text-[#ccc]" size={22} />
      <span className={btnTextClass}>{micText}</span>
    </div>
  );
};
export default AudioButton;
