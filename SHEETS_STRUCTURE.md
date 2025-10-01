# Struttura Google Sheets

## Foglio 1: "Dipendenti"
Colonne:
- A: NFC_Tag (chiave primaria, es: "43339307000")
- B: Nome
- C: Cognome
- D: Email
- E: Reparto
- F: Attivo (TRUE/FALSE)
- G: DataInserimento (timestamp)

Header Row 1: NFC_Tag | Nome | Cognome | Email | Reparto | Attivo | DataInserimento

Esempio dati:
```
43339307000 | Legolas | Verdifoglia | legolas@azienda.it | IT | TRUE | 2024-01-15 10:00:00
46839307000 | Bilbo | Baggins | bilbo@azienda.it | Admin | TRUE | 2024-01-15 10:00:00
```

---

## Foglio 2: "Timbrature"
Colonne:
- A: Timestamp (data e ora completa)
- B: NFC_Tag
- C: Nome
- D: Cognome
- E: Anno
- F: Mese
- G: Giorno

Header Row 1: Timestamp | NFC_Tag | Nome | Cognome | Anno | Mese | Giorno

Note: Le colonne E, F, G servono per query rapide senza parsing date

---

## Foglio 3: "Turni"
Colonne:
- A: ID (autoincrementale)
- B: NFC_Tag (riferimento a Dipendenti)
- C: Nome
- D: Cognome
- E: GiornoSettimana (0-6, dove 0=Domenica)
- F: OraInizio (formato HH:MM)
- G: OraFine (formato HH:MM)

Header Row 1: ID | NFC_Tag | Nome | Cognome | GiornoSettimana | OraInizio | OraFine

---

## Foglio 4: "Config"
Colonne:
- A: Chiave
- B: Valore

Dati:
```
AdminEmail | admin@azienda.com
NomeAzienda | BUSINESS-NAME
EmailNotifiche | TRUE
FusoOrario | Europe/Rome
```

---

## Foglio 5: "Users" (per login web app)
Colonne:
- A: Username
- B: PasswordHash (SHA256)
- C: Ruolo (admin/viewer)
- D: Email
- E: UltimoAccesso

Header Row 1: Username | PasswordHash | Ruolo | Email | UltimoAccesso

Esempio:
```
admin | 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918 | admin | admin@azienda.it |
viewer | 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8 | viewer | viewer@azienda.it |
```
Note:
- Password "admin" = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
- Password "password" = 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8

---

## Fogli Mensili (esistenti, formato attuale)
Nome: "Gennaio-2024", "Febbraio-2024", etc.

Colonne:
- A: Data
- B: SSO (NFC_Tag)
- C: Nome
- D: Cognome

Questi fogli continuano ad essere creati automaticamente come prima.
