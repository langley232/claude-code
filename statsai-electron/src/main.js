const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window with Aura-inspired styling
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false, // Don't show until ready
    backgroundColor: '#0f172a', // Aura dark background
    vibrancy: 'ultra-dark', // macOS vibrancy effect
    frame: true,
    transparent: false
  });

  // Load the app
  mainWindow.loadFile('src/index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Development mode detection
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Set up application menu
  setupMenu();
}

function setupMenu() {
  const template = [
    {
      label: 'AtlasWeb',
      submenu: [
        {
          label: 'About AtlasWeb',
          click: () => {
            // Show about dialog
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About AtlasWeb',
              message: 'AtlasWeb - Advanced Web Analytics Platform',
              detail: 'Version 1.0.0\nBuilt with Electron and Aura Design System'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template[0].submenu.unshift(
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      { type: 'separator' },
      {
        label: 'Hide StatsAI',
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      }
    );

    // Window menu for macOS
    template[2].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('atlasweb');

// Control navigation - allow local files, prevent external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    console.log('🧭 Navigation attempt:', navigationUrl);
    
    try {
      const parsedUrl = new URL(navigationUrl);
      console.log('📊 Parsed URL - Protocol:', parsedUrl.protocol, 'Origin:', parsedUrl.origin);
      
      // Allow local file navigation (our HTML files)
      if (parsedUrl.protocol === 'file:') {
        console.log('✅ Allowing local file navigation');
        return; // Allow the navigation
      }
      
      // Allow https for external resources (like fonts, CDNs)
      if (parsedUrl.protocol === 'https:') {
        console.log('✅ Allowing HTTPS navigation');
        return; // Allow the navigation
      }
      
      // Block everything else
      console.log('❌ Blocking navigation to:', navigationUrl);
      event.preventDefault();
      
    } catch (error) {
      console.log('❌ Error parsing navigation URL:', error);
      event.preventDefault();
    }
  });
});