/**
 * Dashboard - Script principal
 */

// Boutons de la barre de titre
document.getElementById('minimizeBtn').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
});

document.getElementById('maximizeBtn').addEventListener('click', () => {
    window.electronAPI.maximizeWindow();
});

document.getElementById('closeBtn').addEventListener('click', () => {
    window.electronAPI.closeWindow();
});

// Variables globales
let currentUser = null;
let currentConfig = null;
let isGameRunning = false;

/**
 * Charger le profil utilisateur
 */
async function loadUserProfile() {
    const authData = await window.electronAPI.getAuth();
    
    if (!authData) {
        // Rediriger vers la page d'authentification
        window.location.href = 'auth.html';
        return;
    }

    currentUser = authData;

    // Afficher le pseudo
    document.getElementById('profileName').textContent = authData.profile.name;

    // Afficher le skin
    const avatarImg = document.getElementById('profileAvatar');
    
    // Utiliser directement l'URL du skin fournie par l'auth
    avatarImg.src = authData.profile.skin || `https://mc-heads.net/avatar/${authData.profile.cleanUuid}/100`;
    avatarImg.onerror = () => {
        // Fallback sur Crafatar
        avatarImg.src = `https://crafatar.com/avatars/${authData.profile.cleanUuid}?size=100&overlay=true`;
        avatarImg.onerror = () => {
            // Dernier fallback : Steve par défaut
            avatarImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAL0lEQVR4nGP4//8/AxJgYkAFjEgCIAAC/0kTYPj//z8yH6cAhv///zOgATiLAQAw5xb2LxJDrAAAAABJRU5ErkJggg==';
        };
    };
}

/**
 * Charger la configuration
 */
async function loadConfig() {
    currentConfig = await window.electronAPI.getConfig();
    
    if (currentConfig) {
        // Afficher la RAM
        const ramGB = currentConfig.ram / 1024;
        document.getElementById('ramDisplay').textContent = `${ramGB} Go`;

        // Sélectionner le bouton RAM actif
        document.querySelectorAll('.ram-option').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.ram) === currentConfig.ram) {
                btn.classList.add('active');
            }
        });
    }

    // Afficher le chemin du dossier de jeu
    const appDataPath = await window.electronAPI.getAppDataPath();
    document.getElementById('gameFolderPath').textContent = appDataPath;
}

/**
 * Navigation entre les pages
 */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Retirer la classe active
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Ajouter la classe active
        item.classList.add('active');
        const pageName = item.dataset.page;
        document.getElementById(`${pageName}Page`).classList.add('active');
    });
});

/**
 * Sélection de la RAM
 */
document.querySelectorAll('.ram-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ram-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

/**
 * Sauvegarder les paramètres
 */
document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const selectedRamBtn = document.querySelector('.ram-option.active');
    
    if (selectedRamBtn) {
        const ram = parseInt(selectedRamBtn.dataset.ram);
        currentConfig.ram = ram;

        const result = await window.electronAPI.saveConfig(currentConfig);

        if (result.success) {
            // Afficher notification
            alert('Paramètres sauvegardés avec succès !');
            
            // Mettre à jour l'affichage
            const ramGB = ram / 1024;
            document.getElementById('ramDisplay').textContent = `${ramGB} Go`;

            // Retourner à l'accueil
            document.querySelector('.nav-item[data-page="home"]').click();
        } else {
            alert('Erreur lors de la sauvegarde des paramètres');
        }
    }
});

/**
 * Ajouter un log
 */
function addLog(message, type = 'info') {
    const logsContent = document.getElementById('logsContent');
    const logLine = document.createElement('p');
    logLine.className = `log-line log-${type}`;
    logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logsContent.appendChild(logLine);
    logsContent.scrollTop = logsContent.scrollHeight;
}

/**
 * Effacer les logs
 */
document.getElementById('clearLogsBtn').addEventListener('click', () => {
    const logsContent = document.getElementById('logsContent');
    logsContent.innerHTML = '<p class="log-line">Console effacée</p>';
});

/**
 * Lancer le jeu
 */
document.getElementById('playButton').addEventListener('click', async () => {
    if (isGameRunning) {
        addLog('Le jeu est déjà en cours d\'exécution', 'warning');
        return;
    }

    const playButton = document.getElementById('playButton');
    const statusDisplay = document.getElementById('statusDisplay');

    try {
        // Désactiver le bouton
        playButton.disabled = true;
        playButton.innerHTML = '<div class="spinner-small"></div><span>Lancement...</span>';
        statusDisplay.textContent = 'Lancement...';
        isGameRunning = true;

        addLog('Préparation du lancement de Minecraft 1.21...', 'info');

        // Options de lancement
        const launchOptions = {
            version: '1.21',
            username: currentUser.profile.name,
            uuid: currentUser.profile.uuid,
            accessToken: currentUser.tokens.accessToken,
            ram: currentConfig.ram
        };

        addLog(`Joueur: ${currentUser.profile.name}`, 'info');
        addLog(`RAM allouée: ${currentConfig.ram / 1024} Go`, 'info');

        // Lancer le jeu
        const result = await window.electronAPI.launchGame(launchOptions);

        if (result.success) {
            addLog('Minecraft lancé avec succès !', 'success');
            statusDisplay.textContent = 'En jeu';
        } else {
            throw new Error(result.error || 'Erreur inconnue');
        }

    } catch (error) {
        addLog(`Erreur: ${error.message}`, 'error');
        statusDisplay.textContent = 'Erreur';
        isGameRunning = false;
        playButton.disabled = false;
        playButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Jouer</span>';
    }
});

/**
 * Écouter les événements du processus de lancement
 */
window.electronAPI.onLaunchLog((log) => {
    addLog(log, 'info');
});

window.electronAPI.onGameStarted(() => {
    addLog('Minecraft a démarré !', 'success');
    document.getElementById('statusDisplay').textContent = 'En jeu';
});

window.electronAPI.onGameClosed(() => {
    addLog('Minecraft fermé', 'info');
    document.getElementById('statusDisplay').textContent = 'Prêt';
    isGameRunning = false;
    
    const playButton = document.getElementById('playButton');
    playButton.disabled = false;
    playButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Jouer</span>';
});

/**
 * Déconnexion
 */
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        await window.electronAPI.logout();
    }
});

/**
 * Initialisation au chargement
 */
window.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    await loadConfig();
    addLog('QuantumCraft Launcher prêt', 'success');
});
