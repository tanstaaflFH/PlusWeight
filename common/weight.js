import { UUID, zeroPad } from "../common/utils";

const LOCALE = {
    US: "en_US",
    other: ""
}

const UNITS = {
    US: "lbs",
    other: "kg"
}

class Weight {

    constructor ( date, weight, fat, unit ) {

        this.date = date;
        this.weight = weight;
        this.fat = fat;
        this.unit = unit || UNITS.other;
        this.bmi = undefined;
        this.logID = UUID();
        
    }
    
    initFromWebData(data, unit, UTCoffsetMs) {

        let dateString = UTCoffsetMs.raw == 0 ? (`${data.date}T${data.time}Z`) : (`${data.date}T${data.time}${UTCoffsetMs.sign}${UTCoffsetMs.hoursString}:${UTCoffsetMs.minutesString}`);
        this.date = dateString;
        this.weight = data.weight;
        this.fat = data.fat;
        this.bmi = data.bmi;
        this.logID = data.logID;
        this.unit = unit;
    }

}

export {
    LOCALE, 
    UNITS, 
    Weight
};