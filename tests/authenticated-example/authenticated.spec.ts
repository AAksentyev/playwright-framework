import { TAG } from '@constants/tags.ts';
import { test } from '@fixtures/base.ts';
import { Logger } from '@utils/logger.ts';

/**
 * Examples of a test that will have an authenticated session automatically pre-set up by the base fixture
 *
 * These tests are set up in our playwright.config.ts to run in a separate project ('authenticatedChromium')
 * The project has a 'authenticated:true' variable set which is then handled inside our base.ts fixture
 * to set up or restore our authenticated session.
 *
 * See playwright.config.ts and /src/fixtures/base.ts for logic details
 */
test.describe(
    'Tests that will run after Auth session is set up',
    { tag: TAG.AUTHENTICATED },
    async () => {
        /** This will generate 6 separate tests to run, potentially across different workers
         * Each worker will only manually set up the session once and any following run on that worker
         * will restore the session.
         *
         * You can check the attached logs for these tests and the stdout logs
         * will show where the session was set up vs where it was restored from existing saved session
         */
        for (const [i] of Array(6).entries()) {
            test(`Authenticated test example ${i}`, async () => {
                Logger.info('Executing test after the authenticated session was set up....');
            });
        }
    }
);
