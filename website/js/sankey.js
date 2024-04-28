// dimension and margin of graph
var margin = {top:10, right:10, bottom:10, left:200},
width = 900 - margin.left - margin.right,
height = 700 - margin.top - margin.bottom;

// Inspiration for the responsify function comes from
// Brendan Sudol and his blog
// https://brendansudol.github.io/writing/responsive-d3
function responsivefy(svg) {
    container = d3.select(svg.node().parentNode)
    svg.call(resize)
    d3.select(window).on("resize." + container.style("id"), resize)
    function resize() {
        var containerWidth = parseInt(container.style("width"));
        var svgHeight = parseInt(svg.style("height"))
        var svgWidth = parseInt(svg.style("width"))
        svg.attr("width", containerWidth);
        svg.attr("height", Math.round(containerWidth * svgHeight / svgWidth));
    }
}

//format variable
var formatNumber = d3.format(",.0f") // zero decimal places
format = function(d) {return formatNumber(d);},
color = d3.scaleOrdinal(d3.schemeCategory10);

// append the svg_sankey object to the body of the page
var svg_sankey = d3.select("#sankey-viz").append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .call(responsivefy)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// set the sankey diagram properties
var sankey = d3.sankey()
.nodeWidth(20)
.nodePadding(10)
.size([width, height])

var path = sankey.links();

// load the data
d3.json("data/sankey_2020_continent_test.json").then(function(sankeydata){
graph = sankey(sankeydata);

// add the links
var link = svg_sankey.append("g").selectAll(".link")
.data(graph.links)
.enter().append("path")
    .attr("class", "link")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke-width", function(d) {return d.width});

// add the link titles that appear when hovering on the links
link.append("title")
.text(function(d) {
    return "from " + d.source.name + " to " + d.target.name + "\n" + format(d.value);
});

// add in the nodes
var node = svg_sankey.append("g").selectAll(".node")
.data(graph.nodes)
.enter().append("g")
.attr("class", "node");

// add the rectangles for the nodes 
node.append("rect")
.attr("x", function(d) {return d.x0;})
.attr("y", function(d) {return d.y0;})
.attr("height", function(d) {return d.y1 - d.y0; })
.attr("width", sankey.nodeWidth())
.style("fill", function(d) {
                    return d.color = color(d.name.replace(/ .*/, "")); })
.style("stroke", function(d) {
                    return d3.rgb(d.color).darker(2); })
.append("title")
    .text(function(d) {
                return d.name + "\n" + format(d.value); })

// add the titles for the nodes
node.append("text")
.attr("x", function(d) {return d.x0-6;})
.attr("y", function(d) {return (d.y1 + d.y0)/ 2;})
.attr("dy", "0.35em")
.attr("text-anchor", "end")
.text(function(d) {return d.name;})
.filter(function(d) {return d.x0 < width/2;})
.attr("x", function(d) {return dx1 + 6;})
.attr("text-anchor", "start")
});