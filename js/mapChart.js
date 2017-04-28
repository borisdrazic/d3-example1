var MapChart = (function(DataService) {
	"use strict";
	
	d3.selection.prototype.moveToFront = function() {  
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    // NOTE: this will not work with mouselave 
    // (d3.event.x and d3.event.y are coordinates outside the element on which we want to trigger mouseleave)
    d3.selection.prototype.passThruEvents = function() {

    	function passThru(d) {
	        var e = d3.event;

	        var prev = this.style.pointerEvents;
	        this.style.pointerEvents = 'none';

	        var el = document.elementFromPoint(d3.event.x, d3.event.y);

	        var e2 = document.createEvent('MouseEvent');
	        e2.initMouseEvent(e.type,e.bubbles,e.cancelable,e.view, e.detail,e.screenX,e.screenY,e.clientX,e.clientY,e.ctrlKey,e.altKey,e.shiftKey,e.metaKey,e.button,e.relatedTarget);

	        el.dispatchEvent(e2);

	        this.style.pointerEvents = prev;
	    }

    	this.on("mousemove.passThru", passThru);
	    this.on("mousedown.passThru", passThru);
	    return this;
    };

	var animationDuration = 1000,
		mapWidth = 650,
		mapHeight = 430,
		mapTooltip = d3.select("#mapTooltip"),
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
			.extent([[0, 0], [mapWidth, mapHeight]]),
		color = d3.scaleOrdinal(['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9','#fff2ae','#f1e2cc','#cccccc']),
		selectedNeighbourhood,
		updateBarChartFunction;

	function create(selector, updateBarChart) {
		var city = DataService.getTorontoTopoJson(),
		 	neighbourhoods = topojson.feature(city, city.objects.toronto).features,
  			neighbors = topojson.neighbors(city.objects.toronto.geometries);

  		updateBarChartFunction = updateBarChart;
		d3.select(selector)
			.append("svg")
			.attr("width", mapWidth)
			.attr("height", mapHeight)
			.on("mouseleave", function(d, i) {
				d3.selectAll(".neighbourhood")
					.classed("hover", false);
			})
			.append("g")
			.selectAll(".neighbourhood")
      			.data(neighbourhoods)
    			.enter()
    				.insert("path", ".neighbourhood")
      				.attr("class", "neighbourhood")
      				.attr("d", geoPath)
      				.style("fill", function(d, i) { 
        				return color(d.color = d3.max(neighbors[i], function(n) { 
          					return neighbourhoods[n].color; 
        				}) + 1 | 0);
        			})
        			.on("mousemove", function(d, i) {
        				if(typeof selectedNeighbourhood === "undefined") {
        					selectedNeighbourhood = d;
        				}
        				if(d.properties.id !== selectedNeighbourhood.properties.id) {
        					selectedNeighbourhood = d;
        					updateBarChart(DataService.getNeighbourhoodData(selectedNeighbourhood));
        					d3.select("#neighbourhoodName")
        						.text(d.properties.name);

	        				d3.selectAll(".neighbourhood")
	        					.classed("hover", false);
	        				d3.select(this)
	        					.classed("hover", true);
        				}
        			});
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
		
		if(typeof selectedNeighbourhood !== "undefined") {
        	updateBarChartFunction(DataService.getNeighbourhoodData(selectedNeighbourhood));
        }
		

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
			.style("stroke-width", 0)
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
			.style("stroke-width", 0)
			.transition(t)
				.style("fill-opacity", 1)
				.style("stroke-width", 0.5);

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
	  				.classed("pulse", true)
	  				.moveToFront();
	  			mapTooltip.select(".serviceName").html(d.data.service_name);
	  			mapTooltip.select(".serviceCode").html(d.data.service_code);
				d3.select("#address").html(d.data.address);
				mapTooltip.select(".status").html(d.data.status);
				mapTooltip.select(".statusNotes").html(d.data.status_notes);
				mapTooltip.select(".requestedTime").html(d.data.requested_datetime);
				mapTooltip.select(".expectedTime").html(d.data.expected_datetime);
				mapTooltip.transition()
					.duration(animationDuration / 2)
					.style("border-color", DataService.colorMap[d.data.service_name])
					.style("background-color", d3.hsl(DataService.colorMap[d.data.service_name]).brighter(1.3));
				mapTooltip.classed("show", true);
				d3.select(".mapContainer .textBox").classed("show", true);
				d3.select("#barChart").classed("show", true);

			})
			.on("mouseleave", function(d, i) {
				d3.select("#service_request_id_" + d.data.service_request_id)
	  				.classed("pulse", false);
				mapTooltip.classed("show", false);
				d3.select(".mapContainer .textBox").classed("show", false);
				d3.select("#barChart").classed("show", false);
			})
			.passThruEvents();
	}

	return {
		create : create,
		update : updateMap
	};

})(DataService);
