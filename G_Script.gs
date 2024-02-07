// Spreadsheet ID ____YOUR____ID___SPREADSHEET
// Test Url https://script.google.com/macros/s/___YOUR___DEPLOY____/exec?sso=

// Function to obtain name and surname associated with the NFC tag
function getPersonInfo(code) {
  var personInfo = {
   
    "43339307000": { nome: "Legolas", cognome: "Verdifoglia" },
    "46839307000": { nome: "Bilbo", cognome: "Baggins" },
   // "___YOUR_SSO___": { nome: "___YOUR___NAME___", cognome: "____YOUR___SURNAME___" },
    /*  enter other tag IDs, user's first and last name */
  };

  return personInfo[code] || null;  // Returns the person information or null if the code is unauthorized
}

// Function to send the email with the previous month's sheet as an attachment
function sendSheetPreviousMonth() {
  var ss = SpreadsheetApp.openById('____YOUR____ID___SPREADSHEET');
  var CurrentDateTime = new Date();
  var PreviousMonth = new Date(CurrentDateTime.getFullYear(), CurrentDateTime.getMonth() - 1, 1);
  var NameMonthYear = Utilities.formatDate(PreviousMonth, "GMT+1", "MMMM-yyyy");
  var SheetPreviousMonth = ss.getSheetByName(NameMonthYear);

  if (SheetPrevoiusMonth) {
    // Set the recipient and the message body
    var recipient = 'address@email.com';  // Replace with your desired email address
    var object = 'Foglio del Mese Precedente';  // Replace with your desired email object
    var bodyMessage = 'In allegato trovi il foglio del mese precedente.';  // Replace with your desired body message 

    // Convert sheet to pdf
    var pdf = DriveApp.getFileById(ss.getId()).getAs('application/pdf');

    // Send email with attachment PDF
    GmailApp.sendEmail(recipient, object, bodyMessage, { attachments: [pdf], name: 'Sender Name' });
  }
}

// Previous month's email function 
function onTrigger() {
  sendSheetPreviousMonth();
}

// Function to get or create the sheet of the current month
function getOrCreateMonthSheet() {
  var ss = SpreadsheetApp.openById('____YOUR____ID___SPREADSHEET');
  var NameMonthYear = Utilities.formatDate(new Date(), "GMT+1", "MMMM-yyyy");
  var Sheet = ss.getSheetByName(NameMonthYear);

  if (!Sheet) {
    try {
      Sheet = ss.insertSheet(NameMonthYear);

      // Add the header line
      Sheet.appendRow(["Data", "SSO", "Nome", "Cognome"]);

      // Set the sheet format
      var range = Sheet.getDataRange();
      range.setNumberFormat("@");
      range.setFontWeight("bold");

      Logger.log("Sheet created and formatted successfully.");
    } catch (error) {
      Logger.log("Error creating the Sheet: " + error);
    }
  }

  return Sheet;
}

// Function to record NFC code and person information in the spreadsheet
function logToSpreadSheet(code, personInfo) {
  var Sheet = getOrCreateMonthSheet();

  // If the sheet exists, record the data
  if (Sheet) {
    Sheet.appendRow([new Date(), code, personInfo.nome, personInfo.cognome]);
    Logger.log("Data recorded successfully.");
  } else {
    Logger.log("Unable to record data. The sheet was not created correctly.");
  }
}

// Receives a GET request with SSO
function doGet(e) {
  if (e && e.parameter && e.parameter.sso) {
    var SSO = e.parameter.sso;

    // Get information about the person associated with the NFC tag
    var personInfo = getPersonInfo(SSO);

    // If the NFC tag is associated with a person, record the data in the spreadsheet
    if (personInfo) {
      logToSpreadSheet(SSO, personInfo);
    }

    // Send a reply
    var ret = { status: 'success' };
    return ContentService.createTextOutput(JSON.stringify(ret)).setMimeType(ContentService.MimeType.JSON);
  } else {
    var ret = { status: 'error', message: 'Invalid request parameters' };
    return ContentService.createTextOutput(JSON.stringify(ret)).setMimeType(ContentService.MimeType.JSON);
  }
}

