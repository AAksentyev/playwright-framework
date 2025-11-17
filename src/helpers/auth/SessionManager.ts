import { BrowserContext, Page } from '@playwright/test';
//import { config } from '@config';
import { Logger } from '@utils/logger.ts';
import { SESSION_CHECK_INTERVAL_MS, SESSION_LIFETIME_MS, SESSION_STORAGE_FILE } from '@configs/auth/session.ts';
import { hasCookie, setCookies } from './cookieHelper.js';
import fs from 'fs';
import { config } from '@config';

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
    
    /** Stores multiple user sessions keyed by username */
    private sessions: Record<string, SessionState> = {};

    constructor(private readonly context: BrowserContext, private readonly page: Page) {
        this.validateClassCanBeUsed();
    }

    /**
     * Ensure criteria is met for usage of this class
     * constants are pre-set, but certain environment-specific variables 
     * should be configured to be able to use this.
     * 
     * 
     * For example, check for presence of auth cookie configuration
     */
    private validateClassCanBeUsed(){

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
            isValid: true
        };
        Logger.info(`Session initialized for user: ${username}`);
    }

    /**
     * Check if the current session is valid and request a refresh
     * @returns true if session is valid, false if needs re-authentication
     */
    public async validateSession(username:string): Promise<boolean> {
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

        /** VALIDATION LOGIC TO CHECK IF OUR SESSION IS STILL VALID REGARDLESS OF WHETHER WE HIT THE REFRESH BUFFER */
        // Cookie check - verify session cookie exists
        /*const hasCookieResult = await hasCookie(this.context, config.SESSION_COOKIE_NAME);
        if (!hasCookieResult) {
            Logger.warn('Session cookie not found');
            session.isValid = false;
            return false;
        }*/

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
            if (fs.existsSync(SESSION_STORAGE_FILE)) fs.unlinkSync(SESSION_STORAGE_FILE);
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
            if (!fs.existsSync(SESSION_STORAGE_FILE)) return {};
            return JSON.parse(fs.readFileSync(SESSION_STORAGE_FILE, 'utf-8')) as MultiUserStorage;
        } catch {
            return {};
        }
    }

    /** Write all persisted sessions to storageState.json */
    private writeStorage(data: MultiUserStorage) {
        fs.writeFileSync(SESSION_STORAGE_FILE, JSON.stringify(data, null, 2));
    }

    /** Remove a stored session for a username */
    private removeStoredSession(username: string) {
        const all = this.readStorage();
        delete all[username];
        this.writeStorage(all);
    }

    /** Check if a stored session exists and is valid for a username */
    public isStoredSessionValid(username: string): boolean {
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
    public async restoreSession(username: string): Promise<boolean> {
        
        // if the session valid, return false so we proceed with regular login
        if (!this.isStoredSessionValid(username)) return false;

        // read from our storage and set the cookies to context
        const all = this.readStorage();
        const state = all[username];
        if (! state )
            return false;

        // set our cookies to the browser context
        await setCookies(this.context, state.cookies);

        // update the in-memory session
        this.initializeSession(username);
        Logger.info(`Successfully restored session for user: ${username}`);
        return true;
    }

    /**
     * Save a session to storage for a given username
     * @param username
     */
    public async saveSession(username: string): Promise<void> {

        // get our state from the browser context
        const state = await this.context.storageState();
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