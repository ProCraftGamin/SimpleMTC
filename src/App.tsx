import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Timecode from './components/Timecode';

function App() {
  const [running, setRunning] = useState<Boolean>(false);

useEffect(() => {
  const unsubscribe = window.electronAPI.onStateChange((state) => {
    console.log('[App] received state:', state); // 👈 add this
    setRunning(state === 'running');
  });

  return () => unsubscribe();
}, []);


  return (
    <div className="App">
      <Timecode />
      <div id="buttonWrapper">
        <div id="playbackButton" className="button" onClick={() => window.electronAPI.setState(!running)}>{running ? 'Stop' : 'Start'}</div>
        <div id="resetButton" className="button" onClick={() => window.electronAPI.resetTime()}>Reset</div>
      </div>
    </div>
  );
}

export default App;
