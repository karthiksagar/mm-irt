
var express = require('express'),
    core = require('./routes/engine');
 
 var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "http://192.168.56.1:4000");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

 /* For File Upload*/
var uploadPath="upload";
var fs = require('fs');
// End file upload edits
var app = express();
app.use(allowCrossDomain);
//start edits
app.use(app.router); 
//end edits

app.post('/upload', express.bodyParser({keepExtensions: true,uploadDir: __dirname +'\\temp' }),core.uploadFile);
app.post('/reportIncident',express.bodyParser(),core.reportIncident);
app.get('/incident/image',core.getIncidentImage);
app.get('/incident',core.getIncident);
app.get('/incidents',core.getAllIncidents);
app.get('/incidentTypes',core.getIncidentTypes);

app.listen(3000);
console.log('Listening on port 3000...');