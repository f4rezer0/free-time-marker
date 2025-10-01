// ============================================================================
// FREE TIME MARKER - Google Apps Script v2.0
// ============================================================================
// CONFIGURAZIONE: Inserisci il tuo Spreadsheet ID
const SPREADSHEET_ID = '____YOUR____ID___SPREADSHEET';

// Nome dei fogli
const SHEETS = {
  DIPENDENTI: 'Dipendenti',
  TIMBRATURE: 'Timbrature',
  TURNI: 'Turni',
  CONFIG: 'Config',
  USERS: 'Users'
};

// Cache per performance (5 minuti)
const cache = CacheService.getScriptCache();
const CACHE_DURATION = 300; // secondi

// ============================================================================
// ENDPOINT PRINCIPALE - RETROCOMPATIBILE CON WEMOS
// ============================================================================
function doGet(e) {
  // Se arriva parametro 'sso' dal WeMos -> gestisci timbratura (VELOCE)
  if (e && e.parameter && e.parameter.sso) {
    return handleTimbratura(e.parameter.sso);
  }

  // Altrimenti servi la Web App
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Free Time Marker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================================
// GESTIONE TIMBRATURA (OTTIMIZZATA PER VELOCITÀ)
// ============================================================================
function handleTimbratura(sso) {
  try {
    // 1. Cerca dipendente in cache prima
    let personInfo = getCachedEmployee(sso);

    // 2. Se non in cache, cerca in foglio
    if (!personInfo) {
      personInfo = getPersonInfo(sso);

      // Se non trovato, ritorna errore immediato
      if (!personInfo) {
        return ContentService.createTextOutput(
          JSON.stringify({status: 'error', message: 'Tag non autorizzato'})
        ).setMimeType(ContentService.MimeType.JSON);
      }

      // Salva in cache per prossime chiamate
      cache.put('emp_' + sso, JSON.stringify(personInfo), CACHE_DURATION);
    }

    // 3. Registra timbratura in modo ASINCRONO (non blocca risposta)
    logTimbratura(sso, personInfo);

    // 4. Ritorna successo IMMEDIATAMENTE
    return ContentService.createTextOutput(
      JSON.stringify({status: 'success'})
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Errore timbratura: ' + error);
    return ContentService.createTextOutput(
      JSON.stringify({status: 'error', message: error.toString()})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// FUNZIONI DATABASE - DIPENDENTI
// ============================================================================
function getPersonInfo(nfcTag) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.DIPENDENTI);

    if (!sheet) {
      throw new Error('Foglio Dipendenti non trovato');
    }

    const data = sheet.getDataRange().getValues();

    // Cerca dalla riga 2 (salta header)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == nfcTag && data[i][5] === true) { // Colonna A=tag, F=attivo
        return {
          nfcTag: data[i][0],
          nome: data[i][1],
          cognome: data[i][2],
          email: data[i][3],
          reparto: data[i][4]
        };
      }
    }

    return null;
  } catch (error) {
    Logger.log('Errore getPersonInfo: ' + error);
    return null;
  }
}

function getCachedEmployee(nfcTag) {
  const cached = cache.get('emp_' + nfcTag);
  return cached ? JSON.parse(cached) : null;
}

// ============================================================================
// REGISTRAZIONE TIMBRATURA
// ============================================================================
function logTimbratura(nfcTag, personInfo) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date();

  // 1. Registra in foglio "Timbrature" (storico completo)
  const sheetTimbrature = ss.getSheetByName(SHEETS.TIMBRATURE);
  if (sheetTimbrature) {
    sheetTimbrature.appendRow([
      now,                        // Timestamp
      nfcTag,                     // NFC_Tag
      personInfo.nome,            // Nome
      personInfo.cognome,         // Cognome
      now.getFullYear(),          // Anno
      now.getMonth() + 1,         // Mese
      now.getDate()               // Giorno
    ]);
  }

  // 2. Registra in foglio mensile (retrocompatibilità)
  const sheetMensile = getOrCreateMonthSheet(ss);
  if (sheetMensile) {
    sheetMensile.appendRow([
      now,
      nfcTag,
      personInfo.nome,
      personInfo.cognome
    ]);
  }
}

// ============================================================================
// CREAZIONE FOGLIO MENSILE (RETROCOMPATIBILE)
// ============================================================================
function getOrCreateMonthSheet(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const monthName = Utilities.formatDate(new Date(), "GMT+1", "MMMM-yyyy");
  let sheet = ss.getSheetByName(monthName);

  if (!sheet) {
    try {
      sheet = ss.insertSheet(monthName);
      sheet.appendRow(["Data", "SSO", "Nome", "Cognome"]);

      const range = sheet.getRange(1, 1, 1, 4);
      range.setFontWeight("bold");
      range.setBackground("#4285f4");
      range.setFontColor("#ffffff");

      Logger.log("Foglio mensile creato: " + monthName);
    } catch (error) {
      Logger.log("Errore creazione foglio mensile: " + error);
    }
  }

  return sheet;
}

// ============================================================================
// API PER WEB APP - AUTENTICAZIONE
// ============================================================================
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    switch(action) {
      case 'login':
        return handleLogin(params);
      case 'getDipendenti':
        return getDipendenti(params);
      case 'addDipendente':
        return addDipendente(params);
      case 'updateDipendente':
        return updateDipendente(params);
      case 'deleteDipendente':
        return deleteDipendente(params);
      case 'getTimbrature':
        return getTimbrature(params);
      case 'getTurni':
        return getTurni(params);
      case 'saveTurno':
        return saveTurno(params);
      case 'deleteTurno':
        return deleteTurno(params);
      case 'getStatistiche':
        return getStatistiche(params);
      case 'exportData':
        return exportData(params);
      default:
        return jsonResponse({error: 'Azione non riconosciuta'});
    }
  } catch (error) {
    Logger.log('Errore doPost: ' + error);
    return jsonResponse({error: error.toString()});
  }
}

// ============================================================================
// LOGIN
// ============================================================================
function handleLogin(params) {
  const username = params.username;
  const password = params.password;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.USERS);

  if (!sheet) {
    return jsonResponse({success: false, message: 'Foglio Users non trovato'});
  }

  const data = sheet.getDataRange().getValues();
  const passwordHash = hashPassword(password);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === passwordHash) {
      // Aggiorna ultimo accesso
      sheet.getRange(i + 1, 5).setValue(new Date());

      return jsonResponse({
        success: true,
        user: {
          username: data[i][0],
          ruolo: data[i][2],
          email: data[i][3]
        }
      });
    }
  }

  return jsonResponse({success: false, message: 'Credenziali non valide'});
}

function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
    .map(function(byte) {
      const v = (byte < 0) ? 256 + byte : byte;
      return ("0" + v.toString(16)).slice(-2);
    })
    .join('');
}

// ============================================================================
// CRUD DIPENDENTI
// ============================================================================
function getDipendenti(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.DIPENDENTI);

  if (!sheet) {
    return jsonResponse({error: 'Foglio non trovato'});
  }

  const data = sheet.getDataRange().getValues();
  const dipendenti = [];

  for (let i = 1; i < data.length; i++) {
    dipendenti.push({
      nfcTag: data[i][0],
      nome: data[i][1],
      cognome: data[i][2],
      email: data[i][3],
      reparto: data[i][4],
      attivo: data[i][5],
      dataInserimento: data[i][6]
    });
  }

  return jsonResponse({success: true, dipendenti: dipendenti});
}

function addDipendente(params) {
  if (params.ruolo !== 'admin') {
    return jsonResponse({success: false, message: 'Permessi insufficienti'});
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.DIPENDENTI);

  if (!sheet) {
    return jsonResponse({error: 'Foglio non trovato'});
  }

  const dip = params.dipendente;

  // Verifica che il tag non esista già
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dip.nfcTag) {
      return jsonResponse({success: false, message: 'Tag NFC già esistente'});
    }
  }

  sheet.appendRow([
    dip.nfcTag,
    dip.nome,
    dip.cognome,
    dip.email,
    dip.reparto,
    true,
    new Date()
  ]);

  // Invalida cache
  cache.remove('emp_' + dip.nfcTag);

  return jsonResponse({success: true, message: 'Dipendente aggiunto'});
}

function updateDipendente(params) {
  if (params.ruolo !== 'admin') {
    return jsonResponse({success: false, message: 'Permessi insufficienti'});
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.DIPENDENTI);
  const dip = params.dipendente;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dip.nfcTag) {
      sheet.getRange(i + 1, 2).setValue(dip.nome);
      sheet.getRange(i + 1, 3).setValue(dip.cognome);
      sheet.getRange(i + 1, 4).setValue(dip.email);
      sheet.getRange(i + 1, 5).setValue(dip.reparto);
      sheet.getRange(i + 1, 6).setValue(dip.attivo);

      // Invalida cache
      cache.remove('emp_' + dip.nfcTag);

      return jsonResponse({success: true, message: 'Dipendente aggiornato'});
    }
  }

  return jsonResponse({success: false, message: 'Dipendente non trovato'});
}

function deleteDipendente(params) {
  if (params.ruolo !== 'admin') {
    return jsonResponse({success: false, message: 'Permessi insufficienti'});
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.DIPENDENTI);
  const nfcTag = params.nfcTag;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === nfcTag) {
      // Soft delete: imposta attivo = false
      sheet.getRange(i + 1, 6).setValue(false);

      // Invalida cache
      cache.remove('emp_' + nfcTag);

      return jsonResponse({success: true, message: 'Dipendente disattivato'});
    }
  }

  return jsonResponse({success: false, message: 'Dipendente non trovato'});
}

// ============================================================================
// TIMBRATURE
// ============================================================================
function getTimbrature(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.TIMBRATURE);

  if (!sheet) {
    return jsonResponse({error: 'Foglio non trovato'});
  }

  const data = sheet.getDataRange().getValues();
  const timbrature = [];

  // Filtri opzionali
  const filtroAnno = params.anno;
  const filtroMese = params.mese;
  const filtroTag = params.nfcTag;

  for (let i = 1; i < data.length; i++) {
    // Applica filtri
    if (filtroAnno && data[i][4] != filtroAnno) continue;
    if (filtroMese && data[i][5] != filtroMese) continue;
    if (filtroTag && data[i][1] != filtroTag) continue;

    timbrature.push({
      timestamp: data[i][0],
      nfcTag: data[i][1],
      nome: data[i][2],
      cognome: data[i][3],
      anno: data[i][4],
      mese: data[i][5],
      giorno: data[i][6]
    });
  }

  return jsonResponse({success: true, timbrature: timbrature});
}

// ============================================================================
// TURNI
// ============================================================================
function getTurni(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.TURNI);

  if (!sheet) {
    return jsonResponse({error: 'Foglio non trovato'});
  }

  const data = sheet.getDataRange().getValues();
  const turni = [];

  for (let i = 1; i < data.length; i++) {
    turni.push({
      id: data[i][0],
      nfcTag: data[i][1],
      nome: data[i][2],
      cognome: data[i][3],
      giornoSettimana: data[i][4],
      oraInizio: data[i][5],
      oraFine: data[i][6]
    });
  }

  return jsonResponse({success: true, turni: turni});
}

function saveTurno(params) {
  if (params.ruolo !== 'admin') {
    return jsonResponse({success: false, message: 'Permessi insufficienti'});
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.TURNI);
  const turno = params.turno;

  if (turno.id) {
    // Update
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == turno.id) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[
          turno.nfcTag,
          turno.nome,
          turno.cognome,
          turno.giornoSettimana,
          turno.oraInizio,
          turno.oraFine
        ]]);
        return jsonResponse({success: true, message: 'Turno aggiornato'});
      }
    }
  } else {
    // Insert
    const newId = sheet.getLastRow();
    sheet.appendRow([
      newId,
      turno.nfcTag,
      turno.nome,
      turno.cognome,
      turno.giornoSettimana,
      turno.oraInizio,
      turno.oraFine
    ]);
    return jsonResponse({success: true, message: 'Turno creato'});
  }

  return jsonResponse({success: false, message: 'Errore salvataggio turno'});
}

function deleteTurno(params) {
  if (params.ruolo !== 'admin') {
    return jsonResponse({success: false, message: 'Permessi insufficienti'});
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.TURNI);
  const id = params.id;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({success: true, message: 'Turno eliminato'});
    }
  }

  return jsonResponse({success: false, message: 'Turno non trovato'});
}

// ============================================================================
// STATISTICHE
// ============================================================================
function getStatistiche(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.TIMBRATURE);

  if (!sheet) {
    return jsonResponse({error: 'Foglio non trovato'});
  }

  const data = sheet.getDataRange().getValues();
  const stats = {
    totaleTimbrature: data.length - 1,
    timbratureOggi: 0,
    timbratureMese: 0,
    dipendentiAttivi: 0
  };

  const oggi = new Date();
  const annoCorrente = oggi.getFullYear();
  const meseCorrente = oggi.getMonth() + 1;
  const giornoCorrente = oggi.getDate();

  for (let i = 1; i < data.length; i++) {
    if (data[i][4] == annoCorrente && data[i][5] == meseCorrente) {
      stats.timbratureMese++;

      if (data[i][6] == giornoCorrente) {
        stats.timbratureOggi++;
      }
    }
  }

  // Conta dipendenti attivi
  const sheetDip = ss.getSheetByName(SHEETS.DIPENDENTI);
  if (sheetDip) {
    const dataDip = sheetDip.getDataRange().getValues();
    for (let i = 1; i < dataDip.length; i++) {
      if (dataDip[i][5] === true) {
        stats.dipendentiAttivi++;
      }
    }
  }

  return jsonResponse({success: true, stats: stats});
}

// ============================================================================
// UTILITY
// ============================================================================
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================================
// FUNZIONI MANUTENZIONE
// ============================================================================

// Da eseguire manualmente per inviare email del mese precedente
function sendSheetPreviousMonth() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const previousMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const monthName = Utilities.formatDate(previousMonth, "GMT+1", "MMMM-yyyy");
  const sheet = ss.getSheetByName(monthName);

  if (sheet) {
    const sheetConfig = ss.getSheetByName(SHEETS.CONFIG);
    let emailAdmin = 'admin@azienda.it';

    if (sheetConfig) {
      const configData = sheetConfig.getDataRange().getValues();
      for (let i = 1; i < configData.length; i++) {
        if (configData[i][0] === 'AdminEmail') {
          emailAdmin = configData[i][1];
          break;
        }
      }
    }

    const pdf = DriveApp.getFileById(ss.getId()).getAs('application/pdf');
    GmailApp.sendEmail(
      emailAdmin,
      'Foglio Presenze - ' + monthName,
      'In allegato il foglio presenze del mese precedente.',
      { attachments: [pdf], name: 'Free Time Marker' }
    );

    Logger.log('Email inviata a: ' + emailAdmin);
  }
}

// Trigger mensile automatico (da configurare in Apps Script)
function onMonthlyTrigger() {
  sendSheetPreviousMonth();
}
