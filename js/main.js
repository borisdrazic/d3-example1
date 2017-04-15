var Main = (function(DataService, PieChart, MapChart) {
	"use strict";

	function createCharts() {
		PieChart.create("#chart");
		PieChart.update(DataService.getPieData(), DataService.getInputData(), MapChart.update);

		MapChart.create("#map");
		MapChart.update(DataService.getInputData().service_requests);
	}

	DataService.loadData(createCharts);

})(DataService, PieChart, MapChart);
