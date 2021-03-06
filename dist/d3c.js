( function( window ) {
    'use strict';

    var d3c = { version: '0.0.1' };
    function formatText( d ) {
        if ( d.value === '-' ) return '-';
        switch ( d.config.format ) {
            case 'text':
                return d.value;
                break;
            case 'number':
                return d3.format( ',0f' )( d.value );
                break;
            case 'percent':
                return d3.format( '.2%' )( d.value );
                break;
            case 'currency':
                return d3.format( '$.2f' )( d.value );
                break;
            default:
                return d.value;
        }
    }
    function pickColor( color ) {
        var i, l;
        var c = d3.values( d3.rgb( color ) ).slice( 0, 3 );
        for ( i = 0; i < c.length; ++i ) {
            c[i] = c[i] / 255;
            if ( c[i] <= 0.03928 ) {
                c[i] = c[i] / 12.92
            } else {
                c[i] = Math.pow( ( c[i] + 0.055 ) / 1.055, 2.4 );
            }
        }
        l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        return ( l > 0.5 ) ? 'black' : 'white';
    }
    Array.prototype.indexOfObj = function( o ) {
        var arr = this;
        var i = 0;
        for ( i = 0; i < arr.length; i++ ) {
            if ( JSON.stringify( arr[i] ) === JSON.stringify( o ) ) { // TODO: hmmm may need better way to compare objects
                return i;
            }
        }
        return -1;
    };
    function tryConvertNum( d ) {
        if ( d instanceof Array ) {
            d = convertArrNum( d );
        } else if ( typeof d === 'object' ) {
            d = convertObjNum( d );
        } else if ( Number( d ) ) {
            d = +d;
        }
        return d;
    }
    function convertArrNum( d ) {
        d.forEach( function( dd, i ) {
            if ( dd instanceof Array ) {
                d[i] = convertArrNum( dd );
            } else if ( typeof dd === 'object' ) {
                d[i] = convertObjNum( dd );
            } else if ( Number( dd ) ) {
                d[i] = +dd;
            }
        } );
        return d;
    }
    function convertObjNum( d ) {
        var k;
        for ( k in d ) {
            if ( d.hasOwnProperty( k ) ) {
                if ( d[ k ] instanceof Array ) {
                    d[ k ] = convertArrNum( d[ k ] );
                } else if ( typeof d[ k ] === 'object' ) {
                    d[ k ] = convertObjNum( d[ k ] );
                } else if ( Number( d[ k ] ) ) {
                    d[ k ] = +d[ k ];
                }
            }
        }
        return d;
    };
    function toggleArrayItem( a, v ) {
        var i = a.indexOf( v );
        if ( i === -1 )
            a.push( v );
        else
            a.splice( i, 1 );
    }
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
		this.colors = config.colors || [];

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
				row[ k ] = tryConvertNum( row[ k ] );
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
						if ( col.collapse === true ) {
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
						name = self.getRowName( row );
						cell.config.chart.values = ( seriesFrom.length > 0 ) ? seriesFrom[ 0 ].value : [];
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

    Table.prototype.chart = function( config ) {
        if ( arguments.length === 0 || $.isEmptyObject( config ) ) return this._chart || {};
        config || ( config = {} );
        this.chartConfig( config );
        this._chart = this.c3.generate( this.chartConfig() ); // TODO: update if exists
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
        var name = this.getRowName( row ) || 'y';
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
        self.chartUpdate();
        d3.select( selection ).style( 'background-color', function() {
            var rgb = d3.rgb( self.chart().data.colors()[ name ] );
            if ( self.selected.indexOf( name ) !== -1 ) {
                return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.1)';
            }
            return '#fff';
        } );
    };


    Table.prototype.sort = function( sort ) {
        var data = this.data();
        if ( data.length < 2 && arguments.length === 0 ) return this._sort || {};
        if ( arguments.length === 0 ) {
            sort = this._sort || {};
            if ( 'key' in sort && sort.key.length ) {
                if ( 'direction' in sort ) {
                    data.sort( sortByKey( sort.key, sort.direction ) );
                    this._data = data;
                }
            }
        } else {
            this._sort = {
                key: ( 'key' in sort ) ? sort.key : '',
                direction: ( 'direction' in sort ) ? sort.direction : 'asc'
            };
            this.redraw();
        }
        return this._sort;
    };
    Table.prototype.sortColumn = function( selection ) {
        var self = this;
        var key = selection.key || '';
        var newDirection = 'asc';
        if ( '_sort' in self ) {
            if ( 'key' in self._sort ) {
                if ( self._sort.key === key ) {
                    if ( 'direction' in self._sort ) {
                        newDirection = ( self._sort.direction === 'asc' ) ? 'desc' : 'asc'; // toggle sort order
                    }
                }
            }
        }
        this.sort( { key: key, direction: newDirection } );
    };
    function sortByKey( key, dir ) {
        return function( a, b ) {
            var aIndex = a.map( function( obj, index ) {
                if ( obj.key === key ) {
                    return index;
                }
            } ).filter( isFinite );

            var bIndex = b.map( function( obj, index ) {
                if ( obj.key === key ) {
                    return index;
                }
            } ).filter( isFinite );

            return ( dir === 'asc' ) ? ( a[aIndex].value > b[bIndex].value ) : ( a[aIndex].value < b[bIndex].value );
        }
    }


/*eslint no-trailing-spaces:0*/
    Table.prototype.redrawHeader = function() {
	    var columns = this.columns().filter( function( col ) { return !col.hide; } );
        var self = this;
        var headerRows = this.selectTable.select( 'thead' ).selectAll( 'tr' );
        var headerCells = headerRows.selectAll( 'th' ).data( columns );

        headerCells.enter().append( 'th' )
            .on( 'click', function( d ) {
                self.sortColumn( d );
                self.redraw();
            } )
            .style( 'width', function( d ) {
                return d.width;
            } )
            .style( 'opacity', 0.0 )
            .transition()
            .delay( 500 )
            .duration( 500 )
            .style( 'opacity', 1.0 );
        headerCells.html( function( d ) {
            var glyph = '';
            if ( '_sort' in self ) {
                if ( 'key' in self._sort ) {
                    if ( self._sort.key === d.key ) {
                        if ( 'direction' in self._sort ) {
                            glyph = ( self._sort.direction === 'asc' ) ?
                                'noticon noticon-uparrow' : 'noticon noticon-downarrow'
                        }
                    }
                }
            }
            return d.title + '<span class=' + glyph + '></span>';
        } );
        headerCells.exit()
            .transition()
            .delay( 200 )
            .duration( 500 )
            .style( 'opacity', 0.0 )
            .remove();
        var header_cells_in_new_rows = headerRows.selectAll( 'th' ).data( columns );
        header_cells_in_new_rows.enter().append( 'th' )
            .style( 'width', function( d ) {
                return d.width;
            } )
            .style( 'opacity', 0.0 )
            .transition()
            .delay( 500 )
            .duration( 500 )
            .style( 'opacity', 1.0 );
        header_cells_in_new_rows.html( function( d ) {
            var glyph = '';
            if ( '_sort' in self ) {
                if ( 'key' in self._sort ) {
                    if ( self._sort.key === d.key ) {
                        if ( 'direction' in self._sort ) {
                            glyph = ( self._sort.direction === 'asc' ) ?
                                'noticon noticon-uparrow' : 'noticon noticon-downarrow'
                        }
                    }
                }
            }
            return d.title + '<span class=' + glyph + '></span>';
        } );
        this.recalculate();
    };
    Table.prototype.redrawRows = function() {
        var self = this;
        var cells_in_new_rows;
        var cells;
        var tooltip = d3.select( 'body' )
            .append( 'div' )
            .style( 'position', 'absolute' )
            .style( 'z-index', '10' )
            .style( 'visibility', 'hidden' )
            .text( 'a simple tooltip' );

        var data = this.data();
            var rows = this.selectTable.select( 'tbody' )
                .on( 'mouseout', function() {
                    d3.select( self.description ).html( '' );
                } )
                .selectAll( 'tr' )
                .data( data )
                .on( 'click', function( d ) {
                    self.rowSelect( d, this );
                } )
                .on( 'mouseover', function( d ) {
                    var html =
                        '<div class="d3c-table-descr">' +
                            '<strong>' + self.getRowName( d ) + ': </strong>' +
                            self.getRowDescription( d ) +
                        '</div>';
                    d3.select( self.description ).html( html );
                    tooltip
                        .style( 'visibility', 'visible' )
                        .html( html );
                } )
                .on( 'mousemove', function() {
                    return tooltip.style( 'top', ( event.pageY - 10 ) + 'px' ).style( 'left' , ( event.pageX + 10 ) + 'px' );
                } )
                .on( 'mouseout', function() {
                    return tooltip.style( 'visibility', 'hidden' );
                } )
                .style( 'background-color', function( d ) {
                    var name = self.getRowName( d );
                    if ( self.selected.indexOf( name ) !== -1 ) {
                        var rgb = d3.rgb( self.chart().data.colors()[ name ] );
                        return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.1)';
                    }
                    return '#fff';
                } );
            cells = rows.selectAll( 'td' ).data( function( d ) {
                return $.grep( d, function( e ) {
                    return e.config.match && !e.hide;
                } );
            } );
            cells.enter().append( 'td' )
                .style( 'width', function( d ) {
                    return d.config.width;
                } )
                .style( 'opacity', 0.0 )
                .transition()
                .delay( 500 )
                .duration( 500 )
                .style( 'opacity', 1.0 );

            cells.call( drawCell );

            cells.exit()
                .transition()
                .delay( 200 )
                .duration( 500 )
                .style( 'opacity', 0.0 )
                .remove();

            cells_in_new_rows = rows.enter().append( 'tr' )
                .on( 'click', function( d ) {
                    self.rowSelect( d, this );
                } )
                .on( 'mouseover', function( d ) {
                    var html =
                        '<div class="d3c-table-descr">' +
                        '<strong>' + self.getRowName( d ) + ': </strong>' +
                        self.getRowDescription( d ) +
                        '</div>';
                    d3.select( self.description ).html( html );
                    tooltip
                        .style( 'visibility', 'visible' )
                        .html( html );
                } )
                .on( 'mousemove', function() {
                    return tooltip.style( 'top', ( event.pageY - 10 ) + 'px' ).style( 'left' , ( event.pageX + 10 ) + 'px' );
                } )
                .on( 'mouseout', function() {
                    return tooltip.style( 'visibility', 'hidden' );
                } )
                .style( 'background-color', function( d ) {
                    var name = self.getRowName( d );
                    if ( self.selected.indexOf( name ) !== -1 ) {
                        var rgb = d3.rgb( self.chart().data.colors()[ name ] );
                        return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.1)';
                    }
                    return '#fff';
                } )
                .selectAll( 'td' )
                .data( function( d ) {
                    return $.grep( d, function( e ) {
                        return e.config.match && !e.hide;
                    } );
                } );

            cells_in_new_rows.enter().append( 'td' )
                .style( 'width', function( d ) {
                    return d.config.width;
                } )
                .style( 'opacity', 0.0 )
                .transition()
                .delay( 500 )
                .duration( 500 )
                .style( 'opacity', 1.0 );

            cells_in_new_rows.call( drawCell );

            rows.exit()
                .transition()
                .delay( 200 )
                .duration( 500 )
                .style( 'opacity', 0.0 )
                .remove();
    };

    function drawCell( selection ) {
        var x, color, width, svg, hcolor;
        var svgSpark;
        selection.each( function( dd ) {
            var $$ = d3.select( this );
            if ( dd.config.type === 'chart-bar' ) {
                x = dd.config.chart.x;
                color = dd.config.chart.color;
                width = dd.config.chart.width;
	            $$.select( 'div' ).remove();
                $$.select( 'svg' ).remove();

                svg = $$.append( 'svg' )
                    .attr( {
                        width: width,
                        height: 20
                    } );
                svg.append( 'rect' )
                    .attr( 'class', function( d ) {
                        return 'bar bar--' + ( d.value < 0 ? 'negative' : 'positive' );
                    } )
                    .attr( 'x', function( d ) {
                        return ( d.config.chart.zeroBased ) ? x( 0 ) : x( Math.min( 0, d.value ) );
                    } )
                    .attr( 'y', 0 )
                    .attr( 'rx', 3 )
                    .attr( 'ry', 3 )
                    .attr( 'width', function( d ) {
                        return ( d.config.chart.zeroBased ) ? Math.abs( x( d.value ) ) : Math.abs( x( d.value ) - x( 0 ) );
                    } )
                    .attr( 'height', 20 )
                    .attr( 'fill', function( d ) {
                        return d.color; // color( d.value );
                    } );
                svg.append( 'text' )
                    .text( function( d ) {
                        return formatText( d );
                    } )
                    .attr( 'y', 15 )
                    .attr( 'x', function( d ) {
                        var posX = ( d.config.chart.zeroBased ) ? Math.abs( x( d.value ) ) : x( d.value );
                        if ( d.config.chart.zeroBased ) {
                            if ( posX > ( width / 2 ) ) {
                                return x( 0 ) + Math.abs( x( 0 ) ) + 8;
                            }
                            return x( 0 ) + Math.abs( x( d.value ) - x( 0 ) ) + 5;
                        }
                        if ( posX < x( 0 ) ) {
                            if ( posX < ( x( 0 ) / 2 ) ) {
                                return posX + 5;
                            }
                            return posX - 40;
                        } else if ( posX > ( x( 0 ) + ( ( width - x( 0 ) ) / 2 ) ) ) {
                                return x( 0 ) + Math.abs( x( d.value ) - x( 0 ) ) - 40;
                        }
                        return x( 0 ) + Math.abs( x( d.value ) - x( 0 ) );
                    } )
                    .attr( 'class', function( d ) {
                        var posX = x( d.value );
                        if ( posX < x( 0 ) ) {
                            if ( posX < ( x( 0 ) / 2 ) ) {
                                return 'd3c-chart-label-neg-high';
                            }
                            return 'd3c-chart-label-neg-low';
                        } else if ( posX > ( x( 0 ) + ( ( width - x( 0 ) ) / 2 ) ) ) {
                            return 'd3c-chart-label-pos-high';
                        }
                        return 'd3c-chart-label-pos-low';
                    } )
                    .style( 'fill', function( d ) {
                        var posX = x( d.value );
                        if ( posX < x( 0 ) ) {
                            if ( posX < ( x( 0 ) / 2 ) ) {
                                return pickColor( d.color );
                            }
                            return '#000';
                        } else if ( posX > ( x( 0 ) + ( ( width - x( 0 ) ) / 2 ) ) ) {
                            return pickColor( d.color );
                        }
                        return '#000';
                    } );
            } else if ( dd.config.type === 'highlight' ) {
                $$.select( 'div' ).remove();
	            $$.select( 'svg' ).remove();
                hcolor = dd.config.chart.color;
                $$.append( 'div' )
                    .style( 'background-color', function( d ) {
                        return hcolor( d.value )
                    } )
                    .style( 'text-align', 'center' )
                    .style( 'border-radius', '3px' )
                    .text( function( d ) {
                        return formatText( d );
                    } )
                    .style( 'color', function() {
                        return pickColor( d3.select( this ).style( 'background-color' ) );
                    } );
            } else if ( dd.config.type === 'chart-spark' ) {
                width = dd.config.chart.width;
	            $$.select( 'div' ).remove();
                $$.select( 'svg' ).remove();
                svgSpark = $$.append( 'svg' )
                    .attr( {
                        width: width,
                        height: 20
                    } )
                    .append( 'path' )
                    .attr( 'd', dd.config.chart.line( dd.config.chart.values ) )
                    .attr( 'stroke', 'black' ).attr( 'stroke-width', 0.5 ).attr( 'fill', 'none' );
            } else {
	            $$.text( '' );
                $$.text( function( d ) {
                    return formatText( d );
                } );
            }
        } );
    }
    Table.prototype.redraw = function() {
        this.recalculate();
        this.redrawHeader();
        this.redrawRows();
    };

    d3c.table = function( config ) {
        return new Table( config );
    };
    if ( typeof define === 'function' && define.amd ) {
        define( 'd3c', [ 'd3' ], function() {
            return d3c;
        });
    } else if ( 'undefined' !== typeof exports && 'undefined' !== typeof module ) {
        module.exports = d3c;
    } else {
        window.d3c = d3c;
    }
    } )( window );