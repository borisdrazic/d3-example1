var MapChart = (function(DataService) {
	"use strict";

	var animationDuration = 1000,
		mapWidth = 650,
		mapHeight = 430,
		mapTooltip = d3.select("#map .tooltip"),
		albersProjection = d3.geoAlbers()
			.scale(90000)
			.rotate([71.057, 0])
			.center([-8.3, 43.72])
			.translate( [mapWidth/2, mapHeight/2] ),
		geoPath = d3.geoPath()
			.projection(albersProjection),
		voronoi = d3.voronoi()
			.x(function(d, i) {
				return albersProjection([d.long, d.lat])[0];
			})
			.y(function(d, i) {
				return albersProjection([d.long, d.lat])[1];
			})
			.extent([[0, 0], [mapWidth, mapHeight]]);

	function create(selector) {
		d3.select(selector)
			.append("svg")
			.attr("width", mapWidth)
			.attr("height", mapHeight)
			.append("g")
				.selectAll("path")	
				.data(neighborhoods_json.features)
				.enter()
				.append("path")
				.attr("fill", "#ccc")
				.attr("d", geoPath);

		d3.select("#map svg")
			.append("g")
			.classed("points", true);

		d3.select("#map svg")
			.append("g")
			.classed("polygons", true);
	}

	function updateMap(data) {
		var pointG,
			t = d3.transition()
				.duration(animationDuration);

		data = data.filter(function(d, i) {
			return DataService.enabledCategories[d.service_name];
		});

		// JOIN new data with old elements
		var point = d3.select("#map g.points")
				.selectAll("g.map-circle")
				.data(data, function(d, i) {
					return d.service_request_id;
				}),
			polygon = d3.select("#map g.polygons")
	  			.selectAll("path")
	  			.data(voronoi.polygons(data), function(d, i) {
					return d ? d.data.service_request_id : null;
				});

		// EXIT old elements not present in new data
		point.exit()
			.transition(t)
			.style("fill-opacity", 0)
			.remove();
		polygon.exit()
			.remove();

		// UPDATE old elements present in new data
		polygon
	  		.attr("d", function(d) { 
	  			return d ? "M" + d.join("L") + "Z" : null; 
	  		});

		// ENTER new elements present in new data
		pointG = point.enter()
			.append("g");

		pointG.classed("map-circle", true)
			.attr("id", function (d, i) {
				return "service_request_id_" + d.service_request_id;
			})
			.attr("transform", function(d, i) {
				return "translate(" + albersProjection([d.long, d.lat]) + ")";
			})
			.style("fill-opacity", 0)
			.transition(t)
				.style("fill-opacity", 1);

		pointG.append("circle")
			.classed("circle", true)
			.classed("first-circle", true)
			.attr("r", 3)
			.attr("fill", function(d, i) {
				return d3.hsl(DataService.colorMap[d.service_name]).brighter(0.3);
			});

		pointG.append("circle")
			.classed("circle", true)
			.classed("second-circle", true)
			.attr("r", 3)
			.attr("fill", function(d, i) {
				return d3.hsl(DataService.colorMap[d.service_name]).brighter(0.2);
			});

		pointG.append("circle")
			.classed("circle", true)
			.classed("third-circle", true)
			.attr("r", 3)
			.attr("fill", function(d, i) {
				return d3.hsl(DataService.colorMap[d.service_name]).brighter(0.1);
			});

		pointG.append("circle")
			.classed("circle", true)
			.attr("r", 3)
			.attr("fill", function(d, i) {
				return d3.hsl(DataService.colorMap[d.service_name]);
			});

		


		polygon.enter()
			.append("path")
	  		.attr("d", function(d) { 
	  			return d ? "M" + d.join("L") + "Z" : null; 
	  		})
	  		.on("mouseover", function(d, i) {
	  			d3.select("#service_request_id_" + d.data.service_request_id)
	  				.classed("pulse", true);
				mapTooltip.select(".address").html(d.data.address);
			})
			.on("mouseleave", function(d, i) {
				d3.select("#service_request_id_" + d.data.service_request_id)
	  				.classed("pulse", false);
				mapTooltip.select(".address").html("");
			});
	}

	return {
		create : create,
		update : updateMap
	};

})(DataService);
