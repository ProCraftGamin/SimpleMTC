import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import './Buttons.css';

export default function Buttons({ running, setRunning }: { running: boolean, setRunning: React.Dispatch<React.SetStateAction<boolean>> }) {
    
    useEffect(() => {
      const unsubscribe = window.electronAPI.onStateChange((state) => {
        setRunning(state === 'running');
      });
    
      return () => unsubscribe();
    }, []);
    return (
        <div id="buttonWrapper">
            <div id="playbackButton" className="button" onClick={() => window.electronAPI.setState(!running)}>{running ? 'Stop' : 'Start'}</div>
            <div id="resetButton" className={`button ${running ? 'disabled' : 'scaryButton'}`} onClick={() => {if (!running) window.electronAPI.resetTime()}}>Reset</div>
        </div>
    )
}