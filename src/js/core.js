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

Table.prototype.updateRow = function (row) {
    var data = this._data;
    var i = findIndex(data, 'name', row.name);

    if (i == null) {
        this.addRow(row);
        return;
    }

    var updatedRow = [];
    for (var k in row) {
        if (row.hasOwnProperty(k)) {
            updatedRow.push({
                key: k,
                value: row[k]
            });
        }
    }

    data[i] = updatedRow;

    this.redraw()
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

                col.chart.maxX = (col.chart.maxX > Math.abs(col.chart.minX)) ?
                    col.chart.maxX : Math.abs(col.chart.minX);
                col.chart.minX = (col.chart.minX < (-1 * col.chart.maxX)) ?
                    col.chart.minX : (-1 * col.chart.maxX);

                col.chart.colors = ["#f05336", "#faa224", "#ffd73e", "#c6e3bb", "#a3d393", "#64bc52"];
                col.chart.color = d3.scale.quantize()
                    .domain([col.chart.minX, 0, col.chart.maxX])
                    .range(col.chart.colors);

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

    }

    this.sort();

};



