	function Table( config ) {
		config = config || {};
		this.bindto = ( 'bindto' in config ) ? config.bindto : '#d3c-table';
		this.selected = ( 'selected' in config ) ? config.selected : [];
		this.description = ( 'description' in config ) ? config.description : '#d3c-table-description';

		if ( 'responsive' in config ) {
			if ( 'enabled' in config.responsive && 'threshold' in config.responsive ) {
				this.responsive = config.responsive.enabled || false;
				this._tableWidthMax = config.responsive.threshold || 0;
			}
		} else {
			this.responsive = false;
			this._tableWidthMax = 0;
		}

		this.c3 = window.c3;
		this.chart( ( 'chart' in config ) ? config.chart : { data: { columns: [] } } );

		this.selectTable = d3.select( this.bindto ).append( 'table' );
		this.selectTable
			.append( 'thead' )
			.append( 'tr' );
		this.selectTable
			.append( 'tbody' );

		this.data( ( 'data' in config ) ? config.data : [] );
		this.columns( ( 'columns' in config ) ? config.columns : [] );
		this.sort( ( 'sort' in config ) ? config.sort : {} );
	}

	Table.prototype.data = function( data ) {
		var self = this;
		if ( arguments.length === 0 ) return this._data || [];
		this._data = this._data || [];

		data.forEach( function( row ) {
			self.addRow( row );
		} );

		this.redraw();
	};

	Table.prototype.unload = function() {
		this._data = [];
		this.selected = [];
		this.chart().hide();
		this.chartUpdate();
		this.chart().unload();
		this.redraw();
	};

	Table.prototype.addRow = function( row ) {
		var newRow = [], k;
		for ( k in row ) {
			if ( row.hasOwnProperty( k ) ) {
				newRow.push( {
					key: k,
					value: row[ k ]
				} );
			}
		}

		this._data.push( newRow );

		this.chartUpdate();

		this.redraw();
	};

	Table.prototype.updateRow = function( row ) {
		var data = this._data;
		var i, j, k;
		var updatedRow = [];
		var findIndexForUpdate = function( array, key, value ) {
			for ( i = 0; i < array.length; i++ ) {
				for ( j = 0; j < array[ i ].length; j++ ) {
					if ( 'key' in array[ i ][ j ] ) {
						if ( array[ i ][ j ].key === key && 'value' in array[ i ][ j ] ) {
							if ( array[ i ][ j ].value === value ) {
								return i;
							}
						}
					}
				}
			}
			return null;
		};
		i = findIndexForUpdate( data, 'name', row.name );
		if ( i == null ) {
			this.addRow( row );
			return;
		}
		for ( k in row ) {
			if ( row.hasOwnProperty( k ) ) {
				updatedRow.push( {
					key: k,
					value: row[ k ]
				} );
			}
		}
		data[ i ] = updatedRow;
		this.chartUpdate();
		this.redraw();
	};
	Table.prototype.columns = function( columns ) {
		if ( arguments.length === 0 ) return this._columns || [];
		columns || ( columns = {} );
		this._columns = columns;

		this.redraw();
	};
	Table.prototype.recalculate = function() {
		var self = this;
		var columns = this.columns(), data = this.data();
		var widthRatio, cellFrom, columnConfig, checkRow, seriesFrom, nameFrom;
		var name, v;
		self._tableWidth = ( typeof self.selectTable.node() === 'undefined' ) ? 100 : self.selectTable.node().getBoundingClientRect().width;
		self._tableHeight = ( typeof self.selectTable.node() === 'undefined' ) ? 100 : self.selectTable.node().getBoundingClientRect().height;
		if ( columns.length > 0 && data.length > 0 ) { // TODO: handle data without column definitions
			columns.forEach( function( col, i ) {
				if ( col.type === 'chart-bar' || col.type === 'highlight' || col.type === 'chart-spark' ) {
					col.chart = col.chart || {};
					col.chart.values = [];
					widthRatio = parseFloat( col.width ) / 100;
					col.chart = col.chart || {};
					col.chart.zeroBased = col.chart.zeroBased || false;
					col.chart.width = Math.floor( self._tableWidth * widthRatio );
					if ( col.type === 'chart-bar' || col.type === 'highlight' ) {
						data.forEach( function( row ) {
							row.forEach( function( cell ) {
								if ( cell.key === col.key ) {
									col.chart.values.push( +cell.value );
								}
							} );
						} );
						col.chart.x = d3.scale.linear().range( [ 0, col.chart.width ] );
						col.chart.maxX = d3.max( col.chart.values, function( vv ) {
							return +vv;
						} );
						col.chart.minX = d3.min( col.chart.values, function( vv ) {
							return +vv;
						} );
						col.chart.maxX = ( col.chart.maxX > Math.abs( col.chart.minX ) ) ? col.chart.maxX : Math.abs( col.chart.minX );
						col.chart.minX = ( col.chart.minX < ( -1 * col.chart.maxX ) ) ? col.chart.minX : ( -1 * col.chart.maxX );
						col.chart.colors = [ '#f05336', '#faa224', '#ffd73e', '#c6e3bb', '#a3d393', '#64bc52' ];
						col.chart.color = d3.scale.quantize()
							.domain( [ col.chart.minX, 0, col.chart.maxX ] )
							.range( col.chart.colors );
						col.chart.x.domain( [ ( col.chart.zeroBased ) ? 0 : col.chart.minX, col.chart.maxX ] ).nice();
					} else if ( col.type === 'chart-spark' ) {
						col.chart.values = [];
					}
				}
				data.forEach( function( row ) { // TODO: more elegant solution needed for aligning column and row definitions
					checkRow = $.grep( row, function( e ) {
						return e.key === col.key;
					} );
					if ( $.isEmptyObject( checkRow[ 0 ] ) || checkRow.length === 0 ) {
						row.splice( i, 0, { key: col.key, value: '-' } );
					}
				} );
				if ( self.responsive ) {
					if ( self._tableWidthMax > self._tableWidth ) {
						if ( col.bump === true ) {
							col.hide = true;
						} else {
							col.hide = false;
						}
					} else {
						col.hide = false;
					}
				}
			} );

			data.forEach( function( row ) {
				row.forEach( function( cell ) {
					columnConfig = $.grep( columns, function( e ) {
						return e.key === cell.key;
					} );
					cell.config = $.extend( true, {}, columnConfig[ 0 ] ) || {};
					cell.hide = ( 'hide' in cell.config ) ? cell.config.hide : false;
					cell.config.match = $.isEmptyObject( columnConfig[ 0 ] ) ? false : true;
					if ( 'chart' in cell.config && ( cell.config.type === 'chart-bar' || cell.config.type === 'highlight' ) ) {
						cell.x = cell.config.chart.x( cell.value ) || 0;
						cell.color = cell.config.chart.color( cell.value ) || '#000';
						if ( 'colorFrom' in cell.config.chart ) {
							cellFrom = $.grep( row, function( e ) {
								return e.key === cell.config.chart.colorFrom;
							} );

							cell.color = cellFrom[ 0 ].color || cell.color;
						}
					} else if ( 'chart' in cell.config && cell.config.type === 'chart-spark' ) {
						seriesFrom = $.grep( row, function( e ) {
							return e.key === 'series';
						} );
						nameFrom = $.grep( row, function( e ) {
							return e.key === 'name';
						} );
						cell.config.chart.values = ( seriesFrom.length > 0 ) ? seriesFrom[ 0 ].value : [];
						name = ( nameFrom.length > 0 ) ? nameFrom[ 0 ].value : '';
						v = cell.config.chart.values.map( function( o ) {
							return o[ name ];
						} );

						cell.config.chart.values = v;

						cell.config.chart.x = d3.scale.linear().domain( [ 0, v.length - 1 ] ).range( [ 0, cell.config.chart.width ] );
						cell.config.chart.y = d3.scale.linear().domain( [ d3.max( v ), d3.min( v ) ] ).range( [ 0, 20 ] );
						cell.config.chart.line = d3.svg.line()
							.x( function( d, i ) {
								return cell.config.chart.x( i );
							} )
							.y( function( d ) {
								return cell.config.chart.y( d );
							} )
					}
				} );
			} );
		}
		this.sort();
	};

	Table.prototype.getRowName = function( row ) {
		var i;
		row = row || [];
		for ( i = 0; i < row.length; i++ ) {
			if ( row[ i ].key === 'name' ) {
				return row[ i ].value;
			}
		}
	};

	Table.prototype.getRowDescription = function( row ) {
		var i;
		row = row || [];
		for ( i = 0; i < row.length; i++ ) {
			if ( row[ i ].key === 'description' ) {
				return row[ i ].value;
			}
		}
	};
