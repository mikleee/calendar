(() => {
    const calendarService = new CalendarService();
    calendarService
        .createEvent(
            Object.values(calendarService.storage.days)[0].id,
            'test event 1',
            10,
            13,
            [Object.values(calendarService.storage.users)[0].id]
        );
    calendarService
        .createEvent(
            Object.values(calendarService.storage.days)[1].id,
            'test event 2',
            15,
            16,
            [Object.values(calendarService.storage.users)[0].id]
        )
    calendarService
        .createEvent(
            Object.values(calendarService.storage.days)[2].id,
            'test event 3',
            11,
            17,
            [Object.values(calendarService.storage.users)[1].id]
        )
    calendarService
        .createEvent(
            Object.values(calendarService.storage.days)[3].id,
            'test event 4',
            16,
            17,
            [Object.values(calendarService.storage.users)[3].id]
        )

    window.addEventListener('load', () => {
        const calendarContainer = document.getElementById('calendar-container');
        let selectedUserId = Object.values(calendarService.storage.users)[0].id;

        renderCalendarScreen();


        function renderCalendarScreen() {
            calendarContainer.innerHTML = `
                <div>
                    <div style="display: flex; width: 50%; justify-content:space-between">
                        <div><label for="users">Users</label></div>
                        <div><select id="users"></select></div>
                    </div>
                </div>
                <div>
                    <div id="days" style="display: flex; width: 50%; justify-content:space-between"></div>
                </div>
                <div style="display: flex; width: 50%; justify-content:space-between">
                    <div></div>
                    <div><button id="renderCreateEventScreen">Create Event</button></div>
                </div>
            `;

            const daysContainer = document.getElementById('days');
            renderDays(daysContainer);

            const usersSelect = document.getElementById('users');
            for (const user of Object.values(calendarService.storage.users)) {
                usersSelect.innerHTML += `
                    <option value="${user.id}" ${user.id === selectedUserId ? 'selected' : ''}>${user.name}</option>
                `;
            }
            usersSelect.addEventListener('change', () => {
                selectedUserId = Number(usersSelect.value);
                renderDays(daysContainer);
            })

            document.getElementById('renderCreateEventScreen').addEventListener('click', () => {
                renderCreateEventScreen();
            })


        }

        function renderDays(daysContainer) {
            daysContainer.innerHTML = '';
            for (const day of Object.values(calendarService.storage.days)) {
                let dayContainer = document.createElement('div');
                dayContainer.setAttribute('id', `day-${day.id}`);
                dayContainer.style.flexGrow = 1;
                dayContainer.innerHTML = `
                    <div>
                        <div>${day.name}</div>
                    </div>
                    <div>
                        <div id="day-times-${day.id}" style="position: relative"></div>
                    </div>
                `;
                daysContainer.appendChild(dayContainer);

                let dayEventsContainer = document.getElementById(`day-times-${day.id}`);
                renderDayEvents(day, dayEventsContainer);
            }

        }

        function renderDayEvents(day, dayEventsContainer) {
            const minHour = 10;
            const maxHour = 18;

            for (let i = minHour; i <= maxHour; i++) {
                let eventContainer = document.createElement('div');
                eventContainer.setAttribute('id', `day-time-${day.id}-${i}`);
                eventContainer.innerHTML = `
                        <div style="border: 1px solid grey; height: 30px; width: 100%"></div>
                `;
                dayEventsContainer.appendChild(eventContainer);
            }

            let hourDistance = dayEventsContainer.offsetHeight / (maxHour - minHour + 1);


            for (let event of day.events.filter(e => e.users.map(u => u.id).includes(selectedUserId))) {
                let eventContainer = document.createElement('div');
                eventContainer.setAttribute('id', `day-time-${day.id}-event-${event.id}`);
                eventContainer.style.width = '100%';
                eventContainer.style.height = '30px';
                eventContainer.style.position = 'absolute';
                eventContainer.style.border = '1px #0080008f solid';
                eventContainer.style.background = '#00800036';
                eventContainer.style.top = (event.start - minHour) * hourDistance + 'px';
                eventContainer.style.height = (event.end - event.start) * hourDistance + 'px';
                eventContainer.innerHTML = `
                    <span>${event.name}</span>
                    <small data-role="delete-event" style="position: absolute; top: 0; right: 0">remove</small>
                `;
                dayEventsContainer.appendChild(eventContainer);

                eventContainer.querySelector('[data-role="delete-event"]').addEventListener('click', () => {
                    calendarService.deleteEvent(event.id);
                    eventContainer.remove();
                });
            }

        }

        function renderCreateEventScreen() {
            calendarContainer.innerHTML = `
                <form id="createEventForm">
                    <div>
                        <div style="display: flex; width: 50%; justify-content:space-between">
                            <div><label for="eventName">Name</label></div>
                            <div><input type="text" id="eventName" name="eventName"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; width: 50%; justify-content:space-between">
                            <div><label for="eventDays">Day</label></div>
                            <div><select id="eventDays" name="eventDays"></select></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; width: 50%; justify-content:space-between">
                            <div><label for="eventStart">Start</label></div>
                            <div><input type="text" id="eventStart" name="eventStart"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; width: 50%; justify-content:space-between">
                            <div><label for="eventEnd">End</label></div>
                            <div><input type="text" id="eventEnd" name="eventEnd"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; width: 50%; justify-content:space-between">
                            <div><label for="eventUsers">Day</label></div>
                            <div><select id="eventUsers" name="eventUsers" multiple></select></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; width: 50%; justify-content:space-between">
                            <div></div>
                            <div><button id="createEvent">Create</button></div>
                        </div>
                    </div>
                </form>
            `;

            const usersSelect = document.getElementById('eventUsers');
            for (const user of Object.values(calendarService.storage.users)) {
                usersSelect.innerHTML += `
                    <option value="${user.id}">${user.name}</option>
                `;
            }

            const daysSelect = document.getElementById('eventDays');
            for (const day of Object.values(calendarService.storage.days)) {
                daysSelect.innerHTML += `
                    <option value="${day.id}">${day.name}</option>
                `;
            }

            document.getElementById('createEventForm').addEventListener('submit', (event) => {
                event.preventDefault();
                let elements = event.target.elements;

                calendarService.createEvent(
                    Number(elements.eventDays.value),
                    elements.eventName.value,
                    Number(elements.eventStart.value),
                    Number(elements.eventEnd.value),
                    [...elements.eventUsers.querySelectorAll('option:checked')].map(elem => Number(elem.value))
                )


                renderCalendarScreen();
            })
        }

        function renderCreateEvent() {

        }

    });

})();



