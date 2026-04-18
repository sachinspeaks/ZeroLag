import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { Mic } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Dropdown from "../dropDown";
import getDevices from "@/utils/getDevices";
import { updateCallStatus } from "@/features/callStatusSlice";

interface videoButtonPropType {
  smallFeedEl: React.RefObject<HTMLVideoElement | null>;
}

const AudioButton = ({ smallFeedEl }: videoButtonPropType) => {
  const callStatus = useAppSelector((state) => state.callStatus);
  const [caretOpen, setCaretOpen] = useState<boolean>(false);
  const skipFirstRender = useRef(true);
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
    "relative inline-flex flex-col items-center justify-center w-[60px] h-[55px] sm:w-[80px] sm:h-[70px] cursor-pointer hover:bg-[#555] rounded-md px-1 sm:px-2";
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
      tracks.forEach((t: MediaStreamTrack) => (t.enabled = false));
    } else if (callStatus.audio === "disabled") {
      dispatch(updateCallStatus({ prop: "audio", value: "enabled" }));
      const tracks = streams.localStream.stream.getAudioTracks();
      tracks.forEach((t) => (t.enabled = true));
    } else if (callStatus.audio === "off") {
      setSelectedAudioDevice("input-default");
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
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      //stop old audio tracks
      streams.localStream.stream.getAudioTracks().forEach((t) => t.stop());

      const [audioTrack] = newStream.getAudioTracks();

      streams.localStream.stream
        .getAudioTracks()
        .forEach((t) => streams.localStream.stream.removeTrack(t));
      streams.localStream.stream.addTrack(audioTrack);

      for (const s in streams) {
        if (s !== "localStream") {
          const senders = streams[s].peerConnection?.getSenders();
          const sender = senders?.find((s) => s.track?.kind === "audio");
          if (sender) {
            sender.replaceTrack(audioTrack); // device switch — replace existing
          } else {
            streams[s].peerConnection?.addTrack(audioTrack, newStream); // first join — add
          }
        }
      }
      dispatch(updateCallStatus({ prop: "audioDevice", value: deviceId }));
      dispatch(updateCallStatus({ prop: "audio", value: "enabled" }));
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
