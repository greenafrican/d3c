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
        chart.internal.addHiddenTargetIds(series[0]);
        chart.internal.addHiddenLegendIds(series[0]);

    });
    columns.unshift(xs); // TODO: may need to handle series with different date/x ranges
    self._chart_config.columns = columns;
    chart.load({columns: self._chart_config.columns});
};


Table.prototype.getChartSeries = function(row) {
    // Get row id (name)
    var nameCell = row.filter(function(obj) {
        return obj.key === 'name';
    });
    var name = (nameCell.length === 1) ? nameCell[0].value : 'y';

    // Get row series
    var seriesCell = row.filter(function(obj) {
        return obj.key === 'series';
    });
    var series = (seriesCell.length === 1) ? seriesCell[0].value : [];

    // Get values from series
    var values = series.map(function(d) {
        return d[name];
    });
    values.unshift(name);

    // Get xs from series
    var x = this.chartConfig().data.x || 'x';
    var xs = series.map(function(d) {
        return d[x];
    });
    xs.unshift(x);

    return [xs, values];
};


Table.prototype.rowSelect = function (row) {
    var chart = this.chart();
    var nameCell = row.filter(function(obj) {
        return obj.key === 'name';
    });
    var name = (nameCell.length === 1) ? nameCell[0].value : 'y';

    row.forEach(function (cell) {
        if (cell.key === 'series') {
            self._chart_config = self._chart_config || {};
            self._chart_config.show = self._chart_config.show || [];
            toggleArrayItem(self._chart_config.show, name);
            chart.hide(null, {withLegend: true});
            chart.show(self._chart_config.show, {withLegend: true});
        }
    });
};

