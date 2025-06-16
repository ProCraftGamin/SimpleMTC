import * as React from 'react';
import { useEffect, useState } from 'react';
import './Buttons.css';

export default function Buttons() {
    const [running, setRunning] = useState<Boolean>(false);
    
    useEffect(() => {
      const unsubscribe = window.electronAPI.onStateChange((state) => {
        console.log('[App] received state:', state);
        setRunning(state === 'running');
      });
    
      return () => unsubscribe();
    }, []);
    return (
        <div id="buttonWrapper">
            <div id="playbackButton" className="button" onClick={() => window.electronAPI.setState(!running)}>{running ? 'Stop' : 'Start'}</div>
            <div id="resetButton" className="button" onClick={() => window.electronAPI.resetTime()}>Reset</div>
        </div>
    )
}