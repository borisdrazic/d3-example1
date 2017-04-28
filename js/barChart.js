var BarChart = (function(DataService) {
	"use strict";
	
	var animationDuration = 400,
		chartWidth = 300,
		chartHeight = 200,
		margin = {
			top: 20,
			right: 20,
			bottom: 90,
			left: 60
		},
		yExponent = 0.2,
		width = chartWidth - margin.left - margin.right,
		height = chartHeight - margin.top - margin.bottom,
		x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
    	y = d3.scalePow()
    		.exponent(yExponent)
    		.rangeRound([height, 0]),
    	chartG,
    	xDomain = ["Road - Pot hole", "Graffiti", "Bridge - Graffiti Complaint", "Sidewalk - Graffiti Complaint", "Road - Graffiti Complaint"];
	
	function create(selector) {
		var chartSvg = d3.select(selector)
				.append("svg")
				.attr("width", chartWidth)
				.attr("height", chartHeight);
		chartG = chartSvg.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    	x.domain(["Road - Pot hole", "Graffiti", "Bridge - Graffiti Complaint", "Sidewalk - Graffiti Complaint", "Road - Graffiti Complaint"]);
    	y.domain([0, 50]);
    		
    	chartG.append("g")
      		.attr("class", "axis axis-x")
      		.attr("transform", "translate(0," + height + ")")
      		.call(d3.axisBottom(x))
    		.selectAll("text")  
     			.style("text-anchor", "end")
     			.attr("dx", "-.8em")
     			.attr("dy", ".15em")
     			.attr("transform", "rotate(-35)");
  		chartG.append("g")
      		.attr("class", "axis axis-y")
      		.call(d3.axisLeft(y).ticks(3));

      	
    }

    function update(data) {
    	var t = d3.transition()
			.duration(animationDuration);

		// filter data
    	data = data.filter(function(d, i) {
			return DataService.enabledCategories[d.key];
		});
    	// update x axis
		x.domain(xDomain.filter(function(d, i) {
			return DataService.enabledCategories[d];
		}));
		

		chartG.select("g.axis-x")
      		.call(d3.axisBottom(x))
      		.selectAll("text")  
     			.style("text-anchor", "end")
     			.attr("dx", "-.8em")
     			.attr("dy", ".15em")
     			.attr("transform", "rotate(-35)");

		


		// JOIN new data with old elements
		var bar = chartG.selectAll(".bar")
				.data(data, function(d) { return d.key; });

		// EXIT old elements not present in new data
		bar.exit()
			.transition(t)
			.attr("y", height)	
			.attr("height", 0)
			.remove();

		// UPDATE old elements present in new data
		bar.attr("x", function(d) { 
			return x(d.key); 
		})
			.style("fill", function(d, i) {
				return DataService.colorMap[d.key];
			})
			.attr("width", x.bandwidth())
			.transition(t)
				.attr("y", function(d) { return y(d.value); })	
				.attr("height", function(d) { return height - y(d.value); });
			
		// ENTER new elements present in new data
		bar.enter()
			.append("rect")
  			.attr("class", "bar")
  			.style("fill", function(d, i) {
				return DataService.colorMap[d.key];
			})
  			.attr("x", function(d) { return x(d.key); })
  			.attr("width", x.bandwidth())
			.attr("y", height)
			.attr("height", 0)
  			.transition(t)
  				.attr("y", function(d) { return y(d.value); })
				.attr("height", function(d) { return height - y(d.value); });
	}

	return {
		create : create,
		update : update
	};

})(DataService);