# free-time-marker
[![Made with Arduino](https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=Arduino&logoColor=white)](https://www.arduino.cc)
[![Made with Google Sheets API](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)](https://www.google.com/sheets/about)

## Time marker wemos d1 R2 Based

Questo sistema è progettato per tracciare le timbrature attraverso **tag NFC**, registrando le informazioni in un foglio **Google Sheets**. Oltre che l'inserimento automatico delle timbrature, il progetto include la creazione automatica di fogli mensili.

## Configurazione del foglio di lavoro

**Foglio del Mese Corrente:** ogni mese viene creato un nuovo foglio con il formato `<Mese>-yyyy` (es. "Febbraio-2024"). Ogni foglio contiene le colonne "Data", "SSO", "Nome", "Cognome".
 
## Funzionalità Principali

- **Timbratura NFC:** ogni volta che un tag NFC viene letto, le informazioni vengono registrate nel foglio del mese corrente.
- **Creazione Automatica di Fogli Mensili:** un nuovo foglio viene creato automaticamente ogni mese.
- **Invio Automatico di Email:** integrabile tramite l'aggiunta di una funzione che permetta l'invio automatico del foglio del mese precedente via email all'inizio di ogni nuovo mese.

## Estensioni Future

- **Interfaccia Utente:** creazione di un'applicazione web o una GUI per semplificare l'interazione con lo script.
- **Aggiunta di Utenti:** implementazione di una funzione per aggiungere nuovi utenti associati a tag NFC senza dover modificare direttamente il codice.
- **Sommatoria Ore Nomi:** aggiunta del calcolo delle ore lavorate per ogni utente Il totale delle ore per ogni giorno deve essere calcolato e aggiornato.

## Contributing

Per chi avesse voglia di contribuire al progetto opensource può aprire una Issue o una Pull Request con i contenuti proposti.
Nuovi contributori al progetto sono be accetti!

## Licenza

Questo sistema è distribuito con licenza GPL 3.0.
