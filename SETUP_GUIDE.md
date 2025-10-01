# Guida Setup - Free Time Marker v2.0

## 🎯 Obiettivo
Migrare il sistema di timbrature dall'attuale Google Apps Script a una versione moderna con interfaccia web, mantenendo la **retrocompatibilità totale** con il WeMos D1 in produzione.

---

## 📋 Prerequisiti

- Account Google
- Un Google Spreadsheet (puoi usare quello esistente o crearne uno nuovo)
- Il WeMos D1 già configurato e funzionante

---

## 🚀 Installazione Passo-Passo

### **STEP 1: Preparare il Google Spreadsheet**

1. Apri il tuo Google Spreadsheet esistente (o creane uno nuovo)
2. Copia l'**ID del Spreadsheet** dalla URL:
   ```
   https://docs.google.com/spreadsheets/d/[QUESTO-È-L-ID]/edit
   ```

3. Crea i seguenti fogli (Sheet) nel documento:

#### **Foglio "Dipendenti"**
- Colonne: `NFC_Tag | Nome | Cognome | Email | Reparto | Attivo | DataInserimento`
- Inserisci i dipendenti esistenti dalla lista in `G_Script.gs`:

  ```
  NFC_Tag       | Nome    | Cognome      | Email                  | Reparto | Attivo | DataInserimento
  --------------|---------|--------------|------------------------|---------|--------|----------------
  43339307000   | Legolas | Verdifoglia  | legolas@azienda.it     | IT      | TRUE   | 2025-01-01
  46839307000   | Bilbo   | Baggins      | bilbo@azienda.it       | Admin   | TRUE   | 2025-01-01
  ```

#### **Foglio "Timbrature"**
- Colonne: `Timestamp | NFC_Tag | Nome | Cognome | Anno | Mese | Giorno`
- Lascia vuoto (verrà popolato automaticamente)

#### **Foglio "Turni"**
- Colonne: `ID | NFC_Tag | Nome | Cognome | GiornoSettimana | OraInizio | OraFine`
- Lascia vuoto o aggiungi turni esistenti

#### **Foglio "Config"**
- Colonne: `Chiave | Valore`
- Inserisci:
  ```
  Chiave            | Valore
  ------------------|---------------------------
  AdminEmail        | admin@tuaazienda.com
  NomeAzienda       | NOME-TUA-AZIENDA
  EmailNotifiche    | TRUE
  FusoOrario        | Europe/Rome
  ```

#### **Foglio "Users"**
- Colonne: `Username | PasswordHash | Ruolo | Email | UltimoAccesso`
- Inserisci utenti per login:
  ```
  Username | PasswordHash                                                      | Ruolo  | Email               | UltimoAccesso
  ---------|-------------------------------------------------------------------|--------|---------------------|---------------
  admin    | 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918  | admin  | admin@azienda.it    |
  viewer   | 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8  | viewer | viewer@azienda.it   |
  ```

  **Password di default:**
  - `admin` → password: `admin`
  - `viewer` → password: `password`

  ⚠️ **IMPORTANTE**: Cambia queste password dopo il primo accesso! Puoi generare nuovi hash con:
  ```javascript
  // Esegui in Apps Script Editor > Esecuzione
  function generatePasswordHash() {
    var password = "nuova_password";
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
      .map(function(byte) {
        var v = (byte < 0) ? 256 + byte : byte;
        return ("0" + v.toString(16)).slice(-2);
      })
      .join('');
    Logger.log(hash);
  }
  ```

---

### **STEP 2: Caricare Google Apps Script**

1. Nel tuo Google Spreadsheet, vai su **Estensioni > Apps Script**
2. Cancella il codice di default
3. Copia il contenuto di `G_Script_v2.gs` nell'editor
4. **IMPORTANTE**: Sostituisci `____YOUR____ID___SPREADSHEET` con il tuo Spreadsheet ID (riga 5)
5. Salva il progetto (Ctrl+S) con nome "Free Time Marker v2"

---

### **STEP 3: Caricare i File HTML**

Nel Apps Script Editor:

1. Clicca sul **+** accanto a "File" → **HTML**
2. Crea i seguenti file (copia-incolla il contenuto dai rispettivi file):

   - `Index.html` → Copia contenuto da `Index.html`
   - `Stylesheet.html` → Copia contenuto da `Stylesheet.html`
   - `Admin.html` → Copia contenuto da `Admin.html`
   - `Viewer.html` → Copia contenuto da `Viewer.html`

3. In `Admin.html`, cerca e sostituisci `____YOUR____ID___SPREADSHEET` con il tuo Spreadsheet ID (linea ~650)

4. Salva tutto (Ctrl+S)

---

### **STEP 4: Deploy Web App**

1. In Apps Script Editor, clicca su **Implementa > Nuova implementazione**
2. Impostazioni:
   - **Tipo**: Web App
   - **Descrizione**: "Free Time Marker v2.0"
   - **Esegui come**: Me (il tuo account)
   - **Chi ha accesso**: Chiunque
3. Clicca **Implementa**
4. **Autorizza** l'applicazione quando richiesto
5. **COPIA L'URL DEPLOYMENT** (serve per il WeMos)

---

### **STEP 5: NON MODIFICARE IL WEMOS**

⚠️ **IMPORTANTE**: Il WeMos **NON viene modificato**. Mantiene lo stesso Deployment ID.

Il nuovo codice `G_Script_v2.gs` sostituisce completamente il vecchio `G_Script.gs` nello **stesso progetto Apps Script**.

Quando fai il deploy:
1. In Apps Script Editor, vai su **Implementa > Gestisci implementazioni**
2. Clicca sull'implementazione esistente (quella già usata dal WeMos)
3. Clicca **✏️ Modifica**
4. Cambia **Versione** in "Nuova versione"
5. Clicca **Implementa**

In questo modo il **Deployment ID rimane lo stesso** ma il codice viene aggiornato.
Il WeMos continuerà a funzionare senza alcuna modifica.

---

### **STEP 6: Test del Sistema (ZERO modifiche WeMos)**

#### **Test 1: Endpoint WeMos (retrocompatibilità)**

Apri nel browser:
```
https://script.google.com/macros/s/[TUO-DEPLOYMENT-ID]/exec?sso=43339307000
```

Dovresti vedere:
```json
{"status":"success"}
```

E nel foglio "Timbrature" dovrebbe apparire una nuova riga.

#### **Test 2: Login Web App**

1. Vai all'URL deployment (senza parametri `?sso=`)
2. Dovresti vedere la schermata di login
3. Accedi con:
   - Username: `admin`
   - Password: `admin`
4. Dovresti vedere il pannello Admin

#### **Test 3: Timbratura Fisica**

Avvicina un tag NFC al lettore WeMos e verifica:
- Sul display LCD appare "Timbratura OK"
- Nel foglio "Timbrature" compare una nuova riga
- Nel foglio mensile (es. "Ottobre-2025") compare la timbratura

---

## 🎨 Utilizzo delle Interfacce

### **Pannello Admin** (Ruolo: admin)

**Tab Dipendenti:**
- Aggiungi/Modifica/Disattiva dipendenti
- Associa tag NFC manualmente
- Cerca dipendenti

**Tab Presenze:**
- Visualizza tutte le timbrature
- Filtra per anno/mese/dipendente
- Vedi storico completo

**Tab Turni:**
- Crea turni per dipendenti
- Modifica orari
- Elimina turni

**Tab Export:**
- Apri Spreadsheet direttamente
- Scarica CSV

### **Pannello Viewer** (Ruolo: viewer)

Accesso in **sola lettura** a:
- Statistiche presenze
- Elenco presenze (filtrabili)
- Elenco dipendenti (solo attivi)
- Turni programmati

---

## ⚙️ Configurazioni Avanzate

### **Email Automatica Mensile**

Per inviare il foglio del mese precedente via email:

1. In Apps Script Editor, vai su **Trigger** (icona orologio)
2. Aggiungi trigger:
   - Funzione: `onMonthlyTrigger`
   - Origine evento: Basato sul tempo
   - Tipo timer: Timer giorno del mese
   - Giorno: 1
   - Ora: 1:00 - 2:00
3. Salva

Ogni 1° del mese invierà automaticamente il PDF del mese precedente all'email configurata in "Config".

### **Cambio Password**

Per cambiare le password di default:

1. Usa la funzione `generatePasswordHash()` (vedi STEP 1)
2. Copia l'hash generato
3. Aggiorna manualmente il foglio "Users"

### **Backup Automatico**

Google Sheets crea automaticamente versionamento. Per backup esterni:
- **File > Versioni > Vedi storico versioni**
- Oppure usa **File > Scarica > Excel/CSV** periodicamente

---

## 🐛 Troubleshooting

### **Problema: WeMos mostra "Esito Negativo"**

**Possibili cause:**
1. Deployment ID errato nel firmware
2. Tag NFC non presente nel foglio "Dipendenti"
3. Dipendente non attivo (campo `Attivo = FALSE`)

**Soluzione:**
- Verifica che il tag sia nel foglio "Dipendenti"
- Verifica che `Attivo = TRUE`
- Controlla i log in Apps Script (Esecuzioni)

### **Problema: Login non funziona**

**Soluzione:**
- Verifica username/password nel foglio "Users"
- Controlla che l'hash della password sia corretto
- Pulisci cache browser (Ctrl+Shift+R)

### **Problema: Timeout durante caricamento dati**

**Soluzione:**
- Il foglio "Timbrature" potrebbe essere troppo grande (>10.000 righe)
- Archivia i dati vecchi in un altro Spreadsheet
- Usa sempre i filtri anno/mese

### **Problema: Cache non funziona**

**Soluzione:**
- Il cache di Google Apps Script ha limiti
- Riavvia lo script (Implementa > Test implementazioni)

---

## 📊 Performance e Limiti

### **Limiti Google Apps Script (quota gratuita):**
- ✅ Script runtime: 6 minuti max (il nostro usa ~1-2 secondi)
- ✅ Trigger giornalieri: 20 (ne usiamo 1)
- ✅ URL Fetch calls: 20.000/giorno (WeMos fa ~100/giorno)
- ✅ Email: 100/giorno (ne inviamo 1/mese)

### **Ottimizzazioni implementate:**
- **Cache 5 minuti** per lookup dipendenti (riduce letture Sheets)
- **Risposta immediata** al WeMos (~200-500ms)
- **Registrazione asincrona** (non blocca il WeMos)
- **Indicizzazione** con colonne Anno/Mese/Giorno

---

## 🔒 Sicurezza

**Password hash SHA-256** (non reversibili)
**Validazione ruoli** su ogni chiamata API
**Soft-delete dipendenti** (solo disattivazione, non eliminazione)
**Audit trail** con timestamp e ultimo accesso

⚠️ **RACCOMANDAZIONI:**
- Cambia password di default
- Non condividere l'URL deployment pubblicamente
- Usa email aziendali per gli utenti
- Backup regolari dello Spreadsheet

---

## 🔄 Migrazione Dati Esistenti

Se hai già timbrature nel vecchio sistema:

1. I fogli mensili esistenti (es. "Febbraio-2024") **rimarranno intatti**
2. Il nuovo sistema continuerà a crearli automaticamente
3. Per popolare il foglio "Timbrature" con lo storico:
   - Usa **Importa > Importa intervallo** in Google Sheets
   - Oppure copia manualmente i dati dai fogli mensili

---

## 📞 Supporto

Per problemi o domande:
- Controlla **Apps Script > Esecuzioni** per vedere errori
- Controlla **View > Logs** nell'editor
- Verifica che tutti i fogli abbiano i nomi corretti (case-sensitive)

---

## ✅ Checklist Finale

- [ ] Spreadsheet ID aggiornato in `G_Script_v2.gs`
- [ ] Spreadsheet ID aggiornato in `Admin.html`
- [ ] Tutti i 5 fogli creati nello Spreadsheet
- [ ] Dipendenti migrati nel foglio "Dipendenti"
- [ ] Utenti creati nel foglio "Users"
- [ ] File HTML caricati in Apps Script
- [ ] Deploy effettuato come "Nuova versione" (stesso Deployment ID)
- [ ] ✅ WeMos NON modificato (usa stesso Deployment ID)
- [ ] Test endpoint WeMos funzionante
- [ ] Test login web app funzionante
- [ ] Test timbratura fisica funzionante
- [ ] Password di default cambiate
- [ ] Trigger email mensile configurato (opzionale)

---

**🎉 Congratulazioni! Il sistema è pronto all'uso.**

**Vantaggi del nuovo sistema:**
- ✅ Interfaccia moderna e responsive
- ✅ Gestione dipendenti via web (no più codice)
- ✅ Accesso multi-utente con ruoli
- ✅ Statistiche in tempo reale
- ✅ 100% retrocompatibile con WeMos
- ✅ Performance ottimizzate con cache
- ✅ Costo: €0
