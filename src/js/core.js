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
        var tableWidth = this.selectTable.node().getBoundingClientRect().width;

        columns.forEach(function (d) {
            if (d.type === 'chart' || d.type === 'highlight') {
                var values = [];
                data.forEach(function (row) {
                    row.forEach(function (cell) {
                        if (cell.key === d.key) {
                            values.push(cell.value);
                        }
                    });
                });
                var widthRatio = parseFloat(d.width) / 100;

                d.chart = d.chart || {};
                d.chart.zeroBased = d.chart.zeroBased || false;
                d.chart.width = Math.floor(tableWidth * widthRatio);
                d.chart.x = d3.scale.linear().range([0, d.chart.width]);

                d.chart.maxX = d3.max(values, function (v) {
                    return v;
                });
                d.chart.minX = d3.min(values, function (v) {
                    return v;
                });
                d.chart.minX = (d.chart.minX === d.chart.maxX) ? 0 : d.chart.minX;
                d.chart.maxX = (Math.abs(d.chart.maxX) > Math.abs(d.chart.minX)) ?
                    d.chart.maxX : Math.abs(d.chart.minX);
                d.chart.minX = (Math.abs(d.chart.minX) > Math.abs(d.chart.maxX)) ?
                    d.chart.minX : (-1 * d.chart.maxX);

                d.chart.colors = ["#f05336", "#faa224", "#ffd73e", "#c6e3bb", "#a3d393", "#64bc52"];
                d.chart.color = d3.scale.quantize()
                    .domain([d.chart.minX, 0, d.chart.maxX])
                    .range(d.chart.colors);
                d.chart.minX = (d.chart.minX >= 0) ? 0 : d.chart.minX;
                d.chart.x.domain([(d.chart.zeroBased) ? 0 : d.chart.minX, d.chart.maxX]).nice();

            }
        });
    };

    Table.prototype.sortData = function (key, dir) {
        var data = this.data;
        data.sort(sortByKey(key, dir));

        this.redraw();
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
                        return (d.config.chart.zeroBased) ? x(0) : x(Math.min(0, d.value));
                    })
                    .attr("y", 0)
                    .attr('rx', 3)
                    .attr('ry', 3)
                    .attr("width", function (d) {
                        return (d.config.chart.zeroBased) ? Math.abs(x(d.value)) : Math.abs(x(d.value) - x(0));
                    })
                    .attr("height", 20)
                    .attr("fill", function (d) {
                        return color(d.value);
                    });
                svg.append('text')
                    .text(function(d) {
                        return formatText(d);
                    })
                    .attr('y', 15)
                    .attr('x', function (d) {
                        var posX = (d.config.chart.zeroBased) ? Math.abs(x(d.value)) : x(d.value);
                        if (d.config.chart.zeroBased) {
                            if (posX > (width / 2)) {
                                return x(0) + Math.abs(x(0)) + 8;
                            } else {
                                return x(0) + Math.abs(x(d.value) - x(0)) + 5;
                            }
                        }
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
            } else if (dd.config.type === 'highlight') {
                $$.select('div').remove(); // TODO: work on transition (super nice to have though)

                var hcolor = dd.config.chart.color;
                $$.append('div')
                    .style('background-color', function(d) {
                        return hcolor(d.value)
                    })
                    .style('text-align', 'center')
                    .text(function(d) {
                        return formatText(d);
                    });
            } else {
                $$.text(function(d) {
                    return formatText(d);
                });
            }
        });

    }

    Table.prototype.redraw = function () {
        this.redrawHeader();
        this.redrawRows();
    };

    function sortByKey(key, dir) {
        return function (a, b) {
            aIndex = a.map(function (obj, index) {
                if (obj.key == key) {
                    return index;
                }
            }).filter(isFinite);

            bIndex = b.map(function (obj, index) {
                if (obj.key == key) {
                    return index;
                }
            }).filter(isFinite);

            return (dir === 'asc') ? (a[aIndex].value > b[bIndex].value) : (a[aIndex].value < b[bIndex].value);
        }
    }

    function formatText(d) {
        switch (d.config.format) {
            case 'text':
                return d.value;
                break;
            case 'number':
                return d3.format(',0f')(d.value);
                break;
            case 'percent':
                return d3.format('.2%')(d.value);
                break;
            case 'currency':
                return d3.format('$.2f')(d.value);
                break;
            default:
                return d.value;
        }
    }


    var d3c = new Table({
        bindto: "#d3c-table",
        columns: [
            {
                title: "Name",
                key: 'name',
                width: "15%",
                type: "cell",
                format: "text"
            },
            {
                title: "Latest",
                key: 'latest',
                width: "40%",
                type: "chart",
                format: "number",
                chart: {
                    zeroBased: true,
                    color: "chart_change"
                }
            },
            {
                title: "Previous",
                key: 'previous',
                width: "15%",
                type: "cell",
                format: "number"
            },
            {
                title: "Change",
                key: 'chart_change',
                width: "15%",
                type: "highlight",
                format: "percent"
            }]
    });

    d3c.addRow({
        'name': 'Donkeys',
        'latest': 2500.00,
        'previous': 2465.00,
        'difference': 35,
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
            'difference': -65,
            'chart_change': -0.0581
        });
        d3c.addRow({
            'name': 'Pigs',
            'latest': 102,
            'previous': 100,
            'difference': 2,
            'chart_change': 0.005
        });
    }, 3500);

    setTimeout(function () {
        d3c.sortData('chart_change', 'desc');
    }, 7000);

    window.addEventListener('resize', function (event) {
        d3c.redraw();
    });


});


