import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CallStatusState {
  current: "idle" | "process" | "complete" | "negotiating";
  video: "off" | "enabled" | "disabled" | "complete"; // video feed status
  audio: "off" | "enabled" | "disabled" | "complete"; // audio feed status
  audioDevice: string; //enumerate audio devices and this is the chosen one (input device, we dont care about the output device)
  videoDevice: string; //enumerate video devices and this is the chosen one
  shareScreen: boolean; // whether screen sharing is on or off
  haveMedia: boolean; // is there a local stream or not, has getUsermedia run or not
  haveCreatedOffer: boolean; //have we created any offer
  offer: any;
  myRole: string;
}

const initState: CallStatusState = {
  current: "idle",
  video: "off",
  audio: "off",
  audioDevice: "default",
  videoDevice: "default",
  shareScreen: false,
  haveMedia: false,
  haveCreatedOffer: false,
  offer: null,
  myRole: "",
};

type UpdateCallStatusPayload = {
  [K in keyof CallStatusState]: {
    prop: K;
    value: CallStatusState[K];
  };
}[keyof CallStatusState];

function applyStatusUpdate<K extends keyof CallStatusState>(
  state: CallStatusState,
  payload: { prop: K; value: CallStatusState[K] },
) {
  console.log("changign ", payload.prop, " to ", payload.value);
  state[payload.prop] = payload.value;
}

const callStatusSlice = createSlice({
  name: "callStatus",
  initialState: initState,
  reducers: {
    updateCallStatus: (
      state: CallStatusState,
      action: PayloadAction<UpdateCallStatusPayload>,
    ) => {
      applyStatusUpdate(state, action.payload);
    },
    logOut: () => initState,
  },
});

export const { updateCallStatus, logOut } = callStatusSlice.actions;
export default callStatusSlice.reducer;
