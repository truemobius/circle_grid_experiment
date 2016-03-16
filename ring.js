$(document).ready(function(){

  var diameter = 960,
      radius = diameter / 2,
      innerRadius = radius - 60;

  var cluster = d3.layout.cluster()
      .size([360, innerRadius])
      .sort(null)
      .value(function(d) { return d.size; });

  var bundle = d3.layout.bundle();

  var line = d3.svg.line.radial()
      .interpolate("bundle")
      .tension(.50)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });

  var svg = d3.select(".well").append("svg")
      .attr("width", diameter)
      .attr("height", diameter)
      .append("g")
      .attr("transform", "translate(" + radius + "," + radius + ")");

  var link = svg.append("g").selectAll(".link");
  var node = svg.append("g").selectAll(".node");





  d3.json("team.json", function(error, data) {
    if (error) throw error;

    var map = workerMap(data);
    var nodes = cluster.nodes(map);
    var links = workerLinks(nodes);


    link = link
        .data(bundle(links)).enter()
        .append("path")
        .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
        .attr("class", "link")
        .attr("d", line);

    node = node
        .data(nodes.filter(function(n) {
            if(n.hasOwnProperty("children")){
              return n;
            }
        })).enter()
        .append("text")
        .attr("class", "node")
        //.attr("dy", ".31em")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 24) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .text(function(d) { if(d.name !== "root") return d.name; })
        .on("mouseover", mouseovered)
        .on("mouseout", mouseouted);
  });

  function mouseovered(d) {

    node.each(function(n) { n.target = n.source = false; });


    link.classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
        .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
        .style("stroke-width", function(l){
            var s = 0.5;

            if(l.source === d){
               for(var i = 0; i < d.children.length; i++){
                     s = d.children[i].weight;
                }
            }

            if(l.target === d){
              for(var j = 0; j < l.target.children.length; j++){
                    s = l.source.children[j].weight; // so weird that this works this way
              }
            }
            return s+"px";
          })
        .filter(function(l) { return l.target === d || l.source === d; })
        .each(function() { this.parentNode.appendChild(this); });

    node.classed("node--target", function(n) { return n.target; })
        .classed("node--source", function(n) { return n.source; });
  }

  function mouseouted(d) {
    link.classed("link--target", false)
        .classed("link--source", false)
        .style({"stroke-width":"1px"}); //reset

    node.classed("node--target", false)
        .classed("node--source", false); //reset
  }

  //d3.select(self.frameElement).style("height", diameter + "px");


  //build list of employees + links as children i guess
  function workerMap(team_members){
      var map = {};
      map.name = "root";
      map.children = [];


      for (var tmember in team_members) {

          var item = {};
          item.name = tmember;
          item.children = [];


          for (var tm in team_members[tmember]) {
              var i = {};
              i.name = tm;
              i.weight = team_members[tmember][tm];

              if (i.weight > 0) {
                  item.children.push(i);
              }

          }
          map.children.push(item);

      }
      return map;

  }


  // return a list of links for given people
  function workerLinks(nodes) {
      var map = {};
      var links = [];

      nodes.forEach(function(k) {
          if(k.hasOwnProperty("children")){
            map[k.name] = k;
          }
      });

      nodes.forEach(function (k) {
          if(k.children && k.name !== "root"){
              k.children.forEach(function (i) {
                    links.push({source : map[k.name], target : map[i.name]});
              });
          }
      });
      return links;
    }

  });
