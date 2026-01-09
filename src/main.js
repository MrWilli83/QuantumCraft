/**
 * QuantumCraft Launcher - Main Process
 * Processus principal Electron avec gestion du cycle de vie
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { initializeLauncher } = require('./utils/launcher');
const { authenticateMinecraft } = require('./utils/auth');

// Variables globales
let splashWindow = null;
let mainWindow = null;
let isAuthenticated = false;

// Chemin de données utilisateur
const APP_DATA = path.join(process.env.APPDATA || process.env.HOME, '.quantumcraft');

/**
 * Créer la structure de dossiers nécessaire
 */
async function createDirectoryStructure() {
    const directories = [
        APP_DATA,
        path.join(APP_DATA, 'versions'),
        path.join(APP_DATA, 'assets'),
        path.join(APP_DATA, 'runtime'),
        path.join(APP_DATA, 'logs')
    ];

    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true });
            console.log(`✓ Dossier créé: ${dir}`);
        } catch (error) {
            console.error(`✗ Erreur création dossier ${dir}:`, error);
        }
    }

    // Créer config.json s'il n'existe pas
    const configPath = path.join(APP_DATA, 'config.json');
    if (!fsSync.existsSync(configPath)) {
        const defaultConfig = {
            ram: 4096, // 4 Go par défaut
            lastPlayed: null,
            theme: 'dark',
            javaPath: null
        };
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('✓ Fichier config.json créé');
    }
}

/**
 * Créer le Splash Screen
 */
function createSplashScreen() {
    splashWindow = new BrowserWindow({
        width: 600,
        height: 400,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'renderer', 'splash.html'));
    splashWindow.center();

    return splashWindow;
}

/**
 * Créer la fenêtre principale
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 750,
        minWidth: 1000,
        minHeight: 600,
        frame: false,
        show: false,
        backgroundColor: '#0a0e27',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Charger la page d'authentification ou le dashboard
    if (isAuthenticated) {
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'dashboard.html'));
    } else {
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'auth.html'));
    }

    // Afficher quand prêt
    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    return mainWindow;
}

/**
 * Initialisation de l'application
 */
app.whenReady().then(async () => {
    console.log('🚀 QuantumCraft Launcher démarrage...');
    
    // Créer splash screen
    createSplashScreen();

    // Créer la structure de dossiers
    await createDirectoryStructure();

    // Vérifier si l'utilisateur est déjà connecté
    try {
        const authPath = path.join(APP_DATA, 'auth.json');
        if (fsSync.existsSync(authPath)) {
            const authData = JSON.parse(await fs.readFile(authPath, 'utf8'));
            if (authData.accessToken && authData.expiresAt > Date.now()) {
                isAuthenticated = true;
            }
        }
    } catch (error) {
        console.log('Pas d\'authentification sauvegardée');
    }

    // Attendre 2 secondes puis créer la fenêtre principale
    setTimeout(() => {
        createMainWindow();
        
        // Initialiser le module de lancement Minecraft
        initializeLauncher(mainWindow, APP_DATA);
    }, 2000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
            initializeLauncher(mainWindow, APP_DATA);
        }
    });
});

// Quitter l'application quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ============================================
// IPC Handlers - Communication avec le Renderer
// ============================================

/**
 * Obtenir le chemin des données
 */
ipcMain.handle('get-app-data-path', () => {
    return APP_DATA;
});

/**
 * Lire la configuration
 */
ipcMain.handle('get-config', async () => {
    try {
        const configPath = path.join(APP_DATA, 'config.json');
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lecture config:', error);
        return null;
    }
});

/**
 * Sauvegarder la configuration
 */
ipcMain.handle('save-config', async (event, config) => {
    try {
        const configPath = path.join(APP_DATA, 'config.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Erreur sauvegarde config:', error);
        return { success: false, error: error.message };
    }
});

/**
 * Sauvegarder les données d'authentification
 */
ipcMain.handle('save-auth', async (event, authData) => {
    try {
        const authPath = path.join(APP_DATA, 'auth.json');
        await fs.writeFile(authPath, JSON.stringify(authData, null, 2));
        isAuthenticated = true;
        return { success: true };
    } catch (error) {
        console.error('Erreur sauvegarde auth:', error);
        return { success: false, error: error.message };
    }
});

/**
 * Obtenir les données d'authentification
 */
ipcMain.handle('get-auth', async () => {
    try {
        const authPath = path.join(APP_DATA, 'auth.json');
        if (!fsSync.existsSync(authPath)) {
            return null;
        }
        const data = await fs.readFile(authPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lecture auth:', error);
        return null;
    }
});

/**
 * Déconnexion
 */
ipcMain.handle('logout', async () => {
    try {
        const authPath = path.join(APP_DATA, 'auth.json');
        if (fsSync.existsSync(authPath)) {
            await fs.unlink(authPath);
        }
        isAuthenticated = false;
        
        // Recharger la page d'authentification
        if (mainWindow) {
            mainWindow.loadFile(path.join(__dirname, 'renderer', 'auth.html'));
        }
        
        return { success: true };
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        return { success: false, error: error.message };
    }
});

/**
 * Authentification Microsoft/Minecraft Premium
 */
ipcMain.handle('authenticate-microsoft', async () => {
    try {
        console.log('🔐 Démarrage authentification Microsoft/Minecraft Premium...');
        
        // Vérifier si on a un refresh token existant
        let refreshToken = null;
        try {
            const authPath = path.join(APP_DATA, 'auth.json');
            if (fsSync.existsSync(authPath)) {
                const oldAuth = JSON.parse(await fs.readFile(authPath, 'utf8'));
                if (oldAuth.tokens && oldAuth.tokens.refreshToken) {
                    refreshToken = oldAuth.tokens.refreshToken;
                    console.log('♻️  Refresh token trouvé, tentative de renouvellement...');
                }
            }
        } catch (error) {
            console.log('Pas de refresh token disponible');
        }

        // Authentification complète avec OAuth2
        const result = await authenticateMinecraft(refreshToken);

        if (!result.success) {
            throw new Error(result.error);
        }

        console.log(`✓ Authentification réussie: ${result.profile.name}`);
        
        // Retourner les données au format attendu
        return { 
            success: true, 
            data: result
        };

    } catch (error) {
        console.error('✗ Erreur authentification:', error);
        return { 
            success: false, 
            error: error.message || 'Erreur lors de l\'authentification' 
        };
    }
});

/**
 * Charger le dashboard après authentification
 */
ipcMain.handle('load-dashboard', () => {
    if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'dashboard.html'));
    }
});

/**
 * Contrôles de fenêtre
 */
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

/**
 * Écrire dans les logs
 */
ipcMain.handle('write-log', async (event, message) => {
    try {
        const logPath = path.join(APP_DATA, 'logs', 'launcher.log');
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        await fs.appendFile(logPath, logMessage);
        return { success: true };
    } catch (error) {
        console.error('Erreur écriture log:', error);
        return { success: false, error: error.message };
    }
});

console.log('✓ Main process initialisé');
