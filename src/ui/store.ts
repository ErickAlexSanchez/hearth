import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'

type UiState = {
  composerOpen: boolean
  draft: string
}

const initialState: UiState = {
  composerOpen: false,
  draft: '',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openComposer(state) {
      state.composerOpen = true
    },
    closeComposer(state) {
      state.composerOpen = false
    },
    setDraft(state, action: PayloadAction<string>) {
      state.draft = action.payload
    },
    clearComposer(state) {
      state.composerOpen = false
      state.draft = ''
    },
  },
})

export const { openComposer, closeComposer, setDraft, clearComposer } = uiSlice.actions

export function createHearthStore() {
  return configureStore({
    reducer: { ui: uiSlice.reducer },
  })
}

export type HearthStore = ReturnType<typeof createHearthStore>
export type RootState = ReturnType<HearthStore['getState']>
