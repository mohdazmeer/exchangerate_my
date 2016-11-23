// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS data (currency TEXT, rate TEXT)");
		callback(db);
	});
}

function updateRow(db, currency, rate) {
	// Insert some data.
	var statement = db.prepare("INSERT INTO data VALUES (?, ?)");
	statement.run([currency, rate]);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, currency, rate FROM data", function(err, row) {
		console.log(row.id + " - " + row.currency + " : " + row.rate);
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}

		callback(body);
	});
}

function run(db) {
	// Use request to read in pages.
	fetchPage("http://www.exchangerate.my", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);
		var currencies = [];
		var rates = [];
		
		var currElement = $("#ui-accordion-accrates-panel-1 b").each(function () {
			var value = $(this).text().trim();
			currencies.push(value);
			//updateRow(db, value, 'xxx');
		});

		var rateElement = $("tr+ tr td:nth-child(6)").each(function () {
			var value = $(this).text().trim();
			rates.push(value);
			//updateRow(db, value, 'xxx');
		});
		
		for (i = 0; i < currencies.length; i++) {
		    console.log(currencies[i] + " : " + rates[i]);
		    updateRow(db, currencies[i], rates[i]);
		}
		
		readRows(db);

		db.close();
	});
}

initDatabase(run);
