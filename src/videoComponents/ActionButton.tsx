import { useEffect, useRef } from "react";
import HangupButton from "./HangupButton.tsx";
import { Users, MessageSquare, Monitor } from "lucide-react";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { type RootState } from "@/app/store.ts";
import VideoButton from "./videoButton/videoButton.tsx";
import AudioButton from "./audioButton/AudioButton.tsx";

interface ActionButtonsProps {
  openCloseChat: () => void;
  smallFeedEl: React.RefObject<HTMLVideoElement | null>;
}

const ActionButtons = ({ openCloseChat, smallFeedEl }: ActionButtonsProps) => {
  const callStatus = useAppSelector((state: RootState) => state.callStatus);
  const menuButtons = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const setHideTimer = () => {
      clearHideTimer();
      if (callStatus.current !== "idle") {
        hideTimerRef.current = setTimeout(() => {
          if (menuButtons.current) menuButtons.current.style.display = "none";
        }, 4000);
      }
    };

    const onMouseMove = () => {
      const menu = menuButtons.current;
      if (!menu) return;

      if (menu.style.display === "none") {
        menu.style.display = "";
      }

      setHideTimer();
    };

    window.addEventListener("mousemove", onMouseMove);
    setHideTimer();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      clearHideTimer();
    };
  }, [callStatus.current]);

  let micText: string;
  if (callStatus.current === "idle") {
    micText = "Join Audio";
  } else if (callStatus.audio) {
    micText = "Mute";
  } else {
    micText = "Unmute";
  }

  const buttonWrapperClass =
    "relative inline-flex flex-col items-center justify-center w-[80px] h-[70px] cursor-pointer hover:bg-[#555] rounded-md px-2";
  const btnTextClass = "text-white text-xs text-center mt-1";

  return (
    <div
      ref={menuButtons}
      className="flex flex-row items-center h-20 w-full bg-[#333] absolute -bottom-1.5 left-0"
    >
      {/* Left — Mic + Camera */}
      <div className="flex basis-2/12 justify-start pl-2">
        {/* Mic Button */}
        <AudioButton smallFeedEl={smallFeedEl} />
        {/* Camera Button */}
        <VideoButton smallFeedEl={smallFeedEl} />
      </div>

      {/* Center — Participants, Chat, Share Screen */}
      <div className="flex basis-8/12 justify-center gap-2">
        {/* Participants */}
        <div className={buttonWrapperClass}>
          <Users className="text-[#ccc]" size={22} />
          <span className={btnTextClass}>Participants</span>
        </div>

        {/* Chat */}
        <div className={buttonWrapperClass} onClick={openCloseChat}>
          <MessageSquare className="text-[#ccc]" size={22} />
          <span className={btnTextClass}>Chat</span>
        </div>

        {/* Share Screen */}
        <div className={buttonWrapperClass}>
          <Monitor className="text-[#ccc]" size={22} />
          <span className={`${btnTextClass} whitespace-nowrap`}>
            Share Screen
          </span>
        </div>
      </div>

      {/* Right — Hang Up */}
      <div className="flex basis-2/12 justify-end items-center pr-4">
        <HangupButton />
      </div>
    </div>
  );
};

export default ActionButtons;
