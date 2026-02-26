import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { updateCallStatus } from "@/features/callStatusSlice";
import { Button } from "@/components/ui/button";

interface RootState {
  callStatus: {
    current: string;
  };
}

const HangupButton = () => {
  const dispatch = useAppDispatch();
  const callStatus = useAppSelector((state: RootState) => state.callStatus);

  const hangupCall = () => {
    dispatch(updateCallStatus({ prop: "current", value: "complete" }));
  };

  if (callStatus.current === "complete") {
    return <></>;
  }

  return (
    <Button
      onClick={hangupCall}
      className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded"
    >
      Hang Up
    </Button>
  );
};

export default HangupButton;
