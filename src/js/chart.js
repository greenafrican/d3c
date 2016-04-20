Table.prototype.chart = function (config) {
    var self = this;
    if (arguments.length === 0 || $.isEmptyObject(config)) return this._chart || {};
    config || (config = {});

    this.chartConfig(config);
    this._chart = this.c3.generate(this.chartConfig()); // TODO: update if exists
    return this._chart;
};


Table.prototype.chartConfig = function (config) {
    if (arguments.length === 0 || $.isEmptyObject(config)) return this._chart_config || {};
    config || (config = {});
    this._chart_config = config;
    return this._chart_config; // TODO: update if config changes and exists
};


Table.prototype.chartUpdate = function () {
    var self = this;
    var chart = this.chart();
    var data = this.data();
    var xs =  [], columns = [];

    data.forEach(function(row) {
        var series = [];
        [xs, series] = self.getChartSeries(row);
        columns.push(series);
        if (chart.internal.hiddenTargetIds.indexOf(series[0]) === -1) {
            chart.internal.hiddenTargetIds = chart.internal.hiddenTargetIds.concat(series[0]);
        }
        if (chart.internal.hiddenLegendIds.indexOf(series[0]) === -1) {
            chart.internal.hiddenLegendIds = chart.internal.hiddenLegendIds.concat(series[0]);
        }

    });
    columns.unshift(xs); // TODO: may need to handle series with different date/x ranges
    self._chart_config.columns = columns;
    chart.load({columns: self._chart_config.columns});
};


Table.prototype.getChartSeries = function(row) {
    var nameCell = row.filter(function(obj) {return obj.key === 'name';});
    var name = (nameCell.length === 1) ? nameCell[0].value : 'y';

    var seriesCell = row.filter(function(obj) {return obj.key === 'series';});
    var series = (seriesCell.length === 1) ? seriesCell[0].value : [];

    var values = series.map(function(d) {return d[name];});
    values.unshift(name);

    var x = this.chartConfig().data.x || 'x';
    var xs = series.map(function(d) {return d[x];});
    xs.unshift(x);

    return [xs, values];
};


Table.prototype.rowSelect = function (row, selection) {

    var self = this;
    var chart = this.chart();
    var name = self.getRowName(row);

    row.forEach(function (cell) {
        if (cell.key === 'series') {
            self._chart_config = self._chart_config || {};
            self.selected = self.selected || [];
            toggleArrayItem(self.selected, name);
            chart.hide(null, {withLegend: true});
            chart.show(self.selected, {withLegend: true});
        }
    });

    d3.select(selection).classed('d3c-table-row-active', function () {
        return self.selected.indexOf(name) !== -1;
    });
};

