// playwright.custom.d.ts
import { PlaywrightTestOptions } from '@playwright/test';

declare module '@playwright/test' {
  interface PlaywrightTestOptions {
    authenticated?: boolean;   
  }
}