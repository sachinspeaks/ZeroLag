import { useEffect, useRef } from "react";
import HangupButton from "./HangupButton.tsx";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { type RootState } from "@/app/store.ts";
import VideoButton from "./videoButton/videoButton.tsx";
import AudioButton from "./audioButton/AudioButton.tsx";

interface ActionButtonsProps {
  smallFeedEl: React.RefObject<HTMLVideoElement | null>;
  largeFeedEl: React.RefObject<HTMLVideoElement | null>;
}

const ActionButtons = ({ smallFeedEl, largeFeedEl }: ActionButtonsProps) => {
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

  return (
    <div
      ref={menuButtons}
      className="flex flex-row items-center justify-center gap-2 sm:gap-4 h-16 sm:h-20 w-full bg-[#333] absolute -bottom-1.5 left-0"
    >
      <AudioButton smallFeedEl={smallFeedEl} />
      <VideoButton smallFeedEl={smallFeedEl} />
      <HangupButton smallFeedEl={smallFeedEl} largeFeedEl={largeFeedEl} />
    </div>
  );
};

export default ActionButtons;
