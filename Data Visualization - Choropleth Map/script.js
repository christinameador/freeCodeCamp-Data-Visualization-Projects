// Plot constants
var width = 900,
height = 500,
xPadding = 60;

// Discretized colours. We'll use 10 colours.
var colourSet = d3.quantize(d3.interpolateYlOrRd, 10);

var svg = d3.select('#container').append('svg').attr('width', width + 100).attr('height', height + 100);

const EDUCATION_FILE =
'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const COUNTY_FILE =
'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

// Map and projection
var path = d3.geoPath();

// Examples used d3.queue, but this isn't available in the most recent version of d3.
// Using the Promise.all method instead.
Promise.all([
d3.json(COUNTY_FILE),
d3.json(EDUCATION_FILE)]).
then(function (data) {
  // data[0] has county data
  // data[1] is education information

  // the FIP and ID information are what links the data in these files

  // Colours
  var colour = d3.
  scaleQuantize().
  domain([
  0,
  100]).

  range(colourSet);

  svg.
  append('g').
  selectAll('path').
  data(topojson.feature(data[0], data[0].objects.counties).features).
  enter().
  append('path') // draw each county
  .attr('class', 'county').
  attr('data-fips', function (d) {
    return d.id;
  }).
  attr('data-education', function (d) {
    // This filters for locations where the IDs match.
    // Remember, this iterates over every path, so no need to loop.
    var result = data[1].filter(function (obj) {
      return obj.fips == d.id;
    });
    // Return the education if there's a match.
    if (result[0]) {
      return result[0].bachelorsOrHigher;
    } else {
      console.log('No data for: ', d.id);
      return 0;
    }
  }).
  attr('fill', function (d) {
    // Similar to data-education, but selects the fill color.
    var result = data[1].filter(function (obj) {
      return obj.fips == d.id;
    });
    if (result[0]) {
      return colour(result[0].bachelorsOrHigher);
    } else {
      return color(0);
    }
  }).
  attr('d', path).
  on('mouseover', mouseover).
  on('mousemove', (d, i) => mousemove(d)).
  on('mouseout', mouseout);

  // These functions create the tooltip. We first create the div.
  // Note that we set the position to 'absolute' in the CSS.
  var div = d3.select('#container').append('div').attr('id', 'tooltip').style('display', 'none');

  // Makes the div actually visible
  function mouseover() {
    div.style('display', 'inline');
  }

  function mousemove(d) {
    div.
    html(function () {
      var result = data[1].filter(function (obj) {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return (
          result[0]['area_name'] + ', ' + result[0]['state'] + ': ' + result[0].bachelorsOrHigher + '%');

      }
      //could not find a matching fips id in the data
      return 0;
    }).
    attr('data-education', function () {
      var result = data[1].filter(function (obj) {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      } else {
        console.log('No data for: ', d.id);
        return 0;
      }
    }).
    style('left', d3.event.pageX - 34 + 'px').
    style('top', d3.event.pageY - 75 + 'px');
  }

  // Hides the tooltip when done.
  function mouseout() {
    div.style('display', 'none');
  }

  // Thicker boundaries around states
  svg.
  append('path').
  datum(topojson.mesh(data[0], data[0].objects.states, (a, b) => a !== b)).
  attr('fill', 'none').
  attr('stroke', 'black').
  attr('stroke-linejoin', 'round').
  attr('d', path);

  // Legend.
  var legend = svg.
  append('g').
  attr('id', 'legend').
  attr('x', xPadding).
  attr('y', height).
  attr('height', 100).
  attr('width', 100);

  var legendScale = d3.scaleBand().domain(colourSet.map(c => colour.invertExtent(c)[1])).range([
  0,
  colourSet.length * 30]);


  var legendTicks = colourSet.map(c => colour.invertExtent(c)[1]).slice(0, -1);

  const legendAxis = d3.axisBottom(legendScale).tickValues(legendTicks).tickFormat(t => t.toFixed(0) + '%');

  svg.
  append('g').
  attr('transform', 'translate(' + (xPadding + 515) + ',' + 45 + ')').
  attr('id', 'legend-axis').
  call(legendAxis).
  call(g => g.select('.domain').remove());

  legend.selectAll('g').data(colourSet).enter().append('g').each(function (d, i) {
    var g = d3.select(this);
    g.
    append('rect').
    attr('x', xPadding + 500 + i * 30).
    attr('y', 30).
    attr('width', 30).
    attr('height', 15).
    style('fill', colourSet[i]);
  });
});