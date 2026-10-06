/**
 * AE Punch Field App - Code.gs  (server v1.4)
 *
 * Handles:  doPost  = receive stories + outreach from the app
 *           doGet   = live dashboard totals
 *
 * ONE-TIME SETUP:
 *   1. Run setup() once from the editor and approve the permissions
 *   2. Deploy > Manage deployments > Edit > New version > Deploy
 *      (Execute as: Me, Who has access: Anyone)
 *   The first password the app sends is saved as PASSCODE.
 *   After that, every phone must send that same password.
 *   You can still set it yourself: Project Settings > Script properties > PASSCODE.
 */

const CFG = {
  SPREADSHEET_ID: '1m9pj2wZuDfjHjqi1_BGuNuYgIz3KkuTnu5tVz_MjRG8',
  OUTREACH_GID: 0,                       // the first tab (gid=0) holds outreach rows A-P
  STORIES_TAB: 'Stories',
  LOG_TAB: '_Received',                  // hidden tab used to ignore duplicate uploads
  MEDIA_FOLDER_ID: '11EAdLK1Wg82pTDB5dLJJhXWWSl0QSDqN',   // your existing Drive folder for photos and videos
  MEDIA_FOLDER_NAME: 'AE Field App Media',                 // only used if the folder above cannot be opened
  MAX_TEXT: 5000,
  MAX_STORY_TEXT: 20000
};

// 0-based column positions on the outreach tab (A=0 ... P=15)
const COL = { DATE: 1, AREA: 2, STRATA: 5, REACHED: 7, SALV: 8, RECOM: 9, DIGITAL: 13 };

const STORY_HEADERS = ['Timestamp', 'Ministry Date', 'Person', 'Location', 'Reporter',
  'Themes', 'Life Before Christ', 'Gospel Encounter', 'How They Feel Now', 'Media Links', 'Record ID'];

/* ----------------------------- helpers ----------------------------- */

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SpreadsheetApp.openById(CFG.SPREADSHEET_ID); }

function outreachSheet_() {
  const found = ss_().getSheets().filter(function (s) { return s.getSheetId() === CFG.OUTREACH_GID; })[0];
  if (!found) throw new Error('Outreach tab (gid ' + CFG.OUTREACH_GID + ') not found');
  return found;
}

function passcodeOk_(p) {
  var props = PropertiesService.getScriptProperties();
  var real = props.getProperty('PASSCODE');
  var given = String(p || '').trim();
  if (real) return given === real;
  if (given.length < 4 || given.length > 80) return false;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    real = props.getProperty('PASSCODE');
    if (real) return given === real;
    props.setProperty('PASSCODE', given);
    return true;
  } finally {
    lock.releaseLock();
  }
}

// Text safe for a sheet cell: trims, limits length, blocks formula injection
function clean_(v, max) {
  var s = String(v === null || v === undefined ? '' : v).trim().slice(0, max || CFG.MAX_TEXT);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function num_(v) {
  var n = Math.floor(Number(v));
  return isFinite(n) && n > 0 ? Math.min(n, 1000000) : 0;
}

function parseDate_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

function safeName_(s) {
  return String(s).replace(/[^\w.\- ]+/g, '_').slice(0, 120);
}

function getOrCreateSheet_(name, headers) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function logSheet_() {
  var sh = getOrCreateSheet_(CFG.LOG_TAB, ['Record ID', 'Type', 'Received']);
  if (!sh.isSheetHidden()) sh.hideSheet();
  return sh;
}

function logHas_(id) {
  var sh = logSheet_();
  if (sh.getLastRow() < 2) return false;
  return sh.getRange('A:A').createTextFinder(id).matchEntireCell(true).findNext() !== null;
}

function logAdd_(id, type) {
  var sh = logSheet_();
  sh.getRange(sh.getLastRow() + 1, 1, 1, 3).setValues([[id, type, new Date()]]);
}

function mediaFolder_() {
  // Preferred: the folder you nominated. Fails loudly if the script owner cannot access it,
  // so media is never silently saved somewhere unexpected.
  if (CFG.MEDIA_FOLDER_ID) return DriveApp.getFolderById(CFG.MEDIA_FOLDER_ID);

  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperty('MEDIA_FOLDER_ID');
  if (saved) { try { return DriveApp.getFolderById(saved); } catch (e) { /* recreate below */ } }
  var it = DriveApp.getFoldersByName(CFG.MEDIA_FOLDER_NAME);
  var f = it.hasNext() ? it.next() : DriveApp.createFolder(CFG.MEDIA_FOLDER_NAME);
  props.setProperty('MEDIA_FOLDER_ID', f.getId());
  return f;
}

/* ------------------------------ setup ------------------------------ */

// Run once from the editor. Creates the Stories tab and the hidden log tab, and checks the media folder.
function setup() {
  getOrCreateSheet_(CFG.STORIES_TAB, STORY_HEADERS);
  logSheet_();
  var f = mediaFolder_();
  Logger.log('Media folder OK: ' + f.getName() + ' - ' + f.getUrl());
  Logger.log('PASSCODE set: ' + (!!PropertiesService.getScriptProperties().getProperty('PASSCODE')));
}

/* ------------------------------ doPost ----------------------------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  var savedFiles = [];
  try {
    if (!e || !e.postData || !e.postData.contents) return json_({ status: 'error', message: 'Empty request' });
    var d = JSON.parse(e.postData.contents);

    if (!passcodeOk_(d.passcode)) return json_({ status: 'error', message: 'Unauthorized' });

    var id = String(d.id === undefined ? '' : d.id).trim().slice(0, 80);
    if (!/^[\w\-]+$/.test(id)) return json_({ status: 'error', message: 'Missing or invalid record id' });
    if (d.entryType !== 'story' && d.entryType !== 'outreach') {
      return json_({ status: 'error', message: 'Unknown entry type' });
    }

    lock.waitLock(30000);

    if (logHas_(id)) return json_({ status: 'success', id: id, duplicate: true });

    if (d.entryType === 'outreach') saveOutreach_(d);
    else saveStory_(d, id, savedFiles);

    logAdd_(id, d.entryType);
    return json_({ status: 'success', id: id });

  } catch (err) {
    // roll back any media saved during this failed attempt so a retry does not duplicate files
    savedFiles.forEach(function (f) { try { f.setTrashed(true); } catch (x) { /* ignore */ } });
    return json_({ status: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* not held */ }
  }
}

function saveOutreach_(d) {
  var reached = num_(d.reached), digital = num_(d.digitalReach);
  var salv = num_(d.salvations), recom = num_(d.recommitments);
  var sh = outreachSheet_();
  var r = sh.getLastRow() + 1;
  // A..P: Timestamp, Date, Area, Location, Venue, Strata, Rep, Reached, Salvations,
  //       Recommitments, Decision Total, Healings, Prayer, Digital, Total Reached, Notes
  sh.getRange(r, 1, 1, 16).setValues([[
    new Date(), parseDate_(d.ministryDate),
    clean_(d.pillar, 120), clean_(d.location, 200), clean_(d.venue, 200),
    clean_(d.strata, 150), clean_(d.representative, 150),
    reached, salv, recom, salv + recom,
    num_(d.healings), num_(d.prayer), digital, reached + digital,
    clean_(d.notes)
  ]]);
  sh.getRange(r, 2).setNumberFormat('yyyy-mm-dd');
}

function saveStory_(d, id, savedFiles) {
  var sh = getOrCreateSheet_(CFG.STORIES_TAB, STORY_HEADERS);
  var media = Array.isArray(d.media) ? d.media : [];
  var links = [];

  media.forEach(function (m, i) {
    var mt = /^data:([^;,]+)[^,]*;base64,([\s\S]*)$/.exec(String((m && m.data) || ''));
    if (!mt) throw new Error('Unreadable media file: ' + clean_(m && m.name, 80));
    var name = safeName_(String(d.ministryDate || '') + '_' + String(d.person || '') + '_' + (i + 1) + '_' + String((m && m.name) || 'file'));
    var blob = Utilities.newBlob(Utilities.base64Decode(mt[2]), mt[1], name);
    var file = mediaFolder_().createFile(blob);
    savedFiles.push(file);
    links.push(file.getUrl());
  });

  var tags = (Array.isArray(d.tags) ? d.tags : []).map(function (t) { return clean_(t, 60); }).join(', ');
  var r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, STORY_HEADERS.length).setValues([[
    new Date(), parseDate_(d.ministryDate),
    clean_(d.person, 200), clean_(d.location, 200), clean_(d.reporter, 150), tags,
    clean_(d.beforeLife, CFG.MAX_STORY_TEXT), clean_(d.whatHappened, CFG.MAX_STORY_TEXT),
    clean_(d.nowFeelings, CFG.MAX_STORY_TEXT), links.join('\n'), id
  ]]);
  sh.getRange(r, 2).setNumberFormat('yyyy-mm-dd');
}

/* ------------------------------ doGet ------------------------------ */

function doGet(e) {
  try {
    if (!e || !e.parameter || !passcodeOk_(e.parameter.passcode)) {
      return json_({ status: 'error', message: 'Unauthorized' });
    }
    var ss = ss_();
    var rows = outreachSheet_().getDataRange().getValues();
    var tz = ss.getSpreadsheetTimeZone();
    var part = function (d, f) { return Number(Utilities.formatDate(d, tz, f)); };
    var now = new Date();
    var curYear = part(now, 'yyyy'), curMonth = part(now, 'M') - 1;
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];

    var yR = 0, yD = 0, mR = 0, mD = 0;
    var breakdown = {};

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var d = r[COL.DATE] instanceof Date ? r[COL.DATE] : new Date(r[COL.DATE]);
      if (isNaN(d.getTime())) continue;            // skip undated rows rather than guess
      if (part(d, 'yyyy') !== curYear) continue;   // current year only

      var reach = (Number(r[COL.REACHED]) || 0) + (Number(r[COL.DIGITAL]) || 0);
      var dec = (Number(r[COL.SALV]) || 0) + (Number(r[COL.RECOM]) || 0);
      yR += reach; yD += dec;
      if (part(d, 'M') - 1 === curMonth) { mR += reach; mD += dec; }

      var area = r[COL.AREA] || 'Unspecified Area';
      var strata = r[COL.STRATA] || 'General';
      if (!breakdown[area]) breakdown[area] = { totalReach: 0, decisions: 0, strataList: {} };
      var a = breakdown[area];
      a.totalReach += reach; a.decisions += dec;
      if (!a.strataList[strata]) a.strataList[strata] = { reach: 0, decisions: 0 };
      a.strataList[strata].reach += reach;
      a.strataList[strata].decisions += dec;
    }

    var out = JSON.stringify({
      status: 'success',
      totals: { currentMonthName: monthNames[curMonth], currentYear: curYear,
        monthReached: mR, monthDecisions: mD, yearReached: yR, yearDecisions: yD },
      breakdown: breakdown
    });
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  }
}
