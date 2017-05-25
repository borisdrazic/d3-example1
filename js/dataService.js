var DataService = (function() {
	"use strict";

	var inputData,
		pieData,
		expectedTimes,
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
		},
		petNames25,
		petNames10;

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
	

	function parseExpectedTimes(serviceRequestData) {
		var returnData = {},
			data;

		data = d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.mean(d, function(g) {
					return (new Date(g.expected_datetime) - new Date(g.requested_datetime)) / 1000 / 60 / 60 /24;	
				});
			})
			.entries(serviceRequestData.filter(function(d) {
				return d.requested_datetime !== null && d.expected_datetime !== null;
			}));
		data.forEach(function(d, i) {
			returnData[d.key] = {"avg" : Math.round(d.value)};
		});

		data = d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.min(d, function(g) {
					return (new Date(g.expected_datetime) - new Date(g.requested_datetime)) / 1000 / 60 / 60 /24;	
				});
			})
			.entries(serviceRequestData.filter(function(d) {
				return d.requested_datetime !== null && d.expected_datetime !== null;
			}));

		data.forEach(function(d, i) {
			returnData[d.key].min = Math.round(d.value);
		});

		data = d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.max(d, function(g) {
					return (new Date(g.expected_datetime) - new Date(g.requested_datetime)) / 1000 / 60 / 60 /24;	
				});
			})
			.entries(serviceRequestData.filter(function(d) {
				return d.requested_datetime !== null && d.expected_datetime !== null;
			}));

		data.forEach(function(d, i) {
			returnData[d.key].max = Math.round(d.value);
		});

		return returnData;
	}

	function loadData(callback) {
		d3.json("data/data.json", function(error, input) {
			inputData = input;
			pieData = processDataForPieChart(inputData.service_requests);
			expectedTimes = parseExpectedTimes(inputData.service_requests);
			d3.json("data/toronto_topo.json", function(error, toronto) {
			 	torontoTopoJson = toronto;
			 	// load pet names data
			 	d3.csv("data/petNames25.csv", function(petNames25Data) {
			 		petNames25 = petNames25Data;
			 		d3.csv("data/petNames10.csv", function(petNames10Data) {
				 		petNames10 = petNames10Data;
				 		// All data is loaded, so call the callback function.
				 		callback();
				 	});
			 	});
				
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

	function getNeighbourhoodExpectedTimes(neighbourhood) {
		var neighbourhoodData = inputData.service_requests.filter(function(d, i) {
     			return d3.polygonContains(neighbourhood.geometry.coordinates[0], [d.long, d.lat]);
			}),
			returnData = {},
			data;

		data = d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.mean(d, function(g) {
					return (new Date(g.expected_datetime) - new Date(g.requested_datetime)) / 1000 / 60 / 60 /24;	
				});
			})
			.entries(neighbourhoodData.filter(function(d) {
				return d.requested_datetime !== null && d.expected_datetime !== null;
			}));
		data.forEach(function(d, i) {
			returnData[d.key] = {"avg" : Math.round(d.value)};
		});

		data = d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.min(d, function(g) {
					return (new Date(g.expected_datetime) - new Date(g.requested_datetime)) / 1000 / 60 / 60 /24;	
				});
			})
			.entries(neighbourhoodData.filter(function(d) {
				return d.requested_datetime !== null && d.expected_datetime !== null;
			}));

		data.forEach(function(d, i) {
			returnData[d.key].min = Math.round(d.value);
		});

		data = d3.nest()
			.key(function(d) { 
				return d.service_name;
			})
			.rollup(function(d) {
				return d3.max(d, function(g) {
					return (new Date(g.expected_datetime) - new Date(g.requested_datetime)) / 1000 / 60 / 60 /24;	
				});
			})
			.entries(neighbourhoodData.filter(function(d) {
				return d.requested_datetime !== null && d.expected_datetime !== null;
			}));

		data.forEach(function(d, i) {
			returnData[d.key].max = Math.round(d.value);
		});

		return returnData;
		
	}

	function getExpectedTimes() {
		return expectedTimes;
	}

	/**
	 * Returns array with top 25 pet names.
	 * Each element has following properties:
	 * 	category: can be anchor, cat, or dog
	 *  name: name of pet
	 *  number: number of registered pets with this name
	 */
	function getPetNames25Data() {
		return petNames25;
	}

	/**
	 * Returns array with top 10 pet names over years.
	 * Each element has following properties:
	 * 	category: can be anchor, cat, or dog
	 *  name: name of pet
	 *  number: number of registered pets with this name
	 * 	year: year of registration
	 */
	function getPetNames10Data() {
		return petNames10;
	}

	return {
		enabledCategories : enabledCategories,
		colorMap : colorMap,
		loadData : loadData,
		getPieData : getPieData,
		getTorontoTopoJson : getTorontoTopoJson,
		getInputData : getInputData,
		getNeighbourhoodData : getNeighbourhoodData,
		getExpectedTimes : getExpectedTimes,
		getNeighbourhoodExpectedTimes : getNeighbourhoodExpectedTimes,
		getPetNames25Data : getPetNames25Data,
		getPetNames10Data : getPetNames10Data
	};
})();
