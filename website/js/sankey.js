// What use in that ?
// d3.selection.prototype.moveToFront = function () {
    // return this.each(function () {
    //   this.parentNode.appendChild(this);
    // });
//   };

class SankeyViz{
    constructor(data){
        // Set up dimensions and margins
        var margin = { top: 10, right: 10, bottom: 10, left: 200 };
        var width = 900 - margin.left - margin.right;
        var height = 700 - margin.top - margin.bottom;

        // Format variable
        var formatNumber = d3.format(",.0f");
        var format = function(d) {
        return formatNumber(d);
        };
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        // Append the SVG object to the body of the page
        var svg = d3
        .select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Set up the Sankey diagram properties
        var sankey = d3
        .sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .size([width, height]);

        var path = sankey.links();

        // Load the data
        d3.json("../data_world/sankey_2020_continent_test.json").then(function(
        sankeydata
        ) {
        var graph = sankey(sankeydata);

        // Add the links
        var link = svg
            .append("g")
            .selectAll(".link")
            .data(graph.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", function(d) {
            return d.width;
            });

        // Add the link titles that appear when hovering on the links
        link
            .append("title")
            .text(function(d) {
            return (
                "from " + d.source.name + " to " + d.target.name + "\n" + format(d.value)
            );
            });

        // Add in the nodes
        var node = svg
            .append("g")
            .selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", "node");

        // Add the rectangles for the nodes
        node
            .append("rect")
            .attr("x", function(d) {
            return d.x0;
            })
            .attr("y", function(d) {
            return d.y0;
            })
            .attr("height", function(d) {
            return d.y1 - d.y0;
            })
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) {
            return (d.color = color(d.name.replace(/ .*/, "")));
            })
            .style("stroke", function(d) {
            return d3.rgb(d.color).darker(2);
            })
            .append("title")
            .text(function(d) {
            return d.name + "\n" + format(d.value);
            });

        // Add the titles for the nodes
        node
            .append("text")
            .attr("x", function(d) {
            return d.x0 - 6;
            })
            .attr("y", function(d) {
            return (d.y1 + d.y0) / 2;
            })
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(function(d) {
            return d.name;
            })
            .filter(function(d) {
            return d.x0 < width / 2;
            })
            .attr("x", function(d) {
            return d.x1 + 6;
            })
            .attr("text-anchor", "start");
        });

        }
}