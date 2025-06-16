const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onTimecodeUpdate: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('timecode:update', listener);

    return () => ipcRenderer.removeListener('timecode:update', listener);
  },
  onStateChange: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('timecode:stateChange', listener);

    return () => ipcRenderer.removeListener('timecode:stateChange', listener);
  },
  onSettingUpdate: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('timecode:settingUpdate', listener);

    return () => ipcRenderer.removeListener('timecode:settingUpdate', listener);
  },
  onOutputChange: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('timecode:outputChange', listener);

    return () => ipcRenderer.removeListener('timecode:outputChange', listener);
  },
  setState: (state) => ipcRenderer.send('timecode:setState', state),
  resetTime: () => ipcRenderer.send('timecode:resetTime'),
});
