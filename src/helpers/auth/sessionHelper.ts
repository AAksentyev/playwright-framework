/**
 * Handles saving and retrieving of session storage.
 * Used inside the login fixture
 */

import { SESSION_STORAGE_STATE } from '@configs/auth/session.ts';
import { getMetadata, TestMetadata, updateMetadata } from '@helpers/metadata/metadataHelper.js';
import { logInfo } from '@helpers/reporting/reportingHelpers.js';
import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(SESSION_STORAGE_STATE, 'storageState.json');
const SESSION_EXPIRY_MINUTES = 30; // Adjust based on your actual session timeout

interface StorageState {
    cookies: any[];
    timestamp?: number;
}

export async function restoreSession(page: Page, username: string): Promise<boolean> {
    try {
        // if there is no session storage
        if (!fs.existsSync(STORAGE_FILE)) return false;

        // Read and parse storage state
        const state: StorageState = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
        
        // If no cookies or timestamp, session is invalid
        if (!state?.cookies?.length || !state.timestamp) return false;

        // Check if session is expired
        const now = Date.now();
        const sessionAge = (now - state.timestamp) / (1000 * 60); // Convert to minutes
        if (sessionAge >= SESSION_EXPIRY_MINUTES) {
            logInfo('Session expired, requiring fresh login');
            return false;
        }

        // Check if the session belongs to the user we're logging in as
        const metadata: TestMetadata = getMetadata();
        if (username !== metadata.username) return false;

        // Session is valid, restore it
        await page.context().addCookies(state.cookies);
        await page.goto('/#/dashboard');
        logInfo('Successfully restored valid session');
        return true;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logInfo(`Error restoring session: ${errorMessage}`);
        return false;
    }
}

export async function saveSession(page: Page, username: string): Promise<void> {
    const state = await page.context().storageState();
    const stateWithTimestamp: StorageState = {
        ...state,
        timestamp: Date.now()
    };
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(stateWithTimestamp, null, 2));
    updateMetadata({ username });
}

export function deleteSession(): void {
    if (fs.existsSync(STORAGE_FILE)) fs.unlinkSync(STORAGE_FILE);
}

export function isSessionValid(): boolean {
    try {
        if (!fs.existsSync(STORAGE_FILE)) return false;
        
        const state: StorageState = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
        if (!state?.timestamp) return false;

        const now = Date.now();
        const sessionAge = (now - state.timestamp) / (1000 * 60);
        return sessionAge < SESSION_EXPIRY_MINUTES;
    } catch {
        return false;
    }
}
