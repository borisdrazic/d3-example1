var Main = (function() {
	"use strict";

	
	var colorMap = {
		"Road - Pot hole" : "rgb(31, 119, 180)",
		"Graffiti" : "rgb(255, 127, 14)",
		"Bridge - Graffiti Complaint" : "rgb(44, 160, 44)",
		"Sidewalk - Graffiti Complaint" : "rgb(214, 39, 40)",
		"Road - Graffiti Complaint" : "rgb(148, 103, 189)"
	},
	enabledCategories = {
			"Road - Pot hole" : true,
			"Graffiti" : true,
			"Bridge - Graffiti Complaint" : true,
			"Sidewalk - Graffiti Complaint" : true,
			"Road - Graffiti Complaint" : true
		},
	animationDuration = 1000,
	pieGenerator = d3.pie() // pie generator returns values for enalbed pie segments and zero for disabled
		.value(function(d) {
			return d.enabled ? d.value : 0;
		}),
	arcGenerator = d3.arc() // arc generator setup (for pie chart)
		.innerRadius(80)
		.outerRadius(120)
		.cornerRadius(1)
		.padAngle(0.008)
		.padRadius(120),
	chartTooltip = d3.select("#chart .tooltip"),
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

	function updatePieChart(data) {
		var t = d3.transition()
			.duration(animationDuration);

		// JOIN new data with old elements
		var path = d3.select("g.pie")
				.selectAll("path")
				.data(pieGenerator(data)),
			text = d3.select("g.pie")
				.selectAll("text")
				.data(pieGenerator(data));


		// EXIT old elements not present in new data
		path.exit()
			.transition(t)
			.remove();

		text.exit()
			.transition(t)
			.remove();


		// UPDATE old elements present in new data
		path.transition(t)	
			.attrTween("d", function(d) {
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
				return arcGenerator(interpolate(t));
				};
			});

		text.classed("disabled", function(d, i) {
				return !d.data.enabled;
			})
			.classed("enabled", function(d, i) {
				return d.data.enabled;
			});
		text.transition(t)
			.attrTween("x", function(d, i) {
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					return arcGenerator.centroid(interpolate(t))[0];
					};
			})
			.attrTween("y", function(d, i) {
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					return arcGenerator.centroid(interpolate(t))[1];
					};
			});

		
		// ENTER new elements present in new data
		path.enter()
			.append("path")
			.each(function(d) {
				this._current = d;
			})
			.attr("d", arcGenerator)
			.style("fill", function(d, i) {
				return colorMap[d.data.key];
			})
			.on("mouseover", function(d, i) {
				var sum = d3.sum(data.map(function(d) {
						return (d.enabled) ? d.value : 0;
					}));
				chartTooltip.html(d.data.key + " (" +  Math.round(d.data.value / sum * 100, 2)  + "%)");
				chartTooltip.style('display', 'block');
			})
			.on("mouseout", function(d, i) {
				chartTooltip.style('display', 'none');	
			})
			.on("mousemove", function(d, i) {
				chartTooltip.style("left", (d3.event.pageX - 120) + "px");
				chartTooltip.style("top", (d3.event.pageY - 25) + "px");
			});

		text.enter()
			.append("text")
			.each(function(d) {
				this._current = d;
			})
			.attr("dy", "0.33em")
			.attr("x", function(d, i) {
				return arcGenerator.centroid(d)[0];
			})
			.attr("y", function(d, i) {
				return arcGenerator.centroid(d)[1];
			})
			.text(function(d, i) {
				return d.value;
			});
	}

	function updatePieChartLegend(data, inputData) {
		var t = d3.transition()
			.duration(animationDuration);

		// JOIN new data with old elements
		var rect = d3.select("g.legend")
				.selectAll("rect")
				.data(data),
			text = d3.select("g.legend")
				.selectAll("text")
				.data(data);


		// EXIT old elements not present in new data
		rect.exit()
			.transition(t)
			.remove();
		text.exit()
			.transition(t)
			.remove();


		// UPDATE old elements present in new data
		

		// ENTER new elements present in new data
		rect.enter()
			.append("rect")
			.attr("width", 10)
			.attr("height", 10)
			.attr("x", 0)
			.attr("y", function(d, i) {
				return i * 15;
			})
			.style("fill", function(d, i) {
				return colorMap[d.key];
			})
			.style("stroke", function(d, i) {
				return colorMap[d.key];
			})
			.on("click", function(d) {
				var rect = d3.select(this),
					enabled = !rect.classed("disabled"),
					totalEnabled = d3.sum(data.map(function(d) {
						return (d.enabled) ? 1 : 0;
					}));

				if (totalEnabled > 1 || !enabled) {
					rect.classed("disabled", enabled);
					d.enabled = !enabled;
				}

				enabledCategories[d.key] = d.enabled;
				
    			updatePieChart(data);
    			updateMap(inputData.service_requests);
			});

		text.enter()
			.append("text")
			.attr("x", 15)
			.attr("y", function(d, i) {
				return i * 15 + 2;
			})
			.text(function(d, i) {
				return d.key;
			});
	}

	function updateMap(data) {
		var t = d3.transition()
			.duration(animationDuration);

		data = data.filter(function(d, i) {
			return enabledCategories[d.service_name];
		});

		// JOIN new data with old elements
		var point = d3.select("#map g.points")
				.selectAll("circle")
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
			.attr("r", 0)
			.remove();
		polygon.exit()
			.transition(t)
			.style("stroke-opacity", 0)
			.remove();

		// UPDATE old elements present in new data


		// ENTER new elements present in new data
		point.enter()
			.append("circle")
			.attr("fill", function(d, i) {
				return colorMap[d.service_name];
			})
			.attr("transform", function(d, i) {
				return "translate(" + albersProjection([d.long,d.lat]) + ")";
			})
			.attr("r", 0)
			.transition(t)
				.attr("r", 3);

		polygon.enter()
			.append("path")
	  		.attr("d", function(d) { 
	  			return d ? "M" + d.join("L") + "Z" : null; 
	  		})
	  		.on("mouseover", function(d, i) {
				mapTooltip.select(".address").html(d.data.address);
			})
			.on("mouseleave", function(d, i) {
				mapTooltip.select(".address").html("");
			})
			.style("stroke-opacity", 0)
				.transition(t)
				.style("stroke-opacity", 1);
	}

	d3.json("data.json", function(error, inputData) {
		var pieData = processDataForPieChart(inputData.service_requests);
			
		updatePieChart(pieData);
		updatePieChartLegend(pieData, inputData);	
		
		d3.select("#map")
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

		updateMap(inputData.service_requests);
	});
})();
