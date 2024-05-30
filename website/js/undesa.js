// Set the parameters to be passed into the UNDESA chart
const params = {
    svgElementId: "#my_dataviz",
    // TODO: Change the code for the colors and continents
    // to be two seperate arrays maybe where the order plays a role?
    // Regions are defined by the UN M49 standard
    // https://unstats.un.org/unsd/methodology/m49/#geo-regions
    continentColors: {
        "AFRICA": "#004343",
        "ASIA": "#008585",
        "EUROPE": "#80c2c2",
        "LATIN AMERICA AND THE CARIBBEAN": "#74a892",
        "NORTHERN AMERICA": "#b8cdab",
        "OCEANIA": "#fbf2c4",
        "OTHER": "#80a1a1"
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
var UndesaData;
var countryCodes;

class chartUndesa {
    constructor(params) {
        // --------------------------------------
        // The width and height here give rather the ratio
        // and not the final width and height, they are
        // resized using the resize function to the container
        this.width = 780;
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
            .scale(170)
            .translate([this.width / 2, this.height / 2])
            .center([15, 10]);
        // --------------------------------------
        // Strong inspiration from document by Yan Holtz for tooltip    
        // https://d3-graph-gallery.com/graph/bubblemap_tooltip.html
        // https://d3-graph-gallery.com/graph/choropleth_hover_effect.html
        this.tooltip = d3.select(params.svgElementId)
            .append("div")
            .attr("class", "tooltip-undesa")
        // --------------------------------------
        // Define the color used to show percentages
        // TODO: Rename into colorPercentage?
        // const color = d3.scaleQuantize([0.0, 100.0], d3.schemeBlues[5]);
        // --------------------------------------
        Promise.all([
            // Load  GeoJSON map
            // TODO: Exchange GeoJSON by TopoJSON            
            d3.json("https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/data_processing/data_world/map/map.geojson"),
            // d3.json("https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/website/data/map.topojson"),
            // Load data 
            d3.json("https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/website/data/undesa_data.json"),
            // Load centroid and country code data
            d3.json("https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/data_processing/data_world/map/country-centroids.json"),
            d3.json("data/contourWesternAsia.json")
        ]).then((data) => {
            // let worldGeojson = topojson.feature(data[0], data[0].objects.data)
            let worldGeojson = structuredClone(data[0]);
            let switzerlandGeojson = structuredClone(data[0]);
            worldGeojson.features = worldGeojson.features.slice(0, 235); // 235, 227
            switzerlandGeojson.features = switzerlandGeojson.features.slice(235, 261)
            // Debugging
            // TODO: Remove 
            world = worldGeojson
            // --------------------------------------
            // Treat UNDESA data
            let undesaData = [];
            for (let i = 0; i < data[1]["code"].length; i++) {
                let indx = worldGeojson.features.findIndex((obj) => Number(obj.properties["m49"]) === data[1]["code"][i]);
                undesaData.push({
                    "iso_3166_2": worldGeojson.features[indx].properties["iso_3166_2"],
                    "m49": data[1]["code"][i],
                    "name": data[1]["name"][i],
                    "latitude": worldGeojson.features[indx].properties["latitude"],
                    "longitude": worldGeojson.features[indx].properties["longitude"],
                    "cx": projection([worldGeojson.features[indx].properties["longitude"], worldGeojson.features[indx].properties["latitude"]])[0],
                    "cy": projection([worldGeojson.features[indx].properties["longitude"], worldGeojson.features[indx].properties["latitude"]])[1],
                    "region": worldGeojson.features[indx].properties["region"],
                    "sovereignt": worldGeojson.features[indx].properties["sovereignt"],
                    "type": worldGeojson.features[indx].properties["type"],
                    "metaData": data[1]["type"][i],
                    "refugees": data[1]["data"][4]["data"]['2020'][i],
                    "percentRefugees": data[1]["data"],
                    "percentMigrants": data[1]["data"][2]["data"]["2020"][i],
                    "percentRefugeesOfMigrants": data[1]["data"][5]["data"]['2020.1'][i]
                });
            }
            // console.log(undesaData);
            UndesaData = undesaData
            // --------------------------------------
            // Treat country centroid and code data
            countryCodes = data[2];
            let alpha3 = [];
            worldGeojson.features.forEach((obj) => alpha3.push(obj.properties["iso_3166_2"]));
            const convertAlpha = (alph3) => {
                try { return countryCodes.find((obj) => obj.alpha3 === alph3)['alpha2'] } catch {
                    if (alph3 == "SDS") { return "SS" }
                    else if (alph3 == "CUW") { return "CW" }
                    else if (alph3 == "SAH") { return "EH" }
                    else if (alph3 == "PSX") { return "PS" }
                    else if (alph3 == "MAF") { return "MF" }
                    else if (alph3 == "BLM") { return "BL" }
                    else if (alph3 == "SXM") { return "SX" }
                    else if (alph3 == "BES") { return "BQ-BO" }
                    return ""
                }
            };
            let alpha3ToAlpha2 = {}
            alpha3.forEach(alph3 => alpha3ToAlpha2[alph3] = convertAlpha(alph3));
            // console.log(alpha3ToAlpha2);
            // --------------------------------------
            // Convert geographic to cartesian coordinates for centroids
            // Input for projection is [lng,lat] and not [lat,lng]
            let centroidsCartesianWorld = [];
            worldGeojson.features.forEach((feature) => { centroidsCartesianWorld.push(projection([feature.properties["longitude"], feature.properties["latitude"]])) })
            // --------------------------------------
            // Create different groups
            // Order of creating groups decides what is on top
            this.map_countriesWorld = this.svg.append('g');
            this.map_circles = this.svg.append('g');
            this.contour_WesternAsia = this.svg.append('g').attr("class","western_asia");
            this.map_countour = this.svg.append('g');
            // --------------------------------------
            // Add countries
            this.map_countriesWorld.selectAll("path")
                // .join("country")
                .data(worldGeojson.features)
                .join("path")
                .attr("fill", "#dcdcdc")
                .attr("d", d3.geoPath().projection(projection))
                .attr("class", function (d) { return "map_country map_country_code_" + d.properties["iso_3166_2"] })
                .attr("class", function (d, i) { return "map_country map_country_index_" + String(i) })
                .style("stroke", "white")
                .style("stroke-width", 0.75);
            // --------------------------------------
            // Add circles indicating refugees
            let radiusFactorRefugees = 50;
            this.map_circles.selectAll("circle")
                .data(undesaData)
                .join("circle")
                .attr("cx", function (d) { return d.cx; })
                .attr("cy", function (d) { return d.cy; })
                .attr("r", function (d) {
                    if (isNaN(d.refugees)) {
                        // Means the country eihter doesnt report
                        // Or data has been removed out of privacy reasons
                        return 0;
                    }
                    else {
                        try {
                            let val = Math.sqrt(d.refugees / Math.PI) / radiusFactorRefugees;
                            return val;
                        } catch (e) {
                            console.log(e);
                            console.log(d)
                            return 0;
                        }
                    }
                })
                .attr("class", function (d) { return "map_circle map_circle_code_" + d.iso_3166_2 })
                .style("fill", function (d) { try { return params.continentColors[d.region] } catch { return "black" } })
                .attr("stroke", function (d) { try { return params.continentColors[d.region] } catch { return "black" } })
                .attr("stroke-width", 1)
                .attr("fill-opacity", .2);
            // --------------------------------------
            // Draw contour around Western Asia and add text
            // Read in border data
            let borderWesternAsia = data[3];
            borderWesternAsia.features[0].geometry.coordinates[0].reverse();
            this.contour_WesternAsia.append('path')
                .datum(borderWesternAsia)
                .attr("d", d3.geoPath().projection(projection)).style("stroke-width", "1px")
                .style("stroke-dasharray",1.5)
                .style("stroke", "black")
                .attr("fill-opacity", "0");
            // Coordinates where you want to place the text
            const coo = [55.25, 4];
            // Convert geographic coordinates to SVG coordinates
            const [x_coo, y_coo] = projection(coo);
            // Add text at the specified coordinates
            this.textWesternAsia = this.contour_WesternAsia.append("text")
                .attr("x", x_coo)
                .attr("y", y_coo)
                .attr("text-anchor", "left")
                .attr("font-size", "0.6em");
            this.textWesternAsia.append("tspan").attr("dx", "0em").attr("dy", "0em").text("More than 3x the");
            this.textWesternAsia.append("tspan").attr("font-size", "0.5em").attr("x", x_coo).attr("y", y_coo).attr("dx", "0em").attr("dy", "1em").text("number of refugees");
            this.textWesternAsia.append("tspan").attr("x", x_coo).attr("y", y_coo).attr("dx", "0em").attr("dy", "2em").text("in Europe live here");
                

            // --------------------------------------
            // Draws a contour around the map
            // Is appended after the group 'g'
            /* this.map_countour.append("path")
                .datum({ type: "Sphere" })
                .attr("d", d3.geoPath().projection(projection))
                .attr("id", "countour")
                .style("fill", "none")
                .style("stroke", "#ccc")
                .style("stroke-width", 2); */
            // --------------------------------------

            // Highlight country closest to cursor and show info using tooltip
            // The highlighted country is the one with a black border around it
            let indexHighlightedCountry = -1;
            const dist = function (p1, p2) { return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2); }
            this.svg.on("mouseover", () => { this.tooltip.style("opacity", 1).style("padding", "1.25rem 1rem") });
            this.svg.on("mousemove", (event) => {
                let svgBoundingRect = this.svg.node().getBoundingClientRect();
                // Make sure that even after responsivefy() function resized
                // that the mouse position is appropiatley scaled for calculations
                let svgScalingFactor = this.width / svgBoundingRect.width;
                // Mouse position relative to the svg 
                let relativeMousePos = [svgScalingFactor * (event.x - svgBoundingRect.left), svgScalingFactor * (event.y - svgBoundingRect.top)];

                //let centroidsCartesian = centroids.map((latlng) => projection([latlng[1], latlng[0]]));
                let indexClosestCountry = 0;
                for (let i = 0; i < centroidsCartesianWorld.length; i++) {
                    if (dist(relativeMousePos, centroidsCartesianWorld[i]) < dist(relativeMousePos, centroidsCartesianWorld[indexClosestCountry])) {
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
                    let textDependency = "";
                    if (worldGeojson.features[indexHighlightedCountry].properties['type'] == "Dependency") textDependency = "Dependency of " + worldGeojson.features[indexHighlightedCountry].properties['sovereignt'];
                    let numberRefugee = undesaData.find((obj) => obj.m49 == worldGeojson.features[indexHighlightedCountry].properties['m49'])["refugees"];
                    let textNumberRefugees = "";
                    if (numberRefugee == "..") { textNumberRefugees = "No data." }
                    else if (numberRefugee == "~") { textNumberRefugees = "< 5" }
                    else { textNumberRefugees = numberRefugee.toLocaleString("CH") };
                    let percentageMigrants =  undesaData.find((obj) => obj.m49 == worldGeojson.features[indexHighlightedCountry].properties['m49'])["percentMigrants"];
                    let textPercentageMigrants = "";
                    if (percentageMigrants == "..") { textPercentageMigrants = "No data." }
                    else if (percentageMigrants == "~") { textPercentageMigrants = "< 5%" }
                    else { textPercentageMigrants = percentageMigrants.toFixed(1) + "%"};
                    let textEstimateMetaData = "Estimates derived from data";
                    undesaData.find((obj) => obj.m49 == worldGeojson.features[indexHighlightedCountry].properties['m49'])["metaData"]
                        .split('').forEach((char, i) => {
                            if (i != 0 && char != ' ') { textEstimateMetaData += " and" }
                            if (char == 'B') { textEstimateMetaData += " on foreign-born population" }
                            else if (char == 'C') { textEstimateMetaData += " on foreign citizens" }
                            else if (char == 'R') { textEstimateMetaData += " on data of the UNHCR or UNRWA" }
                            else if (char == 'I') { textEstimateMetaData += " imputed (i.e. no data)" }
                        });
                    // console.log(worldGeojson.features[indexHighlightedCountry].properties['iso_3166_2']);
                    let alpha2 = alpha3ToAlpha2[worldGeojson.features[indexHighlightedCountry].properties['iso_3166_2']]
                    // console.log(alpha2);
                    this.tooltip.html("<div><svg width=\"16\" height=\"12\" class=\"icon\"><use xlink:href=\"#" + alpha2 + "\"></use></svg>" + "<b>&ensp;" + worldGeojson.features[indexHighlightedCountry].properties['name'] + "</b>"
                        + "<br>" + textDependency + "</div>"
                        + "<div class=\"undesa-data\">" + "Refugees: " + "<span>" + textNumberRefugees + "</span>"
                        + "<br>" + "Pct. migrants:" + "<span>" + textPercentageMigrants + "</span>" + "</div>"
                        + "<div class=\"undesa-meta-data\"><div>" + textEstimateMetaData + "</div></div>")
                    // d3.select(".tooltip").append("div").html("<br>" + textEstimateMetaData)
                }
                // Update position of tooltip when mouse is moved
                this.tooltip
                    .style("left", (event.x - parseInt(d3.select(".tooltip-undesa").style("width")) / 2) + "px")
                    .style("top", (event.y + 40) + "px")
            })

            this.svg.on("mouseleave", () => {
                this.tooltip.style("opacity", 0).style("padding", "0");
                d3.select(".map_country_index_" + String(indexHighlightedCountry))
                    .transition()
                    .duration(200)
                    .style("stroke", "white")
                    .style("stroke-width", "0.75px");
                indexHighlightedCountry = -1;
            })
            // Zoom in functionality test
            /*
            const zoomIn = () => {
                this.map_countriesWorld.transition().duration(750).call(
                    d3.zoom().on("zoom", (event) => {
                        this.map_countriesWorld.attr("transform", event.transform);
                    }).transform,
                    d3.zoomIdentity.translate(10, 100).scale(1)
                );
            };
            zoomIn();
            */
            // Loading svg into document to decrease flag loading times
            const svgFlagUrl = 'https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/website/data/flag_sprite.svg';
            const svgFlagContainer = document.getElementById('svg_flag_container');
            fetch(svgFlagUrl)
                .then(response => response.text())
                .then(svgText => {
                    const parser = new DOMParser();
                    const svgDocument = parser.parseFromString(svgText, 'image/svg+xml');
                    const svgElement = svgDocument.documentElement;
                    svgFlagContainer.appendChild(svgElement);
                })
                .catch(error => console.error('Error fetching SVG:', error));
            // Define colors for the change
            // const color = d3.scaleQuantize([0.0, 100.0], d3.schemeBlues[5]);
            const color = d3.scaleSequentialSqrt([0, 100.0], d3.interpolateBuPu); // interpolateOrRd
            // Chnage of viz when prsssing on input button
            const radioInput = document.getElementsByClassName('inp');
            for (let i = 0; i < radioInput.length; i++) {
                radioInput[i].addEventListener('input', () => {
                    const newValue = radioInput[i].value;
                    this.updateD3Visualization(newValue, color, undesaData, radiusFactorRefugees);
                })
            }
        });

        let legd = Legend(d3.scaleSequentialSqrt([0, 100.0], d3.interpolateBuPu), {
            title: "Percent migrants in population"
          });
        console.log(legd);
        document.querySelector(".undesa-legend").appendChild(legd);
    }

    updateD3Visualization(value, color, undesaData, radiusFactor) {
        if (value == "Option1") {
            d3.select(".undesa-legend").transition(d3.transition().duration(300)).style("opacity", 0);
            d3.select(".western_asia").transition(d3.transition().duration(300)).style("opacity", 0);
            d3.selectAll(".map_circle").transition(d3.transition().duration(600))
                .attr("r", function (d) {
                    let refugees = undesaData.find((obj) => obj.iso_3166_2 == d['iso_3166_2'])["refugees"];
                    if (isNaN(refugees)) {
                        // Means the country eihter doesnt report
                        // Or data has been removed out of privacy reasons
                        return 0;
                    }
                    else {
                        try {
                            let val = Math.sqrt(refugees / Math.PI) / radiusFactor;
                            return val;
                        } catch (e) { console.log(e, d); return 0; }
                    }
                });
            d3.selectAll(".map_country").transition(d3.transition().duration(100))
                .attr("fill", '#dcdcdc')
        }
        else if (value == "Option2") {
            d3.select(".undesa-legend").transition(d3.transition().duration(300)).style("opacity", 1);
            d3.select(".western_asia").transition(d3.transition().duration(300)).style("opacity", 1);
            d3.selectAll(".map_circle").transition(d3.transition().duration(600))
                .attr("r", 0);
            d3.selectAll(".map_country").transition(d3.transition().duration(300))
                .attr("fill", function (d) {
                    try {
                        let val = undesaData.find((obj) => obj.iso_3166_2 == d.properties["iso_3166_2"])["percentMigrants"];
                        if (val == "~" || val == "..") {
                            return color(0.0);
                        }
                        return color(parseFloat(val));
                    }
                    catch (e) {
                        console.log("error", d);
                        return color(0.0);
                    } 
                })
        }
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
    undesaChart = new chartUndesa(params); // console-inspectable global plot_object
});