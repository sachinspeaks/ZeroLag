import moment from "moment";
import { useEffect, useState } from "react";

interface apptInfoType {
  professionalsFullName: string;
  apptDate: string;
  iat: number;
}

const CallInfo = ({ apptInfo }: { apptInfo: apptInfoType }) => {
  const [momentText, setMomentText] = useState(
    moment(apptInfo.apptDate).fromNow(),
  );

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setMomentText(moment(apptInfo.apptDate).fromNow());
      console.log("Updating time");
    }, 5000);
    return () => {
      console.log("Clearing");
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#cacaca] bg-[#222] p-2.5">
      <h1 className="text-white">
        {apptInfo.professionalsFullName} has been notified.
        <br />
        Your appointment is {momentText}.
      </h1>
    </div>
  );
};

export default CallInfo;
