$(document).ready(function() {
	chrome.storage.local.set({ visitedUpdatePolicy: true });
	const width = screen.width;
	const popupWidth = width * 0.2;
	const scale = width / 1920;
	const popupHeight = (popupWidth / 24) * 36;
	$("body").css("width", popupWidth);
	$("body").css("height", popupHeight);
	$("body").css("--scale", scale);
    const $agree = $("#agree");
    const $disagree = $("#disagree");
    const $clear = $("#clear");
    const closeMSG = $("#closeMSG");
    let selection = "null";
    $agree.click(function() {
        selection = "agreed";
        $agree.addClass("selected");
        $agree.text("Agreed!");
        $disagree.removeClass("selected");
        $disagree.text("Disagree");
        $clear.show();
        chrome.storage.local.set({ userConsent: "true" }, function() {
            console.log("userConsent is set to true");
        });
        closeMSG.text("Popup will close in 3 seconds.");
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (selection != "agreed"){
                    return;
                }
                closeMSG.text("Popup will close in " + (3 - i) + " seconds.");
            }, i * 1000);
        }
        setTimeout(() => {
            if (selection != "agreed"){
                return;
            }
            window.close();
        }, 3000);
    });
    $disagree.click(function() {
        selection = "disagreed";
        $agree.removeClass("selected");
        $agree.text("Agree");
        $disagree.addClass("selected");
        $disagree.text("Disagreed!");
        $clear.show();
        chrome.storage.local.set({ userConsent: "false" }, function() {
            console.log("userConsent is set to false");
        });
        closeMSG.text("Popup will close in 3 seconds.");
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (selection != "disagreed"){
                    return;
                }
                closeMSG.text("Popup will close in " + (3 - i) + " seconds.");
            }, i * 1000);
        }
        setTimeout(() => {
            if (selection != "disagreed"){
                return;
            }
            window.close();
        }, 3000);
    });
    $clear.click(function() {
        selection = "null";
        closeMSG.text("");
        $agree.removeClass("selected");
        $agree.text("Agree");
        $disagree.removeClass("selected");
        $disagree.text("Disagree");
        $clear.hide();
        chrome.storage.local.set({ userConsent: "null" }, function() {
            console.log("userConsent is set to null");
        });
    });
    chrome.storage.local.get(["userConsent"], function(result) {
        console.log("Value currently is " + result.userConsent);
        if (result.userConsent == "true") {
            $agree.addClass("selected");
            $agree.text("Agreed!");
            $disagree.removeClass("selected");
            $clear.show();
        } else if (result.userConsent == "false") {
            $agree.removeClass("selected");
            $disagree.addClass("selected");
            $disagree.text("Disagreed!");
            $clear.show();
            alert("You must agree to the terms of service to use this extension.");
        }
    });
});