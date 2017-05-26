var MapLayoutChart = (function(DataService) {
	"use strict";

	var svg, // svg element
    	width, // width of SVG
		height, // height of SVG
		colors = { // square colors
			"cat" : {
				2016 : "#316786",
				2015 : "#4e8a88",
				2014 : "#024a7a",
				2013 : "#14736b",
				2012 : "#21634a",
			},
			"dog" : {
				2016 : "#403186",
				2015 : "#8c004d",
				2014 : "#7d0b70",
				2013 : "#73272e",
				2012 : "#66284d",
			}
		},
		paddding = { // padding to accomodate legend on left and right
			left : 100,
			right : 100
		},
		data,
		root, // hierarchy root
		xScale, // scale for x axis
		yScale, // sclae for y axis
		zoomLevel = 0; // level of zoom (0 - show all,  1 - show cat or dog, 2 - show single yaer (for cat or dog))

	/**
	 * Children accessor function for hierbarcy.
	 */
	function children(d) {
	  	return d.values;
	}

	/**
	 * Zoom to per+year group.
	 */
	function zoomFromLegend(pet, year) {
		var petGroup = root.children.filter(function(d) { return d.data.key === pet; })[0];
		if (typeof year === "undefined") {
			zoomLevel = 1;
			zoom(petGroup);	
		} else {
			zoomLevel = 2;
			zoom(petGroup.children.filter(function(d) { return d.data.key === year; })[0]);
		}
	}

	/** 
	 * Add legend to the left and right of map.
	 * Add years for cat on left and yers for dog on right.
	 * Each year is in rectange of appropriate color.
	 */
	function addLegend() {
		var catLegend = svg.select("g.catLegend"),
			dogLegend = svg.select("g.dogLegend"),
			xStart = 0,
			yStart = 100,
			yOffset = 30,
			rectWidth = 80,
			y;

		catLegend.select("g.catIcon")
			.on("click", function(d) {
				zoomFromLegend("cat");
			});
		y = yStart;
		Object.keys(colors.cat).map(function(key) {
			catLegend.append("rect")
				.attr("x", xStart)
				.attr("y", y)
				.attr("width", rectWidth)
				.attr("height", yOffset)
				.style("fill", colors.cat[key])
				.on("click", function(d) {
					zoomFromLegend("cat", key);
				});
    		catLegend.append("text")
				.attr("x", xStart + rectWidth / 2)
				.attr("y", y + yOffset / 2)
				.attr("dy", "2.5")
				.style("fill", "white")
				.text(key);
			
			y += yOffset;
		});

		dogLegend.select("g.dogIcon")
			.on("click", function(d) {
				zoomFromLegend("dog");
			});
		y = yStart;
		xStart = width - paddding.right + 20;
		Object.keys(colors.dog).map(function(key) {
			dogLegend.append("rect")
				.attr("x", xStart)
				.attr("y", y)
				.attr("width", rectWidth)
				.attr("height", yOffset)
				.style("fill", colors.dog[key])
				.on("click", function(d) {
					zoomFromLegend("dog", key);
				});

    		dogLegend.append("text")
				.attr("x", xStart + rectWidth / 2)
				.attr("y", y + yOffset / 2)
				.attr("dy", "2.5")
				.style("fill", "white")
				.text(key);
			
			y += yOffset;
		});
	}

	/** 
	 * Add clip path to hide map overflowing over legend.
	 */
	function appendClipPath() {
		if (svg.select("defs").empty()) {
			svg.append("defs");
		}
		
		svg.select("defs")
			.append("clipPath")
				.attr("id", "clipPathMap")
				.append("rect")
					.attr("x", "0")
					.attr("y", "0")
					.attr("width", width - paddding.left - paddding.right)
					.attr("height", height);
	}

	/** 
	 * Zoom map to group d. d can be a cell or a group of cells in the map.
	 */
	function zoom(d) {
		var kx = (width - paddding.left - paddding.right) / (d.x1 - d.x0), // ratio of width of selected group to map
			ky = height / (d.y1 - d.y0), // ratio of height of selected group to map
			t;

		xScale.domain([d.x0, d.x1]); // update domain of x scale to width of selected group
		yScale.domain([d.y0, d.y1]); // update domain of y scale to height of selected group
		
		// move all rectangles to new zoomed position (using newly defined scales)
		t = svg.selectAll("g.cell").transition()
			.duration(750)
			.attr("transform", function(d) {
				return "translate(" + xScale(d.x0) + ", " + yScale(d.y0) + ")";
			});

		// resize rectangles using width and height ratios
		t.select("rect")
			.attr("width", function(d) {
				return kx * (d.x1 - d.x0) - 1;
			})
			.attr("height", function(d) {
				return ky * (d.y1 - d.y0) - 1;
			});

		t.select("text")
      		.style("opacity", function(d) {
      			return kx * 0.8 * (d.x1 - d.x0) > this.getComputedTextLength() ? 1 : 0;
      		});


	}

	/** 
	 * Create pet names map and legend in SVG given by selector.
	 */
	function create(selector) {
		var treemapLayout,
			cell;

    	svg = d3.select(selector);
    	width = svg.attr("width");
    	height = svg.attr("height");

    	appendClipPath(); // add clip path for map area (so content does not overflow to legend when zooming)
    	// setup ranges for scales to dimensions of map
    	xScale = d3.scaleLinear().range([0, width - paddding.left - paddding.right]);
    	yScale = d3.scaleLinear().range([0, height]);

    	// nest pet names by category and then year
    	data = {
			values : d3.nest()
				.key(function(d) { return d.category; })
				.key(function(d) { return d.year; })
				.entries(DataService.getPetNames10Data())
		};
		// create hierarchy out of data
		root = d3.hierarchy(data, children);
		// create layout from hierarchy
		treemapLayout = d3.treemap();
		treemapLayout
			.size([width - paddding.left - paddding.right, height])
			.paddingOuter(0)
			.tile(d3.treemapSquarify);
		// add up name numbers for higher levels of hierarchy
		root.sum(function(d) {
			return d.number;
		});
		
		// populate layout with data
		treemapLayout(root);

		svg.append('g')
			.classed("map", true)
			.attr("transform", "translate(" + paddding.left +", 0)")
			.attr("clip-path", "url(#clipPathMap)");

		// append map to SVG
		cell = svg.select("g.map").selectAll('g')
			.data(root.descendants())
			.enter()
			.append('g')
			.classed("cell", true)
			.attr("transform", function(d) {
				return "translate(" + d.x0 + ", " + d.y0 + ")";
			})
			.on("click", function(d) {
				if (zoomLevel === 0) {
					zoom(d.parent.parent);
					zoomLevel = 1;
				} else if (zoomLevel === 1) {
					zoom(d.parent);
					zoomLevel = 2;
				} else {
					zoom(root);
					zoomLevel = 0;
				}
			});

		cell.append("rect")
			.attr('width', function(d) { return d.x1 - d.x0; })
			.attr('height', function(d) { return d.y1 - d.y0; })
			.style("fill", function(d) {
				if (colors[d.data.category]) {
					return colors[d.data.category][d.data.year];	
				}
			});

		// add labels
		cell.append("text")
			.attr("dx", 4)
			.attr("dy", 14)
			.text(function(d) {
				return d.data.name;
			})
    		.style("opacity", function(d) { 
    			return 0.8 * (d.x1 - d.x0) > this.getComputedTextLength() ? 1 : 0; 
    		});
    	addLegend();
    }

	return {
		create : create,
	};

})(DataService);