'use strict';

const { OAuth2Client } = require('google-auth-library');

let googleClient = null;

function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

/**
 * Verify a Google ID token server-side.
 * Never trust frontend-supplied email/profile data.
 */
async function verifyGoogleToken(idToken) {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    emailVerified: payload.email_verified,
    picture: payload.picture,
  };
}

module.exports = { verifyGoogleToken };
