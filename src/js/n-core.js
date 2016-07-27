function Table( config ) {
	var $$ = this.internal = new TableInternal( this );
	$$.loadConfig( config );
}

function TableInternal() {
	var $$ = this;
	$$.d3 = window.d3 ? window.d3 : typeof require !== 'undefined' ? require( 'd3' ) : undefined;
}

d3c.generate = function( config ) {
	return new Table( config );
};

d3c.table = {
	fn: Table.prototype,
	internal: {
		fn: ChartInternal.prototype,
		axis: {
			fn: Axis.prototype
		}
	}
};