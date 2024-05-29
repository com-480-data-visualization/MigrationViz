
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

/*
    Run the action when we are sure the DOM has been loaded
    https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded
    Example:
    whenDocumentLoaded(() => {
        console.log('loaded!');
        document.getElementById('some-element');
    });
*/
function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    }
}

// unclear where to put that 
var formatNumber = d3.format(",.0f"); // zero decimal places
var format = function(d) { return formatNumber(d); };

const params_Sankey = {
    svgElementId: "#sankey-viz-test",
    margin: {top: 10, right: 20, bottom: 10, left: 20},
    continentColors: {
        "AFRICA": "#c7522a",
        "ASIA": "#f7b801",
        "EUROPE": "#3066be",
        "LATIN AMERICA AND THE CARIBBEAN": "#008585",
        "NORTHERN AMERICA": "#d1b1cb",
        "OCEANIA": "#e40613",
        "OTHER": "#4E0110"
    },
    continentOrder: ["AFRICA", "EUROPE", "ASIA", "LATIN AMERICA AND THE CARIBBEAN", "NORTHERN AMERICA", "OTHER", "OCEANIA"],
    years: [1990, 1995, 2000, 2005, 2010, 2015, 2020],
};

// Conseil : pour debuger définir des variables data
// const data_1990 = d3.json("https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/website/data/sankey_1990.json").then((data)=>{return data;});

class SankeyPlot {
    constructor(params) {
        this.margin = params.margin;
        this.extraMargin = 100;
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 800 - this.margin.top - this.margin.bottom;
        
        this.years = params.years ;
        this.continentOrder = params.continentOrder;
        this.continentColors = params.continentColors;

        // slider to do 
        // this.slider = d3.select(params.svgElementId)
        //     .append("input")
        //     .attr("type", "range")
        //     .attr("id", "sankey-range")
        //     .attr("min", this.years[0])
        //     .attr("max", this.years[this.years.length - 1])
        //     .attr("value", this.years[0])
        //     .attr("step", 5) // Assume the step is 5 years, adjust if necessary
        //     .style("width", "100%")
        // console.log('slider', this.slider)
        
        this.svg = d3.select(params.svgElementId)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .call(responsivefy);
        //     .on("click", function(event){
        //         // Reset all nodes and links to full opacity when clicking on the background
        //         if (!event.target.closest('.node rect')) {
        //             svg_sankey.selectAll(".node rect").style("opacity", 1);
        //             svg_sankey.selectAll(".link").style("opacity", 1);
        // }
        //     })

        d3.json("https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/website/data/sankey_data.json").then((data) => {
            
            let sankey = d3.sankey()
                .nodeWidth(15)
                .nodePadding(10)
                .extent([[this.extraMargin, 1], [this.width - this.extraMargin, this.height]]); // perhaps -1 ; -6 

            let graph = sankey({
                nodes: data[1990].nodes.map(d => Object.assign({}, d)),
                links: data[1990].links.map(d => Object.assign({}, d))
            });

            this.graph = graph;
                        
            console.log("Graph after Sankey layout:", this.graph);
            
            this.link = this.svg.append("g")
                .selectAll(".link")
                .data(this.graph.links)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke-width", (d) => Math.max(1, d.width));
                
            // this.graph.links.forEach((link) => {
            //     console.log(`Source: ${link.source}, Target: ${link.target}, Value: ${link.value}`);
            // });

            this.node = this.svg.append("g")
                .selectAll(".node")
                .data(this.graph.nodes)
                .enter().append("g")
                .attr("class", "node");

            this.node.append("rect")
                .attr("x", (d) => {
                        console.log(`Node ${d.name}: x0 = ${d.x0}`);
                        return d.x0;
                })
                .attr("y", (d) => {
                            console.log(`Node ${d.name}: y0 = ${d.y0}`);
                            return d.y0;
                })
                .attr("height", (d) => d.y1 - d.y0)
                .attr("width", sankey.nodeWidth())
                .style("fill", (d) => {
                    return this.continentColors[d.name.toUpperCase()] || '#ccc'; 
                })
                .style("stroke", (d) => {
                    return d3.rgb(this.continentColors[d.name.toUpperCase()] || '#ccc').darker(2);
                });

            this.node.append("text")
                .attr("x", (d) => d.x0 < this.width / 2 ? d.x0 - 6 : d.x1 + 6)
                .attr("y", (d) => (d.y0 + d.y1) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", (d) => d.x0 < this.width / 2 ? "end" : "start")
                .text((d) => d.name);

            // Tooltip 
            this.tooltipSankey = d3.select(params.svgElementId)
                .append("div")
                .attr("class", "tooltip-undesa")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("text-align", "center")
                .style("width", "120px")
                .style("height", "auto")
                .style("padding", "2px")
                .style("pointer-events", "none");

            this.link
                .on("mouseover", function(event, d) {
                this.tooltipSankey.html(`From: ${d.source.name}<br>To: ${d.target.name}<br>Value: ${format(d.value)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .style("opacity", 1);
                })
                .on("mousemove", function(event) {
                    this.tooltipSankey.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
                })
                .on("mouseout", function() {
                    this.tooltip_sankey.style("opacity", 0);
                });
            
            // Existing event handlers for nodes, ensure they are correctly set up
            node.selectAll("rect")
                .on("mouseover", function(event, d) {
                    this.tooltip_sankey.html(`Name: ${d.name}<br>Value: ${format(d.value)}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px")
                        .style("opacity", 1);
                })
                .on("mousemove", function(event) {
                    this.tooltip_sankey.style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY + 10) + "px");
                })
                .on("mouseout", function() {
                    this.tooltip_sankey.style("opacity", 0);
                })
                .on("click", function(event, clickedNode) {
                    event.stopPropagation();  // Prevent click from propagating to the SVG background

                    // Reset all nodes and links to a lower opacity
                    this.node.selectAll("rect").style("opacity", 0.2);
                    this.link.style("opacity", 0.1);

                    // Highlight the selected node
                    d3.select(this).style("opacity", 1);

                    // Highlight links and connected nodes
                    this.link.filter(d => d.source === clickedNode || d.target === clickedNode)
                        .style("opacity", 1)  // Make connected links fully visible
                        .each(function(d) {
                            // Select the nodes connected by these links and make them fully visible
                            this.node.selectAll("rect")
                                .filter(n => n === d.source || n === d.target)
                                .style("opacity", 1);
                        });
                });

        }).catch((error) => {
            console.error('Error loading or parsing data:', error);
        });


        
    };

}



SankeyPlotTest = new SankeyPlot(params_Sankey);

console.log('Sankey', SankeyPlotTest);

// sankeyPlot.initSankey();



// whenDocumentLoaded(() => {

//     let plot = new SankeyPlot('sankey-viz');
// })
