interface devicesType {
  videoDevices: MediaDeviceInfo[];
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
}

const getDevices = (): Promise<devicesType> => {
  return new Promise(async (resolve, _) => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const availableDevices = allDevices.filter((d) => d.deviceId !== "default");

    const videoDevices = availableDevices.filter(
      (d) => d.kind === "videoinput",
    );
    const audioInputDevices = availableDevices.filter(
      (d) => d.kind === "audioinput",
    );
    const audioOutputDevices = availableDevices.filter(
      (d) => d.kind === "audiooutput",
    );
    resolve({ videoDevices, audioInputDevices, audioOutputDevices });
  });
};

export default getDevices;

// returns all available device s both audio and video
