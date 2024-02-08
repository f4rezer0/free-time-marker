/*          CONNECTIONS

    Wemos D1 R2  |  RFID-RC522
    -------------|------------
        D3       |    RST
        D8       |    SS
        D7       |    MOSI
        D6       |    MISO
        D5       |    SCK
    -------------|------------
    Wemos D1 R2  |  LCD I2C
    -------------|------------
      SCL/D1     |    SCL
      SDA/D2     |    SDA
    -------------|------------
    Wemos D1 R2  |  IR Proxy
    -------------|------------
        D4       |    OUT
*/

#ifndef STASSID
#define STASSID "YOUR-SSID"
#define STAPSK "YOUR-PASSWORD"
#endif
#define RST_PIN D3 // Configurable, see typical pin layout above
#define SS_PIN D8 // Configurable, see typical pin layout above
#define IRSensorPin D4 //Define Digital Input PIN
// Connection attempts
int attempts = 0;
// int "line" to clear only a line of the LCD
int line = 0;

/* Configurazione NTP */
#define MY_NTP_SERVER "it.pool.ntp.org"           
#define MY_TZ "CET-1CEST,M3.5.0/02,M10.5.0/03"

/* Necessary Includes */
#include <time.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <LiquidCrystal_I2C.h>

/* Globals Time */
time_t now;
tm tm;
String data = "";
String ora = "";

// IP Configuration (change as you prefer)
IPAddress staticIP(192, 168, 1, 184);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// set the LCD address to 0x3F for a 16 chars and 2 line display
LiquidCrystal_I2C lcd(0x27,16,2);

// GoogleScriptDeploymentID
String GAS_ID = "YOUR-GOOGLE-SCRIPT-DEPLOYMENT-ID";

// Host & httpsPort
const char* host = "script.google.com";
const int httpsPort = 443;

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

WiFiClientSecure client; //--> Create a WiFiClientSecure object.

// Values to let functions wait withoub blocking other functions
unsigned long previousMillis = 0;
unsigned long previousMillis2 = 0;
const unsigned long interval = 30000;  // 30"
const unsigned long interval2 = 60000;  // 60"

void setup() {
  Serial.begin(9600);
  delay(1000);
  pinMode(IRSensorPin, INPUT);
  lcd.init();
  lcd.clear();
  lcd.backlight();
  Serial.println();
  Serial.println("System Boot!");
  lcd.setCursor(2,1);
  lcd.print("System Boot!");
  configTime(MY_TZ, MY_NTP_SERVER);
  connectToWiFi();
  delay(5000);
  lcd.clear();
  showTime();
  SPI.begin(); // Init SPI bus
  mfrc522.PCD_Init(); // Init MFRC522
  client.setInsecure();
}

void loop() {
  int IRState = digitalRead(IRSensorPin);
  unsigned long currentMillis = millis();  // get current millis
  // Wait 30" before time update
  if (currentMillis - previousMillis >= interval) {
    showTime();
  previousMillis = currentMillis;
  }
  // If object is detected turn on LCD backlight
  if (IRState==LOW){ // LOW MEANS Object Detected
    lcd.backlight();
  } else {
    // Wait 60" before turn off LCD backlight
    if (currentMillis - previousMillis2 >= interval2) {
    lcd.noBacklight();
    previousMillis2 = currentMillis;
  }
  }

  // Restart WeMos at 4 am
  // Function needed because "millis" will do OVERFLOW after 55 days
  if (tm.tm_hour == 3 && tm.tm_min == 59) {
    Serial.println("Riavvio...");
    lcd.setCursor(4,1);
    lcd.print("***Riavvio...***");
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
  String sso = "";

  for (byte i = 0; i < mfrc522.uid.size; i++) {
  // Concatena il byte esadecimale alla stringa
  sso += String(mfrc522.uid.uidByte[i], HEX);
  }

  // Stampa la stringa risultante
  Serial.println("sso: " + sso);
  lcd.backlight();
  lcd.setCursor(0,1);
  lcd.print("sso: " + sso);

  String data = "";
  String ora = "";
  data += String(tm.tm_mday) + "/" + String(tm.tm_mon + 1) + "/" + String(tm.tm_year + 1900);
  ora += String(tm.tm_hour) + ":" + String(tm.tm_min);

  // Send tag HEX to Google Script
  sendData(sso);

  // Halt PICC
  mfrc522.PICC_HaltA();
  // Stop encryption on PCD
  mfrc522.PCD_StopCrypto1();
}

// Connecti to WiFi
// Set language accordly with your LCD space/preference
void connectToWiFi() {
  Serial.println("Connessione al WiFi...");
  Serial.println(STASSID);
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Connessione WiFi");
  lcd.setCursor(0,1);
  lcd.print(STASSID);
  Serial.print("Tentativi di Connessione: ");
  Serial.println(attempts);

  // Check static IP
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
    delay(1500);
    Serial.println("Tentativo di connessione...");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connesso al WiFi!");
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Connesso al WiFi");
    lcd.setCursor(0,1);
    lcd.print(STASSID);
    delay(5000);
    Serial.print("Indirizzo IP: ");
    Serial.println(WiFi.localIP());
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Indirizzo IP: ");
    lcd.setCursor(0,1);
    lcd.print(WiFi.localIP());
    delay(5000);
  } else {
    Serial.println("Impossibile stabilire la connessione al WiFi. Controlla le impostazioni.");
  }
}

// Show Time
void showTime() {
  time(&now);
  localtime_r(&now, &tm);

  data = String(tm.tm_mday) + "/" + String(tm.tm_mon + 1) + "/" + String(tm.tm_year + 1900);
  ora = String(tm.tm_hour) + ":" + String(tm.tm_min);

  // Print time strings
  Serial.print("Data: ");
  Serial.print(data);
  Serial.print("\tOra: ");
  Serial.println(ora);
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print(data);
  lcd.setCursor(11,0);
  lcd.print(ora);
  lcd.setCursor(0,1);
  lcd.print("BUSINESS-NAME");
}

//==============================================================================
//================================================================================== void sendData
// Subroutine for sending data to Google Sheets
void sendData(String sso) {
    String url = "https://script.google.com/macros/s/"+GScriptId+"/exec?"+"sso=" + sso;
    Serial.print("POST data to spreadsheet: ");
    Serial.println(url);
    HTTPClient http;
    http.begin(client, url);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
    int httpCode = http.GET();
    Serial.print("HTTP Status Code: ");
    Serial.println(httpCode);
    //---------------------------------------------------------------------
    //getting response from google sheet
    // Set language accordly with your LCD space/preference
    String payload;
    if (httpCode > 0) {
        payload = http.getString();
        if (payload == ("{\"status\":\"success\""));
        Serial.println("Payload: "+payload);
        line = 1;
        clearLCDLine(line);
        lcd.setCursor(0,1);
        lcd.print("Timbratura OK");
    } else {
      Serial.println("Failed");
        line = 1;
        clearLCDLine(line);
        lcd.setCursor(0,1);
        lcd.print("Esito Negativo");
        delay(5000);
        clearLCDLine(line);
        lcd.setCursor(0,1);
        lcd.print("Riprovare");
        delay(2000);
    }
    //---------------------------------------------------------------------
    http.end();
  //----------------------------------------
}
//==============================================================================
void clearLCDLine(int line)
{
        lcd.setCursor(0,line);
        for(int n = 0; n < 16; n++) // 16 indicates symbols in line. For 2x16 LCD write - 16
        {
                lcd.print(" ");
        }
}
