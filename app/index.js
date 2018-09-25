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
import { debug } from "util";

if (!device.screen) device.screen = { width: 348, height: 250 };

// Initialize data elements
let weightsToBeLogged = storage.loadWeightsToBeLogged();
gui.remainingSync(weightsToBeLogged);
let weightsPast = storage.loadWeightsPast();
let lastWeight;
let lastFat;
if (weightsPast[0]) {
  lastWeight = weightsPast[0].weight || 75;
  lastFat = weightsPast[0].fat || 20
} else {
  lastWeight = 75;
  lastFat = 20;
}

// Display initialize
gui.mainScreenSet(0);
gui.initLastWeightFat(lastWeight, lastFat);

// clock initialize
clock.granularity = "minutes";
clock.ontick = (evt) => {
  gui.setClock();
}
gui.setClock();

/* Functions for display */
display.onchange = function() {

  if ( display.on ) {
    gui.setClock();
  }

};

/* Functions to handle the data */
function addWeightLog() {
// take the settings from the tumbler and add a new weight entry to be saved
}