class CalendarService {

    constructor() {
        this.sequence = new Sequence();
        this.storage = {
            days: {},
            users: {},
        };

        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(name => {
            const id = this.sequence.getNext();
            this.storage.days[id] = new Day(id, name);
        });

        ['Vanya', 'Vasya', 'Hren', 'Sobaka', 'Kolobok'].forEach(name => {
            const id = this.sequence.getNext();
            this.storage.users[id] = new User(id, name);
        });
    }


    createEvent(dayId, name, start, end, userIds) {
        const id = this.sequence.getNext();
        const event = new Event(id, name, start, end);
        userIds.forEach(userId => event.users.push(this.storage.users[userId]));
        this.storage.days[dayId].events.push(event);
        return event;
    }

    changeEventDayTime(dayId, eventId) {

    }

    deleteEvent(eventId) {
        Object.values(this.storage.days).forEach(day => {
            day.events = day.events.filter(event => event.id !== eventId);
        });
    }

    isEventTimeValid(dayId, start, end) {
        let day = this.storage.days[dayId];
        if (start < day.minHour) {
            return false;
        }
        if (end > day.maxHour) {
            return false;
        }
        if (start >= end) {
            return false;
        }

        let events = day.events.sort((e1, e2) => e2.time.start - e1.time.start);
        for (let event of events) {
            // inside
            if (start >= event.time.start && start < event.time.end ||
                end > event.time.start && end < event.time.end) {
                return false;
            }
            //overlaps
            if (start <= event.time.start && end >= event.time.end) {
                return false;
            }
        }

        return true;
    }

    getAvailableTime(dayId) {
        let result = [];
        let day = this.storage.days[dayId];


        if (day.events.length) {
            let startFree = day.minHour;

            day.events
                .sort((e1, e2) => e2.time.start - e1.time.start)
                .forEach(event => {
                    if (startFree < event.time.start) {
                        result.push(new TimeInterval(startFree, event.time.start));
                    }
                    startFree = event.time.end;
                });
            if (startFree < day.maxHour) {
                result.push(new TimeInterval(startFree, day.maxHour));
            }

        } else {
            result.push(new TimeInterval(day.minHour, day.maxHour));
        }
        return result;
    }


}


class Sequence {

    constructor() {
        this.cursor = 0;
    }

    getNext() {
        return this.cursor++;
    }
}

class Entity {

    constructor(id) {
        this.id = id;
    }
}


class Day extends Entity {

    constructor(id, name) {
        super(id);
        this.name = name;
        this.events = [];
        this.minHour = 10;
        this.maxHour = 18;
    }
}

class Event extends Entity {

    constructor(id, name, start, end) {
        super(id);
        this.name = name;
        this.time = new TimeInterval(start, end);
        this.users = [];
    }
}

class TimeInterval {

    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}


class User extends Entity {

    constructor(id, name) {
        super(id);
        this.name = name;
    }
}