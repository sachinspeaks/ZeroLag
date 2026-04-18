import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { updateCallStatus } from "@/features/callStatusSlice";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/streamsSlice";

interface RootState {
  callStatus: {
    current: string;
  };
}
interface HangupButtonProps {
  smallFeedEl: React.RefObject<HTMLVideoElement | null>;
  largeFeedEl: React.RefObject<HTMLVideoElement | null>;
}

const HangupButton = ({ smallFeedEl, largeFeedEl }: HangupButtonProps) => {
  const dispatch = useAppDispatch();
  const callStatus = useAppSelector((state: RootState) => state.callStatus);
  const streams = useAppSelector((state) => state.streams);

  const hangupCall = () => {
    dispatch(updateCallStatus({ prop: "current", value: "complete" }));
    for (const s in streams) {
      streams[s].stream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      if (streams[s].peerConnection) {
        streams[s].peerConnection.close();
        streams[s].peerConnection.onicecandidate = null;
      }
      smallFeedEl.current!.srcObject = null;
      largeFeedEl.current!.srcObject = null;
    }
    dispatch(logout());
  };

  if (callStatus.current === "complete") {
    return <></>;
  }

  return (
    <Button
      onClick={hangupCall}
      className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-2 sm:px-3 text-xs sm:text-sm rounded"
    >
      Hang Up
    </Button>
  );
};

export default HangupButton;
