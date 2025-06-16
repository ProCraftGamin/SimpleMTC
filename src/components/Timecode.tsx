import * as React from 'react';
import { useEffect, useState } from 'react';
import './Timecode.css'


export default function Timecode() {
    const [timecode, setTimecode] = useState<number[]>([0, 0, 0, 0])
    const [fps, setFps] = useState<number>(30);

    useEffect(() => {
        const unsubscribe = window.electronAPI.onTimecodeUpdate(setTimecode);

        return () => {
            unsubscribe();
        }
    }, []);

    useEffect(() => {
        function handleSettingUpdate(change: { type: string, value: any }) {
            switch (change.type) {
                case 'fps':
                    setFps(change.value);
            }
        }

        const unsubscribe = window.electronAPI.onSettingUpdate(handleSettingUpdate);

        return () => {
            unsubscribe();
        }
    }, []);


    return (
        <div id="wrapper">
            <div id="timeWrapper">
                <div id="hours">{timecode[0].toString().padStart(2, '0')}</div>
                <div id="minutes">{timecode[1].toString().padStart(2, '0')}</div>
                <div id="seconds">{timecode[2].toString().padStart(2, '0')}</div>
                <div id="frames">{timecode[3].toString().padStart(2, '0')}</div>
            </div>
            <div id="fps">{fps} FPS</div>
        </div>
    )
}