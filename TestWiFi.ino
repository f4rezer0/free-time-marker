#include <ESP8266WiFi.h>

#ifndef STASSID
#define STASSID "YOUR-SSID"
#define STAPSK "YOUR-PASSWORD"
#endif

IPAddress local_IP(192, 168, 1, 184);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 0, 0);

const char* ssid = STASSID;
const char* password = STAPSK;

void setup() {
  Serial.begin(9600);

  connectToWiFi();
}


//Connessione al WiFi
void connectToWiFi() {
  Serial.println();
  Serial.println();
  Serial.println("Connessione al WiFi...");
  Serial.println(ssid);
  int attempts = 0;

//Check IP Statico
  if (WiFi.config(local_IP, gateway, subnet)) {
    Serial.println("IP Statico Configurato");
  }
  else {
    Serial.println("Configurazione IP Statico Fallita");
  }
    
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  if (WiFi.begin(ssid, password) == WL_CONNECTED) {
    Serial.println("Connesso al WiFi!");
  } else {
    Serial.println("Errore durante la connessione al WiFi. Controlla le impostazioni.");
    // Aggiungi qui ulteriori azioni in caso di errore
  }
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.println("Tentativo di connessione...");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connesso al WiFi!");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Impossibile stabilire la connessione al WiFi. Controlla le impostazioni.");
  }
}

void loop() {
}
