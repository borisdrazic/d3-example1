var DataService = (function() {
	"use strict";

	var inputData,
		pieData,
		torontoTopoJson,
		enabledCategories = {
			"Road - Pot hole" : true,
			"Graffiti" : true,
			"Bridge - Graffiti Complaint" : true,
			"Sidewalk - Graffiti Complaint" : true,
			"Road - Graffiti Complaint" : true
		},
		colorMap = {
			"Road - Pot hole" : "#377eb8",
			"Graffiti" : "#984ea3",
			"Bridge - Graffiti Complaint" : "#e41a1c",
			"Sidewalk - Graffiti Complaint" : "#4daf4a",
			"Road - Graffiti Complaint" : "#ff7f00"
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
			d3.json("data/toronto_topo.json", function(error, toronto) {
			 	torontoTopoJson = toronto;
				callback();
			});
		});
	}

	function getPieData() {
		return pieData;
	}

	function getTorontoTopoJson() {
		return torontoTopoJson;
	}

	function getInputData() {
		return inputData;
	}

	function getNeighbourhoodData(neighbourhood) {
		var neighbourhoodData = inputData.service_requests.filter(function(d, i) {
     		return d3.polygonContains(neighbourhood.geometry.coordinates[0], [d.long, d.lat]);
		});
		return d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.sum(d, function(g) {
					return 1;
				});
			})
			.entries(neighbourhoodData);
	}

	return {
		enabledCategories : enabledCategories,
		colorMap : colorMap,
		loadData : loadData,
		getPieData : getPieData,
		getTorontoTopoJson : getTorontoTopoJson,
		getInputData : getInputData,
		getNeighbourhoodData : getNeighbourhoodData
	};
})();
