// Set the parameters to be passed into the UNDESA chart
const params = {
    svgElementId: "#my_dataviz",
    // TODO: Change the code for the colors and continents
    // to be two seperate arrays maybe where the order plays a role?
    // Regions are defined by the UN M49 standard
    // https://unstats.un.org/unsd/methodology/m49/#geo-regions
    continentColors: {
        "Africa": "#f07d00",
        "Europe": "#0069b3",
        "Asia": "#b80d7f",
        "Americas": "#ffcc01",
        "Oceania": "#e40613",
        "Antarctica": "#21bbef"
    },
    // Defines the radius of the circles indicating refugee numbers for example
    radiusFactor: 50,
};

// Adapt visualization to container width.
// Inspiration comes from Brendan Sudol and his blog
// https://brendansudol.github.io/writing/responsive-d3
function responsivefy(svg) {
    container = d3.select(svg.node().parentNode);
    svg.call(resize);
    d3.select(window).on("resize." + container.style("id"), resize);
    function resize() {
        let containerWidth = parseInt(container.style("width"));
        let svgHeight = parseInt(svg.style("height"));
        let svgWidth = parseInt(svg.style("width"));
        svg.attr("width", containerWidth);
        svg.attr("height", Math.round(containerWidth * svgHeight / svgWidth));
    }
}

var world;
var metaData;

class chartUndesa {
    constructor(params) {
        // --------------------------------------
        // The width and height here give rather the ratio
        // and not the final width and height, they are
        // resized using the resize function to the container
        this.width = 945;
        this.height = 480;
        // Build svg
        this.svg = d3.select(params.svgElementId)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", "0 0 " + this.width + " " + this.height)
            .attr("perserveAspectRatio", "xMinYMid") // Or xMidYMin?
            // Adapt the visualization to container width and make responsive
            .call(responsivefy);
        // --------------------------------------
        // Define the projection type
        const projection = d3.geoWinkel3() // Altertives: geoEckert4(), geoRobinson()
            .scale(150)
            .translate([this.width / 2, this.height / 2])
            .center([0, 0]);
        // --------------------------------------
        // Strong inspiration from document by Yan Holtz for tooltip    
        // https://d3-graph-gallery.com/graph/bubblemap_tooltip.html
        // https://d3-graph-gallery.com/graph/choropleth_hover_effect.html
        this.tooltip = d3.select(params.svgElementId)
            .append("div")
            .attr("class", "tooltip");
        // --------------------------------------
        // Define the color used to show percentages
        // TODO: Rename into colorPercentage?
        const color = d3.scaleQuantize([0.0, 100.0], d3.schemeBlues[5]);
        // --------------------------------------
        // Load UNDESA data
        // TODO: Rewrite so that data in json and generally more clean
        let myMap = new Map();
        unhcr.forEach(function (dictionary) {
            myMap.set(dictionary.country, dictionary.refugees + dictionary.asylum_seekers);
        });
        console.log(myMap)
        Promise.all([
            // Load  GeoJSON map
            // TODO: Exchange GeoJSON by TopoJSON
            // TODO: Maybe the link below could be an interesting source?
            // https://unpkg.com/world-atlas@1/world/110m.json
            // d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
            // Load country meta data
            // TODO: Find different json maybe
            // Alternative: https://raw.githubusercontent.com/mledoze/countries/master/dist/countries-unescaped.json
            d3.json("https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json"),
            // d3.json("https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/cultural/ne_50m_admin_0_map_units.json")
        ]).then((data) => {
            console.log(data[0])
            let worldGeojson = topojson.feature(data[0], data[0].objects.countries)
            world = worldGeojson
            let countriesMetaData = data[1]
            metaData = countriesMetaData
            console.log(worldGeojson)
            // --------------------------------------
            // Create different groups
            // Order of creating groups decides what is on top
            this.map_container = this.svg.append('g');
            this.map_countour = this.svg.append('g')
            // --------------------------------------
            // Add countries
            this.map_container.append("g")
                .selectAll("path")
                .join("country")
                .data(worldGeojson.features)
                .join("path")
                .attr("fill", "#dcdcdc")
                .attr("d", d3.geoPath().projection(projection))
                .attr("class", function (d, i) { return "map_country map_country_index_" + String(i) })
                .style("stroke", "white");
            // --------------------------------------
            // Add circles indicating refugees


/* 
    svg.append("g")
        .selectAll("circle")
        .data(data[0]["features"].map(item => item.id).filter(item => isNaN(item)).filter(item => !["OSA", "SDS", "ABV"].includes(item)))
        .join("circle")
        .attr("cx", function (d) { try { return projection([data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][1], data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][0]])[0] } catch (e) { console.log(d); return 0 } })
        .attr("cy", function (d) { return projection([data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][1], data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][0]])[1] })
        .attr("r", function (d) {
            try {
                let val = Math.sqrt(undesa['data'][4]['data']['2020'][undesa['code'].findIndex((ccn3) => ccn3 === parseInt(data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['ccn3']))] / Math.PI) / radiusFactor;
                // console.log(val); 
                return val;
            } catch (e) {
                console.log(e);
                console.log(d)
                return 0;
            }
        })
        .style("fill", function (d) { try { return continentColors[data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['region']] } catch { return "black" } })
        .attr("stroke", function (d) { try { return continentColors[data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['region']] } catch { return "black" } })
        .attr("stroke-width", 1)
        .attr("fill-opacity", .2)
        .attr("class", "map_circle")
 */






            // --------------------------------------
            // Draws a contour around the map
            // Is appended after the group 'g'
            this.map_countour.append("path")
                .datum({ type: "Sphere" })
                .attr("d", d3.geoPath().projection(projection))
                .attr("id", "countour")
                .style("fill", "none")
                .style("stroke", "#ccc")
                .style("stroke-width", 2);
            // --------------------------------------
            // Highlight country closest to cursor and show info using tooltip
            // The highlighted country is the one with a black border around it
            let indexHighlightedCountry = -1;
            const dist = function (p1, p2) { return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2); }
            this.svg.on("mouseover", () => {this.tooltip.style("opacity", 1)});
            this.svg.on("mousemove", (event) => {
                let svgBoundingRect = this.svg.node().getBoundingClientRect();
                // Make sure that even after responsivefy() function resized
                // that the mouse position is appropiatley scaled for calculations
                let svgScalingFactor = this.width/svgBoundingRect.width;
                // Mouse position relative to the svg 
                let relativeMousePos = [svgScalingFactor*(event.x - svgBoundingRect.left), svgScalingFactor*(event.y - svgBoundingRect.top)];
                // Convert geographic to cartesian coordinates for centroids
                // Input for projection is [lng,lat] and not [lat,lng]
                let centroidsCartesian = centroids.map((latlng) => projection([latlng[1], latlng[0]]));
                let indexClosestCountry = 0;
                for (let i = 0; i < centroidsCartesian.length; i++) {
                    if (dist(relativeMousePos, centroidsCartesian[i]) < dist(relativeMousePos, centroidsCartesian[indexClosestCountry])) {
                        indexClosestCountry = i;
                    }
                }
                // Triggered when country changes
                if (indexHighlightedCountry != indexClosestCountry) {
                    // TODO: The white is not the same anymore after going over it
                     d3.select(".map_country_index_" + String(indexHighlightedCountry))
                        .transition()
                        .duration(200)
                        .style("stroke", "white")
                        .style("stroke-width", "0.5px");
                    indexHighlightedCountry = indexClosestCountry;
                    let nodeHighlightedCountry = d3.select(".map_country_index_" + String(indexClosestCountry));
                    nodeHighlightedCountry
                        .raise()
                        .transition()
                        .duration(200)
                        .style("stroke", "black")
                        .style("stroke-width", "1px");
                    // Update tooltip text
                    // TODO: Find country flag display option accross browsers, make sure it is compatible
                    // TODO: Add country classes to circles and make stroke width bigger when hovering over country
                    this.tooltip.html("Flag" + "<b>&ensp;" + worldGeojson.features[indexHighlightedCountry].properties['name'] + "</b>" + "<br>" + worldGeojson.features[indexHighlightedCountry].id + "<br>" + "some value")
                }
                // Update position of tooltip when mouse is moved
                this.tooltip
                .style("left", (event.x - parseInt(d3.select(".tooltip").style("width")) / 2) + "px")
                .style("top", (event.y + 30) + "px")      
            })
            this.svg.on("mouseleave", () => {
                this.tooltip.style("opacity", 0);
                d3.select(".map_country_index_" + String(indexHighlightedCountry))
                        .transition()
                        .duration(200)
                        .style("stroke", "white")
                        .style("stroke-width", "0.5px");
                indexHighlightedCountry = -1;    
            })
        });
    }
}
// --------------------------------------
// Ensures that visualization loads faster, before images and CSS finished
// Code from 2024 EPFL COM-480 course, exercise session 8 on maps. 
// Code by Kirell Benzi, Krzysztof Lis, Volodymyr Miz
function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    }
}
whenDocumentLoaded(() => {
    plot_object = new chartUndesa(params); // console-inspectable global plot_object
});

