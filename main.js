const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage } = require('electron');

app.commandLine.appendSwitch('gtk-version', '3');
app.name = "SimpleMTC";

const prompt = require('electron-prompt');
const path = require('path');
const { Timecode } = require('./timecode');
const fs = require('fs');

const timecode = new Timecode(30);

let mainWindow, menu, timecodeRunning;
const lockState = { lockState: false, password: null };

function menuBuilder() {
  const outputsSubmenu = (() => {
    const outputs = timecode.getActiveOutputs();

    return outputs.length > 0
    ? outputs.map((output, index) => {
      return {
        label: `${output.name} (${output.type === 'virtual' ? 'virtual' : output.port})` || `Port ${output.port}`,
        enabled: !lockState.locked,
        submenu: [
          {
            label: 'Remove output',
            type: 'normal',
            click: () => timecode.removeOutput(output.name, output.port),
          }
        ]
      }
    })
    : [];
  })();

  const inactiveOutputsSubmenu = (() => {
    const outputs = timecode.getAvailableOutputs();
    const activeOutputs = timecode.getActiveOutputs();
    console.log(`outputs: ${outputs}`);

    return outputs.length > 0
    ? outputs.filter(output => 
      {

        return !activeOutputs.some(activeOutput => activeOutput.name.trim().toLowerCase() === output.name.trim().toLowerCase());
      })
      .map((output, index) => {

        return {
          label: `${output.name} (${output.port})`,
          click: () => timecode.addPhysicalOutput(output.name, output.port),
        }
      })
    : [];
  })();

  const fps = timecode.getFps();

  menu = [
      ...(process.platform === "darwin" ? [{
    role: 'appMenu',
    }] : []),
  {
    label: 'Lock',
    submenu: [
      {
        label: lockState.locked ? 'Unlock Settings' : 'Lock Settings',
        click: async () => {
          if (lockState.password) {
            const input = await prompt({
              title: 'Enter Password',
              label: 'Enter Password',
              inputAttrs: {
                type: 'password',
              },
              type: 'input',
            })

            if (input && input !== lockState.password) {
              dialog.showMessageBox({
                type: 'warning', // or 'none', 'warning', 'error'
                buttons: ['OK'],
                title: 'Incorrect password',
                message: 'Incorrect password',
              });
            }
            else if (!input) return;
          }

          lockState.locked = !lockState.locked;
          let menu = Menu.buildFromTemplate(menuBuilder());
          Menu.setApplicationMenu(menu);
        }
      },
      {
        label: lockState.password ? 'Change password' : 'Add password',
        click: () => {
          console.log(lockState.password);
          prompt({
              title: 'Enter password',
              label: 'Password',
              inputAttrs: {
                type: 'password',
              },
              type: 'input',
            }).then(password => {
              if (!password) return;

              lockState.password = password;
              let menu = Menu.buildFromTemplate(menuBuilder());
              Menu.setApplicationMenu(menu);
              console.log(password);
              console.log(lockState.password);
          })
        }
      },
      ...(lockState.password
      ? [{
        label: 'Remove password',
        click: () => {
          prompt({
              title: 'Enter password',
              label: 'Password',
              inputAttrs: {
                type: 'password',
              },
              type: 'input',
            }).then(password => {
              if (!password || password !== lockState.password) return;

              lockState.password = null;
              let menu = Menu.buildFromTemplate(menuBuilder());
            Menu.setApplicationMenu(menu);
          })
        }
      }] : [])
    ]
  },
  {
    label: 'Fps',
    submenu: [
    {
      label: '30 FPS',
      type: 'radio',
      enabled: !lockState.locked,
      checked: fps === 30,
      click: () => timecode.setFps(30),
    },
    {
      label: '29.97 FPS',
      type: 'radio',
      enabled: !lockState.locked,
      checked: fps === 29.97,
      click: () => timecode.setFps(29.97),
    },
    {
      label: '25 FPS',
      type: 'radio',
      enabled: !lockState.locked,
      checked: fps === 25,
      click: () => timecode.setFps(25),
    },
    {
      label: '24 FPS',
      type: 'radio',
      enabled: !lockState.locked,
      checked: fps === 24,
      click: () => timecode.setFps(24),
    }
    ]
  },
  {
    label: 'Outputs',
    submenu: [ 
      {
        label: 'Add new output',
        enabled: !lockState.locked,
        submenu: [
          { label: 'Add virtual output', enabled: process.platform !== 'win32', click: () => {
            prompt({
              title: 'Name the virtual output',
              label: 'Name',
              value: 'SimpleMTC Virtual Output',
              inputAttrs: {
                type: 'text',
              },
              type: 'input',
            }).then(name => {
              if (!name) return;

              timecode.addVirtualOutput(name);
          })
          }},
          { type: 'separator' },
            ...(inactiveOutputsSubmenu.length > 0 
            ? inactiveOutputsSubmenu 
            : [{ label: 'No physical outputs found', enabled: false }]
          ),
          { type: 'separator' },
          { label: 'Refresh outputs', enabled: !lockState.locked, click: () => {
            let menu = Menu.buildFromTemplate(menuBuilder());
            Menu.setApplicationMenu(menu);
          } }
        ]
      },
      { type: 'separator' },
      ...(outputsSubmenu.length > 0 ? outputsSubmenu : [{ label: 'No active outputs', enabled: false }])
    ]
  }
]
return menu;
}

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'SimpleMTC',
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true,
    },
  });

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, 'build/index.html')}`
    : 'http://localhost:3000';

  mainWindow.loadURL(startURL);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('close', (e) => {
    e.preventDefault();
    if (timecodeRunning === 'running') {
      dialog.showMessageBox({
        type: 'warning',
        title: 'Quit SimpleMTC',
        message: 'Timecode is currently running! Do you still want to quit?',
        buttons: ["Cancel", "Quit"],
        defaultId: 0,
        cancelId: 0,
      }).then(response => {
        console.log(response);
        if (response.response === 1) {
          timecode.stop();
          mainWindow.removeAllListeners('close');
          app.exit();
        }
      })
    } else {
      dialog.showMessageBox({
        type: 'warning',
        title: 'Quit SimpleMTC',
        message: 'Do you really want to quit SimpleMTC?',
        buttons: ["Cancel", "Quit"],
        defaultId: 0,
        cancelId: 0
      }).then(response => {
        if (response.response === 1) {
          mainWindow.removeAllListeners('close');
          app.exit();
        }
      })
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'r') event.preventDefault();
    else if (input.code === 'Space' && input.type === 'keyDown') timecodeRunning === 'running' ? timecode.stop() : timecode.start();
});
}

app.on('ready', async () => {
    
    if (process.platform === 'darwin') {
      app.setAboutPanelOptions({
        applicationName: 'SimpleMTC',
        applicationVersion: '0.0.0',
        copyright: '© 2025 ProCraftGamin',
      });
    }

    ipcMain.on('timecode:setState', (e, newState) => {
      newState
      ? timecode.start(false)
      : timecode.stop();
    });

    ipcMain.on('timecode:resetTime', () => timecode.setTime([0, 0, 0, 0]));

    ipcMain.on('timecode:set', (e, time) => {
      timecode.setTime(time.map(item => {
        return item.toString();
      }))

    });

    createWindow();
    let menu = Menu.buildFromTemplate(menuBuilder());
    Menu.setApplicationMenu(menu);

    timecode.on('timecode', (tc) => {
        mainWindow.webContents.send('timecode:update', tc);
    });

    timecode.on('outputUpdate', () => {
      menu = Menu.buildFromTemplate(menuBuilder());
      Menu.setApplicationMenu(menu);

      mainWindow.webContents.send('timecode:outputChange', timecode.getActiveOutputs())
    });
    
    timecode.on('stateChange', (state) => {
      mainWindow.webContents.send('timecode:stateChange', state);
      timecodeRunning = state;
    });

    timecode.on('settingUpdate', (change) => {
      mainWindow.webContents.send('timecode:settingUpdate', change);
    });


    mainWindow.webContents.once('did-finish-load', () => {
      fs.readFile(path.join(app.getPath('userData'), 'appState.json'), (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.writeFileSync(path.join(app.getPath('userData'), 'appState.json'), JSON.stringify({ timecode: timecode.getTime(), outputs: [], fps: timecode.getFps(), lock: { locked: lockState.locked, password: lockState.password }}));
        }
        else throw err;
      }
      else {
        data = JSON.parse(data);
        lockState.locked = data.lock.locked;
        lockState.password = data.lock.password;
        timecode.setTime(data.timecode);
        timecode.setFps(data.fps);
        data.outputs.forEach(output => {
          if (output.type !== 'virtual') timecode.addPhysicalOutput(output.name, output.port);
          else if (output.type === 'virtual') timecode.addVirtualOutput(output.name);
          })
        }
      })
    })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('quit', () => {
  fs.writeFileSync(path.join(app.getPath('userData'), 'appState.json'), JSON.stringify({ timecode: timecode.getTime(), outputs: timecode.getActiveOutputs(), fps: timecode.getFps(), lock: { locked: lockState.locked, password: lockState.password }}));
  mainWindow.close();
})
