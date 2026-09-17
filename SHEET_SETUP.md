# Google Sheet → application → LinkedIn

The Google Sheet is the input and status display. The application reads it about once per minute through a small Apps Script bridge, stores posts in MongoDB, publishes them through the application's existing LinkedIn connection at their scheduled time, then writes the outcome back to the sheet. **Apps Script does not publish to LinkedIn. No Google service account is required.**

## One-time setup

1. In the spreadsheet, open **Extensions → Apps Script**. Replace the entire `Code.gs` there with [apps-script/Code.gs](./apps-script/Code.gs) and save. Do not keep the old direct-publishing functions in a second `.gs` file.
2. Select `removeMinuteTrigger` and run it once. This removes old Apps Script `checkDuePosts` or `checkAndPostScheduled` timers. Check the Triggers panel to ensure neither remains. The application has its own one-minute scheduler.
3. Generate a random shared secret locally: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. In Apps Script **Project Settings → Script Properties**, create `SHEET_BRIDGE_SECRET` with that value. Keep it private.
4. Deploy the Apps Script as a **Web app**, **Execute as: Me**, **Who has access: Anyone**. If you already deployed it, use **Deploy → Manage deployments → Edit → New version** so the `/exec` URL stays the same. Copy the `/exec` URL.
5. In the application's `.env.local`, set `GOOGLE_APPS_SCRIPT_URL` to that `/exec` URL and `GOOGLE_APPS_SCRIPT_SECRET` to the same random secret. If more than one LinkedIn account is connected to the app, also set `GOOGLE_SHEET_ACCOUNT_ID` to the intended app account ID. Never put these values in a sheet cell or commit them.
6. Make sure the LinkedIn account is connected **inside the application** using its existing `/api/auth` flow. The old LinkedIn OAuth properties in Apps Script are not used. The application's `LINKEDIN_REDIRECT_URI` must point to its own `/api/auth/callback`, not the Apps Script `/exec` URL.
7. Start the application with `npm.cmd run dev` (or `npm run dev` on shells where `npm` works). Keep the application and MongoDB running for automatic scheduling and publishing.

## Manual fetch from All Posts

Set `SHEET_SYNC_ADMIN_KEY` in the deployed application's server environment to a separate random 32+ character value (generate one with the command in step 3). Redeploy or restart the application. On **All Posts**, click **Fetch from Sheet** and enter that key. This imports new `Pending` rows immediately and refreshes the list; it does **not** publish them immediately. Do not put the key in a `NEXT_PUBLIC_` variable, a sheet cell, or source control.

Connecting LinkedIn only saves the account. It does not automatically import sheet rows. The automatic one-minute sync and scheduled publishing run only while the deployment starts the application with `npm start` (`node server.js --production`) and keeps that process running. A deployment that only serves Next.js routes without running `server.js` needs a separate scheduled worker; the manual button alone will not publish a post at its due time.

## Sheet columns and behavior

| Column | Meaning |
| --- | --- |
| A | Post text (1–3000 characters) |
| B | Optional public HTTPS JPEG/PNG/GIF image URL, max 10 MB |
| C | Scheduled date, `YYYY-MM-DD` |
| D | Scheduled time, 24-hour `HH:mm` |
| E | `Pending` → `Scheduled` → `Posting` → `Posted` or `Error` |
| F | Actual publication time, in the spreadsheet's time zone |
| G | Error message |
| H | Automation ID written by the application; do not edit or duplicate |

Add a new row with `Pending` in column E. Within about a minute, the app imports it and shows it on the Posts page, and the sheet changes to `Scheduled`. Edits to text, date/time, or image URL on a still-scheduled row are synced before publication. Once LinkedIn confirms publication, the app writes `Posted` and the actual time back to the sheet. Posts already published cannot be edited retroactively. An `Error` on an imported row must be corrected and then set back to `Pending`; a failed LinkedIn publication should be reviewed on LinkedIn before retrying in the app, because a timeout may follow a successful remote post.

For a safe initial check, create a text-only `Pending` row scheduled well in the future. Confirm it becomes `Scheduled` in the sheet and appears in the app. This tests ingestion without publishing. Later use a deliberate test post to verify the full publish-and-writeback cycle.

The bridge is reachable over the internet but accepts only requests containing the shared secret. Restrict editor access to the Apps Script project and rotate the secret if it is exposed. The app itself should not be exposed publicly without user authentication and authorization.
