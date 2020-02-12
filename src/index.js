(function() {
	const csvFile = require("./CSV/Avg-Burke-Data.csv");
	const ped = require("./SVG/ped.svg");
	const bike = require("./SVG/bike.svg");
	const pedReverse = require("./SVG/ped-reverse.svg");
	const bikeReverse = require("./SVG/bike-reverse.svg");
	// Keep track of the selected time so that if the user clicks to a new
	// time, we don't continue populating the icons from the old time
	// in createIcons!
	let currentTime = 0;
	let csv = d3.csv(csvFile);
	let intervalId;
	let timeoutId;

	// Make sure the window has loaded before we start trying to 
	// modify the DOM.
	window.addEventListener("load", init);

	 function init() {
		sizeElements();
		setupSlider(); 
		id("slider").addEventListener("change", changeTime);
		id("cyclists").addEventListener("click", function() {
			displayStats("visible", "hidden");
		});
		id("pedestrians").addEventListener("click", function() {
			displayStats("hidden", "visible");
		});
		id("both").addEventListener("click", function() {
			displayStats("visible", "visible");
		});
		let resizeId;
		window.addEventListener('resize', function() {
		    clearTimeout(resizeId);
		    resizeId = setTimeout(function() {
		    	// Stop the old transitions
		    	window.location.reload(false)
		    	sizeElements();
		    	clearInterval(intervalId);
		    	changeTime();
		    }, 500);
		});
		loadChart();
	}

	function sizeElements() {
		id("all-moving-icons").style.height = id("trail").clientHeight / 2.5 + "px";
		id("slide-container").style.marginTop = id("trail").clientHeight / 1.8 + "px";
		let containers = qsa(".icon-container");
		for (let i = 0; i < containers.length; i++) {
		    containers[i].style.marginBottom = id("trail").clientHeight / 30 + "px";;
		}
	}

	function setupSlider() {
		let slider = id("slider");
		let output = id("time");
		changeSliderLabel(slider.value, output);
		slider.oninput = function() {
			 changeSliderLabel(slider.value, output); 
		}
	}

	function changeSliderLabel(sliderValue, output) {
		let time = "";
		if (sliderValue == 0) {
			time = "12:00 AM";
		} else if (sliderValue < 12) {
			time = sliderValue + ":00 AM"
		} else if (sliderValue == 12) {
			time = "12:00 PM";
		} else { // if (sliderValue > 12)
			time = (sliderValue - 12) + ":00 PM";
		}
		output.innerHTML = time;
	}

	function changeTime() {
		// Clear out all the old ped/bike content
		clearTimeout(timeoutId);
		id('north-ped-count').textContent = 0;
		id('north-bike-count').textContent = 0;
		id('south-ped-count').textContent = 0;
		id('south-bike-count').textContent = 0;
		let containers = qsa(".icon-container")
		for (let i = 0; i < containers.length; i++) {
		    containers[i].innerHTML = "";
		}
		
		// Populate the new ped/bike content

		currentTime = this.value != null ? this.value : currentTime;

		let width = window.innerWidth * 0.7;
		csv.then(function(data) {
			d3.select("#p-north").text(data[currentTime].ped_north_avg);
			createIcons(data[currentTime].ped_north_avg, "#insert-ped-north-here", ped, currentTime, `translate(${width},0)`, `translate(${width + 20},0)`);
			d3.select("#b-north").text(data[currentTime].bike_north_avg);
			createIcons(data[currentTime].bike_north_avg, "#insert-bike-north-here", bike, currentTime, `translate(${width},0)`, `translate(${width + 20},0)`);
			
			d3.select("#p-south").text(data[currentTime].ped_south_avg);
			createIcons(data[currentTime].ped_south_avg, "#insert-ped-south-here", pedReverse, currentTime, `translate(-${width},0)`, `translate(${-width - 20},0)`);
			d3.select("#b-south").text(data[currentTime].bike_south_avg);
			createIcons(data[currentTime].bike_south_avg, "#insert-bike-south-here", bikeReverse, currentTime, `translate(-${width},0)`, `translate(${-width - 20},0)`);
		});		
	}

	function createIcons(numIcons, insertDiv, typeOfIcon, time, translation, endTranslation) {
		// Create the first one before the interval so that the user isn't
        // staring at a blank page
		
        d3.select("*").interrupt();
        d3.xml(typeOfIcon)
			.then(data => {
			  	d3.select(insertDiv)
			    	.node()
			    	.append(data.documentElement);
                startTransition(time, insertDiv, translation, endTranslation, typeOfIcon);
			})
		
        let x = 0;
		// Keep making icons until we've reached the necessary amount,
		// staggering by 1 seconds
		intervalId = setInterval(function() {
			// If the user has changed the time on us, we should 
			// stop creating new icons.
			if (x < numIcons - 1 && currentTime == time) {
		        d3.xml(typeOfIcon)
					.then(data => {
                          d3.select(insertDiv)
		    				.node()
                            .append(data.documentElement)
                        startTransition(time, insertDiv, translation, endTranslation, typeOfIcon);
					  })
			} else {
				return;
			}
		    x++;
		}, 1000);
	}


	function startTransition(selectedTime, insertDiv, translation, endTranslation, typeOfIcon) {
        d3.selectAll(insertDiv + " svg")
			.filter(function() {
		      return !this.classList.contains('transitioning')
		    })
            .transition()
			.attr("transform", translation)
			.attr("class", "transitioning")
			.duration(5000)
            .ease(d3.easeLinear)
            .on('end', function () { 
            	if (currentTime == selectedTime) {
            		updateCounts(typeOfIcon);
            	}
                d3.select(this)
                	.transition()
                	.attr("transform", endTranslation)
                	.ease(d3.easeLinear)
                	.style('opacity', 0)
                	.duration(370)
                	.remove();
            })
	}

	function updateCounts(typeOfIcon) {
		if (typeOfIcon == ped) {
			id('north-ped-count').textContent = parseInt(id('north-ped-count').textContent) + 1;
		} else if(typeOfIcon == bike) {
			id('north-bike-count').textContent = parseInt(id('north-bike-count').textContent) + 1;
		} else if(typeOfIcon == pedReverse) {
			id('south-ped-count').textContent = parseInt(id('south-ped-count').textContent) + 1;
		} else if (typeOfIcon == bikeReverse) {
			id('south-bike-count').textContent = parseInt(id('south-bike-count').textContent) + 1;
		}
	}

	function displayStats(bikeVisibility, pedestrianVisibility) {
		let bikes = qsa('.bike');
		for (let i = 0; i < bikes.length; i++) {
			bikes[i].style.visibility = bikeVisibility;
		}
		let peds = qsa('.ped');
		for (let i = 0; i < peds.length; i++) {
			peds[i].style.visibility = pedestrianVisibility;
		}
	}

	function loadChart() {
		var margin = {top: 50, right: 50, bottom: 50, left: 50}
		  , width = window.innerWidth * 0.85  - margin.top - margin.bottom // Use the window's width 
		  , height = window.innerHeight * 0.6 - margin.top - margin.bottom; // Use the window's height


		var minDate = new Date(2020, 1, 13, 0, 0, 1);
		var maxDate = new Date(2020, 1, 13, 23, 0, 0);

		var x = d3.scaleLinear()
					.range([0, width]);

		var y = d3.scaleLinear()
					.range([height, 0]);
					
		var time = d3.scaleTime().domain([minDate, maxDate]).range([0, width]);

		var xAxis = d3.axisTop(time).ticks(23);

		var yAxis = d3.axisLeft()
		    .scale(y);
		var color = d3.scaleOrdinal(d3.schemeCategory10);
	    var line = d3.line()
	      		.x(function(d) {
	        		return x(d.time_of_day);
	      		})
	      		.y(function(d) {
	        		return y(d.number);
	      		});

	    d3.csv(csvFile).then(function(data) {
	    	var svg = d3.select("#chart").append("svg")
		      .attr("width", width + margin.left + margin.right)
		      .attr("height", height + margin.top + margin.bottom)
		      .append("g")
		      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		    color.domain(d3.keys(data[0]).filter(function(key) {
		      return key !== "time_of_day";
		    }));

		    var people = color.domain().map(function(name) {
			    return {
			      name: name,
			      values: data.map(function(d) {
			        return {time_of_day: d.time_of_day, number: d[name]};
			      })
			    };
			  });
		    x.domain([0, 23]);
		    y.domain([0, 60]);

		    svg.append("g")
			    	.attr("class", "x axis")
			    	.call(xAxis);

			svg.append("g")
			        .attr("class", "y axis")
			        .call(yAxis)
			        .append("text");
			svg.append("g")			
			        .attr("class", "grid")
			        .call(xAxis
			           .tickSize(-height)
			           .tickFormat("")
			        )

			  // add the Y gridlines
			svg.append("g")			
			      .attr("class", "grid")
			      .call(yAxis
			          .tickSize(-width)
			          .tickFormat("")
			      )

			svg.append("text")             
			      .attr("x", width / 2)
    			  .attr("y", 30)
			      .style("text-anchor", "middle")
			      .text("Time")
			svg.append("text")
			      .attr("text-anchor", "middle")
			      .attr("y", -35)
			      .attr("x", -height + 200)
			      .attr("transform", "rotate(-90)")
			      .text("Number of People");

			var person = svg.selectAll(".people")
			    	.data(people)
			    	.enter().append("g")
			    	.attr("class", "people");   

			person.append("path")
		       	.attr("class", "line")
		      	.attr("d", function(d) { return line(d.values); })
		      	.attr("data-legend",function(d) { return d.name})
		      	.style("stroke", function(d) { return color(d.name); });

			    console.log(people);
			// person.selectAll("circle")
			//     .data(function(d){return d.values})
			//     .enter()
			//     .append("circle")
			//     .attr("r", 3)
			//     .attr("cx", function(d) { return x(d.time_of_day); })
			//     .attr("cy", function(d) { return y(d.number); })
			//     .style("fill", function(d) { return '#000000';});

		    var mouseG = svg.append("g")
		      .attr("class", "mouse-over-effects");

		    mouseG.append("path") // this is the black vertical line to follow mouse
		      .attr("class", "mouse-line")
		      .style("stroke", "black")
		      .style("stroke-width", "1px")
		      .style("opacity", "0");
		      
		    var lines = document.getElementsByClassName('line');

		    var mousePerLine = mouseG.selectAll('.mouse-per-line')
		      .data(people)
		      .enter()
		      .append("g")
		      .attr("class", "mouse-per-line");

		    mousePerLine.append("circle")
		      .attr("r", 7)
		      .style("stroke", function(d) {
		        return color(d.name);
		      })
		      .style("fill", "none")
		      .style("stroke-width", "1px")
		      .style("opacity", "0");

		    mousePerLine.append("text")
		      .attr("transform", "translate(10,3)");

		    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
		      .attr('width', width) // can't catch mouse events on a g element
		      .attr('height', height)
		      .attr('fill', 'none')
		      .attr('pointer-events', 'all')
		      .on('mouseout', function() { // on mouse out hide line, circles and text
		        d3.select(".mouse-line")
		          .style("opacity", "0");
		        d3.selectAll(".mouse-per-line circle")
		          .style("opacity", "0");
		        d3.selectAll(".mouse-per-line text")
		          .style("opacity", "0");
		      })
		      .on('mouseover', function() { // on mouse in show line, circles and text
		        d3.select(".mouse-line")
		          .style("opacity", "1");
		        d3.selectAll(".mouse-per-line circle")
		          .style("opacity", "1");
		        d3.selectAll(".mouse-per-line text")
		          .style("opacity", "1");
		      })
		      .on('mousemove', function() { // mouse moving over canvas
		        var mouse = d3.mouse(this);
		        d3.select(".mouse-line")
		          .attr("d", function() {
		            var d = "M" + mouse[0] + "," + height;
		            d += " " + mouse[0] + "," + 0;
		            return d;
		          });

		        d3.selectAll(".mouse-per-line")
		          .attr("transform", function(d, i) {
		            var xDate = x.invert(mouse[0]),
		                bisect = d3.bisector(function(d) { return d.time_of_day; }).right;
		                idx = bisect(d.values, xDate);
		            
		            var beginning = 0,
		                end = lines[i].getTotalLength(),
		                target = null;

		            while (true){
		              target = Math.floor((beginning + end) / 2);
		              pos = lines[i].getPointAtLength(target);
		              if ((target === end || target === beginning) && pos.x !== mouse[0]) {
		                  break;
		              }
		              if (pos.x > mouse[0])      end = target;
		              else if (pos.x < mouse[0]) beginning = target;
		              else break; //position found
		            }
		            
		            d3.select(this).select('text')
		              .text(y.invert(pos.y).toFixed(0));
		              
		            return "translate(" + mouse[0] + "," + pos.y +")";
		          });
		      });
		  });
}

	function id(idName) {
 		return document.getElementById(idName);
	}

	function qsa(query) {
		return document.querySelectorAll(query);
	}

	function qs(query) {
		return document.querySelector(query);
	}
})();
