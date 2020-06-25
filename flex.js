// ==UserScript==
// @name         Flex usability
// @namespace    http://tampermonkey.net/
// @version      0.3.0
// @description  try to take over the world!
// @author       You
// @match        https://prowand.pro-unlimited.com/worker/standard/billing/billingedit/cntrl_time_create_edit_hourly-*.html?reqId*
// @grant        none
// @updateUrl    https://rawgit.com/TimDG/Flex-tool/master/flex.js
// @downloadUrl  https://rawgit.com/TimDG/Flex-tool/master/flex.js
// ==/UserScript==


(function () {
    'use strict';

    var dates = [];
    var details = [];
    var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    var daysOff = [];
    var daysOffDates = [];
    var today = new Date();

    function isSunday(date) {
        return date.getDay() === 0;
    }

    function isSaturday(date) {
        return date.getDay() === 6;
    }

    $('[id^=billingDtls]')
        .css({'margin-bottom': '10px'})
        .each(function (i, detail) {
            var dateTr = $(detail).find("tr.subfeaturegrey").parent().children(".body11").children(".body11:first");
            var dateName = dateTr.text().trim().split("day")[1].trim();
            var date = new Date(dateName);
            dates.push(date);
            details.push($(this));
            var anchor = $("<a name='" + dateName.replace(/\//g, '') + "'/>");
            $(detail).before(anchor);
            if (isSunday(date) || isSaturday(date) || $(detail).find("div[id^=holidayError]").text().indexOf('Client Holiday') > 0) {
                daysOff.push(dateName);
                daysOffDates.push(date);
            }
            $("<div>").text(date.toLocaleString("nl", {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }))
                .css({'font-weight': 'bold', 'text-align': 'center'})
                .insertBefore(detail);
            $(detail).attr("detailDay", date.getDay());
        })
        .filter(':odd')
        .css({"background-color": "#DDDDDD"});

    var dateTable = $("<table id='elcSolDateTable'>").insertAfter("table:first")
        .css("width", "250px")
        .css("position", "fixed")
        .css("left", "50px")
        .css("top", "50px")
        .css("text-align", "center");

    var headerRow = $("<tr>").appendTo(dateTable);
    var month = $("<th colspan='7'>")
        .css("font-weight", "bold")
        .css("text-align", "center");
    month.text(dates[0].toLocaleString("en", {month: "long"}));
    month.appendTo(headerRow);

    var row = $("<tr>").appendTo(dateTable);

    $.each(days, function (i, day) {
        $("<td>").css("text-align", "center")
            .css("font-weight", "bold")
            .text(day)
            .appendTo(row);
    });

    row = $("<tr>").appendTo(dateTable);

    for (var i = 0; i < (dates[0].getDay() + 6) % 7; i++) {
        row.append("<td>&nbsp;</td>");
    }

    var logHours = function() {
        if ($("#elcSolLogHoursToggle").is(":checked")) {
            var hoursWorked = prompt("How many hours did you work on " + $(this).attr("data-date"));
            if (hoursWorked !== null) {

                var actualHours = parseFloat(hoursWorked, 10);
                logHoursForDay(details[$(this).attr("data-index")], actualHours);
            }
        }
        return true;
    };

    $.each(dates, function (i, date) {
        if (date.getDay() === 1) {
            row = $("<tr>").appendTo(dateTable);
        }

        var td = $("<td>").appendTo(row);

        $("<a>").text(date.toLocaleString("en", {day: "2-digit"}))
            .attr("href", "#" + date.toLocaleString("en", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }).replace(/\//g, ''))
            .attr("data-date", date.toLocaleString("nl", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric"
            }))
            .attr("data-index", date.getDate() - 1)
            .appendTo(td)
            .click(logHours);

        if (daysOff.indexOf(date) >= 0) {
            td.css("background-color", "grey");
        }

        if (date.toDateString() === today.toDateString()) {
            td.css("background-color", "gold");
        }
    });

    function logHoursForDay($day, hoursWorked) {

        //Hours
        $day.find("[id$=hours]").val(hoursWorked);

        //General registration
        var $shiftNameSelect = $day.find('[id$=shiftName]');

        var day = $day.attr("detailDay");

        if (day === "0") {
            //Saturday
            $shiftNameSelect.val("OT 200%");
        } else if (day === "6") {
            //Sunday
            $shiftNameSelect.val("OT 150%");
        } else {
            $shiftNameSelect.val("Day Shift");
        }

        //Hour total
        $day.find('[id$=regularHours]').val(hoursWorked);

        //WBS code
        var $wbs = $day.find('select[id^=cf]');
        var wbsVal = $wbs.find(':last-child').val();
        $wbs.val(wbsVal);
    }

    var logDefaults = function () {
        $.each(dates, function (i, date) {
            if (!isSunday(date) && !isSaturday(date)) {
                var $day = details[i];
                //Holiday?
                if (daysOffDates.indexOf(date) < 0) {
                    logHoursForDay($day, 8);
                }
            }
        });
    };

    $("<tr>").appendTo(dateTable)
        .append("<td>")
        .find("td")
        .attr("colspan", 7)
        .append("<a>Defaults</a>")
        .find("a")
        .click(logDefaults);

    $("<tr>").appendTo(dateTable)
        .append("<td>")
        .find("td")
        .attr("colspan", 7)
        .append("<label>")
        .append("<span> Log hours</span>")
        .prepend("<input type='checkbox' id='elcSolLogHoursToggle' />");
})();
