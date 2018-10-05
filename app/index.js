//imports
import * as clsWeight from "../common/weight";
import * as storage from "./localStorage";
import clock from "clock";
import { display } from "display";
import * as gui from "./gui";
import { debug } from "../common/log";
import * as communication from "./communication";
import * as KEYS from "../common/identifier";

// Initialize data elements
let messageLog = [];
let weightsToBeLogged = storage.loadWeightsToBeLogged();
let weightsPast = storage.loadWeightsPast();
let appSettings = storage.loadSettings() || {weightUnit: clsWeight.UNITS.other};
resetLastWeight();
debug("weightsToBeLogged " + JSON.stringify(weightsToBeLogged));

// callback functions
function addWeightLog (data) {
  
  // create the new entry in the local array
  let newEntry = new clsWeight.Weight(new Date(), data.weight, data.fat);
  weightsToBeLogged.push(newEntry);
  storage.saveWeightsToBeLogged(weightsToBeLogged);
  debug("new weightstobelogged " + JSON.stringify(weightsToBeLogged));

  // show new open unsynched
  gui.remainingSync(weightsToBeLogged.length);

  // try to send to web
  sendWeightLog();
  
}

function sendWeightLog() {

  // send message to companion to upload
  if (weightsToBeLogged) {
    if (weightsToBeLogged.length>0) {
      
      let tempPost = weightsToBeLogged;

      for (let index = 0; index < tempPost.length; index++) {
        tempPost[index] = JSON.stringify(tempPost[index]);
        
      }

      let requestData = {
        key: KEYS.MESSAGE_POST_WEIGHTS_API,
        content: tempPost
      }
      communication.sendData(requestData, KEYS.MESSAGE_POST_WEIGHTS_API, addMessageLog);
      debug(`App shall message companion to send a weight log.`);
    
    }
  }

}

function refreshWeightLog () {

  let requestData = {
    key: KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API,
    content: ""
  }
  communication.sendData(requestData, KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API, addMessageLog);
  debug(`App shall message companion to request web weight log.`);

}

// clock initialize
clock.granularity = "minutes";
clock.ontick = (evt) => {
  gui.setClock();
}

// Display initialize
gui.initGUI(weightsToBeLogged.length, weightsPast, addWeightLog, refreshWeightLog, appSettings.weightUnit);

// Messaging initialize
communication.initMessage(weightsReceivedFromAPI, weightsPostedToAPI, weightUnitChanged, retryMessaging);

// check if remaining unsynched weight logs
sendWeightLog();

/* Functions for display */
display.onchange = function() {

  if ( display.on ) {
    gui.setClock();
  }

};

/* Functions for data handling */
function weightsReceivedFromAPI(data) {

  // Check if a defined error was returned from the companion
  if ( data === KEYS.ERROR_API_TOKEN_OLD_REFRESH_TOKEN ) {
    debug(`App could not refresh web weights ${data}`);
    return;
  }

  debug(`Received data from Web: ${JSON.stringify(data)}`);
  // clean up the date objects
  for (let index = 0; index < data.length; index++) {
    if (data[index]) {
      data[index].date = new Date(data[index].date);
    }
  }

  weightsPast = data;
  storage.saveWeightsPast(weightsPast);
  resetLastWeight();
  gui.setWeightList(weightsPast);

}

function weightsPostedToAPI(data) {
/*  Callback if some of the weights have been posted to the web successfully.
The return array shows all UUID that have been posted. It loops through the array of 
weightsToBeLogged and removes the already posted entries */

  debug(`Successfully posted data to Web: ${JSON.stringify(data)}`);

  for (let index = 0; index < data.length; index++) {
    // loop through all returned entries  
    for (let index = 0; index < weightsToBeLogged.length; index++) {
      // loop through all remaining log entries
      if (weightsToBeLogged[index].logID = data[index] ) {
        weightsToBeLogged.splice(index, 1); // delete from array if UUID matches
        break;
      }
    }    
  }

  // save remaining entries to be logged
  storage.saveWeightsToBeLogged(weightsToBeLogged);

  // update GUI with remaining numbers
  gui.remainingSync(weightsToBeLogged.length);

}

function resetLastWeight() {

  let lastWeight, lastFat;

  if (weightsPast[0]) {
    lastWeight = weightsPast[0].weight || 75;
    lastFat = weightsPast[0].fat || 20
  } else {
    lastWeight = 75;
    lastFat = 20;
  }
  gui.initLastWeightFat(lastWeight, lastFat);

}

function addMessageLog(identifier) {

  if (!messageLog.includes(identifier)) {

    messageLog.push(identifier);

  }

}

function retryMessaging () {

  let countResolved = 0;

  if (messageLog.length > 0) {

    for (let index = 0; index < messageLog.length; index++) {
      
      switch (messageLog[index]) {

        case KEYS.MESSAGE_POST_WEIGHTS_API:
          sendWeightLog();
          countResolved++;
          break;

        case KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API:
          refreshWeightLog();
          countResolved++;
          break;    

      }
      
      messageLog[index] = "resolved";

    }

    for (let loop = 0; loop < countResolved; loop++) {
    
      for (let index = 0; index < messageLog.length; index++) {
      
        if ( messageLog[index] === "resolved" ) {
          messageLog.splice(index, 1);
          break;
        }
        
      }
      
    }

  }

}

function weightUnitChanged(newUnit) {

  // update module variable
  appSettings.weightUnit = newUnit;
  debug(`New unit selected: ${newUnit}`);

  // save new setting to device
  storage.saveSettings(appSettings);

  // reset display
  gui.setWeightUnit(appSettings.weightUnit);

}