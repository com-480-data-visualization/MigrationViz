// Define the size of the svg map    

const width_undesa = 945
const height_undesa = 480
const svg_undesa = d3.select("#undesa-viz")
    .append("svg")
    .attr("width", width_undesa)
    .attr("height", height_undesa)
    .attr("viewBox", "0 0 " + width_undesa + " " + height_undesa)
    .attr("perserveAspectRatio", "xMinYMid") // or xMidYMin?
    .call(responsivefy)

// const projection = d3.geoEckert4()
const projection_undesa = d3.geoRobinson()
    .translate([width_undesa / 2, height_undesa / 2])
    .scale(150)

var radiusFactor = 50
// Define variable for countries json data[1]
var countries
// Adding refugees and asylum seekers together
var world_geojson
// const color = d3.scaleQuantize([0.0, 1.0], d3.schemeBlues[10])
// const color = d3.scaleQuantize(d3.schemeBlues[9]);
// color.domain([0, 1.0]);
const color_undesa = d3.scaleQuantize([0.0, 100.0], d3.schemeBlues[5]);
console.log("color", color_undesa(0.0), color_undesa(20), color_undesa(80), color_undesa(-99))
var myMap = new Map();
unhcr.forEach(function (dictionary) {
    myMap.set(dictionary.country, dictionary.refugees + dictionary.asylum_seekers);
});
// Continent colors
// https://unstats.un.org/unsd/methodology/m49/#geo-regions

var continentColors =
{
    "Africa": "#c7522a",
    "Europe": "#0069b3",
    "Asia": "#f7b801",
    "Americas": "#008585",
    "Oceania": "#e40613",
    "Antarctica": "#21bbef"
    // green: #00963f
}

// https://raw.githubusercontent.com/mledoze/countries/master/dist/countries-unescaped.json
// Load external data and boot
Promise.all([
    // Map geojson
    // TODO: Maybe the link below could be an interesting source?
    // TODO: Exchange GeoJSON by TopoJSON
    // https://unpkg.com/world-atlas@1/world/110m.json
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    // Meta data countries
    d3.json("https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json")
]).then(function (data) {

    // TODO: Remove console.log()
    countries = data[1]
    world_geojson = data[0]
    console.log("countries", countries)
    console.log(data[1])
    console.log(data[1][76]['cca3'], data[1].findIndex(({ cca3 }) => cca3 === 'FRA'))
    console.log(data[1][data[1].findIndex(({ cca3 }) => cca3 === 'FRA')]['flag'])
    console.log("myMap", myMap)

    console.log("data[0] GeoJSON", data[0]["features"].map(item => item.id).filter(item => !(typeof item === "number")).length)
    console.log("data[0] GeoJSON", data[0]["features"].map(item => item.id).filter(item => isNaN(item)).length)

    console.log("filtered result??", data[0]["features"].map(item => item.id).filter(item => isNaN(item)).filter(item => !["OSA", "SDS", "ABV"].includes(item)))
    console.log("tessst", undesa['data'][4]['data']['2020'][undesa['code'].findIndex((ccn3) => ccn3 === parseInt(data[1][data[1].findIndex(({ cca3 }) => cca3 === 'FRA')]['ccn3']))])
    console.log("tessst2", data[1][data[1].findIndex(({ cca3 }) => cca3 === 'FRA')]['ccn3'])
    console.log("tessst3", undesa['data'][4]['data']['2020'][undesa['code'].findIndex((ccn3) => ccn3 === '250')])

    // Add countries
    svg_undesa.append("g")
        .selectAll("path")
        .join("country")
        .data(data[0].features)
        .join("path")
        .attr("fill", "#dcdcdc")
        .attr("d", d3.geoPath()
            .projection(projection_undesa)
        )
        .attr("class", "map_country")
        .style("stroke", "white")
        // .style("stroke-width", "0.5px")
        .on("mouseover", mouseover_undesa)
        .on("mousemove", mousemove_undesa)
        .on("mouseleave", mouseleave_undesa)

    // Add circles indicating refugees
    svg_undesa.append("g")
        .selectAll("circle")
        .data(data[0]["features"].map(item => item.id).filter(item => isNaN(item)).filter(item => !["OSA", "SDS", "ABV"].includes(item)))
        .join("circle")
        .attr("cx", function (d) { try { return projection_undesa([data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][1], data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][0]])[0] } catch (e) { console.log(d); return 0 } })
        .attr("cy", function (d) { return projection_undesa([data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][1], data[1][data[1].findIndex(({ cca3 }) => cca3 === d)]['latlng'][0]])[1] })
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

    // Draws a contour around the map
    // Is appended after the group 'g'
    svg_undesa.append("path")
        .datum({ type: "Sphere" })
        .attr("d", d3.geoPath().projection(projection_undesa))
        .attr("id", "countour")
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", 2);
})

// Strong inspiration from document by Yan Holtz for tooltip    
// https://d3-graph-gallery.com/graph/bubblemap_tooltip.html
// https://d3-graph-gallery.com/graph/choropleth_hover_effect.html
const Tooltip_undesa = d3.select("#undesa-viz").append("div")
    .attr("class", "tooltip-undesa")
    .style("opacity", 0);

const mouseover_undesa = function (event, d) {
    Tooltip_undesa.style("opacity", 1)
    // Change the svg order in the DOM tree, so that this svg
    // is last drawn and therefore the black borders have the same
    // width on all sides as there are no overlaps

    // BUG: When moving the cursor very quickly some borders of countries stay black
    d3.select(this)
        .raise()
        .transition()
        .duration(200)
        .style("stroke", "black")
        .style("stroke-width", "1px")
}
var mousemove_undesa = function (event, d) {
    Tooltip_undesa
        // BUG: findIndex function throws error for some countries:
        // BUG: Uncaught TypeError: countries[countries.findIndex(...)] is undefined
        // BUG: Investigate the problem, maybe by imlpementing try catch?
        // ----------
        // BUG: Country flags displayed in Firefox, but neither in Chrome nor Edge
        // ----------
        // TODO: From the moment the mouse in the svg, the nearest Tooltip should be drawn,
        // TODO: maybe implement feature where Tooltip doesnt go over left and right border
        // TODO: and "moves to top" for the lower border, once not all the content can be seen anymore
        // ----------
        // TODO: Add country classes to circles and make stroke width bigger when hovering over country
        .html(countries[countries.findIndex(({ cca3 }) => cca3 === d.id)]['flag'] + "<b>&ensp;" + d.properties.name + "</b>" + "<br>" + d.id + "<br>" + "some value")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px")
        .style("opacity", 1);
}
var mouseleave_undesa = function (event, d) {
    Tooltip_undesa.style("opacity", 0)
    d3.select(this)
        .transition()
        .duration(200)
        .style("stroke", "white")
        .style("stroke-width", "0.5px")
}

var talk = function (value) {
    console.log("Called:", value)
    // console.log("GRL", undesa['data'][5]['data']['2020.1'][undesa['code'].findIndex((ccn3) => ccn3 === parseInt(countries[countries.findIndex(({ cca3 }) => cca3 === "GRL")]['ccn3']))])
    if (value == "Option1") {
        d3.selectAll(".map_circle").transition(d3.transition().duration(600))
            .attr("r", function (d = world_geojson["features"].map(item => item.id).filter(item => isNaN(item)).filter(item => !["OSA", "SDS", "ABV"].includes(item))) { return Math.sqrt(undesa['data'][4]['data']['2020'][undesa['code'].findIndex((ccn3) => ccn3 === parseInt(countries[countries.findIndex(({ cca3 }) => cca3 === d)]['ccn3']))] / Math.PI) / radiusFactor; });
        d3.selectAll(".map_country").transition(d3.transition().duration(100))
            .attr("fill", '#dcdcdc')
            
        }
    else if (value == "Option2") {
        d3.selectAll(".map_circle").transition(d3.transition().duration(600))
            .attr("r", 0)
        d3.selectAll(".map_country").transition(d3.transition().duration(300))
            // .attr("fill", color(0.0))
            // .attr("fake", function(d) {console.log(d.id)})
            .attr("fill", function(d) {
                    // world_geojson["features"].map(item => item.id).filter(item => isNaN(item)).filter(item => !["OSA", "SDS", "ABV"].includes(item))
                    // console.log(d.id, undesa['data'][5]['data']['2020.1'][undesa['code'].findIndex((ccn3) => ccn3 === parseInt(countries[countries.findIndex(({ cca3 }) => cca3 === d.id)]['ccn3']))])
                    // console.log(d.id)
                    try {
                        let variab = undesa['data'][5]['data']['2020.1'][undesa['code'].findIndex((ccn3) => ccn3 === parseInt(countries[countries.findIndex(({ cca3 }) => cca3 === d.id)]['ccn3']))];
                        if (variab == undefined) {
                            return color_undesa(0.0)
                        }
                        console.log(d.id, variab)
                        return color_undesa(parseFloat(variab))
                    }
                    catch(e) {
                        console.log("error", d.id)
                        return color_undesa(0.0)
                    }
                }
                )
    }

}

    console.log("Undesa", undesa)