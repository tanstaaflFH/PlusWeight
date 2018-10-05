import { UUID } from "../common/utils";

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
    
    initFromWebData(data, unit) {

        let dateString = (data.date + "T" + data.time);
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