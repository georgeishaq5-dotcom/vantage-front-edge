#!/usr/bin/env node
// Generate an Apple "Sign in with Apple" client secret (an ES256-signed JWT)
// for use as the Secret Key in Supabase Authentication -> Providers -> Apple.
//
// Apple does not give you a static secret — you sign a short-lived JWT with the
// .p8 private key. It expires after at most 6 months, so re-run this when it
// lapses (a lapsed secret is the classic "Apple sign-in suddenly broke").
//
// Dependency-free: uses Node's crypto with dsaEncoding 'ieee-p1363', which
// emits the raw r||s signature ES256/JWS requires (no DER conversion, no jose).
//
// USAGE (flags or env vars; flags win):
//   bun scripts/generate-apple-client-secret.mjs \
//     --team   <TEAM_ID>        # JWT iss   (Membership details, 10 chars)
//     --services <SERVICES_ID>  # JWT sub   (Identifiers -> Services IDs, e.g. com.vantage.app.web)
//     --kid    <KEY_ID>         # JWT header kid (Keys -> your Sign in with Apple key)
//     --p8     <PATH_TO_.p8>    # the AuthKey_<KEY_ID>.p8 file (downloaded once at key creation)
//     [--days  <N>]             # validity in days (default 180; Apple max ~180)
//
//   Env equivalents: APPLE_TEAM_ID, APPLE_SERVICES_ID, APPLE_KEY_ID, APPLE_P8_PATH, APPLE_SECRET_DAYS
//
// The JWT is printed to STDOUT (so you can pipe/copy it); a summary of the
// claims and the expiry date goes to STDERR.
//
// NOTE: keep the .p8 out of git. Pass a path that lives outside the repo, or
// add it to .gitignore. This script never copies the key anywhere.

import { readFileSync } from "node:fs";
import { createPrivateKey, sign as cryptoSign } from "node:crypto";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[(i += 1)] : "true";
      out[key] = val;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const teamId = args.team ?? process.env.APPLE_TEAM_ID;
const servicesId = args.services ?? process.env.APPLE_SERVICES_ID;
const keyId = args.kid ?? process.env.APPLE_KEY_ID;
const p8Path = args.p8 ?? process.env.APPLE_P8_PATH;
const days = Number(args.days ?? process.env.APPLE_SECRET_DAYS ?? 180);

const missing = [
  ["--team / APPLE_TEAM_ID", teamId],
  ["--services / APPLE_SERVICES_ID", servicesId],
  ["--kid / APPLE_KEY_ID", keyId],
  ["--p8 / APPLE_P8_PATH", p8Path],
]
  .filter(([, v]) => !v)
  .map(([name]) => name);

if (missing.length) {
  console.error(`Missing required input(s): ${missing.join(", ")}`);
  console.error("Run with --help-style flags; see the header of this file for usage.");
  process.exit(1);
}

if (!Number.isFinite(days) || days <= 0 || days > 180) {
  console.error(`--days must be between 1 and 180 (Apple caps the secret at ~6 months); got: ${days}`);
  process.exit(1);
}

const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let privateKey;
try {
  const pem = readFileSync(p8Path, "utf8");
  privateKey = createPrivateKey(pem);
} catch (err) {
  console.error(`Could not read/parse the .p8 at "${p8Path}": ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

const iat = Math.floor(Date.now() / 1000);
const exp = iat + days * 24 * 60 * 60;

const header = { alg: "ES256", kid: keyId };
const payload = {
  iss: teamId,
  iat,
  exp,
  aud: "https://appleid.apple.com",
  sub: servicesId,
};

const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

let signatureB64url;
try {
  const signature = cryptoSign("SHA256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363", // raw r||s, as JWS ES256 requires
  });
  signatureB64url = signature.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
} catch (err) {
  console.error(`Signing failed (is the .p8 a P-256 Sign in with Apple key?): ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

const jwt = `${signingInput}.${signatureB64url}`;

console.error("Apple client secret generated:");
console.error(`  iss (Team ID):      ${teamId}`);
console.error(`  sub (Services ID):  ${servicesId}`);
console.error(`  kid (Key ID):       ${keyId}`);
console.error(`  expires:            ${new Date(exp * 1000).toISOString()} (${days} days)`);
console.error("  -> paste the line below into Supabase Auth -> Providers -> Apple -> Secret Key\n");

process.stdout.write(jwt + "\n");
