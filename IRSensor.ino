/*  WeMos D1 R2 - ESP8266 IR Sensor Test code
 *  https://github.com/f4rezer0/free-time-marker
 */

#define IRSensorPin D4 //Define Digital Input PIN

void setup() {
  pinMode(IRSensorPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  int IRState = digitalRead(IRSensorPin);
  
  delay(1000);
   if (IRState==LOW){ // LOW MEANS Object Detected
    Serial.print("SensorPin Value: ");
    Serial.println(IRState);
    Serial.println("Oggetto Vicino"); //Object is Near
  }
  else
  {
    Serial.print("SensorPin Value: ");
    Serial.println(IRState);
    Serial.println("Oggetto Distante"); //Object is Far
  }
}
