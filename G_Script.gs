// Spreadsheet ID ____YOUR____ID___SPREADSHEET
// Test Url https://script.google.com/macros/s/___YOUR___DEPLOY____/exec?sso=

// Funzione per ottenere nome e cognome associato al tag NFC
function getPersonInfo(code) {
  var personInfo = {
   
    "43339307000": { nome: "Legolas", cognome: "Verdifoglia" },
    "46839307000": { nome: "Bilbo", cognome: "Baggins" },
   // "___YOUR_SSO___": { nome: "___YOUR___NAME___", cognome: "____YOUR___SURNAME___" },
    /*  inserisci altri ID dei tag, nome e cognome dell'utente */
  };

  return personInfo[code] || null;  // Restituisce le informazioni sulla persona o null se il codice non è autorizzato
}

// Funzione per inviare l'email con il foglio del mese precedente come allegato
function inviaFoglioMesePrecedente() {
  var ss = SpreadsheetApp.openById('____YOUR____ID___SPREADSHEET');
  var dataOraOdierna = new Date();
  var mesePrecedente = new Date(dataOraOdierna.getFullYear(), dataOraOdierna.getMonth() - 1, 1);
  var nomeMeseAnno = Utilities.formatDate(mesePrecedente, "GMT+1", "MMMM-yyyy");
  var foglioMesePrecedente = ss.getSheetByName(nomeMeseAnno);

  if (foglioMesePrecedente) {
    // Imposta il destinatario e il corpo del messaggio
    var destinatario = 'indirizzo@email.com';  // Sostituire con l'indirizzo email desiderato
    var oggetto = 'Foglio del Mese Precedente';
    var corpoMessaggio = 'In allegato trovi il foglio del mese precedente.';

    // Converti il foglio in PDF
    var pdf = DriveApp.getFileById(ss.getId()).getAs('application/pdf');

    // Invia l'email con il PDF in allegato
    GmailApp.sendEmail(destinatario, oggetto, corpoMessaggio, { attachments: [pdf], name: 'Nome Mittente' });
  }
}

// Funzione di invio email del mese precedente (attivata ogni mese all'inizio)
function onTrigger() {
  inviaFoglioMesePrecedente();
}

// Funzione per ottenere o creare il foglio del mese corrente
function getOrCreateFoglioMese() {
  var ss = SpreadsheetApp.openById('____YOUR____ID___SPREADSHEET');
  var nomeMeseAnno = Utilities.formatDate(new Date(), "GMT+1", "MMMM-yyyy");
  var foglio = ss.getSheetByName(nomeMeseAnno);

  if (!foglio) {
    try {
      foglio = ss.insertSheet(nomeMeseAnno);

      // Aggiungi la riga di intestazione
      foglio.appendRow(["Data", "SSO", "Nome", "Cognome"]);

      // Imposta il formato del foglio
      var range = foglio.getDataRange();
      range.setNumberFormat("@");
      range.setFontWeight("bold");

      Logger.log("Foglio creato con successo e formattato.");
    } catch (error) {
      Logger.log("Errore durante la creazione del foglio: " + error);
    }
  }

  return foglio;
}

// Funzione per registrare il codice NFC e le informazioni sulla persona nello spreadsheet
function logToSpreadSheet(code, personInfo) {
  var foglio = getOrCreateFoglioMese();

  // Se il foglio esiste, registra i dati
  if (foglio) {
    foglio.appendRow([new Date(), code, personInfo.nome, personInfo.cognome]);
    Logger.log("Dati registrati con successo.");
  } else {
    Logger.log("Impossibile registrare i dati. Il foglio non è stato creato correttamente.");
  }
}

// Riceve una richiesta GET con SSO
function doGet(e) {
  if (e && e.parameter && e.parameter.sso) {
    var SSO = e.parameter.sso;

    // Ottieni le informazioni sulla persona associata al tag NFC
    var personInfo = getPersonInfo(SSO);

    // Se il tag NFC è associato a una persona, registra i dati nello spreadsheet
    if (personInfo) {
      logToSpreadSheet(SSO, personInfo);
    }

    // Invia una risposta 
    var ret = { status: 'success' };
    return ContentService.createTextOutput(JSON.stringify(ret)).setMimeType(ContentService.MimeType.JSON);
  } else {
    var ret = { status: 'error', message: 'Invalid request parameters' };
    return ContentService.createTextOutput(JSON.stringify(ret)).setMimeType(ContentService.MimeType.JSON);
  }
}

