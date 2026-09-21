# LinkedIn Automation setup

The application is multi-user. Each person signs in with LinkedIn, and their LinkedIn OAuth token, imported posts, templates, and analytics are stored under their own user ID. One user cannot select or publish through another user's LinkedIn account.

## LinkedIn sign-in

Create these environment variables locally and in Vercel:

```text
MONGODB_URI=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://linkedin-auto-vwge.vercel.app
LINKEDIN_VERSION=202601
CRON_SECRET=...
```

Use `http://localhost:3000` for `BETTER_AUTH_URL` during local development. Generate `BETTER_AUTH_SECRET` and `CRON_SECRET` as separate random values with at least 32 characters. Do not use `NEXT_PUBLIC_` for either secret.

Register these exact redirect URLs in the LinkedIn Developer Portal:

```text
http://localhost:3000/api/auth/callback/linkedin
https://linkedin-auto-vwge.vercel.app/api/auth/callback/linkedin
```

After changing Vercel environment variables, redeploy. A user clicks **Continue with LinkedIn**, authorizes the app, and returns to the dashboard. That same OAuth connection is used to publish that user's posts.

## Import CSV or Excel

On **All Posts**, click **Import CSV / Excel**. Choose a `.csv` or `.xlsx` file and a schedule time zone. The import belongs only to the signed-in user.

Use these columns:

| Column | Required | Meaning |
| --- | --- | --- |
| `Post Text` | Yes | LinkedIn post text, 1-3000 characters |
| `Image URL (optional)` | No | Public HTTPS JPEG, PNG, or GIF URL |
| `Scheduled Date` | Yes | `YYYY-MM-DD` |
| `Scheduled Time` | Yes | 24-hour `HH:mm` |
| `Status` | No | Blank or `Pending` |
| `Posted At` | No | Ignored on import |
| `Error` | No | Ignored on import |

The schedule must be in the future. The importer reads up to 100 rows from the first worksheet, accepts files up to 2 MB, reports invalid rows, and prevents duplicate imports for the same user/account/text/image/time combination. Save legacy `.xls` files as `.xlsx` first.

The previous shared live-Google-Sheet bridge is disabled because one global sheet/account setting is unsafe for a public multi-user application. File import is the supported workflow. A future live-sheet feature must connect one Google account and one sheet per signed-in user.

## Scheduled publishing on Vercel

Vercel does not keep `server.js` alive. The project exposes a protected `POST /api/cron` endpoint that runs one scheduler tick. `CRON_SECRET` protects that endpoint.

To use the included Apps Script wake-up trigger:

1. Open any private Google Sheet and choose **Extensions -> Apps Script**.
2. Copy [apps-script/Code.gs](./apps-script/Code.gs) into the project and save it.
3. In **Project Settings -> Script Properties**, set `APP_CRON_URL` to `https://linkedin-auto-vwge.vercel.app/api/cron` and `APP_CRON_SECRET` to the same `CRON_SECRET` stored in Vercel.
4. Run `wakeApplication` once and approve access. Its log should say `Application scheduler tick completed.`
5. Run `installAppWakeupTrigger` once. Confirm a time-driven `wakeApplication` trigger exists in the Triggers panel.

The trigger runs approximately once per minute. It asks the application to find due posts; it does not read spreadsheet rows or publish to LinkedIn itself. A post can therefore publish shortly after its selected minute.

Use only one production scheduler for the same database. If a request times out, verify the LinkedIn account before retrying a post because the remote publication may have succeeded before the response was lost.
