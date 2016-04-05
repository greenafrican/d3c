$( function() {

    //var d3c = { version: "0.0.1" };

    function Table(config) {
        this.bindto = ('bindto' in config) ? config.bindto : "#d3c-table";
        this.selectTable = d3.select(this.bindto).append('table');
        this.columns(('columns' in config) ? config.columns : []);
        this.data = ('data' in config) ? config.data : [];
    }

    Table.prototype.addRow = function(row) {
        var newRow = [];
        for (var k in row) {
            newRow.push({
                key: k,
                value: row[k]
            });
        }

        row = this.bindColumnConfig(newRow);
        this.data.push(row);

        this.redraw();

    };

    Table.prototype.columns = function(columns) {
        if (arguments.length === 0) return this._columns;
        columns || (columns = {});
        this._columns = columns;

        var data = this.data || [];
        if (data.length === 0) { return this._columns;}
        else {
            for (var i = 0; i < data.length; i++) {
                data[i] = this.bindColumnConfig(data[i]);
            }
            this.data = data;
        }
        this.redraw();
    };

    Table.prototype.bindColumnConfig = function(row) {
        var columns = this.columns();

        // Bind column config to each cell and check that column definition and row definition match

        row.forEach(function(r){
            var columnConfig = $.grep(columns, function(e){ return e.key === r.key;});
            r.config = columnConfig[0] || {};
            r.config.match = $.isEmptyObject(columnConfig[0]) ? false : true;
        });

        return row;
    };

    Table.prototype.redraw = function() {
        var data = this.data;

        if (data.length > 0) {

            var rows = this.selectTable.selectAll('tr').data(data);
            var cells = rows.selectAll('td').data(function(d) {
                return $.grep(d, function(e){ return e.config.match; });
            });
            cells.attr('class', 'update');

            // Cells enter selection
            cells.enter().append('td')
                .style('opacity', 0.0)
                .attr('class', 'enter')
                .transition()
                .delay(500)
                .duration(500)
                .style('opacity', 1.0);

            cells.text(function(d) {return d.value});

            // Cells exit selection
            cells.exit()
                .attr('class', 'exit')
                .transition()
                .delay(200)
                .duration(500)
                .style('opacity', 0.0)
                .remove();

            var cells_in_new_rows = rows.enter().append('tr')
                .selectAll('td')
                .data(function(d) {
                    return $.grep(d, function(e){ return e.config.match; });
                });

            cells_in_new_rows.enter().append('td')
                .style('opacity', 0.0)
                .attr('class', 'enter')
                .transition()
                .delay(500)
                .duration(500)
                .style('opacity', 1.0);

            cells_in_new_rows.text(function(d) { return d.value; });

            rows.exit()
                .attr('class', 'exit')
                .transition()
                .delay(200)
                .duration(500)
                .style('opacity', 0.0)
                .remove();

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

    setTimeout(function() {
        d3c.addRow({
            'name': 'Admin Users',
            'latest': 500.00,
            'previous': 565.00,
            'per_change': -0.0581,
            'chart_change': -0.0581
        });
    }, 3500);


});


