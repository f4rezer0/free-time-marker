#ifndef STASSID
#define STASSID "YOUR-SSID"
#define STAPSK "YOUR-PASSWORD"
#endif
//Tentativi di connessione al WiFi
int attempts = 0;

/* Configurazione NTP */
#define MY_NTP_SERVER "it.pool.ntp.org"   //Replace with your Region
#define MY_TZ "CET-1CEST,M3.5.0/02,M10.5.0/03"

/* Necessary Includes */
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <time.h>

/* Globals */
time_t now;
tm tm;

// Configurazione manuale Indirizzo IP
IPAddress staticIP(192, 168, 1, 184);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// Inizializza ritardo senza bloccare l'esecuzione in Background
unsigned long previousMillis = 0;  // Variabile per memorizzare il tempo dell'ultimo aggiornamento
const unsigned long interval = 30000;  // Ritardo desiderato in millisecondi (30 secondi)

void setup() {
  Serial.begin(9600);
  delay(1000);
  Serial.println();
  Serial.println("System Boot");
  configTime(MY_TZ, MY_NTP_SERVER);
  connectToWiFi();
  delay(1000);
  showTime();
}

void loop() {
  unsigned long currentMillis = millis();  // Ottieni il tempo attuale
  //Funzione Ritardata di 30 secondi
  if (currentMillis - previousMillis >= interval) {
  showTime();
  previousMillis = currentMillis;
  }
}

// Connessione al WiFi
void connectToWiFi() {
  Serial.println("Connessione al WiFi...");
  Serial.println(STASSID);
  Serial.print("Tentativi di Connessione: ");
  Serial.println(attempts);

  // Check IP Statico
  if (WiFi.config(staticIP, gateway, subnet, dns)) {
    Serial.println("IP Statico Configurato");
  }
  else {
    Serial.println("Configurazione IP Statico Fallita");
  }
  WiFi.persistent(false);   
  WiFi.mode(WIFI_STA);
  WiFi.begin(STASSID, STAPSK);
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.println("Tentativo di connessione...");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connesso al WiFi!");
    Serial.print("Indirizzo IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Impossibile stabilire la connessione al WiFi. Controlla le impostazioni.");
  }
}

// Mostra il Tempo
void showTime() {
  time(&now);                       // read the current time
  localtime_r(&now, &tm);           // update the structure tm with the current time
  Serial.print(tm.tm_mday);         // day of month
  Serial.print(":");
  Serial.print(tm.tm_mon + 1);      // January = 0 (!)
  Serial.print(":");
  Serial.print(tm.tm_year + 1900);  // years since 1900
  Serial.print("\t");
  Serial.print(tm.tm_hour);         // hours since midnight  0-23
  Serial.print(":");
  Serial.print(tm.tm_min);          // minutes after the hour  0-59
  Serial.println();
}
