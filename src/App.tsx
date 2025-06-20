import React, { useState } from 'react';
import './App.css';
import Timecode from './components/Timecode';
import OutputView from './components/OutputView';
import Buttons from './components/Buttons';

function App() {
  const [running, setRunning] = useState(false);

  return (
    <div className="App">
      <OutputView />
      <Timecode running={running} />
      <Buttons running={running} setRunning={setRunning} />
    </div>
  );
}

export default App;
