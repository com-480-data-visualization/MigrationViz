
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

const params_Sankey = {
    svgElementId: "#sankey-viz",
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
        this.width = 900 - this.margin.left - this.margin.right;
        this.height = 700 - this.margin.top - this.margin.bottom;
        
        this.years = params.years ;
        this.continentOrder = params.continentOrder;
        this.continentColors = params.continentColors;
        
        // this.data = data;
        // console.log('data', this.data);

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
            
            console.log(data[1990]);

            let sankey = d3.sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .extent([1, 1], [this.width - 1, this.height -6 ]); // WHY ?

            this.graph = sankey(data[1990])
            
            console.log(this.graph.links);

  

        });
    }
            /* this.sankey = d3.sankey()
                .nodeWidth(20)
                .nodePadding(10)
                .size([width, height]); */




            // ------------------------
            
/*             // this.graph = d3.sankey(data)
            const  graph = d3.sankey(data)
            .nodeWidth(15)
            .nodePadding(10)
            .extent([1, 1], [this.width - 1, this.height -6 ]); // WHY ?
            console.log('this.graph', graph);
            console.log("graph_nodes", graph.nodes)

            this.link = this.svg.append("g")
                .selectAll(".link")
                .data(graph.links)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke-width", (d) => d.width);
            });
            console.log('this.link', this.link); // undefined 

            this.node = this.svg.append("g")
                .selectAll(".node")
                .data(graph.nodes)
                .enter().append("g")
                .attr("class", "node");

 */
            // -------------------------

        // this.node.append("rect")
        //     .attr("x", (d) => d.x0)
        //     .attr("y", (d) => d.y0)
        //     .attr("height", (d) => d.y1 - d.y0)
        //     .attr("width", sankey.nodeWidth())
        //     .attr("fill", (d) => this.continentColors[d.continent])
        //     .attr("stroke", "#000");

        // this.node.append("text")
        //     .attr("x", (d) => d.x0 - 6)
        //     .attr("y", (d) => (d.y1 + d.y0) / 2)
        //     .attr("dy", "0.35em")
        //     .attr("text-anchor", "end")
        //     .text((d) => d.name)
        //     .filter((d) => d.x0 < this.width / 2)
        //     .attr("x", (d) => d.x1 + 6)
        //     .attr("text-anchor", "start");
  
    

    // initSankey() {
        // const sankey = d3.sankey()
        //     .nodeWidth(15)
        //     .nodePadding(10)
        //     .extent([[1, 1], [this.width - 1, this.height - 6]]);
        // console.log('d3.sankey', sankey)
        // this.graph = d3.sankey(this.data)
        //     .nodeWidth(15)
        //     .nodePadding(10)
        //     .extent([1, 1], [this.width - 1, this.height -6 ]); // WHY ?
        // console.log('this.graph', this.graph)

        // this.link = this.svg.append("g")
        //     .selectAll(".link")
        //     .data(this.graph.links)
        //     .enter().append("path")
        //     .attr("class", "link")
        //     .attr("d", d3.sankeyLinkHorizontal())
        //     .attr("stroke-width", (d) => d.width);

        // this.node = this.svg.append("g")
        //     .selectAll(".node")
        //     .data(this.graph.nodes)
        //     .enter().append("g")
        //     .attr("class", "node");

        // this.node.append("rect")
        //     .attr("x", (d) => d.x0)
        //     .attr("y", (d) => d.y0)
        //     .attr("height", (d) => d.y1 - d.y0)
        //     .attr("width", sankey.nodeWidth())
        //     .attr("fill", (d) => this.continentColors[d.continent])
        //     .attr("stroke", "#000");

        // this.node.append("text")
        //     .attr("x", (d) => d.x0 - 6)
        //     .attr("y", (d) => (d.y1 + d.y0) / 2)
        //     .attr("dy", "0.35em")
        //     .attr("text-anchor", "end")
        //     .text((d) => d.name)
        //     .filter((d) => d.x0 < this.width / 2)
        //     .attr("x", (d) => d.x1 + 6)
        //     .attr("text-anchor", "start");
     //   }
}

// unclear where to put that 
var formatNumber = d3.format(",.0f"); // zero decimal places
var format = function(d) { return formatNumber(d); };


sankeyPlot = new SankeyPlot(params_Sankey);

console.log('Sankey', sankeyPlot);

// sankeyPlot.initSankey();



// whenDocumentLoaded(() => {

//     let plot = new SankeyPlot('sankey-viz');
// })
