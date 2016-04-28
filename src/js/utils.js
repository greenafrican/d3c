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