Table.prototype.chart = function(config) {
    if (arguments.length === 0 || $.isEmptyObject(config)) return this._chart || {};
    config || (config = {});
    this.chartConfig(config);
    this._chart = this.c3.generate(this.chartConfig()); // TODO: update if exists
    return this._chart;
};

Table.prototype.chartConfig = function(config) {
    if (arguments.length === 0 || $.isEmptyObject(config)) return this._chart_config || {};
    config || (config = {});
    this._chart_config = config;
    return this._chart_config; // TODO: update if config changes and exists
};

Table.prototype.rowSelect = function(row) {
    var self = this;
    row.forEach(function(cell, i) {
        if (cell.key === 'series') {
            console.log(row);
            self.chart().load(
                {
                    json: cell.value
                }
            );
        }
    });
};

