import {debug} from "../common/log";
import * as clsWeight from "../common/weight";
import * as utils from "../common/utils";
import { settingsStorage } from "settings";
import * as KEYS from "../common/identifier";
import * as secrets from "../secrets.json";

const URL_BASE = "https://api.fitbit.com/1/user/-/body/log/";
const URL_WEIGHT_GET = "weight/date/"
const URL_WEIGHT_POST = "weight"
const URL_END = ".json";
const PERIOD = "/30d";

function fetchWeightData()  {
// Fetch Weight Data from Fitbit Web API (last month data)
    
    return refreshTokens().then(function(res) {

        // get the current tokens from the storage
        let TOKEN = JSON.parse(settingsStorage.getItem(KEYS.SETTINGS_KEY_OAUTH));
        
        // initialize the return array
        let returnArray = new Array(10);

        // get the current date string
        let date = new Date();
        let todayDate = `${date.getFullYear()}-${utils.zeroPad(date.getMonth() + 1)}-${utils.zeroPad(date.getDate())}`; //YYYY-MM-DD
    
        // fetch the last 30 days weight entries
        let targetURL = `${URL_BASE}${URL_WEIGHT_GET}${todayDate}${PERIOD}${URL_END}`
        debug(`Fetching GET: ${targetURL}`);
        return fetch(targetURL, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${TOKEN.access_token}`
        }
        })
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
        // return is an array with weight entries
        // take the last ten entries and transform in Weight class objects
        let fetchArray = data.weight;
        let length = fetchArray.length;
        for (let index = 0; index < 10; index++) {
            let loopWeight = new clsWeight.Weight();
            if (index < fetchArray.length) {
                loopWeight.initFromWebData(fetchArray[length-index-1]);
                returnArray[index] = loopWeight;
            } else {
                returnArray[index] = false;
            }
        }
        debug("Return Array fetched weight logs: " + JSON.stringify(returnArray));
        return returnArray;
        })
        .catch(err => debug('[FETCH error GET]: ' + err));
    });
}

function postWeightData(data) {
// Post a new Weight Data to the Fitbit Web API)

    return refreshTokens().then(function(res) {

        // get the current tokens from the storage
        let TOKEN = JSON.parse(settingsStorage.getItem(KEYS.SETTINGS_KEY_OAUTH));
        
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
                "Authorization": `Bearer ${TOKEN.access_token}`
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
    });
}   

function refreshTokens() {

    // get the current tokens from the storage
    let storedTOKEN = settingsStorage.getItem(KEYS.SETTINGS_KEY_OAUTH);
    let TOKEN;
    if (storedTOKEN) {
        TOKEN = JSON.parse(storedTOKEN);
        debug("Refresh Oauth token");
    } else {
        debug("No authentication stored. Please reconnect to FitBit in the app settings on the phone.");
        return new Promise (false);
    }

    return fetch(`https://api.fitbit.com/oauth2/token?grant_type=refresh_token&refresh_token=${TOKEN.refresh_token}`, {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${secrets.companion.basicAuth}`
    },
    body: `grant_type=refresh_token&refresh_token=${TOKEN.refresh_token}`
    })
    .then(response => {
        return response.json().then(json => {
        return {
            status: response.status,
            body: json
        };
        });
    })
    .then(response => {
        debug(
        `Refresh tokens response: ${response.status} ${JSON.stringify(
            response.body,
            undefined,
            2
        )}`
        );

        if (response.status === 200) {
            settingsStorage.setItem(KEYS.SETTINGS_KEY_OAUTH, JSON.stringify(response.body));
        }

        return response;
    }).catch(err => debug('[Error in requestTokens]: ' + err));
}

export { fetchWeightData, postWeightData };

