var HiveChart = (function(DataService) {
	"use strict";

	var animationDuration = 1000,
		svg, // SVG element
		width = 1100, // width of SVG
    	height = 630, // height of SVG
    	innerRadius = 40, // inner radius of hive plot
    	outerRadius = 300, // maximum outer radius of hive plot
    	activeWards = d3.range(44).map(function (d) { return false; }), // true for wards that should be displayed
		noYears, // number of years in input data
		links, // hive plot links
		angle, // scale from x axis index to angle of axis
    	radius, // scale for hive plot radius, i.e., position on x axis (from inner radius to outer radius)
    	yearScale, // scale from year to x vale for links
    	color, // scale form ward to color
    	colors = ["#470c44", "#215923", "#3f245e", "#00593d", "#5b0434", "#0c6966", "#600625", "#00381e", "#8c4170", "#132200", "#594381", "#623902", "#3c4382", "#894d26", "#002f5b", "#6a5d2d", "#071336", "#894f3a", "#00597c", "#580d0b", "#5d5792", "#323200", "#7e4c81", "#2f2300", "#475f80", "#442200", "#004659", "#974144", "#003b39", "#974354", "#002a41", "#7c2831", "#406371", "#3b0016", "#52634b", "#220f24", "#8e494c", "#290c11", "#665875", "#3b0b00", "#7e4f6f", "#312120", "#835050", "#775655"],
    	axixColor = "#AAAAAA",
    	waterConsumptionDataArray;

    	

	/**
	 * Converst radians to degrees.
	 */
	function degrees(radians) {
  		return radians / Math.PI * 180 - 90;
	}

	/**
	 * Returns links for hive plot of active wards based on water consumption in waterConsumptionArray.
	 */
	function getLinks(waterConsumptionArray) {
		var links = [],
			data,
			maxYearlyTotalConsumption, // maximum consumption per year (all active wards)
			maxYear, // maximum year
			assignedYSource, // for each x axis portion of axis already assinged to sources of lines (in order of wards)
			assignedYTarget, // for each x axis portion of axis already assinged to targets of lines (in order of wards)
			i;

		// filter out inactive wards
		waterConsumptionArray = waterConsumptionArray.filter(function(d) {
			return activeWards[parseInt(d["city ward"]) - 1];
		});

		// group input data by year
		data = d3.nest()
			.key(function(d) { return d.year; })
			.entries(waterConsumptionArray);

		// set number of years in input data
		noYears = data.length;

		// compute max over years of total consumption for all active wards
		maxYearlyTotalConsumption = d3.max(data, function(v) {
			return d3.sum(v.values, function(d) {
				return parseFloat(d["total consumption"]);
			});
		});

		// find maximum year of input data
		maxYear = d3.max(waterConsumptionArray, function(d) {
			return parseInt(d.year);
		});

		// scale from year value to x vale for links
		yearScale = d3.scaleOrdinal(d3.range(noYears))
			.domain(data.map(function(d) { return parseInt(d.key); }).sort());

		// sort input data by ward (ascending) and then by year (ascending)
		waterConsumptionArray.sort(function(a, b) {
			var ward = parseInt(a["city ward"]) - parseInt(b["city ward"]);
			if (ward === 0) {
				return parseInt(a.year) - parseInt(b.year);
			}
			return ward;
		});

		// initally nothing is assigned to x axis
		assignedYSource = d3.range(noYears).map(function (d) {
			return 0;
		});
		assignedYTarget = d3.range(noYears + 1).map(function (d) {
			return 0;
		});
		
		// create source and targets for links
		for (i = 0; i < waterConsumptionArray.length; ++i) {

			var d, 
				nextD,
				x,
				consumption,
				nextConsumption;

			d = waterConsumptionArray[i]; // current data point
			// Last year does not lead anywhere, so skip it.
			// NB: values for last yaer will be added as targets of second to last year values.
			if (d.year < maxYear) {
				// next data point (next year for this ward)
				nextD = waterConsumptionArray[i + 1]; 
				// get x axis associated with year of this data point
				x = yearScale(parseInt(d.year));
				// consumption at this data point as percentage of total consumption for year
				consumption = parseFloat(d["total consumption"]) / maxYearlyTotalConsumption;
				// Consumption at next data point as percentage of total consumption for next year.
				// This is consumption for nex year of same ward.
				// Remeber, we do not proess last yaer, so we will not run into problems where next data point is for first year of next ward.
				nextConsumption = parseFloat(nextD["total consumption"]) / maxYearlyTotalConsumption;
				// store amount on source x axis taken by this ward
				assignedYSource[x] += consumption;
				// store amount on target x axis taken by this ward
				assignedYTarget[x + 1] += nextConsumption;
				// Add link (value at source is this years consumption and value at end is next years consumption).
				// Group is equal to ward number.
				links.push({
					source : {
						x : x,
						y0 : assignedYSource[x] - consumption,
						y1 : assignedYSource[x] 
					},
					target : {
						x : x + 1,
						y0 : assignedYTarget[x + 1] - nextConsumption,
						y1 : assignedYTarget[x + 1] 
					},
					group : parseInt(d["city ward"])
				});
			}
		}
		return links;
	}

	/**
	 * Update hive plot to show/hide selected ward.
	 */
	function legendClick(d) {
		var ward = d3.select(this).attr("data-ward");
		activeWards[ward] = !activeWards[ward];
		svg.select(".legend rect.legendRect-" + ward).classed("disabled", !activeWards[ward]);
		update();
	}


	//<rect x="240" y="240" height="20" width="20" fill="transparent" stroke="black" stroke-width="2" />
  	//<rect x="239.75" y="239.75" height="20" width="20" fill="transparent" stroke="red" stroke-width="4" class="another-circle"/>


	/**
	 * Appedn legend item (one ward to legendG column).
	 */
	function appendLegendItem(legendG, iOffset) {
		var x = 10, 
			y = 10,
			ySpace = 30,
			i;

		for(i = 0; i < 11; ++i) {
			legendG.append("rect")
				.classed("legendRect", true)
				.classed("legendRect-" + (i + iOffset), true)
				.classed("disabled", i !== 0)
				.attr("width", 20)
				.attr("height", 20)
				.attr("x", x)
				.attr("y", y)
				.style("fill", colors[i + iOffset])
				.style("stroke", colors[i + iOffset])
				.style("stroke-width", 2);
				

			legendG.append("rect")
				.classed("legendBorder", true)
				.attr("data-ward", i + iOffset)
				.attr("width", 20)
				.attr("height", 20)
				.attr("x", x - 0.25)
				.attr("y", y - 0.25)
				.style("fill", "transparent")
				.style("stroke", colors[i + iOffset])
				.style("stroke-width", 4)
				.on("click", legendClick);
			
			legendG.append("text")
				.attr("x", x + 30)
				.attr("y", y)
				.attr("dy", 15)
				.text("Ward " + (i + iOffset + 1));

			y += ySpace;
		}
	}

	/**
	 * Appends legend to the SVG.
	 * Wards 1 to 22 are in two columns on the left of hive plot, 
	 * and wards 23 to 44 are in two columns to the right of hive plot.
	 */
	function appendLegend() {
		var legendG,
			i;

		legendG = svg.append("g")
			.classed("legend", true)
			.classed("left1", true)
			.attr("transform", "translate(0, 120)");
		appendLegendItem(legendG, 0);

		legendG = svg.append("g")
			.classed("legend", true)
			.classed("left2", true)
			.attr("transform", "translate(100, 120)");
		appendLegendItem(legendG, 11);

		legendG = svg.append("g")
			.classed("legend", true)
			.classed("right1", true)
			.attr("transform", "translate(" + (width - 200) + ", 120)");
		appendLegendItem(legendG, 22);

		legendG = svg.append("g")
			.classed("legend", true)
			.classed("right2", true)
			.attr("transform", "translate(" + (width - 100) + ", 120)");
		appendLegendItem(legendG, 33);
	}

	function create(selector) {
		var pieGenerator,
	    	arcData,
	    	arcGenerator;


		waterConsumptionDataArray = DataService.getWaterConsumptionData();
		// set initial active wards
		activeWards[0] = true;
		activeWards[11] = true;
		activeWards[22] = true;
		activeWards[33] = true;
		links = getLinks(waterConsumptionDataArray);
		
		// define scales
		angle = d3.scalePoint().domain(d3.range(noYears + 1)).range([2 * Math.PI / noYears, 2 * Math.PI]);
    	radius = d3.scaleLinear().range([innerRadius, outerRadius]);
    	color = d3.scaleOrdinal(colors).domain(d3.range(44));

    	// add SVG element
    	svg = d3.select(selector).append("svg")
    		.attr("width", width)
    		.attr("height", height);

    	// add inner circle
    	svg.append("circle")
    		.attr("cx", width / 2)
    		.attr("cy", height / 2)
    		.attr("r", innerRadius - 1.5)
    		.style("fill-opacity", 0)
    		.style("stroke", axixColor)
    		.style("stroke-width", "2px");

    	// add outer circle
    	svg.append("circle")
    		.attr("cx", width / 2)
    		.attr("cy", height / 2)
    		.attr("r", outerRadius + 1)
    		.style("fill-opacity", 0)
    		.style("stroke", axixColor)
    		.style("stroke-width", "2px");
		
		svg.append("g")
  			.classed("links", true)
    		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    	// add axis to hive plot
		svg.append("g")
			.classed("x-axis", true)
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
			.selectAll(".axis")
	    	.data(d3.range(noYears))
	  		.enter()
	  		.append("g")
	    		.attr("class", "axis")
	    		.attr("transform", function(d) { return "rotate(" + degrees(angle(d)) + ")"; })
	  			.selectAll("line")
					.data(["stroke", "fill"])
	  				.enter()
	  					.append("line")
	    				.attr("class", function(d) { return d; })
	    				.attr("fill", axixColor)
	    				.attr("stroke", axixColor)
	    				.attr("x1", radius.range()[0])
	    				.attr("x2", radius.range()[1]);

	    // create invisible pie chart used to position year labels
	    // pie chart will have the same number of segments as hive plot
	    arcGenerator = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius + 5)
			.cornerRadius(0)
			.padAngle(0)
			.padRadius(0);
		// position segments with offset to hive plot so that labels end up centered in hive axis
		pieGenerator = d3.pie()
			.startAngle(2 * Math.PI / noYears - 0.02 * Math.PI)
			.endAngle(2 * Math.PI - 0.02 * Math.PI)
			.sort(null);
		// for data we use array of noYeart ones (as we just need segments of same size)
		arcData = pieGenerator(d3.range(noYears).map(function(d) {
			return 1;
		}));

		// add pie chart (hidden)
		svg.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
			.classed("labels", true)
			.selectAll("path")
			.data(arcData)
			.enter()
			.append("path")
				.attr("id", function(d, i) { return "yearArc_" + i; })
				.attr("d", arcGenerator)
				.attr("fill-opacity", 0);

		// add year labels on pie chart arcs
		svg.select("g.labels")
			.selectAll(".yearText")
			.data(yearScale.domain())
   			.enter()
   			.append("text")
				.classed("yearText", true)
   				.append("textPath")
					.attr("xlink:href", function(d, i) { return "#yearArc_" + i; })
					.text(function(d){return d;});

		appendLegend();
		update();
	}

	function update() {
		links = getLinks(waterConsumptionDataArray);

		// add borders on lines if we have a small numebr of links
		svg.select("g.links").classed("small", links.length < 100);
		
		// add links to hive plot
		var link = svg.select("g.links").selectAll(".link")
    		.data(links, function(d, i) {
    			return d.group + "-" + d.source.x + "-" + d.target.x;
    		});
    	
    	// EXIT
    	link.exit()
    		.transition()
  			.duration(animationDuration)
    		.attr("d", d3.hive.link()
    			.angle(function(d) { return angle(d.x); })
    			.startRadius(function(d) { return radius.range()[1] - 0.1; })
    			.endRadius(function(d) {return  radius.range()[1]; }))
    		.remove();

    	
    	// ENTER + UPDATE
  		link.enter()
  			.append("path")
  			.attr("class", "link")
  			.style("fill", function(d) { 
  				return color(d.group - 1); 
  			})
  			.attr("d", d3.hive.link()
    			.angle(function(d) { return angle(d.x); })
    			.startRadius(function(d) { return radius.range()[0]; })
    			.endRadius(function(d) { return radius.range()[0] + 0.1; }))
  			.merge(link)
    			.transition()
  				.duration(animationDuration)
    			.attr("d", d3.hive.link()
    				.angle(function(d) { return angle(d.x); })
    				.startRadius(function(d) { return radius(d.y0); })
    				.endRadius(function(d) { return radius(d.y1); }));    	
	}

	return {
		create : create
	};
	
})(DataService);
