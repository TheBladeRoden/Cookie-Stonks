// ==UserScript==
// @name         Cookie Stonks by Bonks
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Cookie Clicker Stock Market Helper
// @author       Sui
// @match        https://orteil.dashnet.org/cookieclicker/
// @homepageURL  https://github.com/suicidejerk/Cookie-Stonks
// @supportURL   https://github.com/suicidejerk/Cookie-Stonks/issues
// @updateURL    https://raw.githubusercontent.com/suicidejerk/Cookie-Stonks/master/cookieStonks.user.js
// @icon         https://raw.githubusercontent.com/suicidejerk/Cookie-Stonks/main/cookieDollar.png
// @license      MIT
// @grant        none
// ==/UserScript==

let styleSheet = `
.restingElement {
    background-color: grey;
    padding: 5px;
    font-size: 12px;
}
.shimmer {
    position: "relative";
    width: "128px";
    height: "128px";
    top: "0";
    left: "0";
}
.canvases {
     width: 180px;
     height: 83px;
     position: absolute;
     padding-left: -10;
     padding-right: -10;
     margin-left: -1px;
     margin-top: -82px;
     display: block;
     pointer-events: none;
}
`;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRestingValue(id, bankLevel) {
    return (10 * (id + 1) + bankLevel - 1);
}

function getOverhead(brokers) {
    return (0.01 * 20 * Math.pow(0.95, brokers))
}

function getRestingDifference(id, value, bankLevel) {
    let restingValue = getRestingValue(id, bankLevel);
    let difference = (parseFloat(value.replace('$', '')) / restingValue * 100).toFixed(0);

    return difference;
}

function getRestingDifference2(id, value, bankLevel) {
    let restingValue = getRestingValue(id, bankLevel);
    let difference2 = (parseFloat(value.replace('$', '')) - restingValue).toFixed(0);

    return difference2;
}

function getColorMode(value, owned, ownedMax, mode, difference, overhead) {
    if (value > 100) { value = 100; }

    switch (gradient) {
        case "deal":
            value = parseInt(value * 1.28 + 50);
            if (parseInt(owned) > 0 && (mode == "positive1" || mode == "positive2") && difference > Math.sqrt(1 + overhead) * 100) {
                return [128 - value, 128, 128 - value];
            } else if (parseInt(owned) < parseInt(ownedMax) && (mode == "negative1" || mode == "negative2") && difference < 1 / Math.sqrt(1 + overhead) * 100) {
                return [128, 128 - value, 128];
            } else {
                return [128, 128, 128];
            }
            break;
        default:
            value = parseInt(value * 2.55);
            switch (mode) {
                case "positive1":
                    return [0, 255, value];
                case "positive2":
                    return [0, 255 - value, 255];
                case "negative1":
                    return [255, 255 - value, 0];
                case "negative2":
                    return [value * 20, 255, 0];
                default:
                    return [8, 8, 8];
            }
    }
}

function addRestingElement(ele, owned, ownedMax, id, bankLevel, brokers) {
    // Remove previous restingElement and resting elementDiff
    let prevRestingElement = document.getElementById("restingElement-" + id);
    if (prevRestingElement) {
        prevRestingElement.remove();
    }
    let prevRestingBr = document.getElementById("restingBr-" + id);
    if (prevRestingBr) {
        prevRestingBr.remove();
    }
    let prevRestingElementDiff = document.getElementById("restingElementDiff-" + id);
    if (prevRestingElementDiff) {
        prevRestingElementDiff.remove();
    }
    let prevRestingDiffBr = document.getElementById("restingDiffBr-" + id);
    if (prevRestingDiffBr) {
        prevRestingDiffBr.remove();
    }

    // Create new elements
    let restingElement = document.createElement("span");
    restingElement.innerText = "/$" + getRestingValue(id, bankLevel) + " ";
    restingElement.className = "bankSymbol";
    restingElement.id = "restingElement-" + id;
    restingElement.style = "font-weight:bold;color:#BBB;background:linear-gradient(to left,transparent,#333,#333,transparent);padding:0px;";

    let restingBr = document.createElement("br");
    restingBr.id = "restingBr-" + id;

    ele.append(restingBr, ele.childNodes[0]);
    ele.append(restingElement, ele.childNodes[0]);

    let restingElementDiff = document.createElement("span");
    let difference = getRestingDifference(id, ele.innerText, bankLevel);
 		let difference2 = getRestingDifference2(id, ele.innerText, bankLevel);
    restingElementDiff.innerText = difference + "%";
    restingElementDiff.className = "restingElement";
    restingElementDiff.id = "restingElementDiff-" + id;

    let overhead = getOverhead(brokers);
    let bgR, bgG, bgB;
    if (difference2 >= 15) {
        [bgR, bgG, bgB] = getColorMode(difference - 100, owned, ownedMax, "positive2", difference, overhead);
        restingElementDiff.style = "font-weight:bold;color:#FFF;background-color:rgb(" + bgR + "," + bgG + "," + bgB + ")";
    } else if (difference >= 100) {
        [bgR, bgG, bgB] = getColorMode(difference - 100, owned, ownedMax, "positive1", difference, overhead);
        restingElementDiff.style = "font-weight:bold;color:#FFF;background-color:rgb(" + bgR + "," + bgG + "," + bgB + ")";
    } else if (difference >= 95) {
        [bgR, bgG, bgB] = getColorMode(100 - difference, owned, ownedMax, "negative2", difference, overhead);
        restingElementDiff.style = "font-weight:bold;color:#FFF;background-color:rgb(" + bgR + "," + bgG + "," + bgB + ")";
    } else {
        [bgR, bgG, bgB] = getColorMode(100 - difference, owned, ownedMax, "negative1", difference, overhead);
        restingElementDiff.style = "font-weight:bold;color:#FFF;background-color:rgb(" + bgR + "," + bgG + "," + bgB + ")";
    }

    let restingDiffBr = document.createElement("br");
    restingDiffBr.id = "restingDiffBr-" + id;
    restingElement.append(restingDiffBr, restingElement.childNodes[0]);
    restingElement.append(restingElementDiff, restingElement.childNodes[0]);

    // Shimmer
    if (shimmerState == "on") {
        let key1 = 1;
        let key2 = 1;
        if (shimmerMode == "deal") {
            parseInt(owned) > 0 ? key1 = 1 : key1 = 0;
            parseInt(owned) < parseInt(ownedMax) ? key2 = 1 : key2 = 0;
        }
        let topDiff =  parseInt(goldenShimmer);
        let bottomDiff =  parseInt(wrathShimmer);

        // Remove previous shimmer
        let prevCanvas = document.getElementById("shimmerCanvas" + id);
        if (prevCanvas) {
            prevCanvas.remove();
        }

        let canvas = document.createElement("canvas");
        canvas.style.zIndex = 100;
        canvas.className = "canvases";
        if (insugarTradingFound) {
            canvas.style.height = "98px";
            canvas.style.marginTop = "-97px";
        }
        canvas.id = "shimmerCanvas" + id;
        let ctx = canvas.getContext("2d");
        let imageAppend = document.getElementById("bankGood-" + id);
        let shimmer = document.createElement("img");

        imageAppend.append(canvas);
        if (difference2 >= topDiff && key1) {
            ctx.drawImage(shimmerGolden, 0, 0, 264, 150);
        } else if (difference <= bottomDiff && key2) {
            ctx.drawImage(shimmerWrath, 0, 0, 264, 150);
        }
    }
}

// Callback function to execute when mutations are observed
var callback = async function(mutationsList) {
    let bankLevel = parseInt(document.getElementById("productLevel5").innerText.replace("lvl ", ""));
    let brokers;
    if (document.getElementById("bankBrokersText").innerText == "no brokers") {
        brokers = 0;
    } else {
        brokers = parseInt(document.getElementById("bankBrokersText").innerText.replace("brokers ", ""));
    }
    for (let i = 0; i <= 15; i++) {
        observer[i].disconnect(); // So the change we make isn't detected as a mutation and we enter an infinite loop

        let elemToEdit = document.getElementById("bankGood-" + i + "-val");
        let elemStockAmount = document.getElementById("bankGood-" + i + "-stock").innerText.replace(',', '');
        let elemStockMax = document.getElementById("bankGood-" + i + "-stockMax").innerText.replace('/', '').replace(',', '');
        addRestingElement(elemToEdit, elemStockAmount, elemStockMax, i, bankLevel, brokers);

        observer[i].observe(elemToEdit, config);
    }
};

function createOptionsElements() {
    // Div
    let divOptions = document.createElement("div");
    divOptions.id = "divOptions";

    // Title
    let titleOptions = document.createElement("div");
    titleOptions.className = "title";
    titleOptions.innerText = "Cookie Stonks by Bonks";
    divOptions.append(titleOptions);

    // Big Div
    let bigDivOptions = document.createElement("div");
    divOptions.append(bigDivOptions);

    // Gradient Title
    let divGradient = document.createElement("div");
    divGradient.className = "listing listingSection";
    divGradient.innerText = "Gradient";
    divGradient.style = "font-family: Kavoon; font-style: bold; font-size: 17px;";
    bigDivOptions.append(divGradient);

    // Gradient Listing
    let listingGradient = document.createElement("div");
    listingGradient.className = "listing";
    bigDivOptions.append(listingGradient);

    // Gradient Default Tick
    let gradDefTick = document.createElement("input");
    gradDefTick.id = "gradDefTick";
    gradDefTick.type = "checkbox";
    if (gradient == "default") {
        gradDefTick.checked = true;
    } else {
        gradDefTick.checked = false;
    }
    gradDefTick.onclick = function(){
        if (gradient == "default") {
            gradDefTick.checked = true;
        } else {
            gradient = "default";
            gradDealTick.checked = false;
        }
        localStorage["gradient"] = gradient;
    };
    listingGradient.append(gradDefTick);

    // Gradient Default Label
    let gradDefLabel = document.createElement("label");
    gradDefLabel.htmlFor = "gradDefTick";
    gradDefLabel.innerText = "Default — Red-Yellow: Low prices | Green-Blue: High prices";
    gradDefLabel.style.fontFamily = "Tahoma";
    listingGradient.append(gradDefLabel);

    // Break Line
    let br1 = document.createElement("br");
    listingGradient.append(br1);

    // Gradient Deal Tick
    let gradDealTick = document.createElement("input");
    gradDealTick.id = "gradDealTick";
    gradDealTick.type = "checkbox";
    if (gradient == "deal") {
        gradDealTick.checked = true;
    } else {
        gradDealTick.checked = false;
    }
    gradDealTick.onclick = function(){
        if (gradient == "default") {
            gradient = "deal";
            gradDefTick.checked = false;
        } else {
            gradDealTick.checked = true;
        }
        localStorage["gradient"] = gradient;
    };
    listingGradient.append(gradDealTick);

    // Gradient Deal Label
    let gradDealLabel = document.createElement("label");
    gradDealLabel.htmlFor = "gradDealTick";
    gradDealLabel.innerText = "Deal — Purple: Buy | Green: Sell | Grey: Do nothing";
    gradDealLabel.style.fontFamily = "Tahoma";
    listingGradient.append(gradDealLabel);

    // Shimmer Title
    let divShimmer = document.createElement("div");
    divShimmer.className = "listing listingSection";
    divShimmer.innerText = "Shimmer ";
    divShimmer.style = "font-family: Kavoon; font-style: bold; font-size: 17px;";
    bigDivOptions.append(divShimmer);

    // Shimmer Turn ON/OFF Button
    let shimmerButton = document.createElement("a");
    shimmerButton.id = "shimmerButton";

    if (shimmerState == "on") {
        shimmerButton.className = "option";
        shimmerButton.innerText = "ON";
    } else {
        shimmerButton.className = "option off";
        shimmerButton.innerText = "OFF";
    }

    shimmerButton.onclick = function(){
        if (shimmerState == "on") {
            shimmerState = "off";
            shimmerButton.className = "option off";
            shimmerButton.innerText = "OFF";
            // Remove all canvases/shimmers
            for (let id = 0; id <= 15; id++) {
            let prevCanvas = document.getElementById("shimmerCanvas" + id);
                if (prevCanvas) {
                    prevCanvas.remove();
                }
            }
        } else {
            shimmerState = "on";
            shimmerButton.className = "option";
            shimmerButton.innerText = "ON";

        }
        localStorage["shimmerState"] = shimmerState;
    };
    divShimmer.append(shimmerButton);

    // Shimmer Listing
    let listingShimmer = document.createElement("div");
    listingShimmer.className = "listing";
    bigDivOptions.append(listingShimmer);

    // Shimmer Default Tick
    let shimmerDefTick = document.createElement("input");
    shimmerDefTick.id = "shimmerDefTick";
    shimmerDefTick.type = "checkbox";
    if (shimmerMode == "default") {
        shimmerDefTick.checked = true;
    } else {
        shimmerDefTick.checked = false;
    }
    shimmerDefTick.onclick = function(){
        if (shimmerMode == "default") {
            shimmerDefTick.checked = true;
        } else {
            shimmerMode = "default";
            shimmerDealTick.checked = false;
        }
        localStorage["shimmerMode"] = shimmerMode;
    };
    listingShimmer.append(shimmerDefTick);

    // Shimmer Default Label
    let shimmerDefLabel = document.createElement("label");
    shimmerDefLabel.htmlFor = "shimmerDefTick";
    shimmerDefLabel.innerText = "Default — For every stock";
    shimmerDefLabel.style.fontFamily = "Tahoma";
    listingShimmer.append(shimmerDefLabel);

    // Break Line
    let br2 = document.createElement("br");
    listingShimmer.append(br2);

    // Shimmer Deal Tick
    let shimmerDealTick = document.createElement("input");
    shimmerDealTick.id = "shimmerDealTick";
    shimmerDealTick.type = "checkbox";
    if (shimmerMode == "deal") {
        shimmerDealTick.checked = true;
    } else {
        shimmerDealTick.checked = false;
    }
    shimmerDealTick.onclick = function(){
        if (shimmerMode == "default") {
            shimmerMode = "deal";
            shimmerDefTick.checked = false;
        } else {
            shimmerDealTick.checked = true;
        }
        localStorage["shimmerMode"] = shimmerMode;
    };
    listingShimmer.append(shimmerDealTick);

    // Shimmer Deal Label
    let shimmerDealLabel = document.createElement("label");
    shimmerDealLabel.htmlFor = "shimmerDealTick";
    shimmerDealLabel.innerText = "Deal — Only for pertinent stocks";
    shimmerDealLabel.style.fontFamily = "Tahoma";
    listingShimmer.append(shimmerDealLabel);

    // Break Line
    let br3 = document.createElement("br");
    listingShimmer.append(br3);

    // Break Line
    let br4 = document.createElement("br");
    listingShimmer.append(br4);

    // Sliderbox Golden Shimmer
    let sliderGolden = document.createElement("div");
    sliderGolden.className = "sliderBox";
    listingShimmer.append(sliderGolden);

    // Text Sliderbox Golden
    let divSliderGolden = document.createElement("div");
    divSliderGolden.style = "float: left";
    divSliderGolden.innerText = "Golden Shimmer";
    sliderGolden.append(divSliderGolden);

    // Percentage Sliderbox Golden
    let perSliderGolden = document.createElement("div");
    perSliderGolden.style = "float: right";
    perSliderGolden.innerText = ">=" + "+$" + goldenShimmer;
    sliderGolden.append(perSliderGolden);

    // Slider Golden
    let actualSliderGolden = document.createElement("input");
    actualSliderGolden.className = "slider";
    actualSliderGolden.style = "clear: both";
    actualSliderGolden.type = "range";
    actualSliderGolden.min = "1";
    actualSliderGolden.max = "100";
    actualSliderGolden.value = goldenShimmer;
    actualSliderGolden.step = "1";
    actualSliderGolden.oninput = function() {
        goldenShimmer = this.value;
        perSliderGolden.innerText = ">=" + "+$" + goldenShimmer;
        localStorage["goldenShimmer"] = goldenShimmer;
        // Remove all canvases/shimmers
        for (let id = 0; id <= 15; id++) {
            let prevCanvas = document.getElementById("shimmerCanvas" + id);
            if (prevCanvas) {
                prevCanvas.remove();
            }
        }
    }
    sliderGolden.append(actualSliderGolden);

    // Break Line
    let br5 = document.createElement("br");
    listingShimmer.append(br5);

    // Break Line
    let br6 = document.createElement("br");
    listingShimmer.append(br6);

    // Sliderbox Wrath Shimmer
    let sliderWrath = document.createElement("div");
    sliderWrath.className = "sliderBox";
    listingShimmer.append(sliderWrath);

    // Text Sliderbox Wrath
    let divSliderWrath = document.createElement("div");
    divSliderWrath.style = "float: left";
    divSliderWrath.innerText = "Wrath Shimmer";
    sliderWrath.append(divSliderWrath);

    // Percentage Sliderbox Wrath
    let perSliderWrath = document.createElement("div");
    perSliderWrath.style = "float: right";
    perSliderWrath.innerText = "<=" + wrathShimmer + "%";
    sliderWrath.append(perSliderWrath);

    // Slider Wrath
    let actualSliderWrath = document.createElement("input");
    actualSliderWrath.className = "slider";
    actualSliderWrath.style = "clear: both";
    actualSliderWrath.type = "range";
    actualSliderWrath.min = "1";
    actualSliderWrath.max = "99";
    actualSliderWrath.value = wrathShimmer;
    actualSliderWrath.step = "1";
    actualSliderWrath.oninput = function() {
        wrathShimmer = this.value;
        perSliderWrath.innerText = "<=" + wrathShimmer + "%";
        localStorage["wrathShimmer"] = wrathShimmer;
        // Remove all canvases/shimmers
        for (let id = 0; id <= 15; id++) {
            let prevCanvas = document.getElementById("shimmerCanvas" + id);
            if (prevCanvas) {
                prevCanvas.remove();
            }
        }
    }
    sliderWrath.append(actualSliderWrath);

    return divOptions;
}

function checkForInsugarTrading(tries, maxTries) {
    if (document.getElementById("bankGood-1") && document.getElementById("bankGood-1").firstChild && document.getElementById("bankGood-1").firstChild.childNodes[4] && document.getElementById("bankGood-1").firstChild.childNodes[4].innerText && document.getElementById("bankGood-1").firstChild.childNodes[4].innerText.slice(0,9) == "Quantile:") {
        insugarTradingFound = true;
        document.getElementById("bankGood-1-val").id = "bankGood-1-val"; // Force update of shimmers
    } else if (tries < maxTries) {
        setTimeout(function() {
            checkForInsugarTrading(tries + 1, maxTries);
        }, 100);
    }
    return;
}

var callbackMenu = function(mutationsList) {
    observerMenu.disconnect(); // So the change we make isn't detected as a mutation and we enter an infinite loop

    let mainMenu = document.getElementById("menu");
    let sectionMenu = document.getElementsByClassName("section")[0];
    let menu = document.getElementsByClassName("subsection")[0];
    if (mainMenu && menu && sectionMenu && sectionMenu.innerText == "Options") {
        menu.insertBefore(createOptionsElements(), menu.lastChild);
        document.getElementById("centerArea").scrollTop = scroll;
    }

    observerMenu.observe(mainMenu, config);
};

// Options for the observer (which mutations to observe)
var config = { attributes: true, childList: true };

// Mutation observers
var observer = [];

// Create an observer instance linked to the callback function
let observerMenu = new MutationObserver(callbackMenu);

// Broker observer
var observerBrokers = new MutationObserver(callback);

// Variables
let gradient = localStorage["gradient"] || "default";
let shimmerMode = localStorage["shimmerMode"] || "deal";
let shimmerState = localStorage["shimmerState"] || "on";
let goldenShimmer = localStorage["goldenShimmer"] || 15;
let wrathShimmer = localStorage["wrathShimmer"] || 50;
let shimmerGolden = document.createElement("img");
shimmerGolden.src = "img/shadedBordersGold.png";
let shimmerWrath = document.createElement("img");
shimmerWrath.src = "img/shadedBordersRed.png";
let scroll = 0;
let insugarTradingFound = false;

(async function() {
    'use strict';

    let s = document.createElement('style');
    s.type = "text/css";
    s.innerHTML = styleSheet;
    (document.head || document.documentElement).appendChild(s);

    window.addEventListener('load', async function() {
        'use strict';

        //await sleep(2000);

        // Add options menu
        // Control proper scrolling in options menu
        document.getElementById("centerArea").addEventListener("scroll", (event) => {
            let tempScroll = document.getElementById("centerArea").scrollTop;
            if (tempScroll != 0 && document.getElementById("divOptions")) {
                scroll = tempScroll;
            } if (!document.getElementById("divOptions")) {
                scroll = 0;
            }
        });
        let mainMenu = document.getElementById("menu");
        let sectionMenu = document.getElementsByClassName("section")[0];
        let menu = document.getElementsByClassName("subsection")[0];
        if (mainMenu && menu && sectionMenu && sectionMenu.innerText == "Options") {
            menu.insertBefore(createOptionsElements(), menu.lastChild);
            document.getElementById("centerArea").scrollTop = scroll;
        }
        observerMenu.observe(mainMenu, config);

        // Add percentages
        // Wait for elements to load
        let maxTries = 1000;
        let tries = 0;
        while(!document.getElementById("productLevel5") || !document.querySelector("#bankGood-1-val") || !document.getElementById("bankBrokersText")) {
            if (tries <= maxTries) {
                await new Promise(r => setTimeout(r, 100));
                tries++;
            } else {
                console.error("Cookie Stonks couldn't load properly!");
                return;
            }
        }

        // Add actual elements
        let bankLevel = parseInt(document.getElementById("productLevel5").innerText.replace("lvl ", ""));
        let brokers;
        if (document.getElementById("bankBrokersText").innerText == "no brokers") {
             brokers = 0;
        } else {
            brokers = parseInt(document.getElementById("bankBrokersText").innerText.replace("brokers ", ""));
        }

        for (let i = 0; i <= 15; i++) {

            let elemToEdit = document.getElementById("bankGood-" + i + "-val");
            let elemStockAmount = document.getElementById("bankGood-" + i + "-stock").innerText.replace(',', '');
            let elemStockMax = document.getElementById("bankGood-" + i + "-stockMax").innerText.replace('/', '').replace(',', '');
            addRestingElement(elemToEdit, elemStockAmount, elemStockMax, i, bankLevel, brokers);

            // Create an observer instance linked to the callback function
            observer[i] = new MutationObserver(callback);

            // Start observing the target node for configured mutations
            observer[i].observe(elemToEdit, config);
        }
        observerBrokers.observe(document.getElementById("bankBrokersText"), { attributes: true, childList: true, characterData: true });
        console.log("Cookie Stonks loaded.");

        // Check for Insugar Trading to change the Shimmer size
        checkForInsugarTrading(1, 300);
    });
})();
