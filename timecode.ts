const EventEmitter = require('events');

const midi = require('@julusian/midi');
const os = require('os');

interface OutputEntry {
    port: number | null,
    close?: void,
    name: string,
    type: string,
    output: InstanceType<typeof midi.Output>;
}

export class Timecode extends EventEmitter {
    private startOffset: number[];
    private currentTime: number[];
    private maxTime: number[];
    private fps: number;
    private rate: number = 30;
    private maxFrames: number = 30;
    private outputs: OutputEntry[] = [];
    private interval?: NodeJS.Timeout;
    private reverse: boolean;

    constructor(fps: number, startOffset?: number[], maxTime?: number[]) {
        super();
        this.fps = fps;

        if (startOffset && startOffset.length !== 4) throw new Error(`startOffset length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ${startOffset.length}`);
        startOffset ? this.startOffset = startOffset : this.startOffset = [0, 0, 0, 0];

        if (maxTime && maxTime.length !== 4) throw new Error(`maxTime length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ${maxTime.length}`);
        maxTime ? this.maxTime = maxTime : this.maxTime = [24, 0, 0, 0];

        this.currentTime = this.startOffset;


        switch (fps) {
            case 24: this.rate = 0; this.maxFrames = 24; break;
            case 25: this.rate = 1; this.maxFrames = 25;  break;
            case 29.97: this.rate = 2; this.maxFrames = 30;  break;
            case 30: this.rate = 3; this.maxFrames = 30;  break;
        }
    }

    private sendTimecode(reverse: boolean) {
        if (this.interval) {
            if (reverse) {
                this.currentTime[3]--;
                if (this.currentTime[3] >= this.maxFrames) {
                    this.currentTime[3] = 0;
                    this.currentTime[2]--;
                    if (this.currentTime[2] >= 60) {
                        this.currentTime[2] = 0;
                        this.currentTime[1]--;
                        if (this.currentTime[1] >= 60) {
                            this.currentTime[1] = 0;
                            this.currentTime[0]--;
                            if (this.currentTime[0] <= 0) {
                                clearInterval(this.interval);
                            }
                        }
                    }
                }
            }
            else {
                this.currentTime[3]++;
                if (this.currentTime[3] >= this.maxFrames) {
                    this.currentTime[3] = 0;
                    this.currentTime[2]++;
                    if (this.currentTime[2] >= 60) {
                        this.currentTime[2] = 0;
                        this.currentTime[1]++;
                        if (this.currentTime[1] >= 60) {
                            this.currentTime[1] = 0;
                            this.currentTime[0]++;
                            if (this.currentTime[0] >= 24) {
                                this.currentTime[0] = 0;
                            }
                        }
                    }
                }
            }
        }

        for (
            let i = reverse ? 7 : 0;
            reverse ? i >= 0 : i <= 8;
            reverse ? i-- : i++
        ) {
            let dataByte: number;
            switch (i) {
                case 0: dataByte = (i << 4) | (this.currentTime[3] & 0x0F); break;
                case 1: dataByte = (i << 4) | ((this.currentTime[3] >> 4) & 0x01); break;
                case 2: dataByte = (i << 4) | (this.currentTime[2] & 0x0F); break;
                case 3: dataByte = (i << 4) | ((this.currentTime[2] >> 4) & 0x03); break;
                case 4: dataByte = (i << 4) | (this.currentTime[1] & 0x0F); break;
                case 5: dataByte = (i << 4) | ((this.currentTime[1] >> 4) & 0x03); break;
                case 6: dataByte = (i << 4) | (this.currentTime[0] & 0x0F); break;
                case 7: dataByte = (i << 4) | ((this.currentTime[0] >> 4) & 0x01) | (this.rate << 1); break;
            }

            if (this.outputs.length > 0) this.outputs.forEach(out => out.output.send([0xF1, dataByte]));
        };
        if (this.currentTime.every((v, i) => v === this.maxTime[i])) clearInterval(this.interval);
        this.emit('timecode', this.currentTime);
    }

    public getFps() {
        return this.fps;
    }

    public setFps(fps: 24 | 25| 29.97 | 30) {
        this.fps = fps;

        switch (fps) {
            case 24: this.rate = 0; this.maxFrames = 24; break;
            case 25: this.rate = 1; this.maxFrames = 25;  break;
            case 29.97: this.rate = 2; this.maxFrames = 30;  break;
            case 30: this.rate = 3; this.maxFrames = 30;  break;
        }

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = setInterval(() => this.sendTimecode(this.reverse), 1000 / this.maxFrames);
        }

        this.emit('settingUpdate', { type: 'fps', value: fps });
    }

    public getMaxFrames() {
        return this.maxFrames;
    }

    public getOffset() {
        return this.startOffset;
    }

    public setOffset(offset: number[]) {
        if (offset.length !== 4) throw new Error(`Offset length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ${offset.length}`);
        else if (!offset.every((item, index) => {
                    if (index === 0) return item < 24;
                    else if (index === 1 || index === 2) return item < 60;
                    else if (index === 3) return item < this.maxFrames;
                    else return false;
            })
        ) throw new Error('Offset array is invalid\nFormat must be [hh, mm, ss, ff]');
        else this.startOffset = offset;
        
    }

    public getTime() {
        return this.currentTime;
    }

    public setTime(time) {
        if (time[0] >= 24) throw new Error(`Invalid hours number\nExpected a range from 0-23, recieved ${time[0]}`);
        else if (time[1] >= 60) throw new Error(`Invalid minutes number\nExpected a range from 0-59, recieved ${time[1]}`);
        else if (time[2] >= 60) throw new Error(`Invalid seconds number\nExpected a range from 0-59, recieved ${time[2]}`);
        else if (time[3] > this.maxFrames) throw new Error(`Invalid frames number\nExpected a range from 0-${this.maxFrames}, recieved ${time[3]}`);
        else {
            this.currentTime = time;
            this.sendTimecode(false);
        }
        
    }

    public getMaxTime() {
        return this.maxTime;
    }

    public setMaxTime(maxTime: number[]) {
        if (maxTime.length !== 4) throw new Error(`Max Time length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ${maxTime.length}`);
        else if (!maxTime.every((item, index) => {
                    if (index === 0) return item < 24;
                    else if (index === 1 || index === 2) return item < 60;
                    else if (index === 3) return item < this.maxFrames;
                    else return false;
            })
        ) throw new Error('Max Time array is invalid\nFormat must be [hh, mm, ss, ff]');
        else this.startOffset = maxTime;
    }

    public getAvailableOutputs() {
        const dummyOutput = new midi.Output();
        const availableOutputs: { port: number; name: string }[] = [];
        const ports = dummyOutput.getPortCount();
        for (let i = 0; i < ports; i++) {
          availableOutputs.push({ port: i, name: dummyOutput.getPortName(i) });
        }
        dummyOutput.closePort();
        return availableOutputs;
    }


    public getActiveOutputs(): { name: string; type: string; port: number | null }[] {
        return this.outputs.map(({ name, type, port }) => ({ name, type, port }));
    }


    public addPhysicalOutput(name?: string, port?: number) {
        if (!name && (port === undefined || port == null)) throw new Error("No name or port specified");
        
        const output = new midi.Output();

        if (port && !name) {
            output.openPort(port);
            console.log(`Opened Midi output on "${output.getPortName(port)}"`);
        } 
        else if (port && name) {
            const portName = output.getPortName(port);
            if (portName.trim().toLowerCase() === name.trim().toLowerCase()) {
                output.openPort(port);
                console.log(`Opened Midi output on "${portName}"`);
            }
            else throw new Error(`Name doesn't match port ${port}: Expected ${portName}, Recieved ${name}`);
        }
        else if ((port === undefined || port == null) && name) {
            const ports = output.getPortCount()
            for (let i = 0; i < ports; i++) {
                if (output.getPortName(i).trim().toLowerCase() === name.trim().toLowerCase()) {
                    output.openPort(i);
                    console.log(`Opened Midi output on "${output.getPortName(i)}"`);
                    port = i;
                    break;
                };
                if (port === undefined) throw new Error(`Could not find port for name "${name}"`);
            }
        }

        if (output.isPortOpen()) {
            this.outputs.push({
                port: port!,
                name: output.getPortName(port),
                type: 'physical',
                output
            });
            this.emit('outputUpdate', this.outputs);
        }
    }

    public removeOutput(name?: string, port?: number) {
        if (!name && !port) throw new Error("No name or port specified");

        let index: number;
        if (name && !port) index = this.outputs.findIndex(out => (out.output.isPortOpen() || out.type === 'virtual') && out.name.toLowerCase() === name.toLowerCase())
        else if (!name && port) index = this.outputs.findIndex(out => out.output.isPortOpen() && out.port === port); 
        else if (name && port) index = this.outputs.findIndex(out => out.output.isPortOpen() && out.port === port && out.name.toLowerCase() === name.toLowerCase());
        else index = -1;

        if (index === -1) throw new Error(`No Output found with name ${name} or port ${port}`);

        this.outputs[index].output.closePort();
        this.outputs.splice(index, 1);
        this.emit('outputUpdate', this.outputs);
    }

    public addVirtualOutput(name: string) {
        if (os.type() === 'Windows_NT') throw new Error('Virtual ports aren\'t supported on Windows');

        const output = new midi.Output();
        output.openVirtualPort(name);
        this.outputs.push({
                port: null,
                name: name,
                type: 'virtual',
                output
            });
        this.emit('outputUpdate', this.outputs);
    }

    public start(reverse : boolean) {
        if (this.interval) throw new Error('Timecode already running');

        console.log('Timecode started');

        this.emit('stateChange', 'running');
        this.reverse = reverse;
        this.interval = setInterval(() => this.sendTimecode(reverse), 1000 / this.maxFrames);
    }

    public stop() {
        this.emit('stateChange', 'stopped');
        clearInterval(this.interval);
        this.interval = undefined;
        console.log('Timecode stopped');
    }
}