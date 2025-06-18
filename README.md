# SimpleMTC
SimpleMTC is an app I made to run MIDI timecode over physical and virtual outputs. (Virtual outputs don't work on Windows)
#### Features
* Simple interface
* (Theoretically) Infinite outputs
* Multiple FPS support (30, 29.97, 25, 24)
* State persistence (The app remembers your outputs, lock state, fps, and last time you were at)
* On-the-fly time change (The displays for the timecode are all inputs that you can edit by clicking, only when timecode is stopped)

## Setup

* Clone the repo to your computer
* In a terminal, install the required packages (`npm i`)

### Running the app

* In one terminal, run `npm run start`
* In another, run `npm run electron`


### Packaging the app

* In a terminal, run `npm run package`


#### Other information

`timecode.ts` is a class that can totally be used in other places, so if you want to take this and use it in your own project feel free.
