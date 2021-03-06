// ==UserScript==
// @name         Flex usability
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @description  Try to make flex usable.
// @author       You
// @match        https://prowand.pro-unlimited.com/worker/standard/billing/billingedit/cntrl_time_create_edit_hourly-*.html?reqId*
// @grant        none
// @updateUrl    https://cdn.jsdelivr.net/gh/TimDG/Flex-tool@trunk/flex.user.js
// @downloadUrl  https://cdn.jsdelivr.net/gh/TimDG/Flex-tool@trunk/flex.user.js
// ==/UserScript==


(function () {
    'use strict';

   $.getScript("https://code.jquery.com/ui/1.12.1/jquery-ui.min.js");

    var dates = [];
    var details = [];
    var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    var daysOff = [];
    var daysOffDates = [];
    var today = new Date();
    var defaults = loadDefaults();
    console.log(defaults);

    function loadDefaults() {
        var usability = localStorage.usability;
        if (usability) {
            usability = JSON.parse(usability);
            if (usability.defaults) {
                return usability.defaults;
            } else {
                return {};
            }
        } else {
            return {};
        }
    }

    function hasInvalidShifts() {
        var validShifts = $("[id$=shiftName]:first").find("option").map(function() { return $(this).attr("value");}).toArray();
        return $.inArray(defaults.weekday, validShifts) < 0 ||
            $.inArray(defaults.saturday, validShifts) < 0 ||
            $.inArray(defaults.sunday, validShifts) < 0;
    }

    function hasInvalidHours() {
        var hours = defaults.hours;
        return hours === undefined || hours < 1 || hours > 12;
    }

    function checkDefaults() {
        if (hasInvalidHours() || hasInvalidShifts()) {
            showDefaultsDialog();
        }
        //TODO: add a button to change the defaults.
        //TODO: actually use the defaults.
    }

    function copyShift() {
        return $("[id$=shiftName]:first").find("option").clone();
    }

    function getHours() {
        return defaults.hours ? defaults.hours : 8;
    }

    function showDefaultsDialog() {
        var $dialog = $("<div title='Set your flex-usability defaults'></div>");
        var $form = $("<form></form>").appendTo($dialog)
            .append($("<p>How many hours do you normally work in a day?</p>"))
            .append($("<input type='number' name='defaultHours'/>").val(getHours()))
            .append($("<p><br/>Please select your default shift for a weekday</p>"))
            .append($("<select name='defaultDay'></select>").append(copyShift()))
            .append($("<p><br/>Please select your default shift for a Saturday</p>"))
            .append($("<select name='defaultSat'></select>").append(copyShift()))
            .append($("<p><br/>Please select your default shift for a Sunday/holiday</p>"))
            .append($("<select name='defaultSun'></select>").append(copyShift()));

        $form.find("[name=defaultDay]").val(defaults.weekday);
        $form.find("[name=defaultSat]").val(defaults.saturday);
        $form.find("[name=defaultSun]").val(defaults.sunday);

        $dialog.dialog({
            modal:true,
            resizable: false,
            buttons: {
                Save: function() {
                    defaults.hours = parseInt($dialog.find("[name=defaultHours").val(), 10);
                    defaults.weekday = $dialog.find("[name=defaultDay]").val();
                    defaults.saturday = $dialog.find("[name=defaultSat]").val();
                    defaults.sunday = $dialog.find("[name=defaultSun]").val();

                    saveDefaults();
                    $(this).dialog("close");
                }
            }
        });
    }

    function saveDefaults() {
        var usability = {
            defaults: defaults
        };
        localStorage.usability = JSON.stringify(usability);
    }

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

    var dateTable = $("<table id='elcSolDateTable'>").insertBefore("table:first")
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
            //Sunday
            $shiftNameSelect.val(defaults.sunday);
        } else if (day === "6") {
            //Saturday
            $shiftNameSelect.val(defaults.saturday);
        } else {
            $shiftNameSelect.val(defaults.weekday);
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
                    logHoursForDay($day, defaults.hours);
                }
            }
        });
    };

    var $tr = $("<tr>").appendTo(dateTable)
        .append("<td>")
        .find("td")
        .attr("colspan", 7);

    $("<a>Fill in defaults</a>").click(logDefaults)
        .appendTo($tr);
    $tr.append("<br>");
    $("<a name='setDefaults'>Change defaults</a>").appendTo($tr)
        .click(showDefaultsDialog);

    $("<tr>").appendTo(dateTable)
        .append("<td>")
        .find("td")
        .attr("colspan", 7)
        .append("<label>")
        .append("<span> Log hours</span>")
        .prepend("<input type='checkbox' id='elcSolLogHoursToggle' />");

    //Check if we have all the default settings we need.
    checkDefaults();

    $("input[value=Submit]").click(function() {
     return confirm("I know that I use an external script to fill in my timesheet and have verified that it's correct.");
    });
})();
