Table.prototype.chart = function(config) {
    if (arguments.length === 0 || $.isEmptyObject(config)) return this._chart || {};
    config || (config = {});
    this.chart.config(config);
    this._chart = this.c3.generate(this.chart.config()); // TODO: update if exists
    return this._chart;
};

Table.prototype.chart.config = function(config) {
    if (arguments.length === 0 || $.isEmptyObject(config)) return this._chart_config || {};
    config || (config = {});
    this._chart_config = config;
    return this._chart_config; // TODO: update if config changes and exists
};
