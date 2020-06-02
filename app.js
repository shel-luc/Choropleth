const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Add tooltip
const tooltip = d3.select("#main")
  .append("div")
  .attr("id", "tooltip")
  .attr("class", "tooltip")
  .style("opacity", 0)

const unemployment = d3.map();

const path = d3.geoPath();

const x = d3.scaleLinear()
  .domain([2.6, 75.1])
  .rangeRound([600, 860]);

const color = d3.scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemeBlues[9]);

const g = svg.append("g")
  .attr("id", "legend")
  .attr("class", "key")
  .attr("transform", "translate(0,40)");

g.selectAll("rect")
  .data(color.range().map(function (d) {
    d = color.invertExtent(d);
    if (d[0] == null) d[0] = x.domain()[0];
    if (d[1] == null) d[1] = x.domain()[1];
    return d;
  }))
  .enter().append("rect")
  .attr("height", 8)
  .attr("x", function (d) { return x(d[0]); })
  .attr("width", function (d) { return x(d[1]) - x(d[0]); })
  .attr("fill", function (d) { return color(d[0]); });

g.append("text")
  .attr("class", "caption")
  .attr("x", x.range()[0])
  .attr("y", -6)
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr("font-weight", "bold");

g.call(d3.axisBottom(x)
  .tickSize(13)
  .tickFormat(function (x, i) { return Math.round(x) + "%"; })
  .tickValues(color.domain()))
  .select(".domain")
  .remove();

const COUNTY_File = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";
const EDUCATION_File = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";

d3.queue()
  .defer(d3.json, COUNTY_File)
  .defer(d3.json, EDUCATION_File)
  .await(ready);

function ready(error, us, education) {
  if (error) throw error;

  svg.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => {
      let val = education.filter((obj) => {
        return obj.fips == d.id;
      });
      if (val[0]) {
        return val[0].bachelorsOrHigher;
      }
      return 0
    })
    .attr("fill", (d) => {
      let val = education.filter((obj) => {
        return obj.fips == d.id;
      });
      if (val[0]) {
        return color(val[0].bachelorsOrHigher);
      }
      return color(0);
    })
    .attr("d", path)
    .on("mouseover", (d) => {
      tooltip.style("opacity", 1)
      tooltip.attr("data-education", () => {
        let val = education.filter((obj) => {
          return obj.fips == d.id;
        });
        if (val[0]) {
          return val[0].bachelorsOrHigher;
        }
        return 0
      })
      tooltip.html(() => {
        let val = education.filter((obj) => {
          return obj.fips == d.id;
        });
        if (val[0]) {
          return val[0]["area_name"] + " (" + val[0]["state"] + ") - " + val[0].bachelorsOrHigher + "%";
        }
        return 0
      })
        .style("left", (d3.event.pageX + 15) + "px")
        .style("top", (d3.event.pageY - 30) + "px")
    })
    .on("mouseout", (d) => {
      tooltip.style("opacity", 0)
    })

  svg.append("path")
    .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
    .attr("class", "states")
    .attr("d", path);
};