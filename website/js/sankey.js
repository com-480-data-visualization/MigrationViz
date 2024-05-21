// Inspiration for the responsify function comes from
// Brendan Sudol and his blog
// https://brendansudol.github.io/writing/responsive-d3
// FIXME There are multiple mistakes in this code (missing ; container defined without var which could be a problem for later)
// but I did not write it thus I will not change it
function responsivefy(svg) {
    var container_sankey = d3.select(svg.node().parentNode);
    svg.call(resize);
    d3.select(window).on("resize." + container_sankey.style("id"), resize);
    function resize() {
        var containerWidth = parseInt(container_sankey.style("width"));
        var svgHeight = parseInt(svg.style("height"));
        var svgWidth = parseInt(svg.style("width"));
        svg.attr("width", containerWidth);
        svg.attr("height", Math.round(containerWidth * svgHeight / svgWidth));
    }
}

const years = [1990, 1995, 2000, 2005, 2010, 2015, 2020];

const continentOrder = ["AFRICA", "EUROPE", "ASIA", "LATIN AMERICA AND THE CARIBBEAN","NORTHERN AMERICA", "OTHER", "OCEANIA"];

const continentColors_Sankey = {
    "AFRICA": "#c7522a",
    "ASIA": "#f7b801",
    "EUROPE": "#3066be",
    "LATIN AMERICA AND THE CARIBBEAN": "#008585",
    "NORTHERN AMERICA": "#d1b1cb",
    "OCEANIA": "#e40613",
    "OTHER": "#4E0110"
};

// dimension and margin of graph
var margin = {top:10, right:10, bottom:10, left:200},
    width = 900 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// Add the title
d3.select('#sankey-slider').append("label")
    .attr("for", "sankey-range")
    .text("Timeline")
    .style("margin-bottom", "10px")
    .style("display", "block")
    .style("text-align", "center");

// Create the slider
const slider = d3.select('#sankey-slider').append("input")
    .attr("type", "range")
    .attr("id", "sankey-range")
    .attr("min", years[0])
    .attr("max", years[years.length - 1])
    .attr("value", years[0])
    .attr("step", 5) // Assume the step is 5 years, adjust if necessary
    .style("width", "100%")
    .on("input", function() {
        const selectedYear = parseInt(this.value); // Use the slider value as the year
        updateSankeyViz(selectedYear);
    });

// Add ticks to the slider
const tickContainer = d3.select('#sankey-slider').append("div")
    .attr("class", "tick-container");

tickContainer.selectAll("div")
    .data(years)
    .enter().append("div")
    .attr("class", "tick")
    .style("position", "absolute")
    .style("left", d => `${(d - years[0]) / (years[years.length - 1] - years[0]) * 100}%`)
    .style("transform", "translateX(0%)")
    .text(d => d);

////////////// FUNCTIONS ////////////////////
function produce_sankey(data) {
    var graph = sankey(data);    

    // add the links
    var link = svg_sankey.append("g").selectAll(".link")
    .data(graph.links)
    .enter().append("path")
    .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", function(d) {return d.width});
    
    // add in the nodes
    var node = svg_sankey.append("g").selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node");
    
    // add the rectangles for the nodes 
    node.append("rect")
        .attr("x", function(d) { return d.x0; })
        .attr("y", function(d) { return d.y0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) {
            return continentColors_Sankey[d.name.toUpperCase()] || "#ccc"; // Default color if no match
        })
        .style("stroke", function(d) {
            return d3.rgb(continentColors_Sankey[d.name.toUpperCase()] || "#ccc").darker(2);
        });

    // add the titles for the nodes
    node.append("text")
        .attr("x", function(d) {
            return d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6;
        })
        .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
        .attr("dy", "0.35em")
        .attr("text-anchor", function(d) {
            return d.x0 < width / 2 ? "start" : "end";
        })
        .text(function(d) { return d.name; });

    // Append a tooltip div to the body which will be used for displaying details about nodes or links
    var tooltip_sankey = d3.select("#sankey-viz").append("div")
        .attr("class", "tooltip-undesa")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "120px")
        .style("height", "auto")
        .style("padding", "2px")
        .style("pointer-events", "none");

    // Add event handlers for links
    link
        .on("mouseover", function(event, d) {
            tooltip_sankey.html(`From: ${d.source.name}<br>To: ${d.target.name}<br>Value: ${format(d.value)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .style("opacity", 1);
        })
        .on("mousemove", function(event) {
            tooltip_sankey.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip_sankey.style("opacity", 0);
        });

    // Existing event handlers for nodes, ensure they are correctly set up
    node.selectAll("rect")
        .on("mouseover", function(event, d) {
            tooltip_sankey.html(`Name: ${d.name}<br>Value: ${format(d.value)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .style("opacity", 1);
        })
        .on("mousemove", function(event) {
            tooltip_sankey.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip_sankey.style("opacity", 0);
        })
        .on("click", function(event, clickedNode) {
            event.stopPropagation();  // Prevent click from propagating to the SVG background
    
            // Reset all nodes and links to a lower opacity
            node.selectAll("rect").style("opacity", 0.2);
            link.style("opacity", 0.1);
    
            // Highlight the selected node
            d3.select(this).style("opacity", 1);
    
            // Highlight links and connected nodes
            link.filter(d => d.source === clickedNode || d.target === clickedNode)
                .style("opacity", 1)  // Make connected links fully visible
                .each(function(d) {
                    // Select the nodes connected by these links and make them fully visible
                    node.selectAll("rect")
                        .filter(n => n === d.source || n === d.target)
                        .style("opacity", 1);
                });
        });
}

function updateSankeyViz(selectedYear) {
    d3.json("data/sankey_" + selectedYear + ".json").then(function(data) {
        svg_sankey.selectAll("*").remove();  // Clear previous visualization
        produce_sankey(data);
    }).catch(function(error) {
        console.error("Failed to load data for year:", selectedYear, error);
    });
}

var formatNumber = d3.format(",.0f"); // zero decimal places
var format = function(d) { return formatNumber(d); };

// append the svg_sankey object to the body of the page
var svg_sankey = d3.select("#sankey-viz").append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .call(responsivefy)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .on("click", function(event) {
        // Reset all nodes and links to full opacity when clicking on the background
        if (!event.target.closest('.node rect')) {
            svg_sankey.selectAll(".node rect").style("opacity", 1);
            svg_sankey.selectAll(".link").style("opacity", 1);
        }
    });

// set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(10)
    .size([width, height]);

// load the data
d3.json("data/sankey_2020.json").then(function(sankeydata){
    produce_sankey(sankeydata);
});
