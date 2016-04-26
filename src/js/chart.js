    Table.prototype.chart = function( config ) {
        if ( arguments.length === 0 || $.isEmptyObject( config ) ) return this._chart || {};
        config || ( config = {} );
        this.chartConfig( config );
        this._chart = this.c3.generate( this.chartConfig() ); // TODO: update if exists
        if ( typeof this.selectTable !== 'undefined' ) {
            this._tableWidth = ( typeof this.selectTable.node() === 'undefined' ) ? 100 : this.selectTable.node().getBoundingClientRect().width;
            this._tableHeight = ( typeof this.selectTable.node() === 'undefined' ) ? 100 : this.selectTable.node().getBoundingClientRect().height;
            console.log( this._tableWidth, this._tableHeight );
            this._chart.resize( {
                width: this._tableWidth,
                height: (this._tableHeight > 120) ? this._tableHeight : 120
            } );
        }
        return this._chart;
    };
    Table.prototype.chartConfig = function( config ) {
        if ( arguments.length === 0 || $.isEmptyObject( config ) ) return this._chart_config || {};
        config || ( config = {} );
        this._chart_config = config;
        return this._chart_config; // TODO: update if config changes and exists
    };
    Table.prototype.chartUpdate = function() {
        var self = this;
        var chart = this.chart();
        var data = this.data();
        var xs = [], columns = [], series = [];
        var name;
        data.forEach( function( row ) {
            var chartSeries = self.getChartSeries( row );
            xs = chartSeries.xs;
            series = chartSeries.values;
            columns.push( series );
            name = self.getRowName( row );
            if ( self.selected.indexOf( name ) === -1 ) {
                if ( chart.internal.hiddenTargetIds.indexOf( name ) === -1 ) {
                    chart.internal.hiddenTargetIds = chart.internal.hiddenTargetIds.concat( name );
                }
                if ( chart.internal.hiddenLegendIds.indexOf( name ) === -1 ) {
                    chart.internal.hiddenLegendIds = chart.internal.hiddenLegendIds.concat( name );
                }
            }
        } );
        columns.unshift( xs ); // TODO: may need to handle series with different date/x ranges
        self._chart_config.columns = columns;
        chart.load( { columns: self._chart_config.columns } );
    };
    Table.prototype.getChartSeries = function( row ) {
        var x, xs;
        var nameCell = row.filter( function( obj ) {
            return obj.key === 'name';
        } );
        var name = ( nameCell.length === 1 ) ? nameCell[0].value : 'y';

        var seriesCell = row.filter( function( obj ) {
            return obj.key === 'series';
        } );
        var series = ( seriesCell.length === 1 ) ? seriesCell[0].value : [];

        var values = series.map( function( d ) {
            return d[name];
        } );
        values.unshift( name );
        x = this.chartConfig().data.x || 'x';
        xs = series.map( function( d ) {
            return d[x];
        } );
        xs.unshift( x );
        return { xs: xs, values: values };
    };
    Table.prototype.rowSelect = function( row, selection ) {
        var self = this;
        var chart = this.chart( self._chart_config );
        var name = self.getRowName( row );
        row.forEach( function( cell ) {
            if ( cell.key === 'series' ) {
                self._chart_config = self._chart_config || {};
                self.selected = self.selected || [];
                toggleArrayItem( self.selected, name );
                chart.hide( null, { withLegend: true } );
                chart.show( self.selected, { withLegend: true } );
            }
        } );
        d3.select( selection ).classed( 'd3c-table-row-active', function() {
            return self.selected.indexOf( name ) !== -1;
        } );
        self.chartUpdate();
    };

