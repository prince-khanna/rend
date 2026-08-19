import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 60 * 60;

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PROJECT_ACCESS_SECRET || "pigeon-project-access-development-secret";
}

export function createProjectAccessToken(pageId: string): string {
  const expires = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${pageId}.${expires}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${expires}.${signature}`;
}

export function verifyProjectAccessToken(pageId: string, token: string | null): boolean {
  if (!token) return false;
  const [rawExpires, signature] = token.split(".");
  const expires = Number(rawExpires);
  if (!Number.isSafeInteger(expires) || expires < Math.floor(Date.now() / 1000) || !signature) return false;
  const expected = createHmac("sha256", secret()).update(`${pageId}.${expires}`).digest("base64url");
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
