var DataService = (function() {
	"use strict";

	var inputData,
		pieData,
		enabledCategories = {
			"Road - Pot hole" : true,
			"Graffiti" : true,
			"Bridge - Graffiti Complaint" : true,
			"Sidewalk - Graffiti Complaint" : true,
			"Road - Graffiti Complaint" : true
		},
		colorMap = {
			"Road - Pot hole" : "rgb(31, 119, 180)",
			"Graffiti" : "rgb(255, 127, 14)",
			"Bridge - Graffiti Complaint" : "rgb(44, 160, 44)",
			"Sidewalk - Graffiti Complaint" : "rgb(214, 39, 40)",
			"Road - Graffiti Complaint" : "rgb(148, 103, 189)"
		};

	function processDataForPieChart(serviceRequestData) {
		// process data and generate key+value array on service_name count
		var data = d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.sum(d, function(g) {
					return 1;
				});
			})
			.entries(serviceRequestData);

		// initially all pie segments are enabled
		data.forEach(function(d) {
				d.enabled = true;
			});

		// sort data from largest to smallest
		data = data.sort(function(a, b){
			return b.value - a.value;
		});

		return data;
	}

	function loadData(callback) {
		d3.json("data/data.json", function(error, input) {
			inputData = input;
			pieData = processDataForPieChart(inputData.service_requests);
			callback();
		});
	}

	function getPieData() {
		return pieData;
	}

	function getInputData() {
		return inputData;
	}

	return {
		enabledCategories : enabledCategories,
		colorMap : colorMap,
		loadData : loadData,
		getPieData : getPieData,
		getInputData : getInputData
	};
})();
