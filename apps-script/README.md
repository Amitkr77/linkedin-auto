# Apps Script bridge

Replace the **entire** bound Apps Script `Code.gs` with [Code.gs](./Code.gs), and remove any separate old `LinkedIn Scheduler.gs` file. This version only reads/writes the sheet for the application; it does not contain LinkedIn OAuth or posting code. Run `removeMinuteTrigger` once to remove old `checkDuePosts` and `checkAndPostScheduled` timers, then verify the Triggers panel is clear.

Create a `SHEET_BRIDGE_SECRET` Script Property with a random value of at least 32 characters. Deploy as a Web app (Execute as **Me**, access **Anyone**) and put the `/exec` URL plus the same secret in the application's `.env.local` as `GOOGLE_APPS_SCRIPT_URL` and `GOOGLE_APPS_SCRIPT_SECRET`. Edit an existing deployment to a new version rather than creating a second deployment when updating code.

The application polls the bridge every minute, imports/updates posts, publishes at the scheduled time, and writes E–G outcomes back. See [SHEET_SETUP.md](../SHEET_SETUP.md) for the complete workflow and test steps. The earlier Apps Script `LINKEDIN_PUBLISHER_ENABLED`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI` properties are not used by this bridge; do not enable direct publishing.
