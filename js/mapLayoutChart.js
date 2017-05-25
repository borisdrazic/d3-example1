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
		paddding = {
			left : 100,
			right : 100
		},
		data;

	/**
	 * Children accessor function for hierbarcy.
	 */
	function children(d) {
	  	return d.values;
	}

	function addLegend() {
		var catLegend = svg.select("g.catLegend"),
			xStart = 0,
			yStart = 100,
			yOffset = 30,
			rectWidth = 80,
			y;

		y = yStart;
		Object.keys(colors.cat).map(function(key) {
			catLegend.append("rect")
				.attr("x", xStart)
				.attr("y", y)
				.attr("width", rectWidth)
				.attr("height", yOffset)
				.style("fill", colors.cat[key]);
    		catLegend.append("text")
				.attr("x", xStart + rectWidth / 2)
				.attr("y", y + yOffset / 2)
				.attr("dy", "2.5")
				.style("fill", "white")
				.text(key);
			
			y += yOffset;
		});

		y = yStart;
		xStart = width - paddding.right + 20;
		Object.keys(colors.dog).map(function(key) {
			catLegend.append("rect")
				.attr("x", xStart)
				.attr("y", y)
				.attr("width", rectWidth)
				.attr("height", yOffset)
				.style("fill", colors.dog[key]);
    		catLegend.append("text")
				.attr("x", xStart + rectWidth / 2)
				.attr("y", y + yOffset / 2)
				.attr("dy", "2.5")
				.style("fill", "white")
				.text(key);
			
			y += yOffset;
		});

		
	}

	function create(selector) {
		var root, // hierarchy root
			treemapLayout,
			nodes;

    	svg = d3.select(selector);
    	width = svg.attr("width");
    	height = svg.attr("height");

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

		// append map to SVG
		svg.append('g')
			.classed("map", true)
			.attr("transform", "translate(" + paddding.left +", 0)")
			.selectAll('rect')
			.data(root.descendants())
			.enter()
			.append('rect')
			.attr('x', function(d) { return d.x0; })
			.attr('y', function(d) { return d.y0; })
			.attr('width', function(d) { return d.x1 - d.x0; })
			.attr('height', function(d) { return d.y1 - d.y0; })
			.style("fill", function(d) {
				if (colors[d.data.category]) {
					return colors[d.data.category][d.data.year];	
				} else {
					return "black";
				}
			});

		// position rectangles
		nodes = svg.select("g.map")
			.selectAll("g")
			.data(root.descendants())
			.enter()
			.append("g")
			.attr("transform", function(d, i) {
				return "translate(" + [d.x0, d.y0] + ")";
			});

		// add labels
		nodes
			.append("text")
			.attr("dx", 4)
			.attr("dy", 14)
			.text(function(d) {
				return d.data.name;
			});
    	
    	addLegend();
    }

	return {
		create : create,
	};

})(DataService);