Table.prototype.redrawHeader = function () {
    var columns = this.columns();
    var self = this;

    var headerRows = this.selectTable.select('thead').selectAll('tr');
    var headerCells = headerRows.selectAll('th').data(columns);

    headerCells.enter().append('th')
        .on('click', function (d) {
            self.sortColumn(d);
        })
        .style('width', function (d) {
            return d.width;
        })
        .style('opacity', 0.0)
        .transition()
        .delay(500)
        .duration(500)
        .style('opacity', 1.0);

    headerCells.html(function (d) {
        var glyph = "";
        if ('_sort' in self) {
            if ('key' in self._sort) {
                if (self._sort.key === d.key) {
                    if ('direction' in self._sort) {
                        glyph = (self._sort.direction === "asc") ?
                            "noticon noticon-downarrow" : "noticon noticon-uparrow"
                    }
                }
            }
        }
        return d.title + "<span class='" + glyph + "'></span>";
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

    header_cells_in_new_rows.html(function (d) {
        var glyph = "";
        if ('_sort' in self) {
            if ('key' in self._sort) {
                if (self._sort.key === d.key) {
                    if ('direction' in self._sort) {
                        glyph = (self._sort.direction === "asc") ?
                            "noticon noticon-downarrow" : "noticon noticon-uparrow"
                    }
                }
            }
        }
        return d.title + "<span class='" + glyph + "'></span>";
    });

    this.recalculate();
};

Table.prototype.redrawRows = function () {
    var data = this.data();

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

                    return d.color; // color(d.value);
                });
            svg.append('text')
                .text(function (d) {
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
                .style('background-color', function (d) {
                    return hcolor(d.value)
                })
                .style('text-align', 'center')
                .text(function (d) {
                    return formatText(d);
                })
                .style('color', function (d) {
                    return pickColor(this);
                });
        } else {
            $$.text(function (d) {
                return formatText(d);
            });
        }
    });

}

Table.prototype.redraw = function () {
    var columns = this.columns(), data = this.data();
    if (columns.length > 0 && data.length > 0) {
        this.recalculate();
        this.redrawHeader();
        this.redrawRows();
    }
};