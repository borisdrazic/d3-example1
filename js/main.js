var Main = (function(DataService, PieChart, MapChart, BarChart) {
	"use strict";

	function createCharts() {
		BarChart.create("#barChart");
		PieChart.create("#chart");
		PieChart.update(DataService.getPieData(), DataService.getInputData(), MapChart.update);
		MapChart.create("#map", BarChart.update);
		MapChart.update(DataService.getInputData().service_requests);
	}

	DataService.loadData(createCharts);

})(DataService, PieChart, MapChart, BarChart);
