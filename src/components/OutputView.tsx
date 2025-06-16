import * as React from 'react';
import { useEffect, useState } from 'react';
import './OutputView.css';

export default function OutputView() {
    const [outputsString, setOutputsString] = useState<string>("No outputs");

    useEffect(() => {
        const unsubscribe = window.electronAPI.onOutputChange((outputsArr) => {
            if (outputsArr.length > 0) setOutputsString(outputsArr.reduce((accumulator, current, index) => {
                return `${accumulator}${index <= 0 ? '' : ', '}${current.name}`;
            }, ''));
            else setOutputsString("No outputs");
        })

        return () => unsubscribe();
    }, []);

    return <div id="text">{outputsString}</div>;
}