import { settingsStorage } from "settings";
import * as KEYS from "../common/identifier";
import { debug } from "../common/log";
import * as utils from "../common/utils";
import * as clsWeight from "../common/weight";
import secrets from "../secrets";

const URL_BASE_WEIGHT = "https://api.fitbit.com/1/user/-/body/log/";
const ULR_PROFILE = "https://api.fitbit.com/1/user/-/profile.json";
const URL_WEIGHT_GET = "weight/date/"
const URL_WEIGHT_POST = "weight"
const URL_END = ".json";
const PERIOD = "/30d";

async function fetchProfileData()  {
// Fetch Profile Data from Fitbit Web API
    
    let returnObject = {
        status: KEYS.REJECT,
        data: undefined
    };

    try {
        const res = await refreshTokens();
        // abort if the tokens could not be refreshed
        if (res.status === KEYS.REJECT) {
            returnObject.data = `${KEYS.ERROR_API_FETCH_PROFILE} / ${res.data}`;
            return Promise.reject(returnObject);
        }
        // get the current tokens from the storage
        let TOKEN = JSON.parse(settingsStorage.getItem(KEYS.SETTINGS_KEY_OAUTH));
        // fetch the profile
        let targetURL = `${ULR_PROFILE}`;
        debug(`Fetching GET: ${targetURL}`);
        try {
            const res_1 = await fetch(targetURL, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${TOKEN.access_token}`
                }
            });
            const data = await res_1.json();
            debug("Return user profile: " + JSON.stringify(data));
            returnObject.status = KEYS.RESOLVE;
            let rawOffset = data.user.offsetFromUTCMillis;
            let hours = Math.floor(rawOffset/1000/60/60);
            let minutes = Math.floor((rawOffset-(hours*60*60*1000))/1000/60);
            returnObject.data = {
                offsetFromUTCMillis: {
                    raw: rawOffset,
                    sign: rawOffset < 0 ? "-" : "+",
                    hoursString: utils.zeroPad(hours),
                    minutesString: utils.zeroPad(minutes)
                }
            };
            debug("Profile return object:" + JSON.stringify(returnObject));
            return Promise.resolve(returnObject);
        }
        catch (err) {
            debug('[FETCH error GET Profile]: ' + JSON.stringify(err, undefined, 2));
            returnObject.data = `${err}`;
            return Promise.reject(returnObject);
        }
    }
    catch (err_1) {
        debug('[Error in fetchProfileData]: ' + JSON.stringify(err_1, undefined, 2));
        returnObject.data = `${KEYS.ERROR_API_FETCH_PROFILE} / ${err_1.data}`;
        return Promise.reject(returnObject);
    }
}

async function fetchWeightData(UTCoffset)  {
// Fetch Weight Data from Fitbit Web API (last month data)
    
    let returnObject = {
        status: KEYS.REJECT,
        data: undefined
    };

    try {
        const res = await refreshTokens();
        // abort if the tokens could not be refreshed
        if (res.status === KEYS.REJECT) {
            returnObject.data = `${KEYS.ERROR_API_FETCH_WEIGHT_LOG} / ${res.data}`;
            return Promise.reject(returnObject);
        }
        // get the current tokens from the storage
        let TOKEN = JSON.parse(settingsStorage.getItem(KEYS.SETTINGS_KEY_OAUTH));
        // initialize the return array
        let returnArray = new Array(10);
        // get the current date string
        let date = new Date();
        let todayDate = `${date.getFullYear()}-${utils.zeroPad(date.getMonth() + 1)}-${utils.zeroPad(date.getDate())}`; //YYYY-MM-DD
        // fetch the last 30 days weight entries
        let targetURL = `${URL_BASE_WEIGHT}${URL_WEIGHT_GET}${todayDate}${PERIOD}${URL_END}`;
        debug(`Fetching GET: ${targetURL}`);
        try {
            const res_1 = await fetch(targetURL, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${TOKEN.access_token}`
                }
            });
            const data = await res_1.json();
            // return is an array with weight entries
            // take the last ten entries and transform in Weight class objects
            let fetchArray = data.weight;
            let length = fetchArray.length;
            for (let index = 0; index < 10; index++) {
                let loopWeight = new clsWeight.Weight();
                if (index < fetchArray.length) {
                    loopWeight.initFromWebData(fetchArray[length - index - 1],undefined,UTCoffset);
                    returnArray[index] = loopWeight;
                }
                else {
                    returnArray[index] = false;
                }
            }
            debug("Return Array fetched weight logs: " + JSON.stringify(returnArray));
            returnObject.status = KEYS.RESOLVE;
            returnObject.data = returnArray;
            return Promise.resolve(returnObject);
        }
        catch (err) {
            debug('[FETCH error GET Weight]: ' + JSON.stringify(err, undefined, 2));
            returnObject.data = `${err}`;
            return Promise.reject(returnObject);
        }
    }
    catch (err_1) {
        debug('[Error in fetchWeightData]: ' + JSON.stringify(err_1, undefined, 2));
        returnObject.data = `${KEYS.ERROR_API_FETCH_WEIGHT_LOG} / ${err_1.data}`;
        return Promise.reject(returnObject);
    }
}

async function postWeightData(data) {
// Post a new Weight Data to the Fitbit Web API)

    let returnObject = {
        status: KEYS.REJECT,
        data: undefined
    };
    try {
        const res = await refreshTokens();
        // abort if the tokens could not be refreshed
        if (res.status === KEYS.REJECT) {
            returnObject.data = `${KEYS.ERROR_API_POST_WEIGHT_LOG} / ${res.data}`;
            return Promise.reject(returnObject);
        }
        // get the current tokens from the storage
        let TOKEN = JSON.parse(settingsStorage.getItem(KEYS.SETTINGS_KEY_OAUTH));
        // build JSON string to be posted
        let date = data.date;
        let dataPOST;
        let bodyString;
        if (data.fat) {
            dataPOST = {
                'weight': data.weight,
                'fat': data.fat,
                'date': `${date.getFullYear()}-${utils.zeroPad(date.getMonth() + 1)}-${utils.zeroPad(date.getDate())}`,
                'time': `${utils.zeroPad(date.getHours())}:${utils.zeroPad(date.getMinutes())}:${utils.zeroPad(date.getSeconds())}` //HH:MM:SS
            };
            bodyString = `weight=${dataPOST.weight}&fat=${dataPOST.fat}&date=${dataPOST.date}&time=${dataPOST.time}`;
        }
        else {
            dataPOST = {
                'weight': data.weight,
                'date': `${date.getFullYear()}-${utils.zeroPad(date.getMonth() + 1)}-${utils.zeroPad(date.getDate())}`,
                'time': `${utils.zeroPad(date.getHours())}:${utils.zeroPad(date.getMinutes())}:${utils.zeroPad(date.getSeconds())}` //HH:MM:SS
            };
            bodyString = `weight=${dataPOST.weight}&date=${dataPOST.date}&time=${dataPOST.time}`;
        }
        debug("Defined weight POST data: " + JSON.stringify(dataPOST) + "/" + bodyString);
        let targetURL = `${URL_BASE_WEIGHT}${URL_WEIGHT_POST}${URL_END}?${bodyString}`;
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
            .then(function (res_1) {
                return res_1.json();
            })
            .then(function (data) {
                debug("Successfully posted to web: " + JSON.stringify(data));
                returnObject.status = KEYS.RESOLVE;
                returnObject.data = KEYS.MESSAGE_POST_SUCCESS_API;
                return Promise.resolve(returnObject);
            })
            .catch(err => {
                debug('[FETCH error POST]: ' + JSON.stringify(err, undefined, 2));
                returnObject.data = `${KEYS.ERROR_API_POST_WEIGHT_LOG} / ${err}`;
                return Promise.reject(returnObject);
            });
    }
    catch (err_1) {
        debug('[Error in postWeightData]: ' + JSON.stringify(err_1, undefined, 2));
        returnObject.data = `${KEYS.ERROR_API_POST_WEIGHT_LOG} / ${err_1.data}`;
        return Promise.reject(returnObject);
    }
}   

async function refreshTokens() {

    let returnObject = {
        status: KEYS.REJECT,
        data: undefined
    };

    // get the current tokens from the storage
    let storedTOKEN = settingsStorage.getItem(KEYS.SETTINGS_KEY_OAUTH);
    let TOKEN;
    if (storedTOKEN) {
        TOKEN = JSON.parse(storedTOKEN);
        debug("Refresh Oauth token");
    } else {
        debug("No authentication stored. Please reconnect to FitBit in the app settings on the phone.");
        returnObject.data = KEYS.ERROR_API_TOKEN_OLD_REFRESH_TOKEN;
        return Promise.reject(returnObject);
    }

    try {
        const response = await fetch(`https://api.fitbit.com/oauth2/token?grant_type=refresh_token&refresh_token=${TOKEN.refresh_token}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${secrets.companion.basicAuth}`
            },
            body: `grant_type=refresh_token&refresh_token=${TOKEN.refresh_token}`
        });
        const json = await response.json();
        const response_1 = {
            status: response.status,
            body: json
        };
        debug(`Refresh tokens response: ${response_1.status} ${JSON.stringify(response_1.body, undefined, 2)}`);
        if (response_1.status === 200) {
            settingsStorage.setItem(KEYS.SETTINGS_KEY_OAUTH, JSON.stringify(response_1.body));
            returnObject.status = KEYS.RESOLVE;
            returnObject.data = response_1;
            return Promise.resolve(returnObject);
        }
        else {
            returnObject.data = KEYS.ERROR_API_TOKEN_GENERAL;
            return Promise.reject(returnObject);
        }
    }
    catch (err) {
        debug('[Error in requestTokens]: ' + JSON.stringify(err, undefined, 2));
        returnObject.data = err.data;
        return Promise.reject(returnObject);
    }
}

export { fetchWeightData, postWeightData, fetchProfileData };


