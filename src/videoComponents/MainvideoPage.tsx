import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import CallInfo from "./CallInfo";
import ChatWindow from "./ChatWindow";
import ActionButtons from "./ActionButton";

interface apptInfoType {
  professionalsFullName: string;
  apptDate: string;
  iat: number;
}

const MainVideoPage = () => {
  const apptData = useLoaderData() as apptInfoType;
  const [apptInfo, setApptInfo] = useState<apptInfoType>(apptData);

  return (
    <div>
      <div className="relative overflow-hidden">
        <video
          id="large-feed"
          src=""
          autoPlay
          controls
          playsInline
          className="bg-black h-screen w-screen -scale-x-100"
        />
        <video
          id="own-feed"
          src=""
          autoPlay
          controls
          playsInline
          className="absolute border border-white right-12.5 top-12.5 rounded-[10px] w-[320px]"
        />
        {apptInfo.professionalsFullName && <CallInfo apptInfo={apptInfo} />}
        <ChatWindow />
      </div>
      <ActionButtons />
    </div>
  );
};

export default MainVideoPage;
