var Main = (function(DataService, PieChart, MapChart, BarChart, TimeBarChart) {
	"use strict";

	function createCharts() {
		TimeBarChart.create("#timeBarChart");
		BarChart.create("#barChart");
		PieChart.create("#chart");
		PieChart.update(DataService.getPieData(), DataService.getInputData(), MapChart.update);
		MapChart.create("#map", BarChart.update, TimeBarChart.update, TimeBarChart.update2);
		MapChart.update(DataService.getInputData().service_requests);
	}

	DataService.loadData(createCharts);

})(DataService, PieChart, MapChart, BarChart, TimeBarChart);
