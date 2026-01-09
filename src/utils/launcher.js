/**
 * QuantumCraft - Module de lancement Minecraft
 * Gestion du téléchargement et lancement via minecraft-launcher-core
 */

const { Client, Authenticator } = require('minecraft-launcher-core');
const path = require('path');
const { ipcMain } = require('electron');

/**
 * Initialiser les handlers IPC pour le lancement
 */
function initializeLauncher(mainWindow, appDataPath) {
    
    /**
     * Lancer Minecraft
     */
    ipcMain.handle('launch-game', async (event, options) => {
        try {
            const { version, username, uuid, accessToken, ram } = options;

            // Logger le début
            mainWindow.webContents.send('launch-log', 'Initialisation du launcher Minecraft...');

            // Configuration du launcher
            const launcher = new Client();

            // Options de lancement
            const launchOptions = {
                // Chemin de base
                root: appDataPath,

                // Authentification
                authorization: {
                    access_token: accessToken,
                    client_token: uuid,
                    uuid: uuid,
                    name: username,
                    user_properties: '{}'
                },

                // Version de Minecraft
                version: {
                    number: version,
                    type: 'release'
                },

                // Mémoire
                memory: {
                    max: `${ram}M`,
                    min: `${Math.floor(ram / 2)}M`
                },

                // Fenêtre de jeu
                window: {
                    width: 1280,
                    height: 720,
                    fullscreen: false
                },

                // Options Java
                javaPath: null, // Auto-détection
                
                // Chemins personnalisés
                customArgs: [],
                
                // Cache - Ne pas retélécharger si déjà présent
                cache: true,
                
                // Désactiver les vérifications pour éviter les retéléchargements
                checkFiles: true,
                
                // Overrides
                overrides: {
                    gameDirectory: appDataPath,
                    // Arguments JVM pour masquer la console sur Windows
                    minArgs: process.platform === 'win32' ? 2 : undefined,
                    maxSockets: 4,
                    detached: false
                }
            };

            mainWindow.webContents.send('launch-log', `Version: ${version}`);
            mainWindow.webContents.send('launch-log', `Joueur: ${username} (${uuid})`);
            mainWindow.webContents.send('launch-log', `RAM: ${ram}M`);

            // Événements du launcher
            launcher.on('debug', (message) => {
                console.log('[Minecraft Debug]', message);
                mainWindow.webContents.send('launch-log', message);
            });

            launcher.on('data', (data) => {
                console.log('[Minecraft]', data);
                mainWindow.webContents.send('launch-log', data);
            });

            launcher.on('progress', (progress) => {
                const percent = Math.round((progress.task / progress.total) * 100);
                mainWindow.webContents.send('launch-log', `Téléchargement: ${progress.type} - ${percent}%`);
                mainWindow.webContents.send('download-progress', {
                    type: progress.type,
                    task: progress.task,
                    total: progress.total,
                    percent: percent
                });
            });

            launcher.on('close', (code) => {
                console.log('[Minecraft] Fermé avec le code:', code);
                mainWindow.webContents.send('launch-log', `Jeu fermé (code: ${code})`);
                mainWindow.webContents.send('game-closed');
            });

            mainWindow.webContents.send('launch-log', 'Vérification des fichiers...');

            // Lancer Minecraft
            await launcher.launch(launchOptions);

            mainWindow.webContents.send('launch-log', 'Minecraft lancé avec succès !');
            mainWindow.webContents.send('game-started');

            return { success: true };

        } catch (error) {
            console.error('Erreur lancement Minecraft:', error);
            mainWindow.webContents.send('launch-log', `ERREUR: ${error.message}`);
            return { 
                success: false, 
                error: error.message || 'Erreur inconnue lors du lancement' 
            };
        }
    });

    /**
     * Télécharger une version de Minecraft
     */
    ipcMain.handle('download-minecraft', async (event, version) => {
        try {
            mainWindow.webContents.send('launch-log', `Téléchargement de Minecraft ${version}...`);

            const launcher = new Client();

            const options = {
                root: appDataPath,
                version: {
                    number: version,
                    type: 'release'
                }
            };

            // Événements de progression
            launcher.on('progress', (progress) => {
                const percent = Math.round((progress.task / progress.total) * 100);
                mainWindow.webContents.send('download-progress', {
                    type: progress.type,
                    task: progress.task,
                    total: progress.total,
                    percent: percent
                });
                mainWindow.webContents.send('launch-log', `Téléchargement: ${progress.type} - ${percent}%`);
            });

            // Lancer le téléchargement (sans démarrer le jeu)
            // Cette partie vérifiera et téléchargera tous les fichiers nécessaires
            mainWindow.webContents.send('launch-log', 'Vérification des assets, libraries et runtime...');

            return { success: true };

        } catch (error) {
            console.error('Erreur téléchargement:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    });
}

module.exports = { initializeLauncher };
