/*  Wemos D1 R2  |  RFID-RC522
    -------------|------------
        D3       |    RST
        D8       |    SS
        D7       |    MOSI
        D6       |    MISO
        D5       |    SCK
*/

#ifndef STASSID
#define STASSID "YOUR-SSID"
#define STAPSK "YOUR-PASSWORD"
#endif
#define RST_PIN D3 // Configurable, see typical pin layout above
#define SS_PIN D8 // Configurable, see typical pin layout above
//Tentativi di connessione al WiFi
int attempts = 0;

/* Configurazione NTP */
#define MY_NTP_SERVER "it.pool.ntp.org"           
#define MY_TZ "CET-1CEST,M3.5.0/02,M10.5.0/03"

/* Necessary Includes */
#include <time.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>

/* Globals Tempo */
time_t now;
tm tm;
String data = "";
String ora = "";

// Configurazione manuale Indirizzo IP
IPAddress staticIP(192, 168, 1, 184);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// GoogleScriptDeploymentID
String GAS_ID = "YOUR-GOOGLE-SCRIPT-DEPLOYMENT-ID";

// Host & httpsPort
const char* host = "script.google.com";
const int httpsPort = 443;

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

WiFiClientSecure client; //--> Create a WiFiClientSecure object.

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
  SPI.begin(); // Init SPI bus
  mfrc522.PCD_Init(); // Init MFRC522
  client.setInsecure();
}

void loop() {
  unsigned long currentMillis = millis();  // Ottieni il tempo attuale
  //Funzione Ritardata di 30 secondi
  if (currentMillis - previousMillis >= interval) {
  showTime();
  previousMillis = currentMillis;
  }

  // Riavvia alle 3:00 AM
  if (tm.tm_hour == 3 && tm.tm_min == 59) {
    Serial.println("Riavvio...");
    delay(60000);
    ESP.restart();
  }
  
  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
   }

  // Print UID
  String SSO = "";

  for (byte i = 0; i < mfrc522.uid.size; i++) {
  // Concatena il byte esadecimale alla stringa
  SSO += String(mfrc522.uid.uidByte[i], HEX);
  }

  // Stampa la stringa risultante
  Serial.println("SSO: " + SSO);

  String data = "";
  String ora = "";
  data += String(tm.tm_mday) + "/" + String(tm.tm_mon + 1) + "/" + String(tm.tm_year + 1900);
  ora += String(tm.tm_hour) + ":" + String(tm.tm_min);

  // Invia l'ID al foglio di Google tramite Google Apps Script
  sendData(SSO);  

  // Halt PICC
  mfrc522.PICC_HaltA();
  // Stop encryption on PCD
  mfrc522.PCD_StopCrypto1();
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
  time(&now);
  localtime_r(&now, &tm);

  data = String(tm.tm_mday) + "/" + String(tm.tm_mon + 1) + "/" + String(tm.tm_year + 1900);
  ora = String(tm.tm_hour) + ":" + String(tm.tm_min);

  // Stampa delle stringhe
  Serial.print("Data: ");
  Serial.print(data);
  Serial.print("\tOra: ");
  Serial.println(ora);
}

//==============================================================================
//============================================================================== void sendData
// Subroutine for sending data to Google Sheets
void sendData(String sso) {
  Serial.println("==========");
  Serial.print("connecting to ");
  Serial.println(host);
  
  //----------------------------------------Connect to Google host
  if (!client.connect(host, httpsPort)) {
    Serial.println("connection failed");
    return;
  }
  //----------------------------------------

  //----------------------------------------Processing data and sending data
  String string_sso =  String(sso);
  String url = "/macros/s/" + GAS_ID + "/exec?sso=" + string_sso;
  Serial.print("requesting URL: ");
  Serial.println(url);

  client.print(String("GET ") + url + " HTTP/1.1\r\n" +
         "Host: " + host + "\r\n" +
         "User-Agent: BuildFailureDetectorESP8266\r\n" +
         "Connection: close\r\n\r\n");

  Serial.println("request sent");
  //----------------------------------------

  //----------------------------------------Checking whether the data was sent successfully or not
  while (client.connected()) {
    String line = client.readStringUntil('\n');
    if (line == "\r") {
      Serial.print("headers received: ");
      Serial.println(String(line));
      break;
    }
  }
  String line = client.readStringUntil('\n');
  if (line.startsWith("{\"status\":\"success\"")) {
    Serial.println("esp8266/Arduino CI successfull!");
  } else {
    Serial.println("esp8266/Arduino CI has failed");
  }
  Serial.print("reply was : ");
  Serial.println(line);
  Serial.println("closing connection");
  Serial.println("==========");
  Serial.println();
  //----------------------------------------
} 
//==============================================================================
