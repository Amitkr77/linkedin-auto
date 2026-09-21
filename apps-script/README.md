# Apps Script bridge

Replace the **entire** bound Apps Script `Code.gs` with [Code.gs](./Code.gs), and remove any separate old `LinkedIn Scheduler.gs` file. This version only reads/writes the sheet for the application; it does not contain LinkedIn OAuth or posting code. Run `removeMinuteTrigger` once to remove old `checkDuePosts` and `checkAndPostScheduled` timers, then verify the Triggers panel is clear.

Create a `SHEET_BRIDGE_SECRET` Script Property with a random value of at least 32 characters. Deploy as a Web app (Execute as **Me**, access **Anyone**) and put the `/exec` URL plus the same secret in the application's `.env.local` as `GOOGLE_APPS_SCRIPT_URL` and `GOOGLE_APPS_SCRIPT_SECRET`. Edit an existing deployment to a new version rather than creating a second deployment when updating code.

For Vercel, set Apps Script properties `APP_CRON_URL` (your production `/api/cron` URL) and `APP_CRON_SECRET` (the same value as Vercel's `CRON_SECRET`). Run `wakeApplication` once to authorize/test, then run `installAppWakeupTrigger` once. The trigger only wakes the application; Apps Script does not publish to LinkedIn. See [SHEET_SETUP.md](../SHEET_SETUP.md) for the complete workflow. LinkedIn OAuth and publishing are handled by the application through Better Auth.
