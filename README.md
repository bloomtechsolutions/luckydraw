# Supporters Lucky Draw

Staff who come to support a match scan a QR code at the venue, enter their **Staff ID, name and department**, and are entered into that match's lucky draw. Admins run the draw on a big screen with a spinning wheel.

Built with Next.js 15 (App Router), Prisma and Postgres (Prisma Postgres on Vercel), and Tailwind CSS.

## Features

- **Competitions → Matches.** Each match is its own lucky-draw event with its own registrations, prizes and winners.
- **Registration without login** at `/r/<code>`. One entry per staff ID per match, and staff IDs are normalised (` bml 1001 ` → `BML1001`).
- **Abuse protection**
  - **Registration window:** a match only accepts entries between its open and close times, and only while its status is *Open*.
  - **Rotating QR:** the venue screen (`📺 Show QR at venue`) shows a QR code that changes every 60 s. Links older than about 3 minutes are rejected, so a photo of the code shared in a group chat stops working. After a valid scan, the person has 20 minutes to submit the form.
- **Registrations list** with search, sorting and removal, and live auto-refresh while registration is open.
- **Stats:**
  - per match: department breakdown and arrival timeline
  - per competition: supporters per match, departments, and the most loyal supporters
- **Exports:**
  - Excel (Registrations and Winners sheets, plus Per-match and Supporters sheets for a whole competition)
  - CSV
- **Lucky draw wheel** (`🎡 Lucky draw`, full screen):
  - The winner is chosen on the server with `crypto.randomInt`, and the wheel animates to land on them.
  - With more than 60 entries, the wheel shows 60 random names (always including the winner). Everyone still has an equal chance.
  - Prizes have quantities, and the draw moves to the next prize automatically.
  - **Absent: re-draw** marks the winner as absent and draws again.
  - An optional setting excludes staff who already won in another match of the same competition.
  - Confetti, tick sound and a fullscreen mode.
- **Departments:** a managed dropdown list. If it's empty, staff type their department freely.
- **Printable poster** with a static QR code, for matches where rotating QR is turned off.

## Deploying on Vercel

1. Import this GitHub repo as a new Vercel project (framework: Next.js).
2. In **Storage → your Prisma Postgres database → Connect to Project**, pick the project. This adds `DATABASE_URL` and related variables.
3. In **Project → Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD`: the shared admin password
   - `AUTH_SECRET`: a long random string
   - `APP_TIMEZONE`: optional, defaults to `Indian/Maldives`
4. Deploy. The build runs `prisma migrate deploy`, so the tables are created automatically.
5. Open `/admin`, sign in, add your departments, create a competition and its matches, and add prizes.

## Match-day flow

1. Open the match in admin and click **📺 Show QR at venue** on the laptop or TV at the court.
2. Supporters scan the code, fill in the form and see a "You're in the draw!" confirmation.
3. Watch the count go up live. Registration closes automatically at the set time, or click **■ Close registration**.
4. Click **🎡 Lucky draw**, put it in fullscreen, pick a prize and press **SPIN!**.
5. Export the results to Excel.

## Local development

```bash
cp .env.example .env   # point DATABASE_URL at a local Postgres
npm install
npx prisma migrate deploy
npm run dev
```
