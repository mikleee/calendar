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
                    <div id="time-grid" class="time-grid"></div>
                </div>
                <div class="input-row">
                    <div></div>
                    <div><button id="renderCreateEventScreen">Create Event</button></div>
                </div>
            `;


            const usersSelect = document.getElementById('users');
            for (const user of Object.values(calendarService.storage.users)) {
                usersSelect.innerHTML += `
                    <option value="${user.id}">${user.name}</option>
                `;
            }
            usersSelect.addEventListener('change', () => {
                selectedUserId = Number(usersSelect.value);
                initDayEvents(timeGridContainer);
            })

            const timeGridContainer = document.getElementById('time-grid');
            renderTimeGrid(timeGridContainer);
            initDayEvents(timeGridContainer);


            document.getElementById('renderCreateEventScreen').addEventListener('click', () => {
                eventFormService.renderEventFrom(calendarContainer)
                    .then(
                        renderCalendarScreen,
                        renderCalendarScreen
                    );
            })


        }

        function renderTimeGrid(timeGridContainer) {
            timeGridContainer.innerHTML = '';

            let days = calendarService.getDays();


            // render axis
            {
                let id = 'axis';
                let minHour = Math.min(...days.map(d => d.minHour));
                let maxHour = Math.min(...days.map(d => d.maxHour));

                timeGridContainer.innerHTML += getTimeColumnHtml(id, '', 'axis');
                let timeColumnContainer = timeGridContainer.querySelector(`#time-column-grid-${id}`);
                for (let i = minHour; i <= maxHour; i++) {
                    timeColumnContainer.innerHTML += getTimeCellHtml(id, i, i);
                }
            }

            // render days
            for (const day of days) {
                let id = day.id;
                let minHour = day.minHour;
                let maxHour = day.maxHour;

                timeGridContainer.innerHTML += getTimeColumnHtml(id, day.name);
                let timeColumnContainer = timeGridContainer.querySelector(`#time-column-grid-${id}`);
                for (let i = minHour; i < maxHour; i++) {
                    timeColumnContainer.innerHTML += getTimeCellHtml(id, i, '');
                }
            }

            function getTimeColumnHtml(id, title, cssClass) {
                return `
                        <div id="time-column-${id}" class="time-column ${cssClass || ''}">
                            <div class="time-cell time-column-header"><div class="time-column-title">${title}</div></div>
                            <div id="time-column-grid-${id}" data-time-column-grid="${id}" style="position: relative"></div>
                        </div>
                `;
            }

            function getTimeCellHtml(id, time, text) {
                return `<div id="time-cell-${id}-${time}" data-time-cell="${id}-${time}" class="time-cell"><div class="time-cell-content">${text}</div></div>`
            }
        }

        function initDayEvents(timeGridContainer) {
            renderDayEvents(timeGridContainer);
            enableDayEventsDragAndDrop(timeGridContainer);
        }

        function renderDayEvents(timeGridContainer) {
            timeGridContainer.querySelectorAll('[data-event]').forEach(e => e.remove());

            let days = calendarService.getDays();
            let daysGrid = getDaysGrid(timeGridContainer);

            for (const day of days) {
                const dayGrid = daysGrid[day.id];
                const minHour = day.minHour;
                const maxHour = day.maxHour;
                const hourDistance = timeGridContainer.querySelector(`#time-column-grid-${day.id}`).offsetHeight / (maxHour - minHour);

                let events = day.events.filter(e => e.users.map(u => u.id).includes(selectedUserId));
                for (let event of events) {
                    let eventContainer = document.createElement(`div`);
                    timeGridContainer.appendChild(eventContainer);

                    eventContainer.setAttribute('id', `event-${event.id}`);
                    eventContainer.setAttribute('data-event', `${event.id}`);
                    eventContainer.setAttribute('data-event-day', `${day.id}`);
                    eventContainer.setAttribute('data-event-start-time', `${event.time.start}`);
                    eventContainer.setAttribute('data-event-end-time', `${event.time.end}`);
                    eventContainer.classList.add('event');

                    eventContainer.innerHTML = `
                        <div>
                            <div class="event-title">${event.name}</div>
                            <div class="event-content"></div>
                            <div data-event-delete="${event.id}" class="event-delete">&times;</div>
                        </div>
                    `;

                    eventContainer.style.position = 'absolute';
                    eventContainer.style.top = dayGrid.top + (event.time.start - minHour) * hourDistance + 'px';
                    eventContainer.style.height = (event.time.end - event.time.start) * hourDistance + 'px';
                    eventContainer.style.left = dayGrid.left + 'px';
                    eventContainer.style.width = dayGrid.width + 'px';

                    eventContainer.querySelector('[data-event-delete]').addEventListener('click', (e) => {
                        calendarService.deleteEvent(event.id);
                        eventContainer.remove();
                    });

                }
            }


        }


        function enableDayEventsDragAndDrop(timeGridContainer) {
            timeGridContainer.querySelectorAll('[data-event]').forEach(elem => {
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

                let initialPosition = getPosition(elem, timeGridContainer);
                let initialCursorPosition;

                // elem.ondragstart = function () {
                //     return false;
                // };


                elem.onmousedown = function (event) {
                    if (event.target.hasAttribute('data-event-delete')) {
                        return;
                    }

                    let daysGrid = getDaysGrid(timeGridContainer);

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

                    function moveAt(pageX, pageY) {
                        let xdiff = pageX - initialCursorPosition.x;
                        let ydiff = pageY - initialCursorPosition.y;

                        elem.style.left = initialPosition.left + xdiff + 'px';
                        elem.style.top = initialPosition.top + ydiff + 'px';
                    }

                    function onMouseMove(event) {
                        moveAt(event.pageX, event.pageY);

                        let position = getPosition(elem, timeGridContainer);
                        let targetDayTime = defineTargetDayTime(position.left, position.top, daysGrid);
                        elem.classList.remove('event-position-valid');
                        elem.classList.remove('event-position-invalid');

                        if (targetDayTime) {
                            if (calendarService.isEventTimeValid(targetDayTime.day.id, targetDayTime.start, targetDayTime.start + (calendarEvent.time.end - calendarEvent.time.start), calendarEvent.id)) {
                                elem.classList.add('event-position-valid');
                            } else {
                                elem.classList.add('event-position-invalid');
                            }
                        } else {
                            elem.classList.add('event-position-invalid');
                        }
                    }

                    document.addEventListener('mousemove', onMouseMove);


                    elem.onmouseup = function (event) {
                        let position = getPosition(elem, timeGridContainer);
                        let targetDayTime = defineTargetDayTime(position.left, position.top, daysGrid);
                        if (targetDayTime) {
                            if (calendarService.isEventTimeValid(targetDayTime.day.id, targetDayTime.start, targetDayTime.start + (calendarEvent.time.end - calendarEvent.time.start), calendarEvent.id)) {
                                calendarService.changeEventDayTime(calendarEvent.id, targetDayTime.day.id, targetDayTime.start);
                            }
                        }

                        document.removeEventListener('mousemove', onMouseMove);
                        elem.onmouseup = null;
                        for (const [k, v] of Object.entries(initialStyles)) {
                            elem.style[k] = v;
                        }

                        initDayEvents(timeGridContainer);
                        elem.remove();

                    };

                    function defineTargetDayTime(x, y, daysGrid) {
                        for (const cell of Object.values(daysGrid)) {
                            if (x >= cell.left && x <= cell.right && y >= cell.top && y <= cell.bottom) {

                                let day = calendarService.storage.days[cell.dayId];
                                let hourInPx = cell.height / (day.maxHour - day.minHour);
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


            });
        }

        function getPosition(elem, parent) {
            let result = {top: 0, left: 0};
            while (elem && elem !== parent) {
                result.top += elem.offsetTop;
                result.left += elem.offsetLeft;
                elem = elem.offsetParent;
            }
            return result;
        }

        function getDaysGrid(timeGridContainer) {
            return [...timeGridContainer.querySelectorAll('[data-time-column-grid]')].reduce((grid, e) => {
                let position = getPosition(e, timeGridContainer);
                let id = e.getAttribute('data-time-column-grid');
                if (id !== 'axis') {
                    id = Number(id);
                    grid[id] = {
                        dayId: id,
                        element: e,
                        top: position.top,
                        bottom: position.top + e.offsetHeight,
                        left: position.left,
                        right: position.left + e.offsetWidth,
                        width: e.offsetWidth,
                        height: e.offsetHeight
                    }
                }
                return grid;
            }, {});
        }

    });

})();



