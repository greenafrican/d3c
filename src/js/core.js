$( function() {

    //var d3c = { version: "0.0.1" };

    function Table(config) {
        this.bindto = ('bindto' in config) ? config.bindto : "#d3c-table";
        this.columns = ('columns' in config) ? config.columns : [];
        this.data = ('data' in config) ? config.data : [];
    }

    Table.prototype.addRow = function(row) {



        row = this.bindColumnConfig(row);

        this.data.push(row);
        console.log(this.data);
        this.redraw();

    };

    Table.prototype.bindColumnConfig = function(row) {
        var columns = this.columns;

        // Bind column config to each cell and check that column definition and row definition match
        var count = 0;
        for (var k in row) {
            if (row.hasOwnProperty(k)) {
                ++count;
            }
        }
        if (count !== columns.length) {
            alert("Row data length doesn't match number of columns"); // TODO: handle mismatch
            return row;
        }

        for (var key in row) {
            var columnConfig = $.grep(columns, function(e){ // Maybe remove $ dependency if possible?
                return e.key === key;
            });
            row[key] = {
                value: row[key],
                config: columnConfig[0] || {}
            };
            row[key].config['match'] = $.isEmptyObject(columnConfig[0]) ? false : true;
        }

        return row;
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
                key: 'name',
                width: "15%",
                type: "text"
            },
            {
                title: "Latest",
                key: 'latest',
                width: "15%",
                type: "number"
            },
            {
                title: "Previous",
                key: 'previous',
                width: "15%",
                type: "number"
            },
            {
                title: "Change",
                key: 'per_change',
                width: "15%",
                type: "percent"
            },
            {
                title: "Change",
                key: 'chart_change',
                width: "40%",
                type: "chart"
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


