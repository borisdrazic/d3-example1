var Main = (function(DataService, PieChart, MapChart, BarChart, TimeBarChart, ForceChart, MapLayoutChart) {
	"use strict";

	function createCharts() {
		TimeBarChart.create("#timeBarChart");
		BarChart.create("#barChart");
		PieChart.create("#chart");
		PieChart.update(DataService.getPieData(), DataService.getInputData(), MapChart.update);
		MapChart.create("#map", BarChart.update, TimeBarChart.update, TimeBarChart.update2);
		MapChart.update(DataService.getInputData().service_requests);
		ForceChart.create("#petNamesForce svg");
		MapLayoutChart.create("#petNamesMap svg");
	}	

	DataService.loadData(createCharts);

})(DataService, PieChart, MapChart, BarChart, TimeBarChart, ForceChart, MapLayoutChart);
