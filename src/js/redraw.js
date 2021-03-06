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
