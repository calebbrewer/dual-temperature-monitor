const temp1Element = document.getElementById("temp1");
const temp2Element = document.getElementById("temp2");
const chartElement = document.getElementById("chart");
const downloadTempDataElement = document.getElementById("download-temp-data");

const now = moment().valueOf();
const dayStart = moment(moment().format('YYYY-MM-DD')).valueOf();
const dayEnd = moment(moment().format('YYYY-MM-DD') + ' 23:59:59').valueOf();

const buildChartData = data => {
	let formatedData = 	data.map(log => {
		let time = moment(log.timestamp).format('h:mm:ss a');
		//let hr = moment(log.timestamp).format('HH');
		//let min = moment(log.timestamp).format('mm');
		//let sec = moment(log.timestamp).format('ss');
		//console.log(time, min, sec);
		return [time, log.temp1, log.temp2];
	});
	//let dataTable = new google.visualization.DataTable();
	
	//dataTable.addColumn("timeofday", "Time of Day");
	//dataTable.addColumn("number", "Temp1");
	//dataTable.addColumn("number", "Temp2");

	console.log([['Time', 'Temp1', 'temp2'], ...formatedData])
	let dataTable = google.visualization.arrayToDataTable([['Time', 'Temp1', 'temp2'], ...formatedData])
	
	let options = {
		title: "Temperatures Over Time",
		explorer: {
			keepInBounds: true
		},
		titleTextStyle: {
			color: "white"
		},
		hAxis: {
			title: "Time of Day",
			titleTextStyle: {
				color: "white"
			},
			textStyle: {
				color: "white"
			},
			baselineColor: "white",
		},
		vAxis: {
			title: "Degrees Fahrenheit",
			titleTextStyle: {
				color: "white"
			},
			textStyle: {
				color: "white"
			}
		},
		curveType: 'function',
		colors: ["#fff", "#ccc"],
		backgroundColor: {
			fill: "none",
			stroke: "none"
		},
		legend: {
			position: 'none',
			textStyle: {
				color: "white"
			}
		},
		//width: 320,
		height: 320
	};

	return [dataTable, options];
};

let chartsLoaded = false;

const loadCharts = new Promise((resolve, reject) => {
	let chartsInterval = setInterval(() => {
		if (chartsLoaded) {
			clearInterval(chartsInterval);
			return resolve();
		}
	}, 100);
});

const snapToArray = snap => {
	let array = [];

	snap.forEach(childSnap => {
		array.push(childSnap.val());
	});
	
	return array;
};

const convertTimestamp = array => array.map(log => {
	log.timestamp = moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss');
	return log;
});

const downloadCsvData = csvData => {
	let csv = encodeURI('data:text/csv;charset=utf-8,' + csvData);
	let link = document.createElement('a');
	
	link.setAttribute('href', csv);
	link.setAttribute('download', 'Temp Logs');
	link.click();	
}

const firebaseUser = '';
const firebasePass = '';

firebase.initializeApp({

});

const tempsRef = firebase.database().ref('temps');

const range = date => {
	console.log('state', state);	
	
	if (state.chartStart && state.chartEnd && state.chartEnd > state.chartStart) {
		tempsRef.orderByChild('timestamp').startAt(state.chartStart).endAt(state.chartEnd).once('value')
		.then(snap => {
			console.log(snap.val())
			const temps = snapToArray(snap);
			const chartData = buildChartData(temps);
			const chart = new google.visualization.LineChart(chartElement);	
			
			chart.draw(...chartData);		
		})
		.catch(err => {
			console.log(err);
		});
	}
}

let state = {
	chartStart: null,
	chartEnd: null
}

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(() => {
	chartsLoaded = true;
});

flatpickr('#date-start', {
	enableTime: true,
	//disableMobile: true,
	//static: true,
	onChange: (selectedDates, dateStr, instance) => {
		state.chartStart = moment(dateStr).valueOf();
		range();
		//console.log(selectedDates);
	}
});

flatpickr('#date-end', {
	enableTime: true,
	//disableMobile: true,
	//static: true,
	onChange: (selectedDates, dateStr, instance) => {
		state.chartEnd = moment(dateStr).valueOf();
		range();
		//console.log(selectedDates);
	}
});

temp1Element.addEventListener('click', () => {
	
});

downloadTempDataElement.addEventListener('click', () => {
    console.log('foo');
		tempsRef.once('value')
		.then(snap => {
			let jsonData = convertTimestamp(snapToArray(snap));		
			let csv = Papa.unparse(jsonData);
			//console.log(csv);
			downloadCsvData(csv);		
		});
});

firebase.auth().signInWithEmailAndPassword(firebaseUser, firebasePass)
.then(() => {
	state.chartStart = dayStart;
	state.chartEnd = dayEnd;

	tempsRef.limitToLast(1).on('child_added', snap => {
		let temps = snap.val();
		console.log(snap.val());
		temp1Element.innerHTML = temps.temp1;
		temp2Element.innerHTML = temps.temp2;		
	});
	
	return loadCharts;
})
.then(() => {
	range();
})
.catch(err => {
	console.log(err);
});;