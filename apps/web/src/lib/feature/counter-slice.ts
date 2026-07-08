import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  name: string;
  age: number;
}

const initialState: CounterState = {
  value: 0,
  name: '',
  age: 0,
};

const counterSlice = createSlice({
  name: 'counter',
  initialState: initialState,
  reducers: {
    increment: (state, action: PayloadAction<CounterState>) => {
      //console.log(action.payload);
      state.value += action.payload.value;
    },
    decrement: (state, action: PayloadAction<number>) => {
      // return {
      //     value: state.value - action.payload
      // }

      state.value -= action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(incrementAsync.pending, (state) => {
        console.log('in pending state', state.value);
      })
      .addCase(incrementAsync.fulfilled, (state, action: PayloadAction<number>) => {
        console.log('in resolved state', action);
        state.value += action.payload;
      });
  },
});

export const incrementAsync = createAsyncThunk('counter/incrementAsync', async (value: number) => {
  await new Promise<number>((resolve) => setTimeout(resolve, 2000));

  return value;
});

export const { increment, decrement } = counterSlice.actions;
export default counterSlice.reducer;
