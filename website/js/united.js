    // set width and height of svg_united
    var width = 1000
    var height = 800
    var aspect = width / height;

    const totalSum = d3.sum(united, d => d.num_death);

    // The svg_united
    var svg_group = d3.select("#united-viz")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMinYMid")
      .call(responsivefy);

    var svg_united = svg_group.append("g")
        .attr("id", "map-group")
        .attr("height", 200);

    var timelineGroup = svg_group.append("g")
        .attr("id", "timeline-group")
        .attr("transform", `translate(0, ${635})`);

    timelineGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "white");

    // Map and projection
    var projection = d3.geoMercator()
        .center([4, 35])                // GPS of location to zoom on
        .scale(500)                       // This is like the zoom
        .translate([ width/2, height/2 ])


    // Load external data and boot
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then( function(data){
        // Draw the map
        svg_united.append("g")
            .selectAll("path")
            .data(data.features)
            .join("path")
              .attr("fill", "#b8b8b8") // Change color of the Map
              .style("opacity", .7) // Change opacity of the country fill
              .attr("d", d3.geoPath()
                  .projection(projection)
              )
            .style("stroke", "black") // Linecolor
            .style("opacity", .3) // Opacity of map, total
    })


    var Tooltip = d3.select(".hover-info")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");
    
    var rad = d3.scaleSqrt().range([1.5, 2.6]); // Here you can change the size of the circles (the size of the circles according to the nr of death each circle is standing for)

    // Define mouseover, mousemove, and mouseleave function
    function mouseover(event, d) {
        this.setAttribute("class", "circle-hover");
        Tooltip.style("opacity", 1);
    }

    function mousemove(event, d) {
        Tooltip
            .html(`<strong>${d.name}</strong><br>Number of deaths: ${d.num_death}`)

        // Update the content of the info panel
        var infoContent = `<h2>${d.name}</h2>`;
        infoContent += `<p>Number of deaths: ${d.num_death}</p>`;
        updateInfoPanel(infoContent);
    }
    

    function mouseleave(event, d) {
        Tooltip.style("opacity", 0);
    }

    function updateInfoPanel(content) {
        // Select the info panel element
        var infoPanel = document.querySelector('.hover-info');
    
        // Update its HTML content with the provided information
        infoPanel.innerHTML = content;
    }    

function sumNrPerMonth(data) {
    // Initialize an empty object to store sums for each month
    var sums = {};

    // Iterate over the data
    data.forEach(entry => {
        // Extract the month from the date_found
        var date = parseDate(entry.date_sorted)
        var month = date.getMonth() + 1; // JavaScript months are zero-based, so add 1
        var year = date.getFullYear();

        // If the month is not yet in the sums object, initialize it to 0
        if (!sums[year][month]) {
            sums[year][month] = 0;
        }
        // Add the 'Nr' value to the sum for the month
        sums[year][month] += parseInt(entry.Nr);
    });

    return sums;
}


// Get the right Dateformat
function parseDate(dateString) {
    // Split the date string into day, month, and year components
    var [day, month, year] = dateString.split('/');

    // If the year is in the format '93', adjust it to '1993'
    var parsedYear = parseInt(year) < 93 ? '20' + year : '19' + year;

    // varruct a new date object with the components in the correct order
    return new Date(parsedYear, month - 1, day); 
}


// Update the Points on the map according to the selected timeperiod
function updateMapPoints(data) {
    // Adjust scale
    const circles = svg_united.selectAll("circle").data(data, d => d.long + d.lat + d.name + d.num_death);

    // Now you can calculate the sum of num_death
    var partialSum = d3.sum(data, d => d.num_death);
    console.log(partialSum);

    d3.select("#partialSumText").remove();
    d3.select("#totalSumText").remove();

    var partialSumText = svg_united.append("text")
        .attr("id", "partialSumText")
        .attr("x", 980 - 10) // Adjust x position to place it on the right
        .attr("y", 40) // Adjust y position to place it at the top
        .attr("text-anchor", "end") // Align text to the end (right)
        .text("Number of Deaths in the selected Timeperiod: " + partialSum)
        //.style("font-family", "Arial")
       // .style("font-size", "14px")
        .style("fill", "black")
        .style("font-weight", "bold")
        .style("font-style", "italic"); 


    var totalSumText = svg_united.append("text")
        .attr("id", "totalSumText")
        .attr("x", 980 - 10) // Adjust x position to place it on the right
        .attr("y", 20) // Adjust y position to place it below partialSum
        .attr("text-anchor", "end") // Align text to the end (right)
        .text("Total Number of Deaths : " + totalSum)
        .style("fill", "black")
        .style("font-weight", "bold")
        .style("font-style", "italic");
      // Set text content
    // Update existing points
    circles
        .attr("cx", d => projection([d.long, d.lat])[0])
        .attr("cy", d => projection([d.long, d.lat])[1])
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Enter new points
    circles.enter().append("circle")
        .attr("cx", d => projection([d.long, d.lat])[0])
        .attr("cy", d => projection([d.long, d.lat])[1])
        .attr("r", d => rad(d.num_death))
        .attr("class", "circle")
        .style("fill", "69b3a2")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 1)
        .attr("fill-opacity", .4)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Remove exiting points
    circles.exit().remove()


    var data = [totalSum, partialSum];

    const margin = {top: 0, right: 20, bottom: 60, left: 600},
        width = 900 - margin.left - margin.right,
        height = 80- margin.top - margin.bottom;

    var R = data.map(function(d) {
            return Math.sqrt(d / Math.max(...data));
        });

    var propcircle = svg_united.append("svg")
        .attr("id", "propcircle")
       // .attr("width", 780)
        //.attr("height", 80)
        .append("g")
        .attr("transform", "translate(" + 890+ "," + 50 + ")");

    var maxRadius = Math.max(...R);

    var lowestY = 40 + maxRadius * 40;

    var circles2 = propcircle.selectAll("circle")
        .data(R)
        .enter()
        .append("circle")
        .attr("cx", 40) // x-coordinate of the center (remains unchanged)
        .attr("cy", function(d, i) { // Calculate the y-coordinate of the center relative to the lowest point of the largest circle
            return lowestY - d * 40; 
        }) 
        .attr("r", function(d) { return d * 40; }) // radius
        .attr("fill", function(d, i) { 
        if (i === 0) {
            return "blue"; // Color for the first circle
        } else {
            return "red"; // Color for the second circle
        }
        })
        .style("opacity", .3); // Use specified colors

    propcircle.attr("viewBox", "0 0 200 " + R.reduce((acc, cur) => acc + cur * 2 * 100, 0));

}


// The function for choosing the different time periods
function brushCallback(event, data, xScale) {
    var selection = event.selection; // Get the brush selection

    if (!selection) {
        updateMapPoints([]); // No selection, update map with empty data
    } else {
        var newDateRange = selection.map(xScale.invert); // Convert pixel coordinates to date values using the xScale
        var filteredData = data.filter(function(d) {
            return d.date_sorted >= newDateRange[0] && d.date_sorted <= newDateRange[1];
        });
        console.log(filteredData); // Log filtered data to console for debugging
        updateMapPoints(filteredData); // Update map with filtered data
    }
}

function sumNrPerMonth(data) {
    // Initialize an empty object to store sums for each month
    var sums = {};

    // Iterate over the data
    data.forEach(entry => {
        // Extract the month and year from the date_found
        var date = parseDate(entry.date_sorted);
        var month = date.getMonth() + 1; // JavaScript months are zero-based, so add 1
        var year = date.getFullYear();

        // Format the month and year as desired (assuming leading zeros for month)
        var formattedMonth = month < 10 ? '0' + month : month;
        var formattedYear = year;

        // Combine month and year to create the key
        var key = `${formattedMonth}.${formattedYear}`;

        // If the key is not yet in the sums object, initialize it to 0
        if (!sums[key]) {
            sums[key] = 0;
        }

        // Add the 'num_death' value to the sum for the month
        sums[key] += parseInt(entry.num_death);
    });

    return sums;
}

function Timeline(data) {
    var margin = {top: 20, right: 0, bottom: 450, left: 40}, // right need to be 0, so that it is exactly on the line of Europe carte right. Left needs space, in order to see the scale. 
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
        aspect = width / height;
    
    var sumPerMonth = sumNrPerMonth(data); // If we want to define it later, the function needs to be adapted to the new datetime
    // Parse date_found property of data using parseDate function
    data.forEach(function(d) {
        d.date_sorted = parseDate(d.date_sorted);
    });


    timeline = timelineGroup.append("g")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    var dates = data.map(d => d.date_sorted);
    var minDate = d3.min(dates);
    var maxDate = d3.max(dates);
    
    var maxSum = Object.values(sumPerMonth)
        .reduce((max, yearData) => {
            var yearMax = Math.max(...Object.values(yearData));
            return yearMax > max ? yearMax : max;
        }, 0);

    var lineData = Object.keys(sumPerMonth).map(function(key) {
        return { date: key, value: sumPerMonth[key] };
    });

    // Parse date strings into Date objects
    lineData.forEach(function(d) {
        var parts = d.date.split('.');
        d.date = new Date(parseInt(parts[1]), parseInt(parts[0]) - 1);
    });

    var x = d3.scaleTime()
        .domain(d3.extent(lineData, function(d) { return d.date; }))
        .rangeRound([0, width]);
    
    var y = d3.scaleLinear()
        .domain([0, d3.max(lineData, function(d) { return d.value; })])
        .range([height, 0]);

    var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.value); });

    timeline.append("path")
        .datum(lineData)
        .attr("class", "line")
        .attr("d", line);



    var brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on("end", function(event) { brushCallback(event, data, x); }); // Pass event parameter and x scale

    timeline.append("g")
        .attr("class", "brush")
        .call(brush);

    // Append the line on the bottom, define the ticks
    timeline.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
        .ticks(d3.timeYear)
        .tickPadding(0))
        .selectAll("text");

    timeline.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y)
        .ticks(4));

    
    // Calculate default start and end dates
    var endDate = maxDate;
    var startDate = new Date(endDate.getFullYear() - 5, endDate.getMonth(), endDate.getDate()); // 5 years ago

    // Set initial brush selection
    var initialSelection = [x(startDate), x(endDate)];

    // Initialize brush with initial selection
    brush.move(timeline.select('.brush'), initialSelection);

}

    Timeline(united)