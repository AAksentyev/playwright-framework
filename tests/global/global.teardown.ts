import { ARTIFACTS_PATH } from '@configs/auth/session.ts';
import { test as teardown } from '@playwright/test';
import { FSHelpers } from '@utils/fs/fsHelpers.ts';

teardown('Running global teardown....', async () => {
    const pathsToDelete: string[] = [ARTIFACTS_PATH];
    // clean up our artifacts from the run
    FSHelpers.cleanUpFolders(pathsToDelete);
});
