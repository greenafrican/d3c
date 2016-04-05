$(function () {

    //var d3c = { version: "0.0.1" };

    function Table(config) {
        this.bindto = ('bindto' in config) ? config.bindto : "#d3c-table";
        this.columns(('columns' in config) ? config.columns : []);
        this.data = ('data' in config) ? config.data : [];


        this.selectTable = d3.select(this.bindto).append('table');
        this.selectTable
            .append('thead')
            .append('tr');
        this.selectTable
            .append('tbody');
    }

    Table.prototype.addRow = function (row) {
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

    Table.prototype.columns = function (columns) {
        if (arguments.length === 0) return this._columns;
        columns || (columns = {});
        this._columns = columns;

        var data = this.data || [];
        if (data.length === 0) {
            return this._columns;
        }
        else {
            for (var i = 0; i < data.length; i++) {
                data[i] = this.bindColumnConfig(data[i]);
            }
            this.data = data;
        }

        this.redraw();
    };

    Table.prototype.bindColumnConfig = function (row) {
        var columns = this.columns();

        // Bind column config to each cell and check that column definition and row definition match

        row.forEach(function (r) {
            var columnConfig = $.grep(columns, function (e) {
                return e.key === r.key;
            });
            r.config = columnConfig[0] || {};
            r.config.match = $.isEmptyObject(columnConfig[0]) ? false : true;
        });

        return row;
    };

    Table.prototype.updateColumnStats = function () {
        var columns = this.columns(), data = this.data;

        columns.forEach(function (d) {
            if (d.type === 'chart') {
                var values = [];
                data.forEach(function (row) {
                    row.forEach(function (cell) {
                        if (cell.key === d.key) {
                            values.push(cell.value);
                        }
                    });
                });

                d.chart = d.chart || {};
                d.chart.width = 300;

                d.chart.x = d3.scale.linear()
                    .range([0, d.chart.width]);

                d.chart.maxX = d3.max(values, function (v) {
                    return v;
                });
                d.chart.minX = d3.min(values, function (v) {
                    return v;
                });
                d.chart.minX = (d.chart.minX === d.chart.maxX) ? (-1 * d.chart.maxX) : d.chart.minX;

                d.chart.colors = ["#f05336", "#faa224", "#ffd73e", "#efe3be", "#c6e3bb", "#a3d393", "#64bc52"];

                d.chart.color = d3.scale.quantize()
                    .domain([d.chart.minX, 0, d.chart.maxX])
                    .range(d.chart.colors);

                d.chart.x.domain([d.chart.minX, d.chart.maxX]).nice();

            }
        });
    };

    Table.prototype.redrawHeader = function () {
        var columns = this.columns();

        var headerRows = this.selectTable.select('thead').selectAll('tr');
        var headerCells = headerRows.selectAll('th').data(columns);

        headerCells.enter().append('th')
            .style('width', function (d) {
                return d.width;
            })
            .style('opacity', 0.0)
            .transition()
            .delay(500)
            .duration(500)
            .style('opacity', 1.0);

        headerCells.text(function (d) {
            return d.title
        });

        headerCells.exit()
            .transition()
            .delay(200)
            .duration(500)
            .style('opacity', 0.0)
            .remove();

        var header_cells_in_new_rows = headerRows.selectAll('th').data(columns);

        header_cells_in_new_rows.enter().append('th')
            .style('width', function (d) {
                return d.width;
            })
            .style('opacity', 0.0)
            .transition()
            .delay(500)
            .duration(500)
            .style('opacity', 1.0);

        header_cells_in_new_rows.text(function (d) {
            return d.title;
        });

        this.updateColumnStats();
    };

    Table.prototype.redrawRows = function () {
        var data = this.data;

        if (data.length > 0) {
            var rows = this.selectTable.select('tbody').selectAll('tr').data(data);
            var cells = rows.selectAll('td').data(function (d) {
                return $.grep(d, function (e) {
                    // only include rows that fit the column definitions as per bindColumnConfig()
                    return e.config.match;
                });
            });

            cells.enter().append('td')
                .style('width', function (d) {
                    return d.config.width;
                })
                .style('opacity', 0.0)
                .transition()
                .delay(500)
                .duration(500)
                .style('opacity', 1.0);

            cells.call(drawCell);

            cells.exit()
                .transition()
                .delay(200)
                .duration(500)
                .style('opacity', 0.0)
                .remove();

            var cells_in_new_rows = rows.enter().append('tr')
                .selectAll('td')
                .data(function (d) {
                    return $.grep(d, function (e) {
                        return e.config.match;
                    });
                });

            cells_in_new_rows.enter().append('td')
                .style('width', function (d) {
                    return d.config.width;
                })
                .style('opacity', 0.0)
                .transition()
                .delay(500)
                .duration(500)
                .style('opacity', 1.0);

            cells_in_new_rows.call(drawCell);

            rows.exit()
                .transition()
                .delay(200)
                .duration(500)
                .style('opacity', 0.0)
                .remove();

        } else {
            alert("Table has no data!"); // TODO: gracefully handle no data
        }

    };

    function drawCell(selection) {

        selection.each(function (dd, i) {
            var $$ = d3.select(this);
            if (dd.config.type === 'chart') {
                var x = dd.config.chart.x;
                var color = dd.config.chart.color;
                var width = dd.config.chart.width;

                $$.select('svg').remove(); // TODO: work on transition (super nice to have though)

                var svg = $$.append('svg')
                    .attr({
                        "width": width,
                        "height": 20
                    });
                svg.append("rect")
                    .attr("class", function (d) {
                        return "bar bar--" + (d.value < 0 ? "negative" : "positive");
                    })
                    .attr("x", function (d) {
                        return x(Math.min(0, d.value));
                    })
                    .attr("y", 0)
                    .attr("width", function (d) {
                        return Math.abs(x(d.value) - x(0));
                    })
                    .attr("height", 20)
                    .attr("fill", function (d) {
                        return color(d.value);
                    });
                svg.append('text')
                    .text(d3.format('.1%')(dd.value))
                    .attr('y', 15)
                    .attr('x', function (d) {
                        var posX = x(d.value);
                        if (posX < x(0)) {
                            if (posX < (x(0) / 2)) {
                                return posX + 5;
                            } else {
                                return posX - 40;
                            }
                        } else {
                            if (posX > (x(0) + ((width - x(0)) / 2))) {
                                return x(0) + Math.abs(x(d.value) - x(0)) - 40;
                            } else {
                                return x(0) + Math.abs(x(d.value) - x(0));
                            }
                        }
                    })
                    .attr('class', function (d, i) {
                        var posX = x(d.value);

                        if (posX < x(0)) {
                            if (posX < (x(0) / 2)) {
                                return 'd3c-chart-label-neg-high';
                            } else {
                                return 'd3c-chart-label-neg-low';
                            }
                        } else {
                            if (posX > (x(0) + ((width - x(0)) / 2))) {
                                return 'd3c-chart-label-pos-high';
                            } else {
                                return 'd3c-chart-label-pos-low';
                            }
                        }
                    });
            } else {
                var ff = ("number" == typeof dd.value) ? d3.format(',0f')(dd.value) : dd.value;
                $$.text(ff);
            }
        });

    }

    Table.prototype.redraw = function () {
        this.redrawHeader();
        this.redrawRows();
    };

    var d3c = new Table({
        bindto: "#d3c-table",
        columns: [
            {
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
        'name': 'Donkeys',
        'latest': 2500.00,
        'previous': 14865.00,
        'per_change': 0.0375,
        'chart_change': 0.0375
    });

    setTimeout(function () {

        //d3c.columns([
        //    {
        //        title: "Firstname",
        //        key: 'name',
        //        width: "25%",
        //        type: "text"
        //    },
        //    {
        //        title: "Change",
        //        key: 'chart_change',
        //        width: "40%",
        //        type: "chart"
        //    }
        //]);

        d3c.addRow({
            'name': 'Cows',
            'latest': 500.00,
            'previous': 565.00,
            'per_change': -0.0581,
            'chart_change': -0.0581
        });
        d3c.addRow({
            'name': 'Pigs',
            'latest': 101,
            'previous': 100,
            'per_change': 0.01,
            'chart_change': 0.01
        });
    }, 3500);


});


