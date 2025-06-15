const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onTimecodeUpdate: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('timecode:update', listener);

    // Return cleanup function to remove the listener
    return () => ipcRenderer.removeListener('timecode:update', listener);
  }
});
