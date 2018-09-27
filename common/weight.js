const LOCALE = {
    US: "en_US",
    UK: "en_UK",
    other: ""
}

const UNITS = {
    US: "pounds",
    UK: "stone",
    other: "kg"
}

class Weight {

    constructor ( date, weight, fat, unit ) {

        this.date = date;
        this.weight = weight;
        this.fat = fat;
        this.unit = unit || UNITS.other;
        this.bmi = undefined;
        this.logID = undefined;
        
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

class Fat {

    constructor ( date, fat ) {

        this.date = date;
        this.fat = fat;
        this.bmi = undefined;
        this.logID = undefined;
        
    }
    
    initFromWebData(data, unit) {

        let dateString = data.date + "T" + data.time;
        this.date = new Date(dateString);
        this.fat = data.fat;
        this.logID = data.logID;

    }

}
export {LOCALE, UNITS, Weight, Fat};