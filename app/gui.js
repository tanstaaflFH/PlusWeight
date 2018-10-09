import document from "document";
import { me as device } from "device";
import * as util from "../common/utils";
import { preferences } from "user-settings";
import { debug } from "../common/log";
import { UNITS } from "../common/weight";
import { stat } from "fs";

// define DOM elements
// header 
let header = document.getElementById("mainHeader");
let txtUnsync = header.getElementById("txtUnsynced");
let txtClock = header.getElementById("txtClock");

// scroll view and pop up indicators
let panoramicView = document.getElementById("panScreens");

// combo buttons
let cbtTr = document.getElementById("cbtTr");
let cbtLr = document.getElementById("cbtLr");

//pop up weight
let containerEntryWeight = document.getElementById("containerEntryWeight");
let weightTumblerC = document.getElementById("weightTumblerC");
let weightTumblerD = document.getElementById("weightTumblerD");
let weightTumblerS = document.getElementById("weightTumblerS");
let weightTumblerFloat = document.getElementById("weightTumblerFloat");
let weightTumblerUnit = document.getElementById("weightTumblerUnit");
//pop up fat
let containerEntryFat = document.getElementById("containerEntryFat");
let fatTumblerInt = document.getElementById("fatTumblerInt");
let fatTumblerFloat = document.getElementById("fatTumblerFloat");

// spinner
let spinnerContainer = document.getElementById("containerSpinner");
let spinner = document.getElementById("spinner");

// no companion icon
let noCompanionContainer = document.getElementById("containerNoCompanion");

// error pop-up
let alertPopUp = document.getElementById("alertPopUp");
let alertText = document.getElementById("alertText");
let alertClickTarget = document.getElementById("alertClickTarget");

alertClickTarget.onclick = () => { 
    alert(); 
};

// *** main screen ***
let btnNewWeight = document.getElementById("btnNewWeight");
btnNewWeight.onactivate = function(e) {
  mainScreenSet(1);
}

//*** 2nd screen ***
//list items weight log
let weightListDOM = new Array(10);
for (let i=0; i<weightListDOM.length; i++) {
    let symbol = document.getElementById("listWeightLog" + i);
    weightListDOM[i] = {
        txtDate: symbol.getElementById("txtDate"),
        txtWeight: symbol.getElementById("txtWeight"),
        txtFat: symbol.getElementById("txtFat"),
        txtBMI: symbol.getElementById("txtBMI")};
}

let btnRefresh = document.getElementById("btnRefresh");

// callback functions
let callbackNewWeight;
let callbackRefreshLog;

// module variables
let weightUnit;
let weightList;
let deviceWidth = device.screen.width;
debug(`Sreen width: ${deviceWidth}`);

// exported functions
function initGUI(numberUnsync, weightLog, inpCallBackNewWeight, inpCallBackRefreshLog, inpWeightUnit ) {

    // initialize module variables
    weightUnit = inpWeightUnit;
   
    // set callback function
    callbackNewWeight = inpCallBackNewWeight;
    callbackRefreshLog = inpCallBackRefreshLog;
    btnRefresh.onactivate = function(e) {
        debug("clicked refresh button");
        inpCallBackRefreshLog();
    }

    // initialise unsynched log disply
    remainingSync(numberUnsync);

    // initialise clock to current time
    setClock();

    // initialise list to logged weights
    setWeightList(weightLog);

    // set to welcome screen
    mainScreenSet(0);

}

function mainScreenSet(screenNumber) {

    debug("Main Screen shall be set to " + screenNumber );

    // define DOM
    let iconUpper = cbtTr.getElementById("combo-button-icon");
    let iconUpperPressed = cbtTr.getElementById("combo-button-icon-press");
    let iconLower = cbtLr.getElementById("combo-button-icon");
    let iconLowerPressed = cbtLr.getElementById("combo-button-icon-press");

    switch (screenNumber) {

        case 0:
            // welcome screen
            // buttons
            cbtTr.style.display = "none";
            cbtLr.style.fill = "fb-lime";
            iconLower.image = "icons/btn_combo_next_p.png";
            iconLowerPressed.image = "icons/btn_combo_next_p.png";
            cbtLr.onactivate = function(e) {
                switch ( panoramicView.value ) {
                    case 0:
                        mainScreenSet(1);
                            break;
                    case 1:
                        callbackRefreshLog();
                        break;
                }
            }

            // SVG
            hideWeightPopUp();
            hideFatPopUp();
            break;

        case 1:
            // weight entry pop up
            // buttons
            cbtTr.style.display = "inline";
            cbtTr.style.fill = "fb-lime";
            iconUpper = "icons/btn_combo_check_p.png";
            iconUpperPressed = "icons/btn_combo_check_press_p.png"
            cbtLr.style.fill = "fb-magenta";
            iconLower.image = "icons/btn_combo_x_p.png";
            iconLowerPressed.image = "icons/btn_combo_x_p.png";
            cbtTr.onactivate = function(e) {
                mainScreenSet(2);
            }
            cbtLr.onactivate = function(e) {
                switch ( panoramicView.value ) {
                    case 0:
                        mainScreenSet(0);
                            break;
                    case 1:
                        callbackRefreshLog();
                        break;
                }
            }

            // SVG
            showWeightPopUp();
            hideFatPopUp();
            break;

        case 2:
            // fat entry pop up
            // buttons
            cbtTr.style.display = "inline";
            cbtTr.style.fill = "fb-lime";
            iconUpper = "icons/btn_combo_check_p.png";
            iconUpperPressed = "icons/btn_combo_check_press_p.png"
            cbtLr.style.fill = "fb-magenta";
            iconLower.image = "icons/btn_combo_x_p.png";
            iconLowerPressed.image = "icons/btn_combo_x_p.png";
            cbtTr.onactivate = function(e) {
                addNewWeight();
                mainScreenSet(0);
            }
            cbtLr.onactivate = function(e) {
                switch ( panoramicView.value ) {
                    case 0:
                        mainScreenSet(0);
                            break;
                    case 1:
                        callbackRefreshLog();
                        break;
                }
            }
    
            hideWeightPopUp();
            showFatPopUp();
            break;

    }

}

function setClock (inpDate) {

    if (!inpDate) {
        inpDate = new Date();
    }

    // Block variables --> now, hours, minutes
    let hours = inpDate.getHours();
    let mins = util.zeroPad(inpDate.getMinutes());
    
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
    
function remainingSync(numberRemaining) {

    debug(`Set remaining sync text to ${numberRemaining}`);

    if (numberRemaining === undefined || numberRemaining == "") {numberRemaining = 0};
    txtUnsync.text = `${numberRemaining} entries to be synched`;

}

function initLastWeightFat(lastWeight, lastFat) {

    let initWeight = util.convertWeightUnit(lastWeight, UNITS.other, weightUnit);

    // weight
    let hunderts = Math.floor(initWeight / 100);
    let tens = Math.floor((initWeight-hunderts*100) / 10);
    let singles = Math.floor((initWeight-hunderts*100-tens*10));
    let floats = Math.floor((initWeight-(hunderts*100)-(tens*10)-singles)*10);
    weightTumblerC.value = hunderts;
    weightTumblerD.value = tens;
    weightTumblerS.value = singles;
    weightTumblerFloat.value = floats;
    weightTumblerUnit.text = weightUnit;

    // fat
    debug(`GUI: Last fat: ${lastFat}`);
    let intPart = Math.floor(lastFat);
    let floats = Math.round((lastFat-intPart)*10);
    fatTumblerInt.value = intPart;
    fatTumblerFloat.value = floats;

}

function weightTumblerGet() {

    let hunderts = weightTumblerC.value;
    let tens = weightTumblerD.value;
    let singles = weightTumblerS.value;
    let floats = weightTumblerFloat.value;

    let weightSet = ( hunderts * 100 + tens * 10 + singles + floats / 10 );

    let returnValue = util.convertWeightUnit(weightSet,weightUnit,UNITS.other);
    debug(`Weight Tumbler was confirmed with ${weightSet}${weightUnit}/${returnValue}kg`);

    return returnValue;

}

function fatTumblerGet() {

    let intPart = fatTumblerInt.value;
    let floatPart = fatTumblerFloat.value;

    let returnValue = ( intPart + floatPart / 10 )
    debug("Fat Tumbler was confirmed with " + returnValue);

    return returnValue;

}

function setWeightUnit(inpWeightUnit) {

    let curWeight = weightTumblerGet();
    let curFat = fatTumblerGet();

    weightUnit = inpWeightUnit;

    debug(`GUI-setWeightUnit: Unit:${weightUnit} / lastWeight: ${curWeight} / lastFat: ${curFat}`);
    initLastWeightFat(curWeight, curFat);
    setWeightList();

}

function setSpinner(status) {
/* shows+starts or hides+stops the spinner
    argument: status BOOLEAN */
    
    if (!status) {
        spinner.state = "disabled";
        spinnerContainer.style.display = "none";
    } else {
        spinner.state = "enabled";
        spinnerContainer.style.display = "inline";
    }

}

function setNoCompanion(status) {
/*shows or hides the no companion icon
    argument: status BOOLEAN */

    if (status) {
        noCompanionContainer.style.display = "inline";
    } else {
        noCompanionContainer.style.display = "none";
    }

}

function alert(message) {
// shows a message full screen or hides if message is empty

    if (message) {
        alertText.text = message;
        alertPopUp.style.display = "inline";
    } else {
        alertPopUp.style.display = "none";
    }

}

// utility functions (not exported)
function showWeightPopUp () {
    containerEntryWeight.style.display = "inline";
}

function hideWeightPopUp () {
    containerEntryWeight.style.display = "none";
} 

function showFatPopUp () {
    containerEntryFat.style.display = "inline";
}

function hideFatPopUp () {
    containerEntryFat.style.display = "none";
}

function addNewWeight() {

    let newWeight = weightTumblerGet();
    let newFat = fatTumblerGet();
    callbackNewWeight({weight: newWeight, fat: newFat});

}

function setWeightList(weightLog) {

    if (weightLog) {
        weightList = weightLog;
    }

    debug("Resetting weight list");
    if (!weightList) {
        weightList = new Array(10);
    }

    for (let index = 0; index < weightListDOM.length; index++) {
        
        if (weightList[index]) {

            let dateString;
            if (weightList[index].date) {
                let year = weightList[index].date.getFullYear();
                let month = util.zeroPad(weightList[index].date.getMonth()+1);
                let day = util.zeroPad(weightList[index].date.getDate());
                dateString = `${year}-${month}-${day}`;
            } else {
                dateString = "No date";
            }

            let weightString;
            if (weightList[index].weight) {
                let convertedWeightUnit = util.fixedDecimals(weightList[index].weight,1);
                if (!(weightUnit === UNITS.other)) {
                    convertedWeightUnit = util.fixedDecimals(util.convertWeightUnit(weightList[index].weight, UNITS.other, weightUnit),1);
                }
                weightString = `${convertedWeightUnit} ${weightUnit}`;
            } else {
                weightString = "--";
            }

            let fatString;
            if (weightList[index].fat) {
                fatString = `${util.fixedDecimals((Math.round(weightList[index].fat*10)/10),1)} %`;
            } else {
                fatString = "--";
            }

            let BMIstring;
            if (weightList[index].bmi) {
                BMIstring = `${util.fixedDecimals((Math.round(weightList[index].bmi*10)/10),1)} BMI`;
            } else {
                BMIstring = "--";
            }

            weightListDOM[index].txtDate.text = dateString;
            weightListDOM[index].txtWeight.text = weightString;
            weightListDOM[index].txtFat.text = fatString;
            weightListDOM[index].txtBMI.text = BMIstring;

            // update x position of fat and BMI depending on unit
            if (weightUnit === UNITS.other) {
                weightListDOM[index].txtFat.x = deviceWidth * 0.4;
                weightListDOM[index].txtBMI.x = deviceWidth * 0.65;
            } else {
                weightListDOM[index].txtFat.x = deviceWidth * 0.45;
                weightListDOM[index].txtBMI.x = deviceWidth * 0.7;
            }

        } else {

            weightListDOM[index].txtDate.text = "No Entry";
            weightListDOM[index].txtWeight.text = "";
            weightListDOM[index].txtFat.text = "";          
            weightListDOM[index].txtBMI.text = ""; 

        }
        
    }

}

// exports
export { 
    remainingSync,
    setClock,
    mainScreenSet,
    initLastWeightFat,
    initGUI,
    setWeightList,
    setWeightUnit,
    setSpinner,
    setNoCompanion,
    alert
 };