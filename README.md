# African Enterprise Mission Field Tool

Phone app for African Enterprise South Africa field staff. People record outreach numbers and frontline stories on the phone, including when there is no signal. When the phone is on Wi-Fi, those records upload to one shared Google Sheet. Photos and videos go to one Google Drive folder. The comms team opens that Sheet and that Drive folder. Other departments do not.

This is a website saved to the phone home screen. It is not an App Store app and it is not a Play Store app.

| | |
|---|---|
| Organisation | African Enterprise South Africa |
| Short name | AE Field App, also called Punch |
| Repo | https://github.com/galmeida-collab/FieldApp |
| Live site | https://galmeida-collab.github.io/FieldApp/ |
| Language | English, South Africa (`en-ZA`) |
| Team password | `AE2026` |
| App version | `1.5.1`, shown under the title at the top of the app |
| App cache name | `ae-field-v1.5.1` |
| Google script in this folder | `Code.gs` server v1.4 |

The copy in this folder is the working app. GitHub still has an older copy until this folder is published. The Google script that is already deployed also still has to be replaced with the `Code.gs` in this folder and published again. Until that Google step is done, phones can save records locally, and Refresh and Upload will say the office sheet refused the password.

## What each person uses

| Person | What they use | What they do not need |
|---|---|---|
| Field staff | The home-screen app and the team password | A Google account, the Sheet, or the Drive folder |
| Comms team | The same app on a phone, plus the Google Sheet and the Drive folder shared with them | Access for any other department |
| Gary | The Google account that owns the Sheet, the Drive folder, and the Apps Script | — |

There are two different locks:

1. **Team password.** One shared word, `AE2026`. The phone sends it to the Google script. It is not a Google login, not someone’s Gmail password, and not a sign-in with Google. It only tells the script that the request came from this app.
2. **Google accounts.** Gary’s Google account owns the Sheet, the Drive folder, and the script. The script runs as Gary, so a field phone can add a row without that person being allowed to open the Sheet. Comms people open the Sheet and Drive with their own Google logins because those two places are shared with them.

## How a record moves

```text
Phone screen
    Save
        IndexedDB on that phone          (works with no signal)
    Cache, then Upload on Wi-Fi
        Google Apps Script               (runs as Gary)
            outreach row  ->  Google Sheet, first tab
            story row     ->  Google Sheet, Stories tab
            photo/video   ->  Google Drive folder "AE Field App Media"
    Script replies success and the same record id
        Phone deletes its local copy
Home, Refresh
        Script counts the outreach sheet
        Phone shows this month and this year for the whole team
```

Saving never sends the record by itself. Upload is the only send. The phone deletes its copy only after the script returns `status: "success"` and the same record id. A repeat of an id the script has already stored is also treated as success, so a retry does not create a second row. If the script refuses the password, the phone is offline, or the reply is anything else, the record stays in Cache.

Home shows combined totals only: people reached and decisions for the current calendar month and the current calendar year, plus a breakdown by ministry area and strata. Full stories, notes, and files are not downloaded onto every phone. Those stay in the Sheet and Drive for comms.

## Stack

Nothing here needs Node, npm, a database server, or a build step on Gary’s computer. The site is ordinary files. GitHub Pages serves them.

| Layer | What it is | Where it lives |
|---|---|---|
| App | One HTML page, four screens, no framework | `index.html` |
| Look | Tailwind CSS v4, compiled once | `css/app.css` (about 51 KB) |
| Type | Plus Jakarta Sans, weights 400–800, Latin and Latin Extended | `fonts/*.woff2` |
| Phone install | Web app manifest, standalone, theme `#EA580C` | `manifest.webmanifest` |
| Offline shell | Service worker, cache `ae-field-v1.5.1` | `sw.js` |
| Phone records | IndexedDB, not SQLite | database `AE_Frontline_DB` |
| Phone settings | `localStorage` | passcode, script link, last totals |
| Shared numbers and stories | Google Sheet | id in `Code.gs` |
| Photos and videos | Google Drive folder | id in `Code.gs` |
| Bridge | Google Apps Script web app | `Code.gs` |
| Hosting | GitHub Pages from the `main` branch | `galmeida-collab/FieldApp` |
| Staff printout | Separate page, not part of the phone app | `Onboarding.html` |

Not used, and not needed:

- SQLite, Firebase, Supabase, or any other database
- A Google sign-in button inside the app
- React, Vue, or another JavaScript framework
- The Tailwind package or the Tailwind CDN on the phone
- Google Fonts on the phone. The font files are already in `fonts/`
- A `package.json` or `node_modules` folder

`css/app.css` already contains the styles the page uses. A new Tailwind class name typed into `index.html` will not appear unless `css/app.css` is compiled again. Change copy and layout with the classes already in that file, or with a normal `style` attribute.

`Onboarding.html` is an older printable guide. It still loads Plus Jakarta Sans from Google Fonts and it is not cached by the service worker. The phone app does not open it.

## Folder

```text
index.html                 the app
css/app.css                compiled stylesheet and font faces
fonts/                     Plus Jakarta Sans woff2 files
sw.js                      offline cache for the app shell
manifest.webmanifest       home-screen name, icon, colours
Code.gs                    paste this into Google Apps Script
Onboarding.html            printable staff guide
punch-icon.png             home-screen icon
hero.jpg                   home art
hero_frontline.jpg         Stories card art
hero_outreach.jpg          Outreach card art
hero_saflag.jpg            extra art
AESA General Name Logo 2022.png
                           brand file kept in the folder, not shown by the app
README.md                  this file
```

Weight 900 in the stylesheet points at the weight 800 font file. The font package has no separate 900 file.

## Phone screens

Bottom bar, left to right:

| Tab | Purpose |
|---|---|
| Home | Month and year totals, area breakdown, Refresh, shortcuts |
| Stories | One person’s story, theme tags, photos, videos |
| Outreach | One outreach count for a place and a date |
| Cache | Records still on this phone, and Upload |

**TV mode** is the small TV button beside Refresh on Home. It hides everything except the month and year number cards, makes them large, goes full screen where the browser allows it, and refreshes the totals every 5 minutes. Tap **Exit TV**, or press Escape, to go back. The choice is remembered on that screen, so a smart TV reopens in TV mode. The Ministry Area Breakdown keeps its heading fixed at the top while its list scrolls.

The first screen asks for the team password. Four or more characters are accepted and stored on that phone. Google still has to accept the same word. If it does not, a popup explains it in plain language and shows two boxes: **Team password** and **Office sheet link**, plus **Connect**.

### Story fields

Required: the person’s name.

Also stored: ministry date, location, reporter, theme tags, life before Christ, the gospel encounter, how they feel now, and any photos or videos.

Theme tags: Salvation, Recommitment, Healing, Digital Follow-up.

### Outreach fields

Required: location, and the AE representative’s name.

Also stored: ministry date, ministry area, venue, strata, in-person reached, digital reach, salvations, recommitments, healings, prayer, and notes.

Ministry areas:

- Proclamation Evangelism
- Leadership Development
- Youth Enablement
- Peacebuilding & Reconciliation
- Social Action & Community Upliftment

Strata groups: schools, churches, community, care and marginalised settings, training, and digital reach. The full list is the dropdown in `index.html`.

## What is stored on the phone

IndexedDB database `AE_Frontline_DB`, version 1, object store `stories`, key `id`. Both stories and outreach rows use that one store. The id is a UUID from `crypto.randomUUID()`, or a fallback string of letters, numbers, and hyphens.

`localStorage` keys:

| Key | Holds |
|---|---|
| `ae_field_passcode` | Team password typed on this phone |
| `ae_script_url` | Office sheet link, if someone pasted a new one |
| `ae_cloud_metrics` | Last totals JSON, shown again if Refresh fails |
| `punch_app_installed` | Hides the install card after it has been dismissed |

Clearing the browser site data, or deleting the home-screen app in a way that clears its site data, deletes records that have not been uploaded.

## Google Sheet

Sheet link: https://docs.google.com/spreadsheets/d/1m9pj2wZuDfjHjqi1_BGuNuYgIz3KkuTnu5tVz_MjRG8/edit?gid=1735386845#gid=1735386845

| Tab | Written by | Contents |
|---|---|---|
| Tab gid 1735386845 | outreach upload | One row per outreach record, columns A–P |
| `Stories` | story upload | One row per story. Created by `setup()` if it is missing |
| `_Received` | every successful upload | Hidden list of record ids, so the same upload is not written twice |

Outreach columns:

| Column | Field |
|---|---|
| A | Timestamp, when the script received it |
| B | Ministry date |
| C | Ministry area |
| D | Location |
| E | Venue |
| F | Strata |
| G | AE representative |
| H | Reached, in person |
| I | Salvations |
| J | Recommitments |
| K | Decision total, salvations plus recommitments |
| L | Healings |
| M | Prayer |
| N | Digital reach |
| O | Total reached, in person plus digital |
| P | Notes |

Story columns: Timestamp, Ministry Date, Person, Location, Reporter, Themes, Life Before Christ, Gospel Encounter, How They Feel Now, Media Links, Record ID.

Counts are whole numbers. Zero and anything that is not a positive number are stored as 0. Text is trimmed. A cell that would start with `=`, `+`, `-`, or `@` is prefixed with a quote so it cannot run as a formula. Story narrative is limited to 20,000 characters. Other text is limited to 5,000, and shorter fields have their own limits in `Code.gs`.

Dates are counted in the spreadsheet’s own timezone. A row with no usable date is skipped by Refresh. Only the current calendar year is included in the home totals.

## Google Drive

Folder id: `11EAdLK1Wg82pTDB5dLJJhXWWSl0QSDqN`

Folder name: `AE Field App Media`

Drive is the file cabinet for photos and videos. It is not the database. Each file is created by the script, and the Sheet stores the file link. File names look like `date_person_1_original-name`. If a story upload fails after some files were saved, the script moves those new files to the trash so a retry does not leave duplicates from the failed attempt.

Share this folder, and the Sheet, with the comms team only.

## Google Apps Script

The web app address baked into the phone app:

`https://script.google.com/macros/s/AKfycbww1r-T9L30MiiWIBD9pETj5egEdmrkxryUXX085C1YFR-GMnIepGu9p5p_I7ZtBNIh/exec`

A phone can store a different address under **Office sheet link**. That address must start with `https://script.google.com/macros/s/` and end with `/exec`.

`Code.gs` in this folder is the source to paste into the Apps Script editor. Saving the file on GitHub does not change the live Google script. Google runs the copy that was deployed inside Apps Script.

### Publish the script

1. Open the Apps Script project that belongs to this field app.
2. Replace the script with `Code.gs` from this folder.
3. Run `setup()` once from the editor and approve the permissions. That creates the Stories tab and the hidden `_Received` tab, and checks that the script can open the media folder.
4. Choose **Deploy**, then **Manage deployments**, then **Edit**, then **New version**, then **Deploy**.
5. **Execute as:** Me. **Who has access:** Anyone.
6. If Google shows a new web app address, paste that address into the phone’s **Office sheet link** and tap **Connect**. If the address did not change, leave the link as it is.
7. On a phone, enter `AE2026` and tap **Connect**.

The first password the new script accepts is saved as the script property `PASSCODE`. Every phone must use that same word after that. You can also set it yourself: **Project settings**, **Script properties**, property name `PASSCODE`, value `AE2026`.

If the deployment is brand new, the old `/exec` address stops working. The phone then needs the new address in **Office sheet link**.

### What the script accepts

`GET` with `passcode` returns JSON:

```json
{
  "status": "success",
  "totals": {
    "currentMonthName": "October",
    "currentYear": 2026,
    "monthReached": 0,
    "monthDecisions": 0,
    "yearReached": 0,
    "yearDecisions": 0
  },
  "breakdown": {}
}
```

A bad or missing password returns `{"status":"error","message":"Unauthorized"}`. The phone adds a timestamp query so the request is not served from an old cache. Totals are counted from the sheet on every Refresh. They are not cached inside Apps Script.

`POST` sends one JSON record with `Content-Type: text/plain`. Apps Script reads the body from `e.postData.contents`. The password is the current team password on the phone, including for records that were saved earlier under a different word.

Success looks like `{"status":"success","id":"<the same id>"}`. A duplicate id looks like `{"status":"success","id":"<the same id>","duplicate":true}`.

The service worker does not intercept `script.google.com` or `script.googleusercontent.com`. Upload and Refresh always go to the network.

## Put the app on a phone

1. Open https://galmeida-collab.github.io/FieldApp/ in the phone browser.
2. Add it to the home screen. On iPhone that is Share, then Add to Home Screen. On Android that is the browser menu, then Install app or Add to Home screen.
3. Open it from the icon, not from a desktop bookmark, so it runs full screen.
4. Enter the team password.
5. Save stories and outreach as usual. They stay on that phone.
6. On Wi-Fi, open **Cache** and tap **Upload**.
7. Open **Home** and tap **Refresh** to load the combined totals.

Opening `index.html` by double-clicking it does not share data and does not install the service worker. The files have to be served from a website. GitHub Pages is that website. For a local check, from this folder:

```bash
python3 -m http.server 8767
```

Then open `http://127.0.0.1:8767/`. Records saved there stay in that browser only. They are not on a field phone and they are not in the Sheet.

## Publish the website

GitHub Pages serves the `main` branch of https://github.com/galmeida-collab/FieldApp. After a push, phones pick up the new `index.html` on the next visit with a signal, because page loads are network-first. The service worker then updates its cached copy. Old cache names are deleted when the new service worker activates. Bump `CACHE_NAME` in `sw.js` when shipped files change, so phones drop the previous shell.

This computer is not yet signed into GitHub, and this folder is a download rather than a linked clone. Being a collaborator on the repo is what allows a later push. A push updates the website only. It does not deploy `Code.gs`.

## Current connection gap

Checked on 6 October 2026: the deployed script answered HTTP 200 with `{"status":"error","message":"Unauthorized"}` for password `AE2026`. The script is running. It has no matching `PASSCODE`, or the password stored there is different. The phone is behaving correctly by keeping records and showing the Connect popup.

After the script in this folder is deployed, Connect with `AE2026` is the step that finishes the link. The first accepted password becomes the team password.

## Everyday failures

| What the person sees | What it means | What to do |
|---|---|---|
| Shared totals are not available, password refused | Google received the request and rejected the word | Type the team password and tap Connect. If it is still refused, publish `Code.gs` as above |
| Office sheet link is out of date | The `/exec` address is old | Paste the new web app address and tap Connect |
| No internet | The phone kept the records | Save as usual. Upload from Cache on Wi-Fi, then Refresh |
| Records are still on this phone after Upload | Those rows were not confirmed | Nothing was deleted. Fix the password or the link, then Upload again |
| Name is missing, or location or representative is missing | The form was not saved | Fill the named field and save again |

## Security notes

The team password is inside `index.html`, because every field phone has to know it. Anyone who can read the website source can see `AE2026`. The script is deployed as **Anyone**, and it runs as the owner, so the password is the only check in front of writes. Treat the Sheet and Drive sharing list as the real privacy control: comms only.

Do not turn on “execute as the user accessing the web app”. Field staff are not supposed to have the Sheet shared with them, and that setting would ask each person to sign in with Google and would stop the current upload path.

Media is sent as base64 inside the JSON body. Very large videos can fail on a slow link or hit Apps Script size limits. The record then stays on the phone.