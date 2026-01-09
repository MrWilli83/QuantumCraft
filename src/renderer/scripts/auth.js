/**
 * Authentification Microsoft - Script Renderer
 * Gestion de l'authentification OAuth Microsoft/Xbox/Minecraft
 */

// Éléments DOM
const loginBtn = document.getElementById('loginBtn');
const loadingSection = document.getElementById('loadingSection');
const loadingText = document.getElementById('loadingText');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

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

/**
 * Afficher/Masquer les sections
 */
function showLoading(text = 'Connexion en cours...') {
    loginBtn.style.display = 'none';
    errorSection.style.display = 'none';
    loadingSection.style.display = 'block';
    loadingText.textContent = text;
}

function showError(error) {
    loadingSection.style.display = 'none';
    loginBtn.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = error;
}

function showLogin() {
    loadingSection.style.display = 'none';
    errorSection.style.display = 'none';
    loginBtn.style.display = 'flex';
}

/**
 * Authentification Microsoft
 */
async function authenticateWithMicrosoft() {
    try {
        showLoading('Ouverture de la fenêtre Microsoft...');

        // Appeler le main process pour l'authentification
        const result = await window.electronAPI.authenticateMicrosoft();

        if (!result.success) {
            throw new Error(result.error || 'Erreur d\'authentification');
        }

        const authData = result.data;
        
        showLoading('Sauvegarde de la session...');

        // Sauvegarder l'authentification
        const saveResult = await window.electronAPI.saveAuth(authData);

        if (!saveResult.success) {
            throw new Error('Impossible de sauvegarder la session');
        }

        // Logger l'événement
        await window.electronAPI.writeLog(`Authentification réussie: ${authData.username}`);

        showLoading('Chargement du launcher...');

        // Charger le dashboard
        setTimeout(() => {
            window.electronAPI.loadDashboard();
        }, 1000);

    } catch (error) {
        console.error('Erreur authentification:', error);
        await window.electronAPI.writeLog(`Erreur auth: ${error.message}`);
        showError(error.message || 'Une erreur est survenue lors de l\'authentification');
    }
}

/**
 * Événements
 */
loginBtn.addEventListener('click', authenticateWithMicrosoft);
retryBtn.addEventListener('click', () => {
    showLogin();
});

// Vérifier si déjà connecté au chargement
window.addEventListener('DOMContentLoaded', async () => {
    const authData = await window.electronAPI.getAuth();
    
    if (authData && authData.expiresAt > Date.now()) {
        showLoading('Session active détectée...');
        setTimeout(() => {
            window.electronAPI.loadDashboard();
        }, 1000);
    }
});
