# Google Sheet → application → LinkedIn

The Google Sheet is the input and status display. The application reads it about once per minute through a small Apps Script bridge, stores posts in MongoDB, publishes them through the application's existing LinkedIn connection at their scheduled time, then writes the outcome back to the sheet. **Apps Script does not publish to LinkedIn. No Google service account is required.**

## One-time setup

1. In the spreadsheet, open **Extensions → Apps Script**. Replace the entire `Code.gs` there with [apps-script/Code.gs](./apps-script/Code.gs) and save. Do not keep the old direct-publishing functions in a second `.gs` file.
2. Select `removeMinuteTrigger` and run it once. This removes old Apps Script `checkDuePosts` or `checkAndPostScheduled` timers. Check the Triggers panel to ensure neither remains. The application has its own one-minute scheduler.
3. Generate a random shared secret locally: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. In Apps Script **Project Settings → Script Properties**, create `SHEET_BRIDGE_SECRET` with that value. Keep it private.
4. Deploy the Apps Script as a **Web app**, **Execute as: Me**, **Who has access: Anyone**. If you already deployed it, use **Deploy → Manage deployments → Edit → New version** so the `/exec` URL stays the same. Copy the `/exec` URL.
5. In the application's `.env.local`, set `GOOGLE_APPS_SCRIPT_URL` to that `/exec` URL and `GOOGLE_APPS_SCRIPT_SECRET` to the same random secret. If more than one LinkedIn account is connected to the app, also set `GOOGLE_SHEET_ACCOUNT_ID` to the intended app account ID. Never put these values in a sheet cell or commit them.
6. Make sure the LinkedIn account is connected **inside the application** using its existing `/api/auth` flow. The old LinkedIn OAuth properties in Apps Script are not used. The application's `LINKEDIN_REDIRECT_URI` must point to its own `/api/auth/callback`, not the Apps Script `/exec` URL.
7. For local development, start the application with `npm.cmd run dev` (or `npm run dev` on shells where `npm` works). For Vercel, complete the wake-up setup below; Vercel does not run `server.js` continuously.

## Vercel scheduled publishing (including Hobby/free)

1. Set the application's production environment variables in **Vercel → Project → Settings → Environment Variables**, including MongoDB, LinkedIn, and Apps Script bridge settings. Generate a separate random `CRON_SECRET` of at least 16 characters with the command in step 3 above. Set it in Vercel and redeploy.
2. Replace the bound Apps Script `Code.gs` with the current [apps-script/Code.gs](./apps-script/Code.gs) and save. In **Apps Script → Project Settings → Script Properties**, set `APP_CRON_URL` to `https://linkedin-auto-vwge.vercel.app/api/cron` (or your actual production domain plus `/api/cron`) and `APP_CRON_SECRET` to the same value as Vercel's `CRON_SECRET`.
3. Select `wakeApplication` in the Apps Script function menu and run it once. Approve access. The execution log should say `Application scheduler tick completed.` A 401 means the secrets differ; a 503 means Vercel lacks `CRON_SECRET`.
4. Run `installAppWakeupTrigger` once. Verify that a time-driven `wakeApplication` trigger appears under **Triggers**. This wakes the Vercel function about once per minute. Apps Script does not publish to LinkedIn itself.

Do not also run a second scheduler against the same production database and sheet. Vercel Hobby functions have a 60-second maximum; if an import or publish takes too long, check Apps Script Executions and Vercel Function Logs. Before retrying a post stuck in `PROCESSING`, confirm on LinkedIn that it was not already published.

## Manual fetch from All Posts

Set `SHEET_SYNC_ADMIN_KEY` in the deployed application's server environment to a separate random 32+ character value (generate one with the command in step 3). Redeploy or restart the application. On **All Posts**, click **Fetch from Sheet** and enter that key. This imports new `Pending` rows immediately and refreshes the list; it does **not** publish them immediately. Do not put the key in a `NEXT_PUBLIC_` variable, a sheet cell, or source control.

## Import a CSV or Excel file

On **All Posts**, click **Import CSV / Excel**. Select the connected LinkedIn account, a `.csv` or `.xlsx` file, the schedule time zone (for example `Asia/Kolkata`), and the same `SHEET_SYNC_ADMIN_KEY` used for manual sheet sync. Save older `.xls` files as `.xlsx` first. The file should use the sheet's headers: `Post Text`, optional `Image URL (optional)`, `Scheduled Date`, `Scheduled Time`, and optional `Status`. The date must be `YYYY-MM-DD`, the time `HH:mm`, and the time must be in the future. Blank status is treated as Pending. `Posted At` and `Error` are ignored; rows with a non-Pending status, a Posted At value, or an existing Automation ID are skipped. The importer schedules up to 100 rows from the first worksheet (2 MB file limit), reports row errors, and avoids importing the same account/text/image/time combination twice.

This is a separate input path: imported file rows are stored in the application but are **not** written back to the Google Sheet. Scheduled publishing still needs the local worker or Vercel wake-up trigger above.

Connecting LinkedIn only saves the account. It does not automatically import sheet rows. Locally, `npm start` runs the scheduler; on Vercel, the Apps Script `wakeApplication` trigger calls the protected scheduler endpoint. The manual button alone will not publish posts at their due time.

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
