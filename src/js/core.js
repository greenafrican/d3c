$( function() {

    //var d3c = { version: "0.0.1" };

    function Table(config) {
        this.bindto = ('bindto' in config) ? config.bindto : "#d3c-table";
        this.columns = ('columns' in config) ? config.columns : [];
        this.data = ('data' in config) ? config.data : [];
    }

    Table.prototype.addRow = function(row) {

        var count = 0;
        for (var k in row) {
            if (row.hasOwnProperty(k)) {
                ++count;
            }
        }
        if (count !== this.columns.length) {
            alert("Row data structure doesn't match column definition"); // TODO: handle mismatch
            return;
        }

        this.data.push(row);
        this.redraw();

    };

    Table.prototype.redraw = function() {
        var data = this.data;

        if (data.length > 0) {

            this.selectTable = d3.select(this.bindto)
                .append('table');

            this.selectTable
                .append('thead')
                .append('tr')
                .selectAll('th')
                .data(this.columns).enter()
                .append('th')
                .style('width', function (d, i) {
                    return d.width;
                })
                .attr('class', function (d) {
                    return 'd3c-th';
                })
                .text(function (d) {
                    return d.title;
                });

            this.width = d3.select(this.bindto + " table").node().getBoundingClientRect().width;

            this.selectTable.append('tbody')
                .selectAll('tr')
                .data(data).enter()
                .append('tr')
                .selectAll('td')
                .data(function (d) {
                    return d3.values(d);
                })
                .enter().append('td')
                .attr('class', function (d, i) {
                    return 'd3c-td';
                })
                .text(function (d, i) {
                    return d;
                });
        } else {
            alert("Table has no data!"); // TODO: gracefully handle no data
        }
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

    d3c.addRow({
        'name': 'Active Users',
        'latest': 2500.00,
        'previous': 14865.00,
        'per_change': 0.0375,
        'chart_change': 0.0375
    });

});


