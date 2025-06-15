import * as React from 'react';
import { useEffect, useState } from 'react';
import './Timecode.css'


export default function Timecode() {
    const [timecode, setTimecode] = useState<number[]>([0, 0, 0, 0])

    useEffect(() => {
        const handleUpdate = (value: number[]) => {
            setTimecode(value);
        }

        const unsubscribe = window.electronAPI.onTimecodeUpdate(handleUpdate);

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
        </div>
    )
}