import {debug} from "../common/log";
import * as clsWeight from "../common/weight";
import * as utils from "../common/utils";

const URL_BASE = "https://api.fitbit.com/1/user/-/body/log/";
const URL_WEIGHT_GET = "weight/date/"
const URL_WEIGHT_POST = "weight"
const URL_END = ".json";
const PERIOD = "/30d";

function fetchWeightData(accessToken)  {
// Fetch Weight Data from Fitbit Web API (last month data)
    
    // initialize the return array
    let returnArray = new Array(10);

    // get the current date string
    let date = new Date();
    let todayDate = `${date.getFullYear()}-${utils.zeroPad(date.getMonth() + 1)}-${utils.zeroPad(date.getDate())}`; //YYYY-MM-DD
  
    // fetch the last 30 days weight entries
    let targetURL = `${URL_BASE}${URL_WEIGHT_GET}${todayDate}${PERIOD}${URL_END}`
    debug(`Fetching GET: ${targetURL}`);
    fetch(targetURL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
      debug("Data: " + JSON.stringify(data.weight));
      // return is an array with weight entries
      // take the last ten entries and transform in Weight class objects
      let fetchArray = data.weight;
      let length = fetchArray.length;
      for (let index = 0; index < length && index < 10; index++) {
          let loopWeight = new clsWeight.Weight();
          debug("Current JSON array object: " + JSON.stringify(fetchArray[index]));
          loopWeight.initFromWebData(fetchArray[length-index-1]);
          debug("Current weight object: " + JSON.stringify(loopWeight));
          returnArray[index] = loopWeight;
      }
      debug("Return Array: " + JSON.stringify(returnArray));
      return returnArray;
    })
    .catch(err => debug('[FETCH error GET]: ' + err));
}

function postWeightData(data, accessToken) {
// Post a new Weight Data to the Fitbit Web API)

    // build JSON string to be posted
    let date = data.date;
    let dataPOST;
    let bodyString;

    if (data.fat) {
        dataPOST = {
            'weight': data.weight,
            'fat' : data.fat,
            'date': `${date.getFullYear()}-${utils.zeroPad(date.getMonth() + 1)}-${utils.zeroPad(date.getDate())}`, //YYYY-MM-DD
            'time': `${utils.zeroPad(date.getHours())}:${utils.zeroPad(date.getMinutes())}:${utils.zeroPad(date.getSeconds())}` //HH:MM:SS
        }
        bodyString = `weight=${dataPOST.weight}&fat=${dataPOST.fat}&date=${dataPOST.date}&time=${dataPOST.time}`;
    } else {
        dataPOST = {
            'weight': data.weight,
            'date': `${date.getFullYear()}-${utils.zeroPad(date.getMonth() + 1)}-${utils.zeroPad(date.getDate())}`, //YYYY-MM-DD
            'time': `${utils.zeroPad(date.getHours())}:${utils.zeroPad(date.getMinutes())}:${utils.zeroPad(date.getSeconds())}` //HH:MM:SS
        }
        bodyString = `weight=${dataPOST.weight}&date=${dataPOST.date}&time=${dataPOST.time}`;       
    }
    debug("Defined weight POST data: " + JSON.stringify(dataPOST) + "/" + bodyString);
    let targetURL = `${URL_BASE}${URL_WEIGHT_POST}${URL_END}?${bodyString}`
    
    // fetch POST the data
    debug(`Fetching POST: ${targetURL}`);
    fetch(targetURL, {
        method: "POST",
        body: JSON.stringify(dataPOST),
        headers: { 
            'Content-type': 'application/json',
            "Authorization": `Bearer ${accessToken}`
        }
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        debug("Successfully posted to web: " + JSON.stringify(data));
        return;
    })
    .catch(err => debug('[FETCH error POST]: ' + err));
}   

export { fetchWeightData, postWeightData };


