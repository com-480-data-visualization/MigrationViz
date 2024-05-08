// set width and height of svg_united
var width = 1000
var height = 800
var aspect = width / height;

// The total sum of deaths reported by united against refugee deaths
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
    
var rad = d3.scaleSqrt().range([1.8, 2.6]);

// Define the function to zoom
function zoomed(event, data) {
    const { transform } = event; 
    projection.scale(transform.k * 800)
        .translate([transform.x, transform.y]);
    svg_united.selectAll("path")
        .attr("d", d3.geoPath().projection(projection));
    
    svg_united.selectAll(".circle")
        .attr("cx", d => projection([d.long, d.lat])[0])
        .attr("cy", d => projection([d.long, d.lat])[1])
        .on("mouseover", mouseover) // Necessary?
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
}
    
// Define mouseover, mousemove, and mouseleave function
function mouseover(event, d) {
    this.setAttribute("class", "circle-hover");
    Tooltip.style("opacity", 1);
 }

function mousemove(event, d) {
    Tooltip
        .html(`<strong>${d.name}</strong><br>Number of deaths: ${d.num_death}`)
    var infoContent = `<h2>${d.name}</h2>`;
    infoContent += `<p>Number of deaths: ${d.num_death}</p>`;
    updateInfoPanel(infoContent);
}
    
function mouseleave(event, d) {
    Tooltip.style("opacity", 0);
}

// Update the Info Panel on the website
function updateInfoPanel(content) {
    var infoPanel = document.querySelector('.hover-info');
    infoPanel.innerHTML = content;
}    

// Calculate the sum of people dying per month
function sumNrPerMonth(data) {
    var sums = {};

    data.forEach(entry => {
        var date = parseDate(entry.date_sorted)
        var month = date.getMonth() + 1; // JavaScript months are zero-based, so add 1
        var year = date.getFullYear();

        if (!sums[year][month]) {
            sums[year][month] = 0;
        }
        
        sums[year][month] += parseInt(entry.Nr);
    });

    return sums;
}

// Get the right Dateformat
function parseDate(dateString) {
    var [day, month, year] = dateString.split('/');

    var parsedYear = parseInt(year) < 93 ? '20' + year : '19' + year;

    return new Date(parsedYear, month - 1, day); 
}

// Update the Points on the map according to the selected timeperiod
function updateMapPoints(data) {
    const circles = svg_united.selectAll("circle").data(data, d => d.long + d.lat + d.name + d.num_death);

    // Calculate the partial sum of deaths in order to make the comparison with the total number
    var partialSum = d3.sum(data, d => d.num_death);

    // Remove the text that was there before, in order to be able to create the new text
    d3.select("#partialSumText").remove();
    d3.select("#totalSumText").remove();

    // Add the new text for partial sum
    var partialSumText = svg_united.append("text")
        .attr("id", "partialSumText")
        .attr("x", 980 - 10) 
        .attr("y", 40) 
        .attr("text-anchor", "end") 
        .text("Partial Number of Deaths : " + partialSum)
        .style("fill", "black")
        .style("font-weight", "bold")
        .style("font-style", "italic"); 

    // Add the new text for the total sum
    var totalSumText = svg_united.append("text")
        .attr("id", "totalSumText")
        .attr("x", 980 - 10) 
        .attr("y", 20) 
        .attr("text-anchor", "end") 
        .text("Total Number of Deaths : " + totalSum)
        .style("fill", "black")
        .style("font-weight", "bold")
        .style("font-style", "italic");

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
        .style("fill", "74a892")
        .attr("stroke", "#74a892")
        .attr("stroke-width", 1)
        .attr("fill-opacity", .4)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Remove exiting points
    circles.exit().remove()

    // Initialize zoom element
    var zoom = d3.zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", function(event) {zoomed(event, data); })
    
    svg_united.call(zoom);

    // Create a string with the two sums in it
    var sum_deaths = [totalSum, partialSum];

    // Define, where the text & circles will be
    const margin = {top: 0, right: 20, bottom: 60, left: 600},
        width = 900 - margin.left - margin.right,
        height = 80- margin.top - margin.bottom;

    // Calculate the radius of the circle
    var R = sum_deaths.map(function(d) {
            return Math.sqrt(d / Math.max(...sum_deaths));
        });

    // Append the circles
    var propcircle = svg_united.append("svg")
        .attr("id", "propcircle")
        .append("g")
        .attr("transform", "translate(" + 890+ "," + 50 + ")");

    // Calculate the max. radius
    var maxRadius = Math.max(...R);

    // Position the second circle
    var lowestY = 40 + maxRadius * 40;

    // Project the second circle
    var circles2 = propcircle.selectAll("circle")
        .data(R)
        .enter()
        .append("circle")
        .attr("cx", 40)
        .attr("cy", function(d, i) { 
            return lowestY - d * 40; 
        }) 
        .attr("r", function(d) { return d * 40; }) 
        .attr("fill", function(d, i) { 
        if (i === 0) {
            return "#fbf2c4"; 
        } else {
            return "#e5c185";
        }
        })
        .style("opacity", .8);

    propcircle.attr("viewBox", "0 0 200 " + R.reduce((acc, cur) => acc + cur * 2 * 100, 0));
}

// The function for choosing the different time periods
function brushCallback(event, data, xScale) {
    var selection = event.selection; 

    if (!selection) {
        updateMapPoints([]); 
    } else {
        var newDateRange = selection.map(xScale.invert); 
        var filteredData = data.filter(function(d) {
            return d.date_sorted >= newDateRange[0] && d.date_sorted <= newDateRange[1];
        });
        console.log(filteredData); 
        updateMapPoints(filteredData); 
    }
}

// Calculate the sum of number of people that died in this month
function sumNrPerMonth(data) {
    var sums = {};

    data.forEach(entry => {
        var date = parseDate(entry.date_sorted);
        var month = date.getMonth() + 1;
        var year = date.getFullYear();

        var formattedMonth = month < 10 ? '0' + month : month;
        var formattedYear = year;

        var key = `${formattedMonth}.${formattedYear}`;

        if (!sums[key]) {
            sums[key] = 0;
        }

        sums[key] += parseInt(entry.num_death);
    });

    return sums;
}

// Function to create the timeline
function Timeline(data) {
    var margin = {top: 20, right: 0, bottom: 450, left: 40},
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
        aspect = width / height;
    
    // Calculate the sum per month 
    var sumPerMonth = sumNrPerMonth(data);

    // Put into dateformat
    data.forEach(function(d) {
        d.date_sorted = parseDate(d.date_sorted);
    });

    // Add element of timeline
    timeline = timelineGroup.append("g")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var dates = data.map(d => d.date_sorted);
    var maxDate = d3.max(dates);

    // Create the line Data
    var lineData = Object.keys(sumPerMonth).map(function(key) {
        return { date: key, value: sumPerMonth[key] };
    });

    // Parse date strings into Date objects
    lineData.forEach(function(d) {
        var parts = d.date.split('.');
        d.date = new Date(parseInt(parts[1]), parseInt(parts[0]) - 1);
    });

    // Define x variable
    var x = d3.scaleTime()
        .domain(d3.extent(lineData, function(d) { return d.date; }))
        .rangeRound([0, width]);
    
    // Define y variable
    var y = d3.scaleLinear()
        .domain([0, d3.max(lineData, function(d) { return d.value; })])
        .range([height, 0]);

    // Define line
    var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.value); });

    // Append line to timeline
    timeline.append("path")
        .datum(lineData)
        .attr("class", "line")
        .attr("d", line);

    // Initialize brush element
    var brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on("end", function(event) { brushCallback(event, data, x); }); // Pass event parameter and x scale

    // Append the brush element to the timeline
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