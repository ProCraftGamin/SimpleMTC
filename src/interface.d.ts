// src/types/electron-api.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      onTimecodeUpdate: (callback: (value: number[]) => void) => () => void;
      onStateChange: (callback: (state: string) => void) => () => void;
      onSettingUpdate: (callback: ({ type: string, value: any }) => void) => () => void;
      onOutputChange: (callback: (outputs: { name: string, type: string, port: number }[]) => void) => () => void;
      setState: (state: boolean) => void;
      setTimecode: (timecode: string[]) => void;
      resetTime: () => void;
    };
  }
}
