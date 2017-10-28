const fs = require('fs');
const exec = require('child_process').exec;
const firebase = require('firebase'); //The admin SDK did not seem to work on ARM

const endPoint = ``;

const tempFilePath1 = '';

const tempFilePath2 = '';

const firebaseUser = '';

const firebasePass = '';

const firebaseConfig = {

};

const readFile = path => new Promise((resolve, reject) => {
    fs.readFile(path, (err, file) => {
        if (err) {
            return reject(err);
        }
        return resolve(file);
    });
});

const getTempFromFile = file => {
    return file.slice(file.indexOf('t=') + 2) / 1000;
}

const toF = temp => temp * 1.8 + 32;

firebase.initializeApp(firebaseConfig);

const tempLogsRef = firebase.database().ref('temps');

let state = {
    temp1: null,
    temp2: null,
    timestamp: null
}

let inter = () => setInterval(() => {
    Promise.all([readFile(tempFilePath1), readFile(tempFilePath2), firebase.auth().signInWithEmailAndPassword(firebaseUser, firebasePass)])
    .then(res => {       
        state.temp1 = Math.round(toF(getTempFromFile(res[0])));
        state.temp2 = Math.round(toF(getTempFromFile(res[1])) - 0.5);
        state.timestamp = Date.now();
        
        return tempLogsRef.limitToLast(1).once('child_added');
    })
    .then(snap => {
        let lastTemps = snap.val();

        console.log(state, lastTemps);	 
        
        if (state.temp1 !== lastTemps.temp1 || state.temp2 !== lastTemps.temp2) {
            console.log(true);
            return tempLogsRef.push(state);
        }
    })
    .catch(err => {
        console.log(err);
    });
}, 5000);

exec('modprobe w1-gpio && modprobe w1-therm', (err, stdout, stderr) => {
    if (err) {
        console.log(`Couldn't run exec`, stderr);
        return;
    }

    inter();
});