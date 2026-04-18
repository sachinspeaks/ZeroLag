import type { apptInfoType } from "@/types/globalTypes";
import moment from "moment";
import { useEffect, useState } from "react";

const CallInfo = ({ apptInfo }: { apptInfo: apptInfoType }) => {
  const [momentText, setMomentText] = useState(
    moment(apptInfo.apptDate).fromNow(),
  );

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setMomentText(moment(apptInfo.apptDate).fromNow());
    }, 5000);
    return () => clearInterval(timeInterval);
  }, []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#cacaca] bg-[#222] p-3 sm:p-5 w-[90vw] sm:w-auto">
      <h1 className="text-white text-sm sm:text-base">
        {apptInfo.professionalsFullName} has been notified.
        <br />
        Your appointment is {momentText}.
      </h1>
    </div>
  );
};

export default CallInfo;
