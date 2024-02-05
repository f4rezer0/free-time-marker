# free-time-marker
Time marker wemos d1 R2 Based

Questo sistema è progettato per tracciare le timbrature attraverso tag NFC, registrando le informazioni in un foglio Google Sheets. Il progetto include funzioni come la creazione automatica di fogli mensili,

Configurazione del foglio di lavoro
Foglio del Mese Corrente: Ogni mese viene creato un nuovo foglio con il formato "MMMM-yyyy" (es. "Febbraio-2024"). Ogni foglio contiene le colonne "Data", "SSO", "Nome", "Cognome.
 
Funzionalità Principali
Timbratura NFC: Ogni volta che un tag NFC viene letto, le informazioni vengono registrate nel foglio del mese corrente. Il totale delle ore per ogni giorno viene calcolato e aggiornato.

Creazione Automatica di Fogli Mensili: Un nuovo foglio viene creato automaticamente ogni mese.
Invio Automatico di Email: Aggiungi una funzione per inviare automaticamente il foglio del mese precedente via email all'inizio di ogni nuovo mese.

Estensioni Future

Interfaccia Utente: Creare un'applicazione web o una GUI per semplificare l'interazione con lo script.

Aggiunta di Utenti: Implementare una funzione per aggiungere nuovi utenti associati a tag NFC senza dover modificare direttamente il codice.

Sommatoria Ore Nomi: aggiungere il calcolo delle ore lavorate per ogni utente



Licenza
Questo sistema è distribuito con licenza MIT. Leggi il file LICENSE per ulteriori dettagli.