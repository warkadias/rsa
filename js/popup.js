const app = chrome || browser;
let userConsent = true;

// Auto-set userConsent = true agar tidak redirect ke install page
app.storage.local.set({ userConsent: true, visitedUpdatePolicy: true });

const width = screen.width;
const popupWidth = width * 0.2;
const scale = width / 1920;
$("body").css("width", popupWidth);
$("body").css("--scale", scale);

$(document).ready(function () {
	const $search = $("#search");
	const $schedule = $("#schedule");
	const $searchDiv = $("#searchDiv");
	const $scheduleDiv = $("#scheduleDiv");
	const $stopDiv = $("#stopDiv");
	const $stop = $("#stop");
	const $searchPerform = $("#searchPerform");
	const $schedulePerform = $("#schedulePerform");

	// Search tab inputs
	const $searchDesktop = $("#searchDesktop");
	const $readCount = $("#readCount");
	const $searchMin = $("#searchMin");
	const $searchMax = $("#searchMax");

	// Schedule tab inputs
	const $scheduleDesktop = $("#scheduleDesktop");
	const $scheduleReadCount = $("#scheduleReadCount");
	const $scheduleMin = $("#scheduleMin");
	const $scheduleMax = $("#scheduleMax");

	// Schedule presets
	const $scheduleT1 = $("#scheduleT1");
	const $scheduleT2 = $("#scheduleT2");
	const $scheduleT3 = $("#scheduleT3");
	const $scheduleT4 = $("#scheduleT4");
	const $scheduleDefault = $("#scheduleDefault");

	// Search presets
	const $searchT1 = $("#searchT1");
	const $searchT2 = $("#searchT2");
	const $searchT3 = $("#searchT3");
	const $searchT4 = $("#searchT4");

	// ---- TAB NAVIGATION ----
	$search.click(function () {
		$search.addClass("selected");
		$schedule.removeClass("selected");
		$searchDiv.show();
		$scheduleDiv.hide();
	});
	$schedule.click(function () {
		$schedule.addClass("selected");
		$search.removeClass("selected");
		$searchDiv.hide();
		$scheduleDiv.show();
	});
	$search.click();

	// ---- STORE ----
	async function store() {
		app.storage.local.set({
			searchDesktop: parseInt($searchDesktop.val()) || 20,
			readCount: parseInt($readCount.val()) || 10,
			scheduleDesktop: parseInt($scheduleDesktop.val()) || 20,
			searchMin: parseInt($searchMin.val()) || 10,
			searchMax: parseInt($searchMax.val()) || 25,
			scheduleMin: parseInt($scheduleMin.val()) || 10,
			scheduleMax: parseInt($scheduleMax.val()) || 25,
		});
		compare();
	}

	// ---- FETCH ----
	function fetch() {
		app.storage.local.get([
			"searchDesktop", "readCount",
			"scheduleDesktop",
			"searchMin", "searchMax",
			"scheduleMin", "scheduleMax",
			"scheduleDefault",
		], (result) => {
			if (result.searchDesktop != undefined) $searchDesktop.val(result.searchDesktop);
			if (result.readCount != undefined) { $readCount.val(result.readCount); $scheduleReadCount.val(result.readCount); }
			if (result.scheduleDesktop != undefined) $scheduleDesktop.val(result.scheduleDesktop);
			if (result.searchMin != undefined) $searchMin.val(result.searchMin);
			if (result.searchMax != undefined) $searchMax.val(result.searchMax);
			if (result.scheduleMin != undefined) $scheduleMin.val(result.scheduleMin);
			if (result.scheduleMax != undefined) $scheduleMax.val(result.scheduleMax);

			if (result.scheduleDefault != undefined) {
				deselectAllSchedule();
				if (result.scheduleDefault == "scheduleT1") { $scheduleT1.addClass("selected"); $schedulePerform.text("Never"); }
				else if (result.scheduleDefault == "scheduleT2") { $scheduleT2.addClass("selected"); $schedulePerform.text("After startup"); }
				else if (result.scheduleDefault == "scheduleT3") { $scheduleT3.addClass("selected"); $schedulePerform.text("Every 5-6 mins"); }
				else if (result.scheduleDefault == "scheduleT4") { $scheduleT4.addClass("selected"); $schedulePerform.text("Every 15-17.5 mins"); }
			} else {
				deselectAllSchedule();
				app.storage.local.set({ scheduleDefault: "scheduleT1" });
				$scheduleT1.addClass("selected");
			}
		});
		compare();
	}
	fetch();

	// ---- COMPARE (highlight preset) ----
	function compare() {
		app.storage.local.get(["searchDesktop"], (result) => {
			const d = parseInt(result.searchDesktop);
			deselectAllSearch();
			if (d == 10) $searchT1.addClass("selected");
			else if (d == 20) $searchT2.addClass("selected");
			else if (d == 30) $searchT3.addClass("selected");
			else if (d == 50) $searchT4.addClass("selected");
		});
	}

	function deselectAllSearch() {
		$searchT1.removeClass("selected");
		$searchT2.removeClass("selected");
		$searchT3.removeClass("selected");
		$searchT4.removeClass("selected");
	}
	function deselectAllSchedule() {
		$scheduleT1.removeClass("selected");
		$scheduleT2.removeClass("selected");
		$scheduleT3.removeClass("selected");
		$scheduleT4.removeClass("selected");
	}

	// ---- RUNNING STATE ----
	app.storage.local.get(["runningSearch"], (result) => {
		if (!result.runningSearch) $stopDiv.css("display", "none");
		else $stopDiv.css("display", "flex");
	});

	// ---- INPUT HANDLERS ----
	$searchDesktop.on("input", async () => { if (!$searchDesktop.val()) $searchDesktop.val(0); await store(); });
	$readCount.on("input", async () => { if (!$readCount.val()) $readCount.val(0); await store(); });
	$scheduleDesktop.on("input", async () => { if (!$scheduleDesktop.val()) $scheduleDesktop.val(0); await store(); });
	$scheduleReadCount.on("input", async () => {
		$readCount.val($scheduleReadCount.val());
		await store();
	});
	$searchMin.on("input", async () => {
		if (parseInt($searchMin.val()) < 5 || !$searchMin.val()) $searchMin.val(5);
		if (parseInt($searchMin.val()) >= parseInt($searchMax.val())) $searchMax.val(parseInt($searchMin.val()) + 5);
		await store();
	});
	$searchMax.on("input", async () => {
		if (parseInt($searchMax.val()) <= parseInt($searchMin.val()) || !$searchMax.val()) $searchMax.val(parseInt($searchMin.val()) + 5);
		await store();
	});
	$scheduleMin.on("input", async () => {
		if (parseInt($scheduleMin.val()) < 5 || !$scheduleMin.val()) $scheduleMin.val(5);
		if (parseInt($scheduleMin.val()) >= parseInt($scheduleMax.val())) $scheduleMax.val(parseInt($scheduleMin.val()) + 10);
		await store();
	});
	$scheduleMax.on("input", async () => {
		if (parseInt($scheduleMax.val()) <= parseInt($scheduleMin.val()) || !$scheduleMax.val()) $scheduleMax.val(parseInt($scheduleMin.val()) + 10);
		await store();
	});

	// ---- PRESET BUTTONS ----
	$searchT1.click(async () => { deselectAllSearch(); $searchT1.addClass("selected"); $searchDesktop.val(10); await store(); });
	$searchT2.click(async () => { deselectAllSearch(); $searchT2.addClass("selected"); $searchDesktop.val(20); await store(); });
	$searchT3.click(async () => { deselectAllSearch(); $searchT3.addClass("selected"); $searchDesktop.val(30); await store(); });
	$searchT4.click(async () => { deselectAllSearch(); $searchT4.addClass("selected"); $searchDesktop.val(50); await store(); });

	// ---- SCHEDULE PRESETS ----
	$scheduleT1.click(function () {
		deselectAllSchedule(); $scheduleT1.addClass("selected");
		$schedulePerform.text("Schedule updated - Never");
		setTimeout(() => $schedulePerform.text("Never"), 2000);
		app.storage.local.set({ scheduleDefault: "scheduleT1" });
		app.runtime.sendMessage({ message: "scheduleUpdate" });
	});
	$scheduleT2.click(function () {
		deselectAllSchedule(); $scheduleT2.addClass("selected");
		$schedulePerform.text("Scheduled - After startup");
		setTimeout(() => $schedulePerform.text("After startup"), 2000);
		app.storage.local.set({ scheduleDefault: "scheduleT2" });
		app.runtime.sendMessage({ message: "scheduleUpdate" });
	});
	$scheduleT3.click(function () {
		deselectAllSchedule(); $scheduleT3.addClass("selected");
		$scheduleDesktop.val(1); $scheduleReadCount.val(2); $readCount.val(2);
		app.storage.local.set({ scheduleDefault: "scheduleT3", scheduleDesktop: 1, readCount: 2 });
		$schedulePerform.text("Every 5-6 mins");
		app.runtime.sendMessage({ message: "scheduleUpdate" });
	});
	$scheduleT4.click(function () {
		deselectAllSchedule(); $scheduleT4.addClass("selected");
		$scheduleDesktop.val(3); $scheduleReadCount.val(5); $readCount.val(5);
		app.storage.local.set({ scheduleDefault: "scheduleT4", scheduleDesktop: 3, readCount: 5 });
		$schedulePerform.text("Every 15-17.5 mins");
		app.runtime.sendMessage({ message: "scheduleUpdate" });
	});

	// ---- NICHE ----
	app.storage.local.get(["searchNiche"], (result) => {
		if (!result.searchNiche) { app.storage.local.set({ searchNiche: "Random" }); $("#searchRandom").addClass("selected"); }
		else { $(`#search${result.searchNiche}`).addClass("selected"); }
	});
	$(".searchNiche").click(async function () {
		const niche = $(this).attr("id").replace("search", "");
		$(".searchNiche").removeClass("selected");
		$(this).addClass("selected");
		await app.storage.local.set({ searchNiche: niche });
	});

	// ---- ACTION BUTTONS ----
	$searchPerform.click(async function () {
		await store();
		app.runtime.sendMessage({ message: "search" });
		$stopDiv.css("display", "flex");
	});

	$schedulePerform.click(function () {
		const content = this.textContent;
		$schedulePerform.text("Schedule updated");
		setTimeout(() => $schedulePerform.text(content), 2000);
		app.runtime.sendMessage({ message: "schedule" });
	});

	$stop.click(function () {
		app.storage.local.set({ runningSearch: false });
		$stopDiv.css("display", "none");
		app.runtime.sendMessage({ message: "stop" });
	});
});
