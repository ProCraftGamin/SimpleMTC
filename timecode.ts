const EventEmitter = require('events');

const midi = require('midi');
const os = require('os');

export class Timecode extends EventEmitter {
    private startOffset: number[];
    private currentTime: number[];
    private maxTime: number[];
    private fps: number;
    private rate: number = 30;
    private maxFrames: number = 30;
    private outputs: InstanceType<typeof midi.Output>[] = [];
    private interval?: NodeJS.Timeout;

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

            this.outputs.forEach(out => out.send([0xF1, dataByte]));

            if (this.currentTime.every((v, i) => v === this.maxTime[i])) clearInterval(this.interval);
            this.emit('timecode', this.currentTime);
        };
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
        return new Promise(async (resolve, reject) => {
        const dummyOutput = new midi.Output();
        const availableOutputs: { [key: number]: string }[] = [];
        const ports = await dummyOutput.getPortCount()
        for (let i = 0; i < ports; i++) {
            availableOutputs.push({ [i]: dummyOutput.getPortName(i) });
        }
        dummyOutput.closePort();

        resolve(availableOutputs);
        })
    }

    public addPhysicalOutput(name?: string, port?: number) {
        if (!name && (port == undefined || port == null)) throw new Error("No name or port specified");
        
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
        else if ((port == undefined || port == null) && name) {
            const ports = output.getPortCount()
            for (let i = 0; i < ports; i++) {
                if (output.getPortName(i).trim().toLowerCase() === name.trim().toLowerCase()) {
                    output.openPort(i);
                    console.log(`Opened Midi output on "${output.getPortName(i)}"`);
                    break;
                };
            }
        }

        if (output.isPortOpen()) this.outputs.push(output);
    }

    public removePhysicalOutput(name?: string, port?: number) {
        if (!name && !port) throw new Error("No name or port specified");

        let index: number;
        if (name && !port) index = this.outputs.findIndex(out => out.isPortOpen() && out.getPortName(out.getPort()).toLowerCase() === name.toLowerCase())
        else if (!name && port) index = this.outputs.findIndex(out => out.isPortOpen() && out.getPort() === port); 
        else if (name && port) index = this.outputs.findIndex(out => out.isPortOpen() && out.getPort() === port && out.getPortName(out.getPort()).toLowerCase() === name.toLowerCase());
        else index = -1;

        if (index === -1) throw new Error(`No Output found with name ${name} or port ${port}`);

        this.outputs[index].closePort();
        this.outputs.splice(index, 1);
    }

    public addVirtualOutput(name: string) {
        if (os.type() === 'Windows_NT') throw new Error('Virtual ports aren\'t supported on Windows');

        const output = new midi.Output();
        output.openVirtualPort(name);
        this.outputs.push(output);
    }

    public start(reverse : boolean) {
        if (this.outputs.length <= 0) throw new Error('Midi outputs not initialized');
        else if (this.interval) throw new Error('Timecode already running');

        console.log('Timecode started');

        this.interval = setInterval(() => this.sendTimecode(reverse), 1000 / this.maxFrames);
    }

    public stop() {
        clearInterval(this.interval);
        this.interval = undefined;
    }
}