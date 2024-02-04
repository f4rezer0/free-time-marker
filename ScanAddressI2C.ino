//I2C Address Scanner
//HEX value is needed to define I2C like this -> LiquidCrystal_I2C lcd(0x3F, 16, 2);
//0x3F is the value of the Example. In my case it is 0x27
//If after upload serial monitor is prompting Done. Found 1 device(s) just hard reset it

#include <Wire.h>

void setup() {
  Serial.begin (9600);
  while(!Serial){
  //Waiting for Serial connection
  }
  Serial.println ();
  Serial.println ("I2C Address scanner");
  Serial.println ("Scanning ...");
  byte count = 0;  
  Wire.begin();

  for (byte i = 8; i < 120; i++){
    Wire.beginTransmission (i);
    if (Wire.endTransmission () == 0){
      Serial.print ("Found address: ");
      Serial.print (i, DEC);
      Serial.print (" (0x");
      Serial.print (i, HEX);
      Serial.println (")");
      count++;
      delay (100);
      }
  }
  Serial.println ("Done.");
  Serial.print ("Found ");
  Serial.print (count, DEC);
  Serial.println (" device(s).");
}

void loop(){
}
