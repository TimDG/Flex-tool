// ==UserScript==
// @name         ELC Magnit/Flex Helper.
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Make this piece of $@%& usable.
// @author       You
// @match        https://prowand.pro-unlimited.com/wand/app/worker/index.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pro-unlimited.com
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js#sha512-pumBsjNRGGqkPzKHndZMaAG+bir374sORyzM3uulLV14lN5LyykqNk8eEeUlUkB3U0M4FApyaHraT65ihJhDpQ==
// @require      https://gist.githubusercontent.com/raw/2625891/waitForKeyElements.js
// @updateUrl    https://cdn.jsdelivr.net/gh/TimDG/Flex-tool@trunk/flex.user.js
// @downloadUrl  https://cdn.jsdelivr.net/gh/TimDG/Flex-tool@trunk/flex.user.js
// ==/UserScript==

const usability = JSON.parse(localStorage.usability);
var dateCards;

(function() {
    'use strict';

    //Wait until the UI is ready.
    waitForKeyElements("#submit-time-btn", loadTimeSheets);
})();

function enterDefault(day) {
    enterHoursForDay(day, usability.defaults.hours);
}

function enterHoursForDay(day, hours) {
    const element = $(day.card);
    triggerChange(element.find("[formcontrolname='hours']")
                  .val(hours));
    triggerChange(element.find("[formcontrolname='regularHours']")
                  .val(hours));

    const shiftSelect = element.find("[formcontrolname='shift']");
    fillInShift(shiftSelect, getShiftValue(day.date));
    triggerChange(shiftSelect);

    const costCenter = element.find("[formcontrolname='value']:eq(2)");
    //Yay, we need to simulate clicks. What could go wrong there?
    costCenter.click();
    waitForKeyElements("mat-option.mat-active", (node) => { node.click(); });
    triggerChange(costCenter);
}

//Make sure angular knows the field is changed, so it also posts the new info.
function triggerChange(field) {
    const event = new Event('input', { bubbles: true });
    field[0].dispatchEvent(event);
}

function getShiftValue(date) {
    switch (date.getDay()) {
        case 0: return usability.defaults.sunday;
        case 6: return usability.defaults.saturday;
        default: return usability.defaults.weekday;
    }
}

function fillInShift(element, shift) {
    //More clicks!!!
    element[0].click();
    waitForKeyElements("span.mat-option-text:contains('" + shift + "')", (node) => node.click() );
}

function loadTimeSheets() {
    //Get all date cards
    var cards = $("div[id^='scrollSpy']")
    dateCards = cards.map(function(index, element) {
        const date = getDate(element);
        return {
            card: element,
            date: date,
            logHours: shouldLogHours(date, element)
        };
    }).get()

    // Create the new button element
    const fillDefaults = $('<button>', {
        type: 'button',
        'mat-raised-button': '',
        color: 'accent',
        id: 'fill-defaults-btn',
        class: 'mat-focus-indicator mat-raised-button mat-button-base mat-accent'
    }).html('<span class="mat-button-wrapper"><div class="ng-star-inserted" style="">Fill defaults</div></span><span matripple="" class="mat-ripple mat-button-ripple"></span><span class="mat-button-focus-overlay"></span>')
    .css('background-color', '#4a61c4');

    // Insert the new button next to the button with id 'btn-submit'
    $('#submit-time-btn').before(fillDefaults);
    fillDefaults.click(() => fillInDefaults());

    //Update the day buttons on the left.
    updateSideNav();
}

function updateSideNav() {
    //Only do this on the ones we haven't processed yet.
    $("#workday-sidenav li").not('.usability-touched').each(function() {
        updateSideNavCard($(this)[0]);
    });
}

function updateSideNavCard(navCard) {
        //Fix the date.
        var dateParts = $(navCard).contents()[0].textContent.trim().split("/");
        var date = new Date(+dateParts[2], dateParts[0] - 1, +dateParts[1]);
        $(navCard).contents()[0].textContent = ' ' + dateParts[1] + '/' + dateParts[0] + '/' + dateParts[2] + ' ';

        //Add the edit icon (and make it useful)
        const matIcon = $('<mat-icon>')
            .text('edit')
            .addClass('mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color')
            .css({
                position: 'absolute',
                top: '50%',
                right: '0',
                'font-size': '15px'
            })
            .on('click', function() {
                const card = dateCards.filter(card => card.date.getDate() === date.getDate())[0];
                const hours = prompt("How many hours have you worked?");
                if (hours != null) {
                    enterHoursForDay(card, hours);
                    updateSideNav();
                }
            });
        $(navCard)
            .css('position', 'relative')
            .addClass('usability-touched')
            .append(matIcon);

    }

function getDate(dateCard) {
    const dateParts = $(dateCard).find(".date").text().split("/");
    return new Date(+dateParts[2], dateParts[0] - 1, +dateParts[1]);
}

//No need to log hours on weekend days or holidays.
function shouldLogHours(date, cardElement) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

    return !(isWeekend || isHoliday(cardElement));
}

function isHoliday(cardElement) {
    return $(cardElement).find('.holiday-warning-banner').length > 0;
}

function fillInDefaults() {
    const workDays = dateCards.filter(card => card.logHours);

    $.each(workDays, function(index, day) {
        enterDefault(day);
    });
    updateSideNav();
}
