import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import './Timecode.css'

export default function Timecode({ running }: { running: boolean }) {
  const [timecode, setTimecode] = useState<string[]>(['00', '00', '00', '00']);
  const [fps, setFps] = useState<number>(30);

  const inputsRef = {
    hours: useRef<HTMLInputElement>(null),
    minutes: useRef<HTMLInputElement>(null),
    seconds: useRef<HTMLInputElement>(null),
    frames: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    const unsubscribe = window.electronAPI.onTimecodeUpdate(tc => {
      const paddedTc = tc.map(item => item.toString().padStart(2, '0'));
      setTimecode(paddedTc);

      // Update inputs only if they are NOT focused
      Object.entries(inputsRef).forEach(([key, ref]) => {
        if (ref.current && document.activeElement !== ref.current) {
          ref.current.value = paddedTc[
            key === 'hours' ? 0 :
            key === 'minutes' ? 1 :
            key === 'seconds' ? 2 :
            3
          ];
        }
      });
    });

    return () => unsubscribe();
  });

  useEffect(() => {
    const unsubscribe = window.electronAPI.onSettingUpdate(change => {
      if (change.type === 'fps') {
        setFps(change.value);
      }
    });
    return () => unsubscribe();
  }, []);

  function handleBeforeInput(e: React.FormEvent<HTMLInputElement>) {
    const nativeInputEvent = e.nativeEvent as InputEvent;
    if (nativeInputEvent.data && !/^[0-9]$/.test(nativeInputEvent.data)) {
      e.preventDefault();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2); // only digits max length 2

    switch (e.target.id) {
      case 'hours':
        setTimecode([String(Math.min(Number(val), 23)).padStart(2, '0'), timecode[1], timecode[2], timecode[3]]);
        break;
      case 'minutes':
        setTimecode([timecode[0], String(Math.min(Number(val), 59)).padStart(2, '0'), timecode[2], timecode[3]]);
        break;
      case 'seconds':
        setTimecode([timecode[0], timecode[1], String(Math.min(Number(val), 59)).padStart(2, '0'), timecode[3]]);
        break;
      case 'frames':
        setTimecode([timecode[0], timecode[1], timecode[2], String(Math.min(Number(val), fps)).padStart(2, '0')]);
        break;
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const valNum = Math.min(Number(e.target.value), e.target.id === 'hours' ? 23 : (e.target.id === 'frames' ? fps : 59));
    const padded = String(valNum).padStart(2, '0');

    switch (e.target.id) {
      case 'hours':
        setTimecode([padded, timecode[1], timecode[2], timecode[3]]);
        break;
      case 'minutes':
        setTimecode([timecode[0], padded, timecode[2], timecode[3]]);
        break;
      case 'seconds':
        setTimecode([timecode[0], timecode[1], padded, timecode[3]]);
        break;
      case 'frames':
        setTimecode([timecode[0], timecode[1], timecode[2], padded]);
        break;
    }

    window.electronAPI.setTimecode(timecode);
  }

  return (
    <div id="wrapper">
      <div id="timeWrapper" style={{ display: 'flex', gap: '6px' }}>
        <div className=":after">
        <input
          ref={inputsRef.hours}
          id="hours"
          className={running ? '' : 'enabled'}
          type="text"
          maxLength={2}
          defaultValue={timecode[0]}
          onBlur={handleBlur}
          onChange={handleChange}
          onBeforeInput={handleBeforeInput}
          inputMode="numeric"
          disabled={running}
        />
        </div>
        <div className=":after">
        <input
          ref={inputsRef.minutes}
          id="minutes"
          className={running ? '' : 'enabled'}
          type="text"
          maxLength={2}
          defaultValue={timecode[1]}
          onBlur={handleBlur}
          onChange={handleChange}
          onBeforeInput={handleBeforeInput}
          inputMode="numeric"
          disabled={running}
        />
        </div>
        <div className=";after">
        <input
          ref={inputsRef.seconds}
          id="seconds"
          className={running ? '' : 'enabled'}
          type="text"
          maxLength={2}
          defaultValue={timecode[2]}
          onBlur={handleBlur}
          onChange={handleChange}
          onBeforeInput={handleBeforeInput}
          inputMode="numeric"
          disabled={running}
        />
        </div>
        <div id="dummyWrapper">
        <input
          ref={inputsRef.frames}
          id="frames"
          className={running ? '' : 'enabled'}
          type="text"
          maxLength={2}
          defaultValue={timecode[3]}
          onBlur={handleBlur}
          onChange={handleChange}
          onBeforeInput={handleBeforeInput}
          inputMode="numeric"
          disabled={running}
        />
        </div>
      </div>
      <div id="fps">{fps} FPS</div>
    </div>
  );
}
