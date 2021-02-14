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
        const eventFormService = new EventFormService(calendarService);
        const calendarContainer = document.getElementById('calendar-container');

        let selectedUserId = Object.values(calendarService.storage.users)[0].id;

        renderCalendarScreen();


        function renderCalendarScreen() {
            calendarContainer.innerHTML = `
                <div>
                    <div class="input-row">
                        <div><label for="users">Users</label></div>
                        <div><select id="users"></select></div>
                    </div>
                </div>
                <div>
                    <div id="days" class="days"></div>
                </div>
                <div class="input-row">
                    <div></div>
                    <div><button id="renderCreateEventScreen">Create Event</button></div>
                </div>
            `;

            const daysContainer = document.getElementById('days');
            renderDays(daysContainer);

            const usersSelect = document.getElementById('users');
            for (const user of Object.values(calendarService.storage.users)) {
                usersSelect.innerHTML += `
                    <option value="${user.id}">${user.name}</option>
                `;
            }
            usersSelect.addEventListener('change', () => {
                selectedUserId = Number(usersSelect.value);
                renderDays(daysContainer);
            })

            document.getElementById('renderCreateEventScreen').addEventListener('click', () => {
                eventFormService.renderEventFrom(calendarContainer)
                    .then(
                        renderCalendarScreen,
                        renderCalendarScreen
                    );
            })


        }

        function renderDays(daysContainer) {
            daysContainer.innerHTML = '';
            for (const day of Object.values(calendarService.storage.days)) {
                let dayContainer = document.createElement('div');
                dayContainer.setAttribute('id', `day-${day.id}`);
                dayContainer.classList.add('day');
                dayContainer.innerHTML = `
                    <div>
                        <div>${day.name}</div>
                    </div>
                    <div>
                        <div id="day-times-${day.id}" data-day-times="${day.id}" style="position: relative"></div>
                    </div>
                `;
                daysContainer.appendChild(dayContainer);

                let dayEventsContainer = document.getElementById(`day-times-${day.id}`);
                renderDayTimeGrid(day, dayEventsContainer);
                renderDayEvents(day, dayEventsContainer);
            }

            enableDayEventsDragAndDrop(daysContainer);
        }

        function renderDayTimeGrid(day, dayEventsContainer) {
            const minHour = day.minHour;
            const maxHour = day.maxHour;

            for (let i = minHour; i <= maxHour; i++) {
                let eventContainer = document.createElement('div');
                eventContainer.setAttribute('id', `data-day-time-${day.id}-${i}`);
                eventContainer.classList.add('day-time-cell');
                eventContainer.innerHTML = `
                        <div></div>
                `;
                dayEventsContainer.appendChild(eventContainer);
            }
        }

        function renderDayEvents(day, dayEventsContainer) {
            dayEventsContainer.querySelectorAll('[data-event]').forEach(e => e.remove());

            const minHour = day.minHour;
            const maxHour = day.maxHour;

            let hourDistance = dayEventsContainer.offsetHeight / (maxHour - minHour + 1);

            for (let event of day.events.filter(e => e.users.map(u => u.id).includes(selectedUserId))) {
                let eventContainer = document.createElement('div');
                eventContainer.setAttribute('id', `day-time-${day.id}-event-${event.id}`);
                eventContainer.setAttribute('data-event', `${event.id}`);
                eventContainer.classList.add('event');
                eventContainer.style.top = (event.time.start - minHour) * hourDistance + 'px';
                eventContainer.style.height = (event.time.end - event.time.start) * hourDistance + 'px';
                eventContainer.innerHTML = `
                    <div>${event.name}</div>
                    <div data-delete-event="${event.id}" class="delete-event">&times;</div>
                `;
                dayEventsContainer.appendChild(eventContainer);

                eventContainer.querySelector('[data-delete-event]').addEventListener('click', (e) => {
                    calendarService.deleteEvent(event.id);
                    eventContainer.remove();
                });
            }
        }

        function enableDayEventsDragAndDrop(daysContainer) {
            daysContainer.querySelectorAll('[data-event]').forEach(elem => {
                let calendarEvent = calendarService.getEventById(Number(elem.getAttribute('data-event')))

                let initialStyles = {
                    zIndex: elem.style.zIndex,
                    position: elem.style.position,
                    width: elem.style.width
                };
                let modifiedStyles = {
                    zIndex: null,
                    position: null,
                    width: null
                };

                let initialPosition = getPosition(elem);
                let initialCursorPosition;

                // elem.ondragstart = function () {
                //     return false;
                // };


                elem.onmousedown = function (event) {
                    if (event.target.hasAttribute('data-delete-event')) {
                        return;
                    }

                    let daysGrid = getDaysGrid(event);

                    modifiedStyles.position = 'absolute';
                    modifiedStyles.zIndex = '1000';
                    if (modifiedStyles.width == null) {
                        modifiedStyles.width = elem.clientWidth + 'px';
                    }
                    for (const [k, v] of Object.entries(modifiedStyles)) {
                        elem.style[k] = v;
                    }
                    if (initialCursorPosition == null) {
                        initialCursorPosition = {x: event.pageX, y: event.pageY};
                    }

                    document.body.appendChild(elem);

                    moveAt(event.pageX, event.pageY);


                    function moveAt(pageX, pageY) {
                        let xdiff = pageX - initialCursorPosition.x;
                        let ydiff = pageY - initialCursorPosition.y;

                        elem.style.left = initialPosition.left + xdiff + 'px';
                        elem.style.top = initialPosition.top + ydiff + 'px';
                    }

                    function onMouseMove(event) {
                        moveAt(event.pageX, event.pageY);

                        let position = getPosition(event.target);
                        let targetDayTime = defineTargetDayTime(position.left, position.top, daysGrid);
                        if (targetDayTime) {
                            elem.classList.remove('event-position-valid')
                            elem.classList.remove('event-position-invalid')
                            if (calendarService.isEventTimeValid(targetDayTime.day.id, targetDayTime.start, targetDayTime.start + (calendarEvent.time.end - calendarEvent.time.start))) {
                                elem.classList.add('event-position-valid')
                            } else {
                                elem.classList.add('event-position-invalid')
                            }
                        }
                    }

                    document.addEventListener('mousemove', onMouseMove);


                    elem.onmouseup = function (event) {
                       debugger;
                        let position = getPosition(event.target);
                        let targetDayTime = defineTargetDayTime(position.left, position.top, daysGrid);
                        if (targetDayTime) {
                            if (calendarService.isEventTimeValid(targetDayTime.day.id, targetDayTime.start, targetDayTime.start + (calendarEvent.time.end - calendarEvent.time.start))) {
                                calendarService.changeEventDayTime(calendarEvent.id, targetDayTime.day.id, targetDayTime.start);
                            }
                        }

                        document.removeEventListener('mousemove', onMouseMove);
                        elem.onmouseup = null;
                        for (const [k, v] of Object.entries(initialStyles)) {
                            elem.style[k] = v;
                        }


                        for (const day of Object.values(calendarService.storage.days)) {
                            let dayEventsContainer = document.getElementById(`day-times-${day.id}`);
                            renderDayEvents(day, dayEventsContainer);
                        }
                        enableDayEventsDragAndDrop(daysContainer);
                        elem.remove();

                    };

                    function getDaysGrid() {
                        return [...daysContainer.querySelectorAll('[data-day-times]')].reduce((grid, e) => {
                            let position = getPosition(e);

                            grid.push({
                                dayId: Number(e.getAttribute('data-day-times')),
                                top: position.top,
                                bottom: position.top + e.offsetHeight,
                                left: position.left,
                                right: position.left + e.offsetWidth,
                                width: e.offsetWidth,
                                height: e.offsetHeight
                            })
                            return grid;
                        }, []);
                    }

                    function defineTargetDayTime(x, y, daysGrid) {
                        for (const cell of daysGrid) {
                            if (x >= cell.left && x <= cell.right && y >= cell.top && y <= cell.bottom) {

                                let day = calendarService.storage.days[cell.dayId];
                                let hourInPx = cell.height / (day.maxHour - day.minHour + 1);
                                let offset = y - cell.top;
                                let hours = day.minHour + offset / hourInPx - 1;

                                return {
                                    day: day,
                                    start: Math.ceil(hours)
                                }
                            }
                        }
                        return null;
                    }
                };

                function getPosition(elem) {
                    let result = {top: 0, left: 0};
                    while (elem) {
                        result.top += elem.offsetTop;
                        result.left += elem.offsetLeft;
                        elem = elem.offsetParent;
                    }
                    return result;
                }
            });
        }

    });

})();



