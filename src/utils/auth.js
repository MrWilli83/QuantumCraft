/**
 * QuantumCraft - Authentification Microsoft/Minecraft Premium
 * Flux OAuth2 complet avec refresh token
 */

const { BrowserWindow } = require('electron');
const axios = require('axios');
const crypto = require('crypto');

// Configuration OAuth2
const OAUTH_CONFIG = {
    clientId: '00000000402b5328', // ClientID officiel Minecraft
    redirectUri: 'https://login.live.com/oauth20_desktop.srf',
    scope: 'XboxLive.signin offline_access',
    authorizeUrl: 'https://login.live.com/oauth20_authorize.srf',
    tokenUrl: 'https://login.live.com/oauth20_token.srf',
    xblAuthUrl: 'https://user.auth.xboxlive.com/user/authenticate',
    xstsAuthUrl: 'https://xsts.auth.xboxlive.com/xsts/authorize',
    mcAuthUrl: 'https://api.minecraftservices.com/authentication/login_with_xbox',
    mcProfileUrl: 'https://api.minecraftservices.com/minecraft/profile'
};

/**
 * Encoder en base64url (compatible avec toutes les versions de Node.js)
 */
function base64UrlEncode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Générer le couple code_verifier + code_challenge pour PKCE
 * IMPORTANT : Appelé UNE SEULE FOIS au début du flux OAuth2
 */
function generatePKCE() {
    // 1. Générer un code_verifier aléatoire (43-128 caractères)
    const randomBytes = crypto.randomBytes(32); // 32 bytes = 43 caractères en base64url
    const code_verifier = base64UrlEncode(randomBytes);
    
    // 2. Calculer le code_challenge = BASE64URL(SHA256(code_verifier))
    const hash = crypto.createHash('sha256').update(code_verifier).digest();
    const code_challenge = base64UrlEncode(hash);
    
    console.log(`📝 PKCE généré:`);
    console.log(`   code_verifier: ${code_verifier.substring(0, 20)}...`);
    console.log(`   code_challenge: ${code_challenge.substring(0, 20)}...`);
    
    return {
        code_verifier,
        code_challenge
    };
}

/**
 * Étape 1 : Ouvrir la fenêtre de connexion Microsoft et récupérer le code
 */
async function getMicrosoftAuthCode() {
    return new Promise((resolve, reject) => {
        const state = crypto.randomBytes(16).toString('hex');

        // Construction de l'URL d'autorisation (SANS PKCE pour simplifier)
        const authUrl = new URL(OAUTH_CONFIG.authorizeUrl);
        authUrl.searchParams.append('client_id', OAUTH_CONFIG.clientId);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.redirectUri);
        authUrl.searchParams.append('scope', OAUTH_CONFIG.scope);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('prompt', 'select_account');

        // Créer une fenêtre de connexion
        const authWindow = new BrowserWindow({
            width: 500,
            height: 700,
            show: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        authWindow.loadURL(authUrl.toString());

        // Intercepter la redirection
        authWindow.webContents.on('will-redirect', (event, url) => {
            handleRedirect(url);
        });

        authWindow.webContents.on('did-navigate', (event, url) => {
            handleRedirect(url);
        });

        function handleRedirect(url) {
            const urlObj = new URL(url);
            
            // Vérifier si c'est la page de redirection desktop
            if (urlObj.origin === 'https://login.live.com' && urlObj.pathname.includes('oauth20_desktop.srf')) {
                const code = urlObj.searchParams.get('code');
                const returnedState = urlObj.searchParams.get('state');
                const error = urlObj.searchParams.get('error');

                if (error) {
                    authWindow.close();
                    reject(new Error(`Erreur Microsoft: ${error}`));
                    return;
                }

                if (code && returnedState === state) {
                    authWindow.close();
                    console.log(`✓ Code d'autorisation reçu`);
                    resolve({ code });
                }
            }
        }

        authWindow.on('closed', () => {
            reject(new Error('Fenêtre de connexion fermée par l\'utilisateur'));
        });
    });
}

/**
 * Étape 2 : Échanger le code contre des tokens Microsoft
 */
async function exchangeCodeForTokens(code) {
    console.log(`🔄 Échange du code contre tokens...`);
    
    const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: OAUTH_CONFIG.redirectUri
    });

    try {
        const response = await axios.post(OAUTH_CONFIG.tokenUrl, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in
        };
    } catch (error) {
        throw new Error(`Erreur échange de tokens: ${error.response?.data?.error_description || error.message}`);
    }
}

/**
 * Étape 3 : Obtenir un token Xbox Live (XBL)
 */
async function getXBLToken(accessToken) {
    try {
        const response = await axios.post(OAUTH_CONFIG.xblAuthUrl, {
            Properties: {
                AuthMethod: 'RPS',
                SiteName: 'user.auth.xboxlive.com',
                RpsTicket: `d=${accessToken}`
            },
            RelyingParty: 'http://auth.xboxlive.com',
            TokenType: 'JWT'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return {
            token: response.data.Token,
            uhs: response.data.DisplayClaims.xui[0].uhs
        };
    } catch (error) {
        throw new Error(`Erreur XBL: ${error.response?.data?.Message || error.message}`);
    }
}

/**
 * Étape 4 : Obtenir un token XSTS (Xbox Secure Token Service)
 */
async function getXSTSToken(xblToken) {
    try {
        const response = await axios.post(OAUTH_CONFIG.xstsAuthUrl, {
            Properties: {
                SandboxId: 'RETAIL',
                UserTokens: [xblToken]
            },
            RelyingParty: 'rp://api.minecraftservices.com/',
            TokenType: 'JWT'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return {
            token: response.data.Token,
            uhs: response.data.DisplayClaims.xui[0].uhs
        };
    } catch (error) {
        const errorCode = error.response?.data?.XErr;
        let errorMessage = 'Erreur XSTS';

        if (errorCode === 2148916233) {
            errorMessage = 'Ce compte n\'a pas de compte Xbox. Créez-en un sur xbox.com';
        } else if (errorCode === 2148916235) {
            errorMessage = 'Compte Xbox interdit dans votre région ou compte enfant nécessitant une autorisation parentale';
        } else if (errorCode === 2148916238) {
            errorMessage = 'Compte enfant. Ajoutez-le à une famille sur account.microsoft.com';
        }

        throw new Error(`${errorMessage} (Code: ${errorCode})`);
    }
}

/**
 * Étape 5 : Obtenir le token d'accès Minecraft
 */
async function getMinecraftToken(xstsToken, uhs) {
    try {
        const response = await axios.post(OAUTH_CONFIG.mcAuthUrl, {
            identityToken: `XBL3.0 x=${uhs};${xstsToken}`
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in
        };
    } catch (error) {
        throw new Error(`Erreur auth Minecraft: ${error.response?.data?.errorMessage || error.message}`);
    }
}

/**
 * Étape 6 : Récupérer le profil Minecraft (UUID, pseudo, skin)
 */
async function getMinecraftProfile(mcAccessToken) {
    try {
        const response = await axios.get(OAUTH_CONFIG.mcProfileUrl, {
            headers: {
                'Authorization': `Bearer ${mcAccessToken}`
            }
        });

        const profile = response.data;
        const cleanUuid = profile.id;
        const formattedUuid = `${cleanUuid.substr(0, 8)}-${cleanUuid.substr(8, 4)}-${cleanUuid.substr(12, 4)}-${cleanUuid.substr(16, 4)}-${cleanUuid.substr(20, 12)}`;

        return {
            uuid: formattedUuid,
            name: profile.name,
            skins: profile.skins || [],
            cleanUuid: cleanUuid
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Ce compte Microsoft n\'a pas Minecraft Java Edition. Achetez le jeu sur minecraft.net');
        }
        throw new Error(`Erreur profil Minecraft: ${error.response?.data?.errorMessage || error.message}`);
    }
}

/**
 * Renouveler les tokens avec le refresh token
 */
async function refreshTokens(refreshToken) {
    const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        redirect_uri: OAUTH_CONFIG.redirectUri
    });

    try {
        const response = await axios.post(OAUTH_CONFIG.tokenUrl, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in
        };
    } catch (error) {
        throw new Error('Refresh token expiré. Reconnexion nécessaire.');
    }
}

/**
 * FONCTION PRINCIPALE : Authentification complète
 */
async function authenticateMinecraft(useRefreshToken = null) {
    console.log('🔐 Démarrage authentification Microsoft/Minecraft...');

    try {
        let msTokens;

        // Si on a un refresh token, on l'utilise
        if (useRefreshToken) {
            console.log('♻️  Utilisation du refresh token...');
            try {
                msTokens = await refreshTokens(useRefreshToken);
                console.log('✓ Tokens renouvelés');
            } catch (error) {
                console.log('✗ Refresh token invalide, nouvelle connexion requise');
                useRefreshToken = null;
            }
        }

        // Sinon, connexion complète
        if (!useRefreshToken) {
            console.log('1️⃣ Ouverture fenêtre Microsoft...');
            const authResult = await getMicrosoftAuthCode();
            console.log('✓ Code d\'autorisation reçu');

            console.log('2️⃣ Échange du code contre tokens...');
            msTokens = await exchangeCodeForTokens(authResult.code);
            console.log('✓ Tokens Microsoft obtenus');
        }

        console.log('3️⃣ Authentification Xbox Live...');
        const xblData = await getXBLToken(msTokens.accessToken);
        console.log('✓ Token XBL obtenu');

        console.log('4️⃣ Authentification XSTS...');
        const xstsData = await getXSTSToken(xblData.token);
        console.log('✓ Token XSTS obtenu');

        console.log('5️⃣ Authentification Minecraft...');
        const mcToken = await getMinecraftToken(xstsData.token, xstsData.uhs);
        console.log('✓ Token Minecraft obtenu');

        console.log('6️⃣ Récupération du profil...');
        const profile = await getMinecraftProfile(mcToken.accessToken);
        console.log(`✓ Profil récupéré: ${profile.name}`);

        // Retourner toutes les données
        return {
            success: true,
            profile: {
                uuid: profile.uuid,
                name: profile.name,
                cleanUuid: profile.cleanUuid,
                skin: `https://mc-heads.net/avatar/${profile.cleanUuid}/100`
            },
            tokens: {
                accessToken: mcToken.accessToken,
                refreshToken: msTokens.refreshToken,
                expiresAt: Date.now() + (mcToken.expiresIn * 1000)
            },
            xbox: {
                uhs: xstsData.uhs,
                xuid: xstsData.uhs // XUID pour compatibilité
            }
        };

    } catch (error) {
        console.error('✗ Erreur authentification:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    authenticateMinecraft
};
