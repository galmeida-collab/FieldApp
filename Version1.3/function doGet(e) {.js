function doGet(e) {
  try {
    var passcode = e.parameter.passcode;
    if (passcode !== "AE2026") {
      return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Unauthorized"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    
    if (!rows || rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", 
        totals: { monthReached: 0, monthDecisions: 0, yearReached: 0, yearDecisions: 0, currentMonthName: "October", currentYear: 2026 },
        breakdown: {}
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth(); // 9 for October
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var yearReached = 0;
    var yearDecisions = 0;
    var monthReached = 0;
    var monthDecisions = 0;
    var breakdown = {};

    // Skip header row (index 0), start at index 1
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      
      var dateVal = row[1];                  // Column B: Ministry Date
      var area = row[2] || "Unspecified Area"; // Column C: Ministry Area
      var strata = row[5] || "General";        // Column F: Strata Sector
      
      var reached = Number(row[7]) || 0;      // Column H: Reached
      var salvations = Number(row[8]) || 0;   // Column I: Salvations
      var recommit = Number(row[9]) || 0;     // Column J: Recommitments
      var digital = Number(row[13]) || 0;     // Column N: Digital Reach

      var totalReach = reached + digital;
      var decisions = salvations + recommit;

      // Safe year and month extraction
      var rowYear = currentYear;
      var rowMonth = currentMonth;

      if (dateVal) {
        var parsedDate = new Date(dateVal);
        if (!isNaN(parsedDate.getTime())) {
          rowYear = parsedDate.getFullYear();
          rowMonth = parsedDate.getMonth();
        }
      }

      // Accumulate Year-to-Date for all 2026 records (includes September & October)
      if (rowYear === currentYear || rowYear === 2026) {
        yearReached += totalReach;
        yearDecisions += decisions;

        // If you want September and October both counted in the current month display block:
        if (rowMonth === currentMonth || rowMonth === 8 || rowMonth === 9) {
          monthReached += totalReach;
          monthDecisions += decisions;
        }
      }

      // Aggregate Breakdown by Ministry Area
      if (!breakdown[area]) {
        breakdown[area] = { totalReach: 0, decisions: 0, strataList: {} };
      }
      breakdown[area].totalReach += totalReach;
      breakdown[area].decisions += decisions;

      if (!breakdown[area].strataList[strata]) {
        breakdown[area].strataList[strata] = { reach: 0, decisions: 0 };
      }
      breakdown[area].strataList[strata].strataList = breakdown[area].strataList[strata] || { reach: 0, decisions: 0 };
      breakdown[area].strataList[strata].reach += totalReach;
      breakdown[area].strataList[strata].decisions += decisions;
    }

    var result = {
      status: "success",
      totals: {
        currentMonthName: monthNames[currentMonth],
        currentYear: currentYear,
        monthReached: monthReached,
        monthDecisions: monthDecisions,
        yearReached: yearReached,
        yearDecisions: yearDecisions
      },
      breakdown: breakdown
    };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}