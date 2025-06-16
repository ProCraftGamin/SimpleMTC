import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Timecode from './components/Timecode';
import OutputView from './components/OutputView';
import Buttons from './components/Buttons';

function App() {
  return (
    <div className="App">
      <OutputView />
      <Timecode />
      <Buttons />
    </div>
  );
}

export default App;
