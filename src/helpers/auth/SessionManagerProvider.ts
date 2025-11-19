import { SessionManager } from './SessionManager.ts';

// worker-scoped session manager instance
let sessionManager: SessionManager | null = null;

/**
 * Session Manager provider. We're treating the SessionManager as a singleton per worker 
 * So this provider function initializes it once (per node instance) and 
 * returns existing instance if it already exists
 * @param workerIndex 
 * @returns 
 */
export function getSessionManager(workerIndex: number): SessionManager {
    if (! sessionManager) {
        if (! workerIndex) throw new Error('Cannot initialize SessionManager without workerInfo');
        sessionManager = new SessionManager(workerIndex);
    }
    return sessionManager;
}