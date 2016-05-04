# d3c
D3 tables and linked C3 charts

## Usage
```
<script src="https://code.jquery.com/jquery-1.12.0.min.js"></script>
<script type="text/javascript" src="dist/moment.js"></script>
<script type="text/javascript" src="dist/calendar.js"></script>
<script type="text/javascript" src="dist/d3.min.js"></script>
<script type="text/javascript" src="dist/c3.min.js"></script>
<script type="text/javascript" src="dist/d3c.min.js"></script>

<link href="dist/c3.min.css" rel="stylesheet" type="text/css">
```

## Example
```
d3cTable = d3c.table({
    description: ".d3c-table-description",
    bindto: "#d3c-table",
    responsive: {
        enabled: true,
        threshold: 600
    },
    columns: [
        {
            title: "Name",
            key: 'name',
            width: "15%",
            type: "cell",
            format: "text",
            collapse: false
        },
        {
            title: "Latest",
            key: 'latest',
            width: "40%",
            type: "chart-bar",
            format: "number",
            collapse: true,
            chart: {
                zeroBased: true,
                colorFrom: "chart_change"
            }
        },
        {
            title: "Change",
            key: 'chart_change',
            width: "10%",
            type: "highlight",
            format: "percent",
            collapse: false
        },
        {
            title: "Spark",
            key: 'chart_spark',
            width: "10%",
            type: "chart-spark",
            format: "number",
            collapse: true,
            chart: {
                keys: {
                    x: 'date'
                }
            }
        }],
    data: [],
    chart: {
        bindto: '#d3c-chart',
        data: {
            columns: [],
            x: 'date',
            type: 'line'
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d',
                    count: 5
                }
            },
            y: {
                tick: {
                    format: d3.format(".3s"),
                    count: 5
                }
            }
        }
    }
});
        
d3cTable.updateRow({
    'name': 'cows',
    'description': 'big fat mooing cow',
    'latest': 500000.00,
    'chart_change': -0.0581,
    'chart_spark': 'series',
    'series': [
        {"date": "2016-04-06", "cows": 1},
        {"date": "2016-04-07", "cows": 2},
        {"date": "2016-04-08", "cows": 3},
        {"date": "2016-04-09", "cows": 2},
        {"date": "2016-04-10", "cows": 1},
        {"date": "2016-04-11", "cows": 4}
    ]
});  
```

