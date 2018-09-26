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

if (!device.screen) device.screen = { width: 348, height: 250 };

// Initialize data elements
let weightsToBeLogged = storage.loadWeightsToBeLogged();
let weightsPast = storage.loadWeightsPast();
let lastWeight;
let lastFat;
resetLastWeight();

// callback functions
function addWeightLog (data) {
  
  lastWeight = data.weight;
  lastFat = data.fat;

  debug(`Index.js: Added weight/fat: ${data.weight} / ${data.fat} `);

}

// clock initialize
clock.granularity = "minutes";
clock.ontick = (evt) => {
  gui.setClock();
}

// Display initialize
gui.initGUI(weightsToBeLogged.length, lastWeight, lastFat, addWeightLog);

// Messaging initialize
communication.initMessage(weightsReceivedFromAPI, weightsPostedToAPI);

/* Functions for display */
display.onchange = function() {

  if ( display.on ) {
    gui.setClock();
  }

};

/* Functions for data handling */
function weightsReceivedFromAPI(data) {

  weightsPast = data.content;
  resetLastWeight();

}

function weightsPostedToAPI(data) {

  debug(`Successfully posted data to Web: ${JSON.stringify(data)}`);

}

function resetLastWeight() {

  if (weightsPast[0]) {
    lastWeight = weightsPast[0].weight || 75;
    lastFat = weightsPast[0].fat || 20
  } else {
    lastWeight = 75;
    lastFat = 20;
  }

}