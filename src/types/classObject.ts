import { EventAttributes, DateArray } from 'ics';
import seedrandom from 'seedrandom';
import { customRandom, urlAlphabet } from 'nanoid';
import ClassData from "./interfaceData";

interface DateNum {
    year: number;
    month: number;
    day: number;
}

const getDateNum = (date: string): DateNum => {
    const [day, month, year] = date.split('.').map(Number);
    return { year: year, month: month - 1, day: day };
}

const setDateTime = (time: string, date: DateNum): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(date.year, date.month, date.day, hours, minutes);
}

const dateTimeArray = (date: Date): DateArray => {
    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes()
    ];
}

class Class {
    name: string;
    longName: string;
    type: string;
    comment: string;
    place: string[];
    data: string[];
    start: Date;
    end: Date;

    constructor(data: ClassData) {
        this.name = data.name;
        this.longName = data.longName;
        this.type = data.type;
        this.comment = data.comment;
        this.place = data.place;
        this.data = data.data;

        const date = getDateNum(data.date);
        const [timeStart, timeEnd] = data.time.split('-');
        this.start = setDateTime(timeStart, date);
        this.end = setDateTime(timeEnd, date);
    }

    toIcsEvent(): EventAttributes {
        const location = this.place.length > 2 ? this.place[2] : undefined;

        return {
            start: dateTimeArray(this.start),
            end: dateTimeArray(this.end),
            uid: this.getUID(),
            title: this.getSummary(),
            description: this.getDescription(),
            location,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
        };
    }

    private getDescription(): string {
        const firstRow = this.longName ? `${this.longName}\n\n` : '';
        return `${firstRow}${this.data.join('\n')}`;
    }

    private getSummary(): string {
        const textArr = [];
        if (this.place.length > 1) textArr.push(this.place[1]);
        if (this.comment) textArr.push(this.comment);
        const place = textArr.length > 0 ? ` (${textArr.join(', ')})` : '';
        const type = this.type ? ` – ${this.type}` : '';
        return `${this.name}${place}${type}`
    }

    private getUID(): string {
        const rng = seedrandom(`${this.start}`);
        const nanoid = customRandom(urlAlphabet, 21, size => {
            return new Uint8Array(size).map(() => 256 * rng());
        });
        return nanoid();
    }

}

export default Class;