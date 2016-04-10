(function (window) {
    'use strict';

/*global define, module, exports, require */
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

function pickColor(color) {
    var c = d3.values(d3.rgb(color)).slice(0, 3);
    for (var i = 0; i < c.length; ++i) {
        c[i] = c[i] / 255;
        if (c[i] <= 0.03928) {
            c[i] = c[i] / 12.92
        } else {
            c[i] = Math.pow(( c[i] + 0.055 ) / 1.055, 2.4);
        }
    }
    var l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    //return ( l > 0.179 ) ? 'black' :'white';
    return ( l > 0.5 ) ? 'black' : 'white';
}
var d3c = {version: "0.0.1"};

function Table(config) {
    config = config || {};
    this.bindto = ('bindto' in config) ? config.bindto : "#d3c-table";

    this.selectTable = d3.select(this.bindto).append('table');
    this.selectTable
        .append('thead')
        .append('tr');
    this.selectTable
        .append('tbody');

    this.data(('data' in config) ? config.data : []);
    this.columns(('columns' in config) ? config.columns : []);
    this.sort(('sort' in config) ?  config.sort : {});
}

Table.prototype.data = function (data) {
    if (arguments.length === 0) return this._data || [];
    this._data = this._data || [];
    var self = this;

    data.forEach(function(row) {
        self.addRow(row);
    });

    this.redraw();
};

Table.prototype.addRow = function (row) {
    var newRow = [];
    for (var k in row) {
        if (row.hasOwnProperty(k)) {
            newRow.push({
                key: k,
                value: row[k]
            });
        }
    }

    this._data.push(newRow);

    this.redraw();
};

Table.prototype.columns = function (columns) {
    if (arguments.length === 0) return this._columns || [];
    columns || (columns = {});
    this._columns = columns;

    this.redraw();
};

Table.prototype.recalculate = function() {
    var columns = this.columns(), data = this.data();
    var tableWidth = ('undefined' === typeof this.selectTable.node()) ? 100 :
        this.selectTable.node().getBoundingClientRect().width;

    if (columns.length > 0 && data.length > 0) { // TODO: handle data without column definitions
        columns.forEach(function(col,i) {
            if (col.type === 'chart' || col.type === 'highlight') {
                col.chart = col.chart || {};
                col.chart.values = [];
                data.forEach(function (row) {
                    row.forEach(function (cell) {
                        if (cell.key === col.key) {
                            col.chart.values.push(+cell.value);
                        }
                    });
                });
                var widthRatio = parseFloat(col.width) / 100;

                col.chart = col.chart || {};
                col.chart.zeroBased = col.chart.zeroBased || false;
                col.chart.width = Math.floor(tableWidth * widthRatio);
                col.chart.x = d3.scale.linear().range([0, col.chart.width]);

                col.chart.maxX = d3.max(col.chart.values, function (v) { return +v; });
                col.chart.minX = d3.min(col.chart.values, function (v) { return +v; });
                col.chart.minX = (col.chart.minX === col.chart.maxX) ? 0 : col.chart.minX;
                col.chart.maxX = (Math.abs(col.chart.maxX) > Math.abs(col.chart.minX)) ?
                    col.chart.maxX : Math.abs(col.chart.minX);
                col.chart.minX = (Math.abs(col.chart.minX) > Math.abs(col.chart.maxX)) ?
                    col.chart.minX : (-1 * col.chart.maxX);

                col.chart.colors = ["#f05336", "#faa224", "#ffd73e", "#c6e3bb", "#a3d393", "#64bc52"];
                col.chart.color = d3.scale.quantize()
                    .domain([col.chart.minX, 0, col.chart.maxX])
                    .range(col.chart.colors);
                col.chart.minX = (col.chart.minX >= 0) ? 0 : col.chart.minX;
                col.chart.x.domain([(col.chart.zeroBased) ? 0 : col.chart.minX, col.chart.maxX]).nice();
            }
        });

        data.forEach(function(row, i) {
            row.forEach(function(cell, ii) {
                var columnConfig = $.grep(columns, function (e) {
                    return e.key === cell.key;
                });
                cell.config = columnConfig[0] || {};
                cell.config.match = $.isEmptyObject(columnConfig[0]) ? false : true;
                if ('chart' in cell.config) {
                    cell.x = cell.config.chart.x(cell.value) || 0;
                    cell.color = cell.config.chart.color(cell.value) || '#000';
                    if ('colorFrom' in cell.config.chart) {
                        var cellFrom = $.grep(row, function (e) {
                            return e.key === cell.config.chart.colorFrom;
                        });

                        cell.color = cellFrom[0].color || cell.color;
                    }
                }
            });

        });

        if (arguments.length === 0) return this._columns || [];
        columns || (columns = {});
        this._columns = columns;
    }

    this.sort();
};




Table.prototype.sort = function (sort) {
    var data = this.data();
    if (data.length === 0 && arguments.length === 0) return this._sort || {};
    if (arguments.length === 0) {
        sort = this._sort || {};
        if ('key' in sort) {
            if ('direction' in sort) {
                data.sort(sortByKey(sort.key, sort.direction));
                this._data = data;
            }
        }
    } else {
        this._sort = {
            key: ('key' in sort) ? sort.key : "",
            direction: ('direction' in sort) ? sort.direction : "asc"
        };
        this.sort();
    }
    this.redraw();
    return this._sort;
};

Table.prototype.sortColumn = function (selection) {
    var self = this;
    var key = selection.key || "";
    var newDirection = "asc";
    if ('_sort' in self) {
        if ('key' in self._sort) {
            if (self._sort.key === key) {
                if ('direction' in self._sort) {
                    newDirection = (self._sort.direction === "asc") ? "desc" : "asc"; // toggle sort order
                }
            }
        }
    }
    this.sort({key: key, direction: newDirection});
    this.redraw();
};

function sortByKey(key, dir) {
    return function (a, b) {
        var aIndex = a.map(function (obj, index) {
            if (obj.key == key) {
                return index;
            }
        }).filter(isFinite);

        var bIndex = b.map(function (obj, index) {
            if (obj.key == key) {
                return index;
            }
        }).filter(isFinite);

        return (dir === 'asc') ? (a[aIndex].value > b[bIndex].value) : (a[aIndex].value < b[bIndex].value);
    }
}


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
                            "noticon noticon-uparrow" : "noticon noticon-downarrow"
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
                            "noticon noticon-uparrow" : "noticon noticon-downarrow"
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
                })
                .style('color', function (d) {
                    return pickColor(d.color);
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
                    return pickColor(d3.select(this).style('background-color'));
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
d3c.table = function (config) {
    return new Table(config);
};


if (typeof define === 'function' && define.amd) {
    define("d3c", ["d3"], function () {
        return d3c;
    });
} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
    module.exports = d3c;
} else {
    window.d3c = d3c;
}

})(window);
//# sourceMappingURL=d3c.js.map
