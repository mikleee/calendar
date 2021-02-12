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
    }
}

class Event extends Entity {

    constructor(id, name, start, end) {
        super(id);
        this.name = name;
        this.start = start;
        this.end = end;
        this.users = [];
    }
}

class User extends Entity {

    constructor(id, name) {
        super(id);
        this.name = name;
    }
}