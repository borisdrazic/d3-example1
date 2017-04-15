var PieChart = (function(DataService) {
	"use strict";

	var animationDuration = 1000,
		chartWidth = 500,
		chartHeight = 500,
		pieGenerator = d3.pie() // pie generator returns values for enalbed pie segments and zero for disabled
			.value(function(d) {
				return d.enabled ? d.value : 0;
			}),
		arcGenerator = d3.arc() // arc generator setup (for pie chart)
			.innerRadius(chartWidth / 2 - 100)
			.outerRadius(chartWidth / 2 - 10)
			.cornerRadius(1)
			.padAngle(0.008)
			.padRadius(120),
		chartTooltip = d3.select("#chart .tooltip");
	
	function create(selector) {
		var chartSvg = d3.select(selector)
			.append("svg")
			.attr("width", chartWidth)
			.attr("height", chartHeight);
		chartSvg.append("g")
			.classed("pie", true)
			.attr("transform", "translate(" + chartWidth / 2 + ", " + chartHeight / 2 + ")");
		chartSvg.append("g")
			.classed("legend", true)
			.attr("transform", "translate(" + (chartWidth / 2 - 80) + ", " + (chartHeight / 2 - 60) + ")");
	}

	function updatePieChartLegend(data, inputData, updateMap) {
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
			.attr("width", 20)
			.attr("height", 20)
			.attr("x", 0)
			.attr("y", function(d, i) {
				return i * 25;
			})
			.style("fill", function(d, i) {
				return DataService.colorMap[d.key];
			})
			.style("stroke", function(d, i) {
				return DataService.colorMap[d.key];
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

				DataService.enabledCategories[d.key] = d.enabled;
				
    			updatePieChart(data);
    			updateMap(inputData.service_requests);
			});

		text.enter()
			.append("text")
			.attr("x", 25)
			.attr("y", function(d, i) {
				return i * 25 + 2;
			})
			.attr("dy", "0.25em")
			.text(function(d, i) {
				return d.key;
			});
	}

	function isAngleLargeEnoughForText(d) {
		return d.endAngle - d.startAngle > 0.15;
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
				return !d.data.enabled || !isAngleLargeEnoughForText(d);
			})
			.classed("enabled", function(d, i) {
				return d.data.enabled && isAngleLargeEnoughForText(d);
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
				return DataService.colorMap[d.data.key];
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
				chartTooltip.style("left", (d3.event.pageX - 160) + "px");
				chartTooltip.style("top", (d3.event.pageY - 15) + "px");
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
			})
			.classed("disabled", function(d, i) {
				return !d.data.enabled || !isAngleLargeEnoughForText(d);
			})
			.classed("enabled", function(d, i) {
				return d.data.enabled && isAngleLargeEnoughForText(d);
			});

		
	}

	function update(data, inputData, updateMap) {
		updatePieChart(data);
		updatePieChartLegend(data, inputData, updateMap);
	}

	return {
		create : create,
		update : update
	};

})(DataService);