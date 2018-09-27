//imports
import document from "document";
import * as fs from "fs";
import * as messaging from "messaging";
import * as util from "../common/utils";
import * as clsWeight from "../common/weight";
import * as storage from "./localStorage";
import { me as device } from "device";
import clock from "clock";
import { display } from "display";
import { preferences } from "user-settings";
import * as gui from "./gui";
import { debug } from "../common/log";
import * as communication from "./communication";
import * as KEYS from "../common/identifier";

if (!device.screen) device.screen = { width: 348, height: 250 };

// Initialize data elements
let weightsToBeLogged = storage.loadWeightsToBeLogged();
let weightsPast = storage.loadWeightsPast();
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
  
}

function sendWeightLog() {

  // send message to companion to upload
  if (weightsToBeLogged) {
    if (weightsToBeLogged.length>0) {
      
      let requestData = {
        key: KEYS.MESSAGE_POST_WEIGHTS_API,
        content: weightsToBeLogged
      }
      communication.sendData(requestData);
    
    }
  }

}

function refreshWeightLog () {

  let requestData = {
    key: KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API,
    content: ""
  }
  communication.sendData(requestData);

}

// clock initialize
clock.granularity = "minutes";
clock.ontick = (evt) => {
  gui.setClock();
}

// Display initialize
gui.initGUI(weightsToBeLogged.length, weightsPast, addWeightLog, refreshWeightLog);

// Messaging initialize
communication.initMessage(weightsReceivedFromAPI, weightsPostedToAPI, undefined, sendWeightLog);

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

  let countResolved = 0;

  debug(`Successfully posted data to Web: ${JSON.stringify(data)}`);

  for (let index = 0; index < weightsToBeLogged.length; index++) {
    for (let indexData = 0; indexData < data.length; indexData++) {
      
      if ( index == data[indexData] ) {
        weightsToBeLogged[index] = "resolved";
        countResolved++;
      }
      
    }
    
  }

  for (let loop = 0; loop < countResolved; loop++) {
    
    for (let index = 0; index < weightsToBeLogged.length; index++) {
    
      if ( weightsToBeLogged[index] === "resolved" ) {
        weightsToBeLogged.splice(index, 1);
        break;
      }
      
    }
    
  }

  storage.saveWeightsToBeLogged(weightsToBeLogged);

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