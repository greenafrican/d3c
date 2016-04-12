function formatText(d) {
    switch (d.config.format) {
        case 'text':
            return d.value;
            break;
        case 'number':
            return d3.format(',0f')(d.value);
            break;
        case 'percent':
            return d3.format('.2%')(d.value);
            break;
        case 'currency':
            return d3.format('$.2f')(d.value);
            break;
        default:
            return d.value;
    }
}

function pickColor(color) {
    var c = d3.values(d3.rgb(color)).slice(0, 3);
    for (var i = 0; i < c.length; ++i) {
        c[i] = c[i] / 255;
        if (c[i] <= 0.03928) {
            c[i] = c[i] / 12.92
        } else {
            c[i] = Math.pow(( c[i] + 0.055 ) / 1.055, 2.4);
        }
    }
    var l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    //return ( l > 0.179 ) ? 'black' :'white';
    return ( l > 0.5 ) ? 'black' : 'white';
}

