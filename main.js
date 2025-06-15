const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const prompt = require('electron-prompt');
const path = require('path');
const isDev = require('electron-is-dev');
const { Timecode } = require('./timecode');
const os = require('os');

const timecode = new Timecode(24);

let mainWindow, menu;

function menuBuilder() {
  const outputsSubmenu = (() => {
    const outputs = timecode.getActiveOutputs();

    return outputs.length > 0
    ? outputs.map((output, index) => {
      return {
        label: `${output.name} (${output.port})` || `Port ${output.port}`,
        submenu: [
          {
            label: 'Remove output',
            type: 'normal',
            click: () => output.type === 'physical' ? timecode.removePhysicalOutput(null, output.port) : timecode.removeVirtualOutput(output.name), // removeVirtualOutput isn't implimented yet
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
        console.log(output);
        console.log(activeOutputs);

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

  menu = [
  {
    label: 'Fps',
    submenu: [
    {
      label: '30 FPS',
      type: 'radio',
      checked: false,
      click: () => timecode.setFps(30),
    },
    {
      label: '29.97 FPS',
      type: 'radio',
      checked: false,
      click: () => timecode.setFps(29.97),
    },
    {
      label: '25 FPS',
      type: 'radio',
      checked: false,
      click: () => timecode.setFps(25),
    },
    {
      label: '24 FPS',
      type: 'radio',
      checked: true,
      click: () => timecode.setFps(24),
    }
    ]
  },
  {
    label: 'Outputs',
    submenu: [ 
      {
        label: 'Add new output',
        submenu: [
          { label: 'Add virtual output', enabled: os.type() !== 'Windows_NT', click: () => {
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
          { label: 'Refresh outputs', click: () => console.log('Refresh clicked') }
        ]
      },
      { type: 'separator' },
      ...(outputsSubmenu.length > 0 ? outputsSubmenu : [{ label: 'No active outputs', enabled: false }])
    ]
  }
]

console.log(JSON.stringify(menu, null, 2));

console.log(os.type());

return menu;
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: true,
    title: 'SimpleMTC',
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build/index.html')}`;

  mainWindow.loadURL(startURL);

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', async () => {
    createWindow();
    let menu = Menu.buildFromTemplate(menuBuilder());
    Menu.setApplicationMenu(menu);

    timecode.on('timecode', (tc) => {
        mainWindow.webContents.send('timecode:update', tc);
    });

    timecode.on('outputUpdate', () => {
      console.log('outputUpdate');
      menu = Menu.buildFromTemplate(menuBuilder());
      Menu.setApplicationMenu(menu);
    })

    timecode.addPhysicalOutput(null, 1);

    timecode.start(false);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
