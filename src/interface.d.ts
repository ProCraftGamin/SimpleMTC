// src/types/electron-api.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      onTimecodeUpdate: (callback: (value: number[]) => void) => () => void;
    };
  }
}
