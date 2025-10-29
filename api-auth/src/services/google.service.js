const axios = require("axios");
const User = require("../models/user");
const { signAppJwt } = require("../utils/appJwt");
const config = require("../utils/config");

function buildAuthorizeUrl({ clientId, redirectUri, scope, state }) {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        //Habilitar si se quiere forzar el consentimiento en cada login
        //prompt: "consent",
        state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
    const params = new URLSearchParams({
        code,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        redirect_uri: config.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
    });

    const resp = await axios.post("https://oauth2.googleapis.com/token", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    //Retorna explícitamente el token de acceso
    const token = resp.data?.access_token || resp.data?.id_token; 
    if (!token) throw new Error(" No se recibió access_token o id_token de Google");
    return token;
}


async function fetchGoogleProfile(accessToken) {

    const resp = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return resp.data; // { sub, email, name, picture }

}


async function upsertUserFromGoogle(profile) {
    const email = profile.email?.toLowerCase().trim();
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            nombre: profile.name,
            email,
            avatarUrl: profile.picture,
            googleId: profile.sub,
            role: "ADMINISTRADOR",
        });
    } else if (!user.googleId) {
        user.googleId = profile.sub;
        user.avatarUrl = user.avatarUrl || profile.picture;
        await user.save();
    }
    return user;
}

async function exchangeAndLogin({ code }) {
    const accessToken = await exchangeCodeForToken(code);
    const profile = await fetchGoogleProfile(accessToken);
    const user = await upsertUserFromGoogle(profile);

    const expiresInSeconds = 24 * 60 * 60;
    const accessExpires = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    const appToken = signAppJwt(
        {
            sub: String(user._id),
            name: user.nombre,
            role: [user.role],
            email: user.email,
            iss: config.JWT_ISSUER,
            aud: config.JWT_AUDIENCE,
        },
        expiresInSeconds
    );

    return {
        accessToken: appToken,
        expiresAtUtc: accessExpires,
        username: user.email,
        roles: [user.role],
    };
}

module.exports = { buildAuthorizeUrl, exchangeAndLogin };
