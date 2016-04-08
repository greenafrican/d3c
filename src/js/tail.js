    if (typeof define === 'function' && define.amd) {
        define("d3c", ["d3"], function () { return d3c; });
    } else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
        module.exports = d3c;
    } else {
        window.d3c = d3c;
    }

})(window);