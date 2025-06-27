import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: {},
  isLoggedIn: false,
}

const userSlice = createSlice({
  name: 'userSlice',
  initialState,
  reducers: {
    signIn: (state: any, action: any) => {
      state.user = {...state.user, ...action.payload}
      state.isLoggedIn = true
    },
    signOut: (state: any) => {
      state.user = {}
      state.isLoggedIn = false
    }
  }
})

export const {signIn, signOut}: any = userSlice.actions
export default userSlice.reducer