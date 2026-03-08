import crypto from 'crypto';

/**
 * Generate a random secure token.
 * Default 16 bytes for 32 hex chars.
 */
export function generateToken(bytes = 16): string {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token for storage in the database.
 */
export function hashToken(token: string): string {
    const salt = process.env.TOKEN_SALT || '';
    return crypto.createHash('sha256').update(token + salt).digest('hex');
}
