// ==UserScript==
// @name         Flex on-call usability
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  try to take over the world!
// @author       You
// @match        https://prowand.pro-unlimited.com/worker/standard/billing/billingedit/cntrl_time_create_edit_daily-*.html?*
// @grant        none
// @updateUrl    https://cdn.jsdelivr.net/gh/TimDG/Flex-tool@master/flex-oncall.js
// @downloadUrl  https://cdn.jsdelivr.net/gh/TimDG/Flex-tool@master/flex-oncall.js
// ==/UserScript==


(function () {
    'use strict';

    var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    var dates=[];
    var details=[];
    var daysOff=[];
    var daysOffDates = [];
    var today = new Date();

    function isSunday(date) {
        return date.getDay() === 0;
    }

    function isSaturday(date) {
        return date.getDay() === 6;
    }

    function cleanUpGui() {
        $('[id^=billingDetailId]')
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
    }

    function createDateTable() {
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

    }

    function logHours() {
        if ($("#elcSolLogHoursToggle").is(":checked")) {
            var $day = details[$(this).attr("data-index")];

            $day.find("[id$=daily1]").attr("checked", "checked");
            $day.find("[id$=percentOfDay]").val("100");

            var $wbs = $day.find('select[id^=cf]');
            var wbsVal = $wbs.find(':last-child').val();
            $wbs.val(wbsVal);
        }
        return true;
    }

    function fillCalendar() {
        var dateTable = $("#elcSolDateTable");
        var row = dateTable.find("tr:last-of-type");

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
    }

    function appendLogHours() {
        var dateTable = $("#elcSolDateTable");
        $("<tr>").appendTo(dateTable)
            .append("<td>")
            .find("td")
            .attr("colspan", 7)
            .append("<label>")
            .append("<span> Log hours</span>")
            .prepend("<input type='checkbox' id='elcSolLogHoursToggle' />");
    }

    cleanUpGui();
    createDateTable();
    fillCalendar();
    appendLogHours();

})();
