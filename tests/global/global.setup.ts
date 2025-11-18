import { test as setup } from '@playwright/test';

setup('Running global setup....', async ({ page }) => {
    console.log('In my global setup...');
});
