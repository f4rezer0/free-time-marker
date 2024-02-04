//I2C Print "Hello World!"
//To know I2C Address download ScanAddressI2C.ino at https://github.com/f4rezer0/free-time-marker
//HEX value is needed to define I2C like this -> LiquidCrystal_I2C lcd(0x3F, 16, 2);
//0x3F is the value of the Example. In my case it is 0x27
//Adjust LCD Contrast with a screwdriver


#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27,16,2);  // set the LCD address to 0x3F for a 16 chars and 2 line display

void setup() {
  lcd.init();
  lcd.clear();         
  lcd.backlight();      // Make sure backlight is on
  
  // Print a message on both lines of the LCD.
  lcd.setCursor(2,0);   //Set cursor to character 2 on line 0
  lcd.print("Hello world!");
  
  lcd.setCursor(2,1);   //Move cursor to character 2 on line 1
  lcd.print("LCD Tutorial");
}

void loop() {
}
