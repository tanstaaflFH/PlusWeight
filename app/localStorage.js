/*
  Responsible for loading and saving the to be logged weight entries on the device until they are uploaded
*/

import * as fs from "fs";
import { debug } from "../common/log";

const FILE_TYPE = "json";
const SETTINGS_FILE = "settings.txt";
const WEIGHT_LOG_FILE = "weightlog.txt";
const WEIGHT_WEB_FILE = "weightweb.txt";

// Load weight log from filesystem
function loadWeightsToBeLogged() {

  return loadFile(WEIGHT_LOG_FILE);
  
}

// Save feed log to the filesystem
function saveWeightsToBeLogged(input) {
    
  saveFile(WEIGHT_LOG_FILE, input);
}

// Load weight past lof from filesystem
function loadWeightsPast() {

  return loadFile(WEIGHT_WEB_FILE);

}

// Save past weights to the filesystem
function saveWeightsPast(input) {
    
  saveFile(WEIGHT_WEB_FILE, input);
  
}

function saveFile(fileName, input) {

  let jsonData = JSON.stringify(input);
  fs.writeFileSync(fileName, jsonData, FILE_TYPE);

  debug(`Successfully saved ${fileName} to device: ${jsonData}`);

}

function loadFile(fileName) {

  let returnObject;

  try { 
    returnObject = JSON.parse(fs.readFileSync(fileName, FILE_TYPE));
    for (let index = 0; index < returnObject.length; index++) {
      // JSON must be turned to Date for each array entry
      returnObject[index].date = Date(returnObject[index].date);    
    }
    debug(`Successfully loaded ${fileName} from device: ${JSON.stringify(returnObject)}`);
  } catch (ex) {
    debug("Error loading past weights from device: " + ex);
    returnObject = [];
  }

  return returnObject;

}

export { 
  loadWeightsToBeLogged, 
  saveWeightsToBeLogged,
  loadWeightsPast,
  saveWeightsPast 
};