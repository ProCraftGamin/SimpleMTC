"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timecode = void 0;
var EventEmitter = require('events');
var midi = require('midi');
var os = require('os');
var Timecode = /** @class */ (function (_super) {
    __extends(Timecode, _super);
    function Timecode(fps, startOffset, maxTime) {
        var _this = _super.call(this) || this;
        _this.rate = 30;
        _this.maxFrames = 30;
        _this.outputs = [];
        _this.fps = fps;
        if (startOffset && startOffset.length !== 4)
            throw new Error("startOffset length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ".concat(startOffset.length));
        startOffset ? _this.startOffset = startOffset : _this.startOffset = [0, 0, 0, 0];
        if (maxTime && maxTime.length !== 4)
            throw new Error("maxTime length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ".concat(maxTime.length));
        maxTime ? _this.maxTime = maxTime : _this.maxTime = [24, 0, 0, 0];
        _this.currentTime = _this.startOffset;
        switch (fps) {
            case 24:
                _this.rate = 0;
                _this.maxFrames = 24;
                break;
            case 25:
                _this.rate = 1;
                _this.maxFrames = 25;
                break;
            case 29.97:
                _this.rate = 2;
                _this.maxFrames = 30;
                break;
            case 30:
                _this.rate = 3;
                _this.maxFrames = 30;
                break;
        }
        return _this;
    }
    Timecode.prototype.sendTimecode = function (reverse) {
        var _this = this;
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
        var _loop_1 = function (i) {
            var dataByte;
            switch (i) {
                case 0:
                    dataByte = (i << 4) | (this_1.currentTime[3] & 0x0F);
                    break;
                case 1:
                    dataByte = (i << 4) | ((this_1.currentTime[3] >> 4) & 0x01);
                    break;
                case 2:
                    dataByte = (i << 4) | (this_1.currentTime[2] & 0x0F);
                    break;
                case 3:
                    dataByte = (i << 4) | ((this_1.currentTime[2] >> 4) & 0x03);
                    break;
                case 4:
                    dataByte = (i << 4) | (this_1.currentTime[1] & 0x0F);
                    break;
                case 5:
                    dataByte = (i << 4) | ((this_1.currentTime[1] >> 4) & 0x03);
                    break;
                case 6:
                    dataByte = (i << 4) | (this_1.currentTime[0] & 0x0F);
                    break;
                case 7:
                    dataByte = (i << 4) | ((this_1.currentTime[0] >> 4) & 0x01) | (this_1.rate << 1);
                    break;
            }
            this_1.outputs.forEach(function (out) { return out.send([0xF1, dataByte]); });
            if (this_1.currentTime.every(function (v, i) { return v === _this.maxTime[i]; }))
                clearInterval(this_1.interval);
            this_1.emit('timecode', this_1.currentTime);
        };
        var this_1 = this;
        for (var i = reverse ? 7 : 0; reverse ? i >= 0 : i <= 8; reverse ? i-- : i++) {
            _loop_1(i);
        }
        ;
    };
    Timecode.prototype.getFps = function () {
        return this.fps;
    };
    Timecode.prototype.setFps = function (fps) {
        this.fps = fps;
        switch (fps) {
            case 24:
                this.rate = 0;
                this.maxFrames = 24;
                break;
            case 25:
                this.rate = 1;
                this.maxFrames = 25;
                break;
            case 29.97:
                this.rate = 2;
                this.maxFrames = 30;
                break;
            case 30:
                this.rate = 3;
                this.maxFrames = 30;
                break;
        }
    };
    Timecode.prototype.getOffset = function () {
        return this.startOffset;
    };
    Timecode.prototype.setOffset = function (offset) {
        var _this = this;
        if (offset.length !== 4)
            throw new Error("Offset length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ".concat(offset.length));
        else if (!offset.every(function (item, index) {
            if (index === 0)
                return item < 24;
            else if (index === 1 || index === 2)
                return item < 60;
            else if (index === 3)
                return item < _this.maxFrames;
            else
                return false;
        }))
            throw new Error('Offset array is invalid\nFormat must be [hh, mm, ss, ff]');
        else
            this.startOffset = offset;
    };
    Timecode.prototype.getMaxTime = function () {
        return this.maxTime;
    };
    Timecode.prototype.setMaxTime = function (maxTime) {
        var _this = this;
        if (maxTime.length !== 4)
            throw new Error("Max Time length is incorrect\nFormat must be [hh, mm, ss, ff]\nExpected 4, recieved ".concat(maxTime.length));
        else if (!maxTime.every(function (item, index) {
            if (index === 0)
                return item < 24;
            else if (index === 1 || index === 2)
                return item < 60;
            else if (index === 3)
                return item < _this.maxFrames;
            else
                return false;
        }))
            throw new Error('Max Time array is invalid\nFormat must be [hh, mm, ss, ff]');
        else
            this.startOffset = maxTime;
    };
    Timecode.prototype.getAvailableOutputs = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var dummyOutput, availableOutputs, ports, i;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dummyOutput = new midi.Output();
                        availableOutputs = [];
                        return [4 /*yield*/, dummyOutput.getPortCount()];
                    case 1:
                        ports = _b.sent();
                        for (i = 0; i < ports; i++) {
                            availableOutputs.push((_a = {}, _a[i] = dummyOutput.getPortName(i), _a));
                        }
                        dummyOutput.closePort();
                        resolve(availableOutputs);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    Timecode.prototype.addPhysicalOutput = function (name, port) {
        if (!name && (port == undefined || port == null))
            throw new Error("No name or port specified");
        var output = new midi.Output();
        if (port && !name) {
            output.openPort(port);
            console.log("Opened Midi output on \"".concat(output.getPortName(port), "\""));
        }
        else if (port && name) {
            var portName = output.getPortName(port);
            if (portName.trim().toLowerCase() === name.trim().toLowerCase()) {
                output.openPort(port);
                console.log("Opened Midi output on \"".concat(portName, "\""));
            }
            else
                throw new Error("Name doesn't match port ".concat(port, ": Expected ").concat(portName, ", Recieved ").concat(name));
        }
        else if ((port == undefined || port == null) && name) {
            var ports = output.getPortCount();
            for (var i = 0; i < ports; i++) {
                if (output.getPortName(i).trim().toLowerCase() === name.trim().toLowerCase()) {
                    output.openPort(i);
                    console.log("Opened Midi output on \"".concat(output.getPortName(i), "\""));
                    break;
                }
                ;
            }
        }
        if (output.isPortOpen())
            this.outputs.push(output);
    };
    Timecode.prototype.removePhysicalOutput = function (name, port) {
        if (!name && !port)
            throw new Error("No name or port specified");
        var index;
        if (name && !port)
            index = this.outputs.findIndex(function (out) { return out.isPortOpen() && out.getPortName(out.getPort()).toLowerCase() === name.toLowerCase(); });
        else if (!name && port)
            index = this.outputs.findIndex(function (out) { return out.isPortOpen() && out.getPort() === port; });
        else if (name && port)
            index = this.outputs.findIndex(function (out) { return out.isPortOpen() && out.getPort() === port && out.getPortName(out.getPort()).toLowerCase() === name.toLowerCase(); });
        else
            index = -1;
        if (index === -1)
            throw new Error("No Output found with name ".concat(name, " or port ").concat(port));
        this.outputs[index].closePort();
        this.outputs.splice(index, 1);
    };
    Timecode.prototype.addVirtualOutput = function (name) {
        if (os.type() === 'Windows_NT')
            throw new Error('Virtual ports aren\'t supported on Windows');
        var output = new midi.Output();
        output.openVirtualPort(name);
        this.outputs.push(output);
    };
    Timecode.prototype.start = function (reverse) {
        var _this = this;
        if (this.outputs.length <= 0)
            throw new Error('Midi outputs not initialized');
        else if (this.interval)
            throw new Error('Timecode already running');
        console.log('Timecode started');
        this.interval = setInterval(function () { return _this.sendTimecode(reverse); }, 1000 / this.maxFrames);
    };
    Timecode.prototype.stop = function () {
        clearInterval(this.interval);
        this.interval = undefined;
    };
    return Timecode;
}(EventEmitter));
exports.Timecode = Timecode;
