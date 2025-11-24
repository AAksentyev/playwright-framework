import { ARTIFACTS_PATH } from '@configs/auth/session.ts';
import { test as teardown } from '@playwright/test';
import { FSHelpers } from '@utils/fs/fsHelpers.ts';
import processAllureResults from '@utils/post-processors/allure-postprocessor.ts';

teardown('Running global teardown....', async () => {
    processAllureResults();

    const pathsToDelete: string[] = [ARTIFACTS_PATH];
    // clean up our artifacts from the run
    FSHelpers.cleanUpFolders(pathsToDelete);
});
