/**
 * Splash Screen - Animation et textes de chargement
 */

const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');

const loadingSteps = [
    'Initialisation des dossiers...',
    'Vérification des composants...',
    'Chargement des ressources...',
    'Préparation du launcher...'
];

let currentStep = 0;

function updateLoading() {
    if (currentStep < loadingSteps.length) {
        loadingText.textContent = loadingSteps[currentStep];
        loadingProgress.style.width = `${(currentStep + 1) * 25}%`;
        currentStep++;
    }
}

// Mettre à jour toutes les 500ms
setInterval(updateLoading, 500);
