const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

const DISCORD_CLIENT_ID = defineSecret("DISCORD_CLIENT_ID");
const DISCORD_CLIENT_SECRET = defineSecret("DISCORD_CLIENT_SECRET");
const WEB_ORIGIN = defineString("WEB_ORIGIN", { default: "https://memoplayer40.github.io" });

const COOKIE_NAME = "discord_oauth_state";

function makeState() {
  return crypto.randomBytes(32).toString("hex");
}

function getRedirectUri(req) {
  return `${req.protocol}://${req.get("host")}/discordCallback`;
}

function safeJson(res, status, data) {
  res.status(status).set("Content-Type", "application/json").send(JSON.stringify(data));
}

exports.discordAuth = onRequest(
  {
    region: "us-central1",
    secrets: [DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET],
    cors: false
  },
  async (req, res) => {
    const path = req.path || "/";

    if (req.method === "GET" && path === "/discordLogin") {
      const state = makeState();
      const redirectUri = getRedirectUri(req);
      const params = new URLSearchParams({
        response_type: "code",
        client_id: DISCORD_CLIENT_ID.value(),
        scope: "identify",
        state,
        redirect_uri: redirectUri,
        prompt: "consent"
      });

      res.set(
        "Set-Cookie",
        `${COOKIE_NAME}=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
      );
      return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
    }

    if (req.method === "GET" && path === "/discordCallback") {
      const { code, state, error } = req.query;
      if (error) return res.status(400).send("Discord authorization was cancelled.");

      const cookies = String(req.headers.cookie || "");
      const stateCookie = cookies
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${COOKIE_NAME}=`));
      const savedState = stateCookie ? stateCookie.slice(COOKIE_NAME.length + 1) : "";

      if (!state || !savedState || !crypto.timingSafeEqual(Buffer.from(String(state)), Buffer.from(savedState))) {
        return res.status(400).send("Invalid OAuth state.");
      }
      if (!code) return res.status(400).send("Missing Discord authorization code.");

      const redirectUri = getRedirectUri(req);
      const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID.value(),
          client_secret: DISCORD_CLIENT_SECRET.value(),
          grant_type: "authorization_code",
          code: String(code),
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) return res.status(502).send("Discord token exchange failed.");
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) return res.status(502).send("Discord did not return an access token.");

      const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!userResponse.ok) return res.status(502).send("Could not read the Discord profile.");

      const discordUser = await userResponse.json();
      const uid = `discord:${discordUser.id}`;
      const nickname = discordUser.global_name || discordUser.username || "Discord User";

      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "discord",
        discordId: String(discordUser.id)
      });

      res.set("Set-Cookie", `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);
      res.set("Content-Type", "text/html; charset=utf-8");
      const origin = WEB_ORIGIN.value();
      return res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Discord Login</title></head>
<body><p>Finishing Discord login...</p>
<script>
  const token = ${JSON.stringify(customToken)};
  const targetOrigin = ${JSON.stringify(origin)};
  if (window.opener) {
    window.opener.postMessage({ type: "DISCORD_FIREBASE_TOKEN", token }, targetOrigin);
    window.close();
  } else {
    document.body.textContent = "Please close this window and try Discord login again.";
  }
</script></body></html>`);
    }

    return safeJson(res, 404, { error: "Not found" });
  }
);
