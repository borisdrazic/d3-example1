var TimeBarChart = (function(DataService) {
	"use strict";

	d3.selection.prototype.moveToFront = function() {  
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };
	
	var animationDuration = 1000,
		chartWidth = 300,
		chartHeight = 200,
		margin = {
			top: 10,
			right: 10,
			bottom: 10,
			left: 10
		},
		width = chartWidth - margin.left - margin.right,
		height = chartHeight - margin.top - margin.bottom,
		chartG,
		barGs = [],
		noBars = 5,
		barHeight = (height / noBars) * 0.3,
		avgPointerWidth = width / 20,
		xScales = [],
		colors = [
			"#377eb8",
			"#984ea3",
			"#e41a1c",
			"#4daf4a",
			"#ff7f00"
		],
		categories = ["Road - Pot hole", "Graffiti", "Bridge - Graffiti Complaint", "Sidewalk - Graffiti Complaint", "Road - Graffiti Complaint"];


	function create(selector) {
		var barIndex,
			barG,
			expectedTimes,
			data = [];

		expectedTimes = DataService.getExpectedTimes();
		for (barIndex = 0; barIndex < noBars; ++barIndex) {
			data.push(expectedTimes[categories[barIndex]]);
		}
		

		chartG = d3.select(selector)
				.append("svg")
				.attr("width", chartWidth)
				.attr("height", chartHeight)
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		for (barIndex = 0; barIndex < noBars; ++barIndex) {
			xScales.push(d3.scaleLinear().domain([0, data[barIndex].max]).range([0, width]).nice());
			barG = chartG.append("g")
					.attr("transform", "translate(0, " + barIndex * (height / noBars) + ")");
			barG.append("g")
      			.attr("class", "axis axis-y")
      			.attr("transform", "translate(0," + barHeight + ")")
      			.call(d3.axisBottom(xScales[barIndex]).ticks(5));
      		barG.append("rect")
      			.attr("class", "backBar")
      			.attr("width", xScales[barIndex](data[barIndex].max) - xScales[barIndex](data[barIndex].min))
      			.attr("height", barHeight)
      			.style("fill", d3.hsl(colors[barIndex]).brighter(1.3))
      			.attr("x", xScales[barIndex](data[barIndex].min));


      		var gg = barG.append("g")
      			.attr("class", "bottomAvg")
      			.attr("transform", function(d, i) {
					return "translate(" + xScales[barIndex](data[barIndex].avg) + ",-" + barHeight / 2 +")";
				})
      			.append("g")
      				.attr("transform", "translate(-" + avgPointerWidth / 2 + ",0)")
      				.style("fill", d3.hsl(colors[barIndex]).brighter(1.3));
      					
      		gg.append("path")
      			.attr("d" ,"M 0,0 " + avgPointerWidth / 2 + "," + barHeight / 2 + " " + avgPointerWidth + ",0 Z");
	
			barGs.push(barG);
			
		}
    }

    function update(data) {
    	var barIndex,
    		t = d3.transition()
				.duration(animationDuration),
			d1 = [];

		for (barIndex = 0; barIndex < noBars; ++barIndex) {
			if (typeof data[categories[barIndex]] === "undefined") {
				d1.push({
					min : 0,
					avg  : 0,
					max : 0
				});
			} else {
				d1.push(data[categories[barIndex]]);	
			}
			
		}

    	for (barIndex = 0; barIndex < noBars; ++barIndex) {
    		// JOIN new data with old elements
			var barG = barGs[barIndex].selectAll(".bar")
					.data([d1[barIndex]]),
			 	avgPointerG = barGs[barIndex].selectAll(".avg")
					.data([d1[barIndex]]);

			// EXIT old elements not present in new data
			barG.exit()
				.remove();
			avgPointerG.exit()
				.remove();

			// UPDATE old elements present in new data
			barG.transition(t)
				.attr("x", function(d, i) {
	  				return xScales[barIndex](d.min);
	  			})
				.attr("width", function(d, i) {
	  				return xScales[barIndex](d.max) - xScales[barIndex](d.min);
	  			});
	  		avgPointerG.transition(t)
				.attr("transform", function(d, i) {
					return "translate(" + xScales[barIndex](d.avg) + ",-" + barHeight / 2 +")";
				});
				
			// ENTER new elements present in new data
			barG.enter()
				.append("rect")
	  			.attr("class", "bar")
	  			.style("fill", function(d, i) {
					return colors[barIndex];
				})
	  			.attr("x", function(d, i) {
	  				return xScales[barIndex](d.min);
	  			})
	  			.attr("y", 0)
	  			.attr("width", function(d, i) {
	  				return xScales[barIndex](d.max) - xScales[barIndex](d.min);
	  			})
				.attr("height", barHeight);

			// ENTER new elements present in new data
			var gg = avgPointerG.enter()
				.append("g")
      			.attr("class", "avg")
      			.attr("transform", function(d, i) {
					return "translate(" + xScales[barIndex](d.avg) + ",-" + barHeight / 2 +")";
				})
      			.append("g")
      				.attr("transform", "translate(-" + avgPointerWidth / 2 + ",0)")
      				.style("fill", colors[barIndex]);
      					
      		gg.append("path")
      			.attr("d" ,"M 0,0 " + avgPointerWidth / 2 + "," + barHeight / 2 + " " + avgPointerWidth + ",0 Z");

	    }
	}

	function update2(category, noDays) {
    	var barIndex,
    		t = d3.transition()
				.duration(animationDuration),
			d1 = [];


		for (barIndex = 0; barIndex < noBars; ++barIndex) {
			if (categories[barIndex] === category) {
				d1.push(noDays);
			} else {
				d1.push(0);
			}
		}

    	for (barIndex = 0; barIndex < noBars; ++barIndex) {
    		// JOIN new data with old elements
			var avgPointerG = barGs[barIndex].selectAll(".avgPoint")
					.data([d1[barIndex]]);

			avgPointerG.moveToFront();
			// EXIT old elements not present in new data
			avgPointerG.exit()
				.remove();

			// UPDATE old elements present in new data
	  		avgPointerG.transition(t)
				.attr("transform", function(d, i) {
					return "translate(" + xScales[barIndex](d) + ",0)";
				})
				.style("opacity", function(d, i) {
					return d > 0 ? 1 : 0;
				});

			// ENTER new elements present in new data
			var gg = avgPointerG.enter()
				.append("g")
      			.attr("class", "avgPoint")
      			.attr("transform", function(d, i) {
					return "translate(" + xScales[barIndex](d) + ",0)";
				})
				.style("opacity", function(d, i) {
					return d > 0 ? 1 : 0;
				})
  				.append("g")
  					.attr("transform", "translate(-" + avgPointerWidth / 2 + ",0)")
  					.style("fill", "#000");
      					
      		gg.append("path")
      			.attr("d" ,"M " + avgPointerWidth / 2 + "," + barHeight / 2 + " 0," + barHeight + " 0,0 z");
      		gg.append("path")
      			.attr("transform", "translate(" + avgPointerWidth / 2 + ",0)")
      			.attr("d" ,"M 0," + barHeight / 2 + " " +  avgPointerWidth / 2 + ",0 " + avgPointerWidth / 2 + "," + barHeight +" Z");
	    }
	}

	return {
		create : create,
		update : update,
		update2 : update2
	};

})(DataService);