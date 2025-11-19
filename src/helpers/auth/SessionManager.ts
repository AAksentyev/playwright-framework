import fs from 'fs';
import path from 'path';
import { sprintf } from 'sprintf-js';
import { setCookies } from './cookieHelper.js';
import { BrowserContext } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import {
    SESSION_CHECK_INTERVAL_MS,
    SESSION_LIFETIME_MS,
    SESSION_STORAGE_FILE,
    ARTIFACTS_PATH,
} from '@configs/auth/session.ts';

/** User session information */
interface SessionState {
    username: string;
    startTime: number;
    lastChecked: number;
    isValid: boolean;
}

/** Storage format for persisted sessions */
interface StorageState {
    cookies: any[];
    timestamp?: number;
}

/** Multi-username storage map */
interface MultiUserStorage {
    [username: string]: StorageState;
}

/**
 * A session manager helper class to store and validate the session.
 * Used when sessionStorage to ensure any potentially expired sessions (when tests are long-running)
 * are appropriately refreshed
 */
export class SessionManager {
    private static readonly SESSION_CHECK_INTERVAL = SESSION_CHECK_INTERVAL_MS; // 5 minutes
    private static readonly SESSION_LIFETIME = SESSION_LIFETIME_MS; // 55 minutes (refresh before 1 hour expiry)

    private readonly WORKER_SESSION_STORAGE_FILE: string;

    /** Stores multiple user sessions keyed by username */
    private sessions: Record<string, SessionState> = {};

    constructor(
        //private readonly context: BrowserContext,
        private readonly workerIndex: number
    ) {
        this.validateClassCanBeUsed();
        this.WORKER_SESSION_STORAGE_FILE = path.join(
            ARTIFACTS_PATH,
            sprintf(SESSION_STORAGE_FILE, this.workerIndex)
        );
    }

    /**
     * Ensure criteria is met for usage of this class
     * constants are pre-set, but certain environment-specific variables
     * should be configured to be able to use this.
     *
     *
     * For example, check for presence of auth cookie configuration
     */
    private validateClassCanBeUsed() {
        //if (! config.SESSION_COOKIE_NAME.length)
        //    throw new Error(`process.env.SESSION_COOKIE_NAME is not configured. Session cannot be tracked.`);
    }
    /**
     * Initialize or update session state
     * @param username User's username
     */
    private initializeSession(username: string): void {
        this.sessions[username] = {
            username,
            startTime: Date.now(),
            lastChecked: Date.now(),
            isValid: true,
        };
        Logger.info(`Session initialized for user: ${username}`);
    }

    /**
     * Check if the current session is valid and request a refresh
     * @returns true if session is valid, false if needs re-authentication
     */
    public async validateSession(username: string): Promise<boolean> {
        const session = this.sessions[username];

        if (!session) {
            Logger.warn('No active session found');
            return false;
        }

        // Don't check too frequently
        if (Date.now() - session.lastChecked < SessionManager.SESSION_CHECK_INTERVAL) {
            return session.isValid;
        }

        // Update last checked time
        session.lastChecked = Date.now();

        // Check if session is approaching expiration
        const sessionAge = Date.now() - session.startTime;
        if (sessionAge >= SessionManager.SESSION_LIFETIME) {
            Logger.warn('Session is approaching expiration, marking for refresh');
            session.isValid = false;
            return false;
        }

        // let's ensure, as a final step, that we have a valid session saved
        if (!this.isStoredSessionValid(username)) return false;

        // Additional session validation could be added here
        // For example, making a lightweight API call to verify session

        return true;
    }

    /**
     * Clear the session state for a specific username or all sessions if no username provided
     * @param username Optional username to clear
     */
    public clearSession(username?: string): void {
        if (username) {
            delete this.sessions[username];
            this.removeStoredSession(username);
            Logger.info(`Session cleared for user: ${username}`);
        } else {
            this.sessions = {};
            if (fs.existsSync(this.WORKER_SESSION_STORAGE_FILE))
                fs.unlinkSync(this.WORKER_SESSION_STORAGE_FILE);
            Logger.info('All sessions cleared');
        }
    }

    /**
     * Get the current session state for a given username
     * @param username User's username
     */
    public getCurrentSession(username: string): SessionState | null {
        return this.sessions[username] ?? null;
    }

    // ======================
    // STORAGE-STATE INTEGRATION
    // ======================

    /** Read all persisted sessions from storageState.json */
    private readStorage(): MultiUserStorage {
        try {
            if (!fs.existsSync(this.WORKER_SESSION_STORAGE_FILE)) return {};
            return JSON.parse(
                fs.readFileSync(this.WORKER_SESSION_STORAGE_FILE, 'utf-8')
            ) as MultiUserStorage;
        } catch {
            return {};
        }
    }

    /** Write all persisted sessions to storageState.json */
    private writeStorage(data: MultiUserStorage) {
        if (!fs.existsSync(ARTIFACTS_PATH)) fs.mkdirSync(ARTIFACTS_PATH, { recursive: true });

        fs.writeFileSync(this.WORKER_SESSION_STORAGE_FILE, JSON.stringify(data, null, 2));
    }

    /** Remove a stored session for a username */
    private removeStoredSession(username: string) {
        const all = this.readStorage();
        delete all[username];
        this.writeStorage(all);
    }

    /** Check if a stored session exists and is valid for a username */
    private isStoredSessionValid(username: string): boolean {
        const all = this.readStorage();
        const state = all[username];
        if (!state?.timestamp || !state.cookies?.length) return false;

        const ageMs = Date.now() - state.timestamp;
        return ageMs < SESSION_LIFETIME_MS; // adjust based on session timeout
    }

    /**
     * Restore a session from storage for a given username
     * @param username
     */
    public async restoreSession(context: BrowserContext, username: string): Promise<boolean> {
        // read from our storage and set the cookies to context
        const all = this.readStorage();
        const state = all[username];
        if (!state) return false;

        // set our cookies to the browser context
        await setCookies(context, state.cookies);

        // update the in-memory session
        this.initializeSession(username);
        Logger.info(`Successfully restored session for user: ${username}`);
        return true;
    }

    /**
     * Save a session to storage for a given username
     * @param username
     */
    public async saveSession(context: BrowserContext, username: string): Promise<void> {
        // get our state from the browser context
        const state = await context.storageState();
        // add a timestamp to our storage state. This will allow us keep track of the session age
        // and track session refreshes
        const stateWithTimestamp: StorageState = { ...state, timestamp: Date.now() };
        // update our session storage for the username
        const all = this.readStorage();
        all[username] = stateWithTimestamp;
        this.writeStorage(all);

        // update the in-memory storage for the username
        this.initializeSession(username);
        Logger.info(`Saved session for user: ${username}`);
    }
}
