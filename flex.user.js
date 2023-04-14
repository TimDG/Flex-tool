// ==UserScript==
// @name         ELC Magnit/Flex Helper.
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Make this piece of $@%& usable.
// @author       You
// @match        https://prowand.pro-unlimited.com/wand/app/worker/index.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pro-unlimited.com
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js
// @require      https://gist.githubusercontent.com/raw/2625891/waitForKeyElements.js
// ==/UserScript==


(function() {
    'use strict';

    waitForKeyElements("#submit-time-btn", loadTimeSheets);
})();

function enterDefault(day, usability) {
    const element = $(day.card);
    element.find("[formcontrolname='hours']").val(usability.defaults.hours);
    element.find("[formcontrolname='regularHours']").val(usability.defaults.hours);

    const shiftSelect = element.find("[formcontrolname='shift']");
    fillInShift(shiftSelect, getShiftValue(day.date, usability));

    element.find("[formcontrolname='value']:first()").click();
    waitForKeyElements("mat-option.mat-active", (node) => { node.click(); });
}

function getShiftValue(date, usability) {
    switch (date.getDay()) {
        case 0: return usability.defaults.sunday;
        case 6: return usability.defaults.saturday;
        default: return usability.defaults.weekday;
    }
}

function fillInShift(element, shift) {
    element[0].click();
    waitForKeyElements("span.mat-option-text:contains('" + shift + "')", selectShift );
}

function selectShift(node) {
    node.click();
}

function loadTimeSheets() {
    //Get all date cards
    var dateCards = $("div[id^='scrollSpy']")
    console.log(dateCards);
    dateCards = dateCards.map(function(index, element) {
        const date = getDate(element);
        return {
            card: element,
            date: date,
            logHours: shouldLogHours(date, element)
        };
    }).get()
    console.log(dateCards);

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
    fillDefaults.click(() => fillInDefaults(dateCards));

}

function getDate(dateCard) {
    const dateParts = $(dateCard).find(".date").text().split("/");
    return new Date(+dateParts[2], dateParts[0] - 1, +dateParts[1]);
}

function shouldLogHours(date, cardElement) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

    return !(isWeekend || isHoliday(cardElement));
}

function isHoliday(cardElement) {
    return $(cardElement).find('.holiday-warning-banner').length > 0;
}

function fillInDefaults(cards) {
    const workDays = cards.filter(card => card.logHours);
    const usability = JSON.parse(localStorage.usability);

    $.each(workDays, function(index, day) {
        enterDefault(day, usability);
    });
}
