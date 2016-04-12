function Chart(config) {
    this.config(config || {});
    this.c3 = window.c3;
}

Chart.prototype.config = function (config) {
    if (arguments.length === 0) return this._config || [];
    config || (config = {});
    this._config = config;
};

Chart.prototype.generate = function () {
    return this.c3.generate(this.config());
};
