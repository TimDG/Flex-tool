// ==UserScript==
// @name         ELC Magnit/Flex Helper.
// @namespace    http://tampermonkey.net/
// @version      0.9.9
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

(function() {
    'use strict';

    //Wait until the UI is ready.
    waitForKeyElements("#submit-time-btn", function() {
        alert("This is an outdated version of the Flex usability script. Please go to https://cdn.jsdelivr.net/gh/TimDG/Flex-tool@trunk/flex.user.js to get the latest version")
    });
})();
