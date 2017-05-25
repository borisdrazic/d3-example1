var ForceChart = (function(DataService) {
	"use strict";

	d3.selection.prototype.moveToFront = function() {  
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    var animationDuration = 1000, // duration of animations in ms
    	svg, // svg element
    	width, // width of SVG
		height, // height of SVG
		maxRadius = 80, // maximum radius of name circle (excldes center circle)
		colors = { // colors for circles
			"cat" : "url(#gradientForceCatDogPointCat)",
			"dog" : "url(#gradientForceCatDogPointDog)",
			"anchor" : "url(#gradientForceCatDogLinear)"
		},
		xyCenter, // x and y coordinates of centers of attractions per category
		data, // pet names data
		rCat, // scale for cat circle radius (from name of numbers to radius)
		rDog, // scale for dpg circle radius (from name of numbers to radius)
		simulation;
    
    /**
     * Append gradinet definitions to svg.
     * The gradient is vertical linear gradient fading outwards from percent point.
     */
	function appendGradient(svg, percent) {
		var gradientLinear,
			gradientPointCat,
			gradientPointDog;

		if (svg.select("defs").empty()) {
			svg.append("defs");
		}
		
		gradientLinear = svg.select("defs")
			.append("linearGradient")
				.attr("id", "gradientForceCatDogLinear")
				.attr("x1", "0")
				.attr("x2", "1")
				.attr("y1", "0")
				.attr("y2", "0")
			    .attr("spreadMethod", "pad");

		gradientLinear.append("stop")
		    .attr("offset", "0%")
		    .attr("stop-color", "#5d8ba3");

		gradientLinear.append("stop")
		    .attr("offset", percent + "%")
		    .attr("stop-color", "#316786");

		gradientLinear.append("stop")
		    .attr("offset", (percent + 0.1) + "%")
		    .attr("stop-color", "#403186");

		gradientLinear.append("stop")
		    .attr("offset", "100%")
		    .attr("stop-color", "#6f62ab");


		gradientPointCat = svg.select("defs")
			.append("radialGradient")
				.attr("id", "gradientForceCatDogPointCat")
				.attr("cx", "50%")
				.attr("cy", "50%")
				.attr("r", "100%");

		gradientPointCat.append("stop")
		    .attr("offset", "0%")
		    .attr("stop-color", "#316786");

		gradientPointCat.append("stop")
		    .attr("offset", "100%")
		    .attr("stop-color", "#5d8ba3");

		gradientPointDog = svg.select("defs")
			.append("radialGradient")
				.attr("id", "gradientForceCatDogPointDog")
				.attr("cx", "50%")
				.attr("cy", "50%")
				.attr("r", "100%");

		gradientPointDog.append("stop")
		    .attr("offset", "0%")
		    .attr("stop-color", "#403186");

		gradientPointDog.append("stop")
		    .attr("offset", "100%")
		    .attr("stop-color", "#6f62ab");
	}

	/**
	 * Add dog icon (fade in).
	 * Add icon to svg, translate by (x,y) and scale by scaleFactor.
	 */
	function addDogIcon(svg, x, y, scaleFactor) {
		svg.select("g.dogIcon")
			.attr("transform", "translate(" + (+x + 406 * scaleFactor) + ", " + (+y + -518 * scaleFactor) + ") scale(" + scaleFactor + ")")
			.style("fill-opacity", 1)
			.style("stroke-opacity", 1)
			.moveToFront();
	}

	/**
	 * Add cat icon (fade in).
	 * Add icon to svg, translate by (x,y) and scale by scaleFactor.
	 */
	function addCatIcon(svg, x, y, scaleFactor) {
		svg.select("g.catIcon")
			.attr("transform", "translate(" + (+x + 362 * scaleFactor) + ", " + (+y + -17 * scaleFactor) + ") scale(" + -scaleFactor + "," + scaleFactor + ")")
			.style("fill-opacity", 1)
			.style("stroke-opacity", 1)
			.moveToFront();
	}

	// Update simulation when circles are dragged.
	function dragstarted(d) {
		if (!d3.event.active) {
			simulation.alphaTarget(0.3).restart();
		}
	  	d.fx = d.x;
	  	d.fy = d.y;
	}

	function dragged(d) {
		d.fx = d3.event.x;
	  	d.fy = d3.event.y;
	}

	function dragended(d) {
	  	if (!d3.event.active) {
	  		simulation.alphaTarget(0);
	  	}
	  	d.fx = null;
	  	d.fy = null;
	}

	/** 
	 * Update circle and labels positions on tick of force simuliton.
	*/
	function ticked() {
		var circle,
			text;

		circle = svg
			.selectAll("circle")
			.data(data);

		circle.enter()
			.append("circle")
			.classed("center", function(d) {
				return d.category === "anchor";
			})
			.attr('r', function(d) {
		      return d.radius;
		    })
		    .call(d3.drag()
          		.on("start", dragstarted)
          		.on("drag", dragged)
          		.on("end", dragended))
			.merge(circle)
			.attr("cx", function(d) {
				return d.x;
			})
			.attr("cy", function(d) {
				return d.y;
			})
			.attr("fill", function(d) {
				return colors[d.category];
			});

		circle.exit().remove();

		text = svg
			.selectAll("text")
			.data(data);

		text.enter()
			.append("text")
			.text(function(d) {
				return d.category !== "anchor" ? d.name : "";
			})
			.merge(text)
			.attr("x", function(d) {
				return d.x;
			})
			.attr("y", function(d) {
				return d.y;
			})
			.attr("dy", function(d) {
				return 5;
			});

		text.exit().remove();

		var centerX = parseFloat(svg.select("circle.center").attr("cx")),
			centerY = parseFloat(svg.select("circle.center").attr("cy"));
		
		addDogIcon(svg, centerX - 10, centerY - 0.75 * maxRadius, Math.min((3 * maxRadius) / 349.1, (1.5 * maxRadius) / 422.53));
		addCatIcon(svg, centerX + 20 - 1.5 * maxRadius, centerY - 0.75 * maxRadius, Math.min((3 * maxRadius) / 327.13, (1.5 * maxRadius) / 350.25));
	}

    function create(selector) {
    	svg = d3.select(selector);
    	width = svg.attr("width");
    	height = svg.attr("height");
    	xyCenter = {
			"cat" : [width / 2 - 2 * maxRadius, height / 2], // centre cats to the left of center circle
			"dog" : [width / 2 + 2 * maxRadius, height / 2], // centre dogs to the left of center circle
			"anchor" : [width / 2, height / 2] // central circle goes to center of svg
		};

		// add gradient definition for central circle
    	appendGradient(svg, 50);


		// get pet names data
		data = DataService.getPetNames25Data();
		// cat circle radius scale domain goes from 0 to max number of cats with same name
		rCat = d3.scaleLinear()
			.domain([0, d3.max(data, function(d) {
				return d.category === "cat" ? parseInt(d.number) : 0;
			})])
			.range([0, maxRadius / 2]);
		// dog circle radius scale domain goes from 0 to max number of dogs with same name
		rDog = d3.scaleLinear()
			.domain([0, d3.max(data, function(d) {
    			return d.category === "dog" ? parseInt(d.number) : 0;
			})])
			.range([0, maxRadius]);

		// compute circle radii
		data.forEach(function(d) {
			d.number = parseInt(d.number);
			if (d.category === "cat") {
				d.radius = rCat(d.number);
			} else if (d.category === "dog") {
				d.radius = rDog(d.number);
			} else {
				d.radius = 1.5 * maxRadius;
			}	
		});

		// create force simulation for pet name circles
		simulation = d3.forceSimulation(data)
			.force("charge", d3.forceManyBody().strength(1))
			.force("center", d3.forceCenter(width / 2, height / 2)) // pull all circles towards the center of SVG
			.force("collision", d3.forceCollide().radius(function(d) { // prevent circle overlapping
				return d.radius;
			}))
			// Set forces to pull towards (x,y) point: pull cat circles to the left and dog circles to the right of central circle
			.force('x', d3.forceX().x(function(d) { 
  				return xyCenter[d.category][0];
			}))
			.force('y', d3.forceY().y(function(d) {
  				return xyCenter[d.category][1];
			}))
			.on("tick", ticked);
    }

	return {
		create : create,
	};

})(DataService);