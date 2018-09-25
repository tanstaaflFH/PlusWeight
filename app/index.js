//imports
import document from "document";
import * as fs from "fs";
import * as messaging from "messaging";
import * as util from "../common/utils";
import { me as device } from "device";
import clock from "clock";
import { display } from "display";
import { preferences } from "user-settings";


if (!device.screen) device.screen = { width: 348, height: 250 };

// *** header ***
let header = document.getElementById("mainHeader");
let txtUnsync = header.getElementById("txtUnsynced");
let txtClock = header.getElementById("txtClock");

// scroll view and pop up indicators
let panoramicView = document.getElementById("panScreens");
let screenMain = 0;

// combo buttons
let cbtTr = document.getElementById("cbtTr");
cbtTr.onactivate = function(e) {
  clickedTopRightButton();
}
let cbtLr = document.getElementById("cbtLr");
cbtLr.onactivate = function(e) {
  clickedLowerRightButton();
}
initializeComboButtons();

//pop up weight
let containerEntryWeight = document.getElementById("containerEntryWeight");
let weightTumblerInt = document.getElementById("weightTumblerInt");
let weightTumblerFloat = document.getElementById("weightTumblerFloat");
let weightTumblerSeparator = document.getElementById("weightTumblerSeparator");
let weightTumblerUnit = document.getElementById("weightTumblerUnit");
//pop up fat
let containerEntryFat = document.getElementById("containerEntryFat");
let fatTumblerInt = document.getElementById("fatTumblerInt");
let fatTumblerFloat = document.getElementById("fatTumblerFloat");
let fatTumblerSeparator = document.getElementById("fatTumblerSeparator");

// *** main screen ***
let btnNewWeight = document.getElementById("btnNewWeight");
btnNewWeight.onactivate = function(e) {
  showWeightPopUp();
}
updateClock();

//*** 2nd screen ***
let txtWeightList = document.getElementById("txtWeightList");
let btnRefresh = document.getElementById("btnRefresh");

// Used to count the new weight & fat entries being added
let newEntryCount = 0;

clock.granularity = "minutes";
clock.ontick = (evt) => {
  updateClock();
}

/* Functions for display */

display.onchange = function() {

  if ( display.on ) {
    updateClock();
  }

};


function initializeComboButtons() {
/* if main screen or entry pop ups are shown:
  - show/hide combo buttons
  - set colors and icons
  - change onactivate functions
  */

  // define DOM
  let iconUpper = cbtTr.getElementById("combo-button-icon");
  let iconUpperPressed = cbtTr.getElementById("combo-button-icon-press");
  let iconLower = cbtLr.getElementById("combo-button-icon");
  let iconLowerPressed = cbtLr.getElementById("combo-button-icon-press");

  switch (screenMain) {
    
    case 0:
    // main screen without pop ups

      // hide / show / style
      cbtTr.style.display = "none";
      cbtLr.style.fill = "fb-lime";
      iconLower.image = "icons/btn_combo_next_p.png";
      iconLowerPressed.image = "icons/btn_combo_next_p.png";

      // event function
      cbtLr.onactivate = function(e) {
        showWeightPopUp();
      }

      break;

    case 1:
    // weight entry pop-up

      // hide / show / style
      cbtTr.style.display = "inline";
      cbtTr.style.fill = "fb-lime";
      iconUpper = "icons/btn_combo_check_p.png";
      iconUpperPressed = "icons/btn_combo_check_press_p.png"
      cbtLr.style.fill = "fb-magenta";
      iconLower.image = "icons/btn_combo_x_p.png";
      iconLowerPressed.image = "icons/btn_combo_x_p.png";

      // event function
      cbtTr.onactivate = function(e) {
        //addWeightLog();
        hideWeightPopUp();
        showFatPopUp();
      }
      cbtLr.onactivate = function(e) {
        hideWeightPopUp();
      }

      break;

    case 2:
    // fat entry pop-up

      // hide / show / style
      cbtTr.style.display = "inline";
      cbtTr.style.fill = "fb-lime";
      iconUpper = "icons/btn_combo_check_p.png";
      iconUpperPressed = "icons/btn_combo_check_press_p.png"
      cbtLr.style.fill = "fb-magenta";
      iconLower.image = "icons/btn_combo_x_p.png";
      iconLowerPressed.image = "icons/btn_combo_x_p.png";

      // event function
      cbtTr.onactivate = function(e) {
        //addFatLog();
        hideFatPopUp();
      }
      cbtLr.onactivate = function(e) {
        hideFatPopUp();
      }

      break;

  }


}

function showWeightPopUp () {
  screenMain = 1;
  initializeComboButtons();
  containerEntryWeight.style.display = "inline";
}

function hideWeightPopUp () {
  screenMain = 0;
  initializeComboButtons();
  containerEntryWeight.style.display = "none";
} 

function showFatPopUp () {
  screenMain = 2;
  initializeComboButtons();
  containerEntryFat.style.display = "inline";
}

function hideFatPopUp () {
  screenMain = 0;
  initializeComboButtons();
  containerEntryFat.style.display = "none";
}

function updateClock () {

  // Block variables --> now, hours, minutes
  let currentDate = new Date();
  let hours = currentDate.getHours();
  let mins = util.zeroPad(currentDate.getMinutes());
  
  // 12h or 24h format for hours based on user profile settings
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }

  // output Time
  txtClock.text = `${hours}:${mins}`;

}

/*
// grab goal and summary from cached file
let goal, summary, fileValue;
try {
  fileValue = fs.readFileSync("waterValue.txt", "ascii");
}catch (e) {
  console.log(e);
}
if(fileValue) {
  waterValue.text = fileValue;
  let tempUnits;
  [summary, goal, tempUnits] = waterValue.text.split("/");
  if (tempUnits) {
    units = tempUnits;
    unitsText.text = units;
  }
  updateWaterLevel();
  startup.style.display = "none";
} else {
  setRefreshText("Open settings to login with fitbit")
}

// Message is received from companion
messaging.peerSocket.onmessage = evt => {
  let from = Math.round((1 - (summary/goal))*250);
  if (evt.data.units) {
    units = evt.data.units;
    unitsText.text = units;
  }
  goal = util.convertToUnit(parseInt(evt.data.goal), units);
  summary = util.convertToUnit(parseInt(evt.data.summary), units);
  
  waterValue.text = `${summary}/${goal}`;
  fs.writeFileSync("waterValue.txt", waterValue.text, "ascii");

  updateWaterLevel();
  // doAnimation(from, Math.round((1 - (summary/goal))*250))
  clearRequest();
};


// Touch Handlers
waterValue.onclick = function(e) {
  doRequest("refresh");
}
rect.onclick = function(e) {
  doRequest("refresh");
}

plusOne.onactivate = function(evt) {
  newWaterCount += (units === "fl oz" ? 1 : 100);
  newWater.text = `+${newWaterCount}`
  save.style.display = "inline";
  plusGlass.style.display = "none";
  plusSmallBottle.style.display = "none";
  plusBigBottle.style.display = "none";
  minusOne.style.display = "inline";
}

minusOne.onactivate = function(evt) {
  newWaterCount -= (units === "fl oz" ? 1 : 100);
  if (newWaterCount > 0) {
    newWater.text = `+${newWaterCount}` 
  } else {
    clearRequest();
  }
}

save.onactivate = function(evt) {
  if(newWaterCount <= 0) return; // do nothing
  let saveData = {
    newWater: newWaterCount
  }
  doRequest(saveData);
}

plusGlass.onactivate = function(evt) {
  let saveData = {
    newWater: units === "fl oz"? 8 : 250
  }
  doRequest(saveData);
}

plusSmallBottle.onactivate = function(evt) {
  let saveData = {
    newWater: units === "fl oz"? 16 : 500
  }
  doRequest(saveData);
}

plusBigBottle.onactivate = function(evt) {
  let saveData = {
    newWater: units === "fl oz"? 32 : 750
  }
  doRequest(saveData);
}

messaging.peerSocket.onopen = () => {
  console.log("Opened socket.");
  doRequest("refresh");
};

// Request/UI helpers
function doRequest(data) {
  refreshingText.text = "refreshing...";
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
    setTimeout(function () {
      if (refreshingText.text === "refreshing...") {
        console.log("Failed to send message to companion.");
        setRefreshText("Failed. Please restart app.");
      }
    }, 5000)
  } else {
    setRefreshText("Failed. Please restart app.");
    console.log("Failed to send message to companion.");
  }
}

function clearRequest() {
  refreshingText.text = "";
  newWaterCount = 0;
  newWater.text = "";
  save.style.display = "none";
  startup.style.display = "none";
  plusGlass.style.display = "inline";
  plusSmallBottle.style.display = "inline";
  plusBigBottle.style.display = "inline";
  minusOne.style.display = "none";
}

function setRefreshText(str) {
  refreshingText.text = str;
}


function updateWaterLevel() {
  let rectHeight = Math.round((1 - (summary/goal))*device.screen.height);
  rect.height = rectHeight < 0 ? 0 : rectHeight;
  
  if(summary/goal >= 1) {
    gradientRect.gradient.colors.c1 = "#a8e063"
    gradientRect.gradient.colors.c2 = "#56ab2f"
  } else {
    gradientRect.gradient.colors.c1 = "#baeaff"
    gradientRect.gradient.colors.c2 = "#3dc4ff"
  }
}

*/