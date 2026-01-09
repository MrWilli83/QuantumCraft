/**
 * QuantumCraft Launcher - Preload Script
 * Bridge sécurisé entre Main et Renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposer l'API au renderer de manière sécurisée
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // Configuration
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),

    // Authentification
    authenticateMicrosoft: () => ipcRenderer.invoke('authenticate-microsoft'),
    saveAuth: (authData) => ipcRenderer.invoke('save-auth', authData),
    getAuth: () => ipcRenderer.invoke('get-auth'),
    logout: () => ipcRenderer.invoke('logout'),
    loadDashboard: () => ipcRenderer.invoke('load-dashboard'),

    // Minecraft
    launchGame: (options) => ipcRenderer.invoke('launch-game', options),
    downloadMinecraft: (version) => ipcRenderer.invoke('download-minecraft', version),

    // Logs
    writeLog: (message) => ipcRenderer.invoke('write-log', message),

    // Contrôles fenêtre
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),

    // Événements (one-way du main vers renderer)
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, progress) => callback(progress));
    },
    onLaunchLog: (callback) => {
        ipcRenderer.on('launch-log', (event, log) => callback(log));
    },
    onGameStarted: (callback) => {
        ipcRenderer.on('game-started', () => callback());
    },
    onGameClosed: (callback) => {
        ipcRenderer.on('game-closed', () => callback());
    }
});

console.log('✓ Preload script chargé - API exposée au renderer');
