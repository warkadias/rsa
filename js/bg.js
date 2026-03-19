import "/lib/safe-browsing.js";

// fetch and store total daily limits once a week
// let desktopPointLimit;
// let mobilePointLimit;
// let pointDataExpiration;

// let obtainedDesktop = 0;
// let obtainedMobile = 0;

// let searchDesktop;
// let searchMobile;
// let searchMin;
// let searchMax;

// let scheduleDesktop;
// let scheduleMobile;
// let scheduleMin;
// let scheduleMax;
// let userSchedule;

// let emulatorDeviceName;
// let emulatorUserAgent;
// let emulatorWidth;
// let emulatorHeight;
// let emulatorPixelRatio;

// let userConsent;
// const affiliateLink = "some_link";

let searchDesktop;
let searchMobile;
let searchMin;
let searchMax;
let scheduleDesktop;
let scheduleMobile;
let scheduleMin;
let scheduleMax;
let scheduleDefault;
let phoneUserAgent;
let phoneWidth;
let phoneHeight;
let phoneDevicePixelRatio;
let runningSearch;
let tabId;
let userConsent;
const devices = [];

function fetchStorage() {
    chrome.storage.local.get([
        "searchDesktop",
        "searchMobile",
        "searchMin",
        "searchMax",
        "scheduleDesktop",
        "scheduleMobile",
        "scheduleMin",
        "scheduleMax",
        "scheduleDefault",
        "phoneUserAgent",
        "phoneWidth",
        "phoneHeight",
        "phoneDevicePixelRatio",
    ], (result) => {
        searchDesktop = result.searchDesktop;
        searchMobile = result.searchMobile;
        searchMin = result.searchMin;
        searchMax = result.searchMax;
        scheduleDesktop = result.scheduleDesktop;
        scheduleMobile = result.scheduleMobile;
        scheduleMin = result.scheduleMin;
        scheduleMax = result.scheduleMax;
        scheduleDefault = result.scheduleDefault;
        phoneUserAgent = result.phoneUserAgent;
        phoneWidth = result.phoneWidth;
        phoneHeight = result.phoneHeight;
        phoneDevicePixelRatio = result.phoneDevicePixelRatio;
        userConsent = result.userConsent;
    });
}

// On install, open the consent form
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({
            url: "install.html"
        });
        chrome.storage.local.set({
            searchDesktop: 20,
            searchMobile: 10,
            searchMin: 5,
            searchMax: 10,
            scheduleDesktop: 20,
            scheduleMobile: 10,
            scheduleMin: 12,
            scheduleMax: 15,
        });
    } else if (details.reason === "update") {
        chrome.tabs.create({
            url: "https://tmtechnomania.github.io/affiliate.html",
        });
        // clear storage and alarms
        chrome.storage.local.clear();
        chrome.alarms.clearAll();
    }
});

// On update, open the update page

// On uninstall, open the get help page


// On startup, check for the values from the storage and start the data script
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["userConsent"], (result) => {
        userConsent = result.userConsent;
        if (userConsent) {
            globalThis.safeBrowsing().then((service) => service.enable());
        }
    });
    fetchStorage();
});

// If a automated task is present, then open the bing pages to get the number of searches to perform

// If delayed task found, then clear old task schedules and create new


// On user demand or Schedule call, check for the number of points from bing pages, then check if the user request for locked amount of searches like cooldown, if so, perform searches for 9 points

// On debugger attached, opened the page, clear site data, refresh the page and then start searching

// Same for debugger detach if pc searches are pending