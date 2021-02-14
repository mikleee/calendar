class EventFormService {

    constructor(calendarService) {
        this.calendarService = calendarService;
        this.template = `
                <form id="createEventForm" class="event-form">
                    <div class="input-row">
                        <div><label for="eventName">Name</label></div>
                        <div><input type="text" id="eventName" name="eventName"></div>
                    </div>
                    <div class="input-row">
                        <div><label for="eventDays">Day</label></div>
                        <div><select id="eventDays" name="eventDays"></select></div>
                    </div>
                    <div class="input-row">
                        <div></div>
                        <div><div id="timeReport"></div></div>
                    </div>
                    <div class="input-row">
                        <div><label for="eventStart">Start</label></div>
                        <div><input type="text" id="eventStart" name="eventStart"></div>
                    </div>
                    <div class="input-row">
                        <div><label for="eventEnd">End</label></div>
                        <div><input type="text" id="eventEnd" name="eventEnd"></div>
                    </div>
                    <div class="input-row">
                        <div><label for="eventUsers">User</label></div>
                        <div><select id="eventUsers" name="eventUsers" multiple></select></div>
                    </div>
                    <div class="input-row">
                        <div></div>
                        <div>
                            <button id="cancelCreateEvent" type="button">Back</button>
                            <button id="createEvent" type="submit">Create</button>
                        </div>
                    </div>
                </form>
            `;
    }


    renderEventFrom(container) {
        container.innerHTML = this.template;

        let form = container.querySelector('#createEventForm');
        this._populateUsersSelect(form);
        this._populateDaysSelect(form);

        return new Promise((resolve, reject) => {
            form.querySelector('#cancelCreateEvent').addEventListener('click', () => reject());

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                let result = this._submitForm(form);
                if (result.valid) {
                    let event = this.calendarService.createEvent(
                        result.dayId,
                        result.name,
                        result.start,
                        result.end,
                        result.users
                    );
                    resolve(event);
                }
            });
        });
    }

    _populateUsersSelect(form) {
        const usersSelect = form.querySelector('#eventUsers');
        for (const user of Object.values(this.calendarService.storage.users)) {
            usersSelect.innerHTML += `
                        <option value="${user.id}">${user.name}</option>
                `;
        }
    }

    _populateDaysSelect(form) {
        const daysSelect = form.querySelector('#eventDays');
        for (const day of Object.values(this.calendarService.storage.days)) {
            daysSelect.innerHTML += `
                        <option value="${day.id}">${day.name}</option>
                `;
        }

        const onDayChange = (select) => {
            let dayId = Number(select.value);
            let freeTimesElement = document.getElementById('timeReport');

            let freeTimes = this.calendarService.getAvailableTime(dayId);
            if (freeTimes.length) {
                freeTimesElement.innerHTML = freeTimes.reduce((html, time) => {
                    html += `<i style="display: inline-block; margin: 0 3px">${time.start}-${time.end}</i>`;
                    return html;
                }, 'Free time: ')
            } else {
                freeTimesElement.innerHTML = 'No available time left';
            }
        }

        onDayChange(daysSelect);
        daysSelect.addEventListener('change', () => {
            this._removeValidation(form);
            onDayChange(daysSelect);
        });

    }

    _appendValidation(element, message, context) {
        let validationElement = document.createElement('div');
        validationElement.setAttribute('validation-message', '');
        validationElement.classList.add('validation-message');
        validationElement.innerHTML = `<div>${message}</div>`;
        element.after(validationElement);
        context.valid = false;
    }

    _removeValidation(form) {
        form.querySelectorAll('[validation-message]').forEach(e => e.remove());
    }

    _submitForm(form) {
        this._removeValidation(form);

        let elements = form.elements;
        let result = {valid: true};
        let eventNameElement = elements['eventName'];
        let dayElement = elements['eventDays'];
        let eventStartElement = elements['eventStart'];
        let eventEndElement = elements['eventEnd'];
        let eventUsersElement = elements['eventUsers'];
        let timeReportElement = form.querySelector('#timeReport');

        result.name = eventNameElement.value
        if (eventNameElement.value === '') {
            this._appendValidation(eventNameElement, 'Enter event name', result);
        }
        if (dayElement.value === '') {
            this._appendValidation(dayElement, 'Select day', result);
        } else {
            result.dayId = Number(dayElement.value);
        }
        if (eventStartElement.value === '') {
            this._appendValidation(eventStartElement, 'Enter start time', result);
        } else if (isNaN(eventStartElement.value) || Number(eventStartElement.value) < 0) {
            this._appendValidation(eventStartElement, 'Start time should have a positive numeric value', result);
        } else {
            result.start = Number(eventStartElement.value);
        }
        if (eventEndElement.value === '') {
            this._appendValidation(eventEndElement, 'Enter end time', result);
        } else if (isNaN(eventEndElement.value) || Number(eventEndElement.value) < 0) {
            this._appendValidation(eventEndElement, 'End time should have a positive numeric value', result);
        } else {
            result.end = Number(eventEndElement.value);
        }
        result.users = [...eventUsersElement.querySelectorAll('option:checked')].map(elem => Number(elem.value));
        if (result.users.length === 0) {
            this._appendValidation(eventUsersElement, 'Select at least one user', result);
        }
        if (result.valid && !this.calendarService.isEventTimeValid(result.dayId, result.start, result.end)) {
            this._appendValidation(timeReportElement, `${result.start}-${result.end} time is occupied`, result);
        }

        return result;
    }


}