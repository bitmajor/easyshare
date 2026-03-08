import { addMinutes } from 'date-fns';

/**
 * Compute the expiry date given a number of minutes in the future.
 * Returns null if no expiry.
 */
export function computeExpiry(minutesDelay?: number | null): Date | null {
    if (!minutesDelay) return null;
    return addMinutes(new Date(), minutesDelay);
}
