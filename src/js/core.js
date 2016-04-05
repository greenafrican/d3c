$( function() {

    //var d3c = { version: "0.0.1" };

    function Table(config) {
        this.bindto = ('bindto' in config) ? config.bindto : "#d3c-table";
        this.columns = ('columns' in config) ? config.columns : [];
        this.data = ('data' in config) ? config.data : [];
    }

    Table.prototype.add = function(data) {
        this.data.push(data);
    };

    Table.prototype.redraw = function() {
        this.selectTable = d3.select(this.bindto)
            .append('table')
            .append('thead')
            .append('tr')
            .selectAll('th')
            .data(this.columns).enter()
            .append('th')
            .style('width', function(d, i) {return d.width;})
            .attr('class', function(d, i) {return 'd3c-th';})
            .text(function(d) {return d.title;});
    };

    

    var d3c = new Table({
        bindto: "#d3c-table",
        columns: [{
                title: "Name",
                width: "15%"
            },
            {
                title: "Latest",
                width: "15%"
            },
            {
                title: "Previous",
                width: "15%"
            },
            {
                title: "Change",
                width: "15%"
            },
            {
                title: "Change",
                width: "40%"
            }]
    });

    d3c.redraw();

});


