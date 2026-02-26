import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CallStatusState {
  current: "idle" | "process" | "complete" | "negotiating";
  video: boolean; // whether video is on or off
  audio: boolean; // whether audio is on or off
  audioDevice: string; //enumerate audio devices and this is the chosen one
  videoDevice: string; //enumerate video devices and this is the chosen one
  shareScreen: boolean; // whether screen sharing is on or off
  haveMedia: boolean; // is there a local stream or not, has getUsermedia run or not
}

const initState: CallStatusState = {
  current: "idle",
  video: false,
  audio: false,
  audioDevice: "default",
  videoDevice: "default",
  shareScreen: false,
  haveMedia: false,
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
