import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type StreamEntry = {
  who: string;
  stream: MediaStream;
  peerConnection?: RTCPeerConnection | null;
};

export interface StreamsState {
  [who: string]: StreamEntry;
}
const initState: StreamsState = {};

type AddStreamPayload = StreamEntry;

const streamsSlice = createSlice({
  name: "streams",
  initialState: initState,
  reducers: {
    addStream: (
      state: StreamsState,
      action: PayloadAction<AddStreamPayload>,
    ) => {
      state[action.payload.who] = action.payload;
    },
    logout: () => ({}),
  },
});

export const { addStream, logout } = streamsSlice.actions;
export default streamsSlice.reducer;
