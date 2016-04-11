Table.prototype.sort = function (sort) {
    var data = this.data();
    if (data.length < 2 && arguments.length === 0) return this._sort || {};
    if (arguments.length === 0) {
        sort = this._sort || {};
        if ('key' in sort && sort['key'].length) {
            if ('direction' in sort) {
                console.debug(sort);
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

        console.debug(a, aIndex);
        console.debug(b, bIndex);

        return (dir === 'asc') ? (a[aIndex].value > b[bIndex].value) : (a[aIndex].value < b[bIndex].value);
    }
}

