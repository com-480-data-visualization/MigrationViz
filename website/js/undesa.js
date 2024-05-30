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
            d3.json("https://raw.githubusercontent.com/com-480-data-visualization/MigrationViz/master/data_processing/data_world/map/country-centroids.json")
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
            this.map_circles = this.svg.append('g')
            this.map_countour = this.svg.append('g')
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
            // Draw contour around Western Asia
            let borderWesternAsia = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"coordinates":[[[25.3262420992599,38.99882387402414],[25.493057009842204,38.30402929104079],[26.123246672039784,37.29350069805396],[26.95732122494755,36.58240133843948],[28.143560589083194,35.9097406124403],[29.459544883672095,35.60892628738988],[30.81259915839007,35.60892628738988],[31.94323355233206,35.714340652419494],[32.888518045627194,35.744433472958775],[33.68552261840708,35.63905887678179],[34.24157232034517,35.322101014467435],[34.556667151443975,34.82150605852108],[34.538132161379394,34.24127304354279],[34.36627416914371,33.3248301763398],[33.949112368139566,32.56634032007406],[33.636241017386226,32.00796449808968],[33.46242360030163,31.416503996557395],[33.56671405055235,30.58216346688907],[33.8100584344719,29.649986346797874],[34.12292978522416,28.556534680580242],[34.609618553063285,27.42075376543073],[35.24291281156019,26.3856591198018],[36.107370967333594,24.95377805511319],[36.85501045340686,23.654941036322427],[37.69610487524048,22.105169534049352],[38.53719929707427,20.581935100141294],[39.54538674131584,18.879332177245487],[40.316389961328724,17.36947903757283],[41.32103052074214,15.599693637060625],[41.813831122347295,14.590339344544248],[42.257742067202315,13.297881796547642],[43.005381553277005,11.815608689159632],[43.590380410792875,11.380141521549206],[44.327957208841724,11.319878841497257],[45.29090469518246,11.56085277772084],[46.7873267338405,12.000775811578265],[48.20774853626531,12.606357305261056],[49.70564789154929,13.185367016827485],[51.35850235255191,13.838250053034272],[53.21796362118084,14.689250565930763],[54.793340529324155,15.561831176968838],[56.246825571218295,16.371999863943827],[57.359309431246146,17.297906322437186],[58.47179329127408,18.356953776070796],[59.24569510694664,19.45515903282852],[60.06796578609857,20.50068012124018],[60.769314306550484,21.31398689591218],[61.25300294134186,22.503164281279112],[61.25300294134186,23.08285381050075],[60.914420896986485,23.704350125000232],[60.04378135435533,24.01399723897164],[58.686555851020586,24.24876323477075],[57.00988246368246,24.609587122493537],[55.15029925227179,24.9693732016825],[53.47362586493375,25.630829653771258],[52.437136861851684,26.23396564381315],[51.46161780012821,27.10568453265637],[50.79094844519338,28.105203205741404],[50.29102017602335,28.826869451505715],[49.786277830535084,29.53196489664137],[49.130112781400925,30.478987329526376],[48.75996839471003,31.100475089068482],[48.154277580127285,31.920357575710028],[47.68318472433805,32.60326090722427],[47.394104742079776,33.11647435853622],[47.1248961465289,33.73191205761172],[46.984439487981405,34.32363631048145],[46.84398282943397,34.84400158873542],[46.660465800842815,35.45649552260336],[46.43807609147595,36.0548997282194],[46.1441055072338,36.62061082116011],[45.83978274704759,37.238132292524384],[45.61980499395759,37.66660677441156],[45.630069157903534,37.9828010176968],[45.79429578103776,38.19284373125481],[46.17406984703706,38.3459545546705],[46.800183847739106,38.57100273662371],[47.518675323952834,38.69127527912988],[48.15505348860074,38.7633419218578],[48.80698756394233,38.805444981842726],[49.29966743334646,38.797445891471995],[49.525479040156,38.94129208415376],[49.73076231907524,39.10077959441384],[49.977102253777986,39.44245822127016],[50.07974389323684,39.68775016202409],[50.14132887691221,39.98724582977994],[50.13759493352089,40.526045981979536],[49.91764572879646,41.07451057300335],[49.5941910159647,41.32761297974429],[49.27091555662108,41.47928664465931],[48.761490037338774,41.60877709053321],[48.328958894035225,41.730835448693426],[47.87720418825518,41.80252635939681],[47.43506128472694,41.89560475916818],[46.96107692732801,42.05556164798733],[46.65473973137469,42.173391245415644],[46.24629013677077,42.34972478751942],[45.83784054216687,42.43351978222543],[45.338624370984576,42.492109708376006],[44.88479148809148,42.508839616176715],[44.46499607141527,42.508839616176715],[43.9884715443776,42.517202891416844],[43.398488796617045,42.50047522182027],[42.910618447505584,42.47537532433873],[42.53620631911994,42.40001520895419],[42.13910254658839,42.366492735882474],[41.67392384162295,42.24062407481341],[41.289468325474616,42.12448515103898],[41.03744304569824,41.95736854286059],[40.89342860011115,41.83677250245944],[40.488387971899755,41.736101880912855],[40.092348246537426,41.621817456176785],[39.615300395533154,41.594897511982],[39.10224893313108,41.57470018264283],[38.661204693523246,41.567966335598214],[38.1661550368207,41.55449653573021],[37.51928423527778,41.7020990064463],[36.64688415276203,41.96848977733953],[35.97470704000429,42.18080372987757],[35.31683156794253,42.40296868362634],[34.35862164124515,42.51902798221042],[33.55772975600311,42.54010655010853],[33.0571723316086,42.50848601891295],[32.31348701536524,42.41352841009552],[31.55550005842491,42.30785108101449],[30.81181474218252,42.23377121285057],[30.268352395697207,41.989753122479755],[29.724890049211808,41.776800170183975],[29.395952313181397,41.552436034615255],[28.80216408215358,41.33145497350364],[28.444623064729342,41.148634091665485],[28.144288610092786,40.96530202392648],[27.58652462291053,40.78145922322577],[27.08596719851593,40.66223018411387],[26.499599929939876,40.499301080776235],[26.027645786939132,40.226871287654916],[25.713009691605663,39.86557975301247],[25.48418344045379,39.45822110430683],[25.3262420992599,38.99882387402414]]],"type":"Polygon"}},{"type":"Feature","properties":{},"geometry":{"coordinates":[[55.113993486524464,15.854611327352629],[55.59750741111927,15.077943663267021],[56.0810213357141,14.350482816256957],[56.45708772150863,13.411708130877287],[56.725706568506496,12.521702636236455],[57.048049184903675,11.418052767348243],[57.1554967237021,10.204362432830507],[57.262944262500554,9.516274599282355],[57.262944262500554,9.039087169877675]],"type":"LineString"}}]}
            borderWesternAsia.features[0].geometry.coordinates[0].reverse();
            console.log(borderWesternAsia);
            this.svg.append('path').datum(borderWesternAsia).attr("d", d3.geoPath().projection(projection)).style("stroke-width", "1px").style("stroke-dasharray",1.5).style("stroke", "black").attr("fill-opacity", "0");

            // Coordinates where you want to place the text
            const coo = [55.25, 4]; // Example: New York City

            // Convert geographic coordinates to SVG coordinates
            const [x_coo, y_coo] = projection(coo);

            // Add text at the specified coordinates
            // 3x the number of refugees in Europe live here
            this.textWesternAsia = this.svg.append("text")
                .attr("x", x_coo)
                .attr("y", y_coo)
                .attr("text-anchor", "left")
                .attr("font-size", "1em")
            this.textWesternAsia.append("tspan").attr("dx", "0em").attr("dy", "0em").text("3x the number of");
            this.textWesternAsia.append("tspan").attr("x", x_coo).attr("y", y_coo).attr("dx", "0em").attr("dy", "1em").text("refugees in Europe");
            this.textWesternAsia.append("tspan").attr("x", x_coo).attr("y", y_coo).attr("dx", "0em").attr("dy", "2em").text("live here");
            //this.textWesternAsia.append("tspan").attr("dy", "1em").text("hello");
                

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