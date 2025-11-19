import { test as setup } from '@playwright/test';
import { Logger } from '@utils/logger.ts';

setup('Running global setup....', async () => {
    Logger.debug('In my global setup...');
});
