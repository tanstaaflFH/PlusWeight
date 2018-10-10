/* general utility functions
    functions:
      - zeroPad: Add zero in front of numbers < 10
      - numberGroupThousand: takes a number as an input, rounds it to an integer and returns it as a string with the numbers in 3 digits groups separated by a space
      - numberWithSeparator: takes a number as an input, rounds it to an integer and returns it as a string with the numbers in 3 digits groups separated by a "."
*/

import { UNITS } from "../common/identifier";

function zeroPad(i) {
// Add zero in front of numbers < 10
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function fixedDecimals(number, digits, separator) {

  let intPart = Math.floor(number);
  let floatPart = Math.round((number-intPart)*(10*digits));
  if (!separator) {
    separator = ".";
  }
  return `${intPart}${separator}${floatPart}`;

}

function numberGroupThousand( inputNumber ) {
// takes a number as an input, rounds it to an integer and returns it as a string with the numbers in 3 digits groups separated by a space

  // split into groups of 3
  let tempArray = Math.round(inputNumber).toString.split(""); 

}

const numberWithSeparator = (x) => {
// takes a number as an input, rounds it to an integer and returns it as a string with the numbers in 3 digits groups separated by a "."
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
}

function convertWeightUnit(value, unitFrom, unitTo) {

  let returnValue;

  switch (unitFrom) {

    case UNITS.other: // kg
      if (unitTo === UNITS.US) { // to lb
        returnValue = Math.round(value*2.20462262185*10)/10;
        console.log(`Converted from kg to lb: ${value} --> ${returnValue}`);
        return returnValue;
      }
    break;

    case UNITS.US: // pounds
      if (unitTo === UNITS.other) { // to kg
        returnValue = Math.round(value/2.20462262185*10)/10;
        console.log(`Converted from lb to kg: ${value} --> ${returnValue}`);
        return returnValue;
      }
      break;
      
  }

  return value;

}

function UUID() {
// creates a unique identifier

  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });

  return uuid;
  
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { zeroPad, numberGroupThousand, numberWithSeparator, convertWeightUnit, UUID, sleep, fixedDecimals };

