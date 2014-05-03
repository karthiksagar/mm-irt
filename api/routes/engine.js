var MongoClient = require('mongodb').MongoClient, Server = require('mongodb').Server, db;
var GeoJSON = require('geojson');
var collection;
var mongoClient = new MongoClient(new Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
	db = mongoClient.db("irt");
	collection = db.collection("incidents");
});
var fs = require('fs');
var util = require('util');
ObjectID = require('mongodb').ObjectID;

exports.reportIncident = function(req, res) {
	
	var type = req.param('type');
	lat_x = parseFloat(req.param('lat'));
	long_y = parseFloat(req.param('long'));
	desc = req.param('desc');
	reported_by = req.param('name');
	device_info = req.param('dev_info');
	console.log(type,lat_x,long_y,desc,reported_by,device_info);
	/*var rec = {
		type : type,
		geometry : {
			type : "point",
			coordinates : [lat_x, long_y]
		},
		description : desc,
		reported_by : reported_by,
		from_device : device_info,
		image_path  : ""
	}*/
    var rec = {
        type : type,
        lat:lat_x,
        lng:long_y,
        description : desc,
        reported_by : reported_by,
        from_device : device_info,
        image_path  : ""
    }
	collection.insert(rec, function(err, records) {
		
		if (err) {
			res.send(500, {error : "Failed to insert record!"});
		} else {
			console.log("Record added as " + records[0]._id);
			res.send(200, records[0]._id);
		}
		});
	}


exports.uploadFile = function(req, res) {
	//get the file name
	var filename = req.files.file.name;
	// Create a new ObjectID
	var recId = req.param('id');
	var objectId = new ObjectID(recId);		
	
	var extensionAllowed = [".png", "png", ".jpg", "jpeg"];
	var maxSizeOfFile = 10000;
	var msg = "";
	var i = filename.lastIndexOf('.');
	// get the temporary location of the file
	var tmp_path = req.files.file.path;
	// set where the file should actually exists - in this case it is in the "images" directory
	var target_path = __dirname + '\\upload\\' + req.files.file.name;
	
	var file_extension = (i < 0) ? '' : filename.substr(i);
	if (( file_extension in extList(extensionAllowed)) && ((req.files.file.size / 1024 ) < maxSizeOfFile)) {
		
		fs.exists(tmp_path,function(exists){
			util.debug(exists?"Path is valid":"temp path is not valid")
		})
		fs.exists(target_path,function(exists){
			util.debug(exists?"Path is valid":"target path is not valid")
		})
		
		fs.rename(tmp_path, target_path, function(err) {
		
			if (err)
			{
				console.log(err);
				res.send(500, {
					error : "Failed to update record!"
				});
			}
			// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
			fs.unlink(tmp_path, function() {
				if (err)
				{
					console.log(err);
					res.send(500, {
					error : "Failed to update record!"
				});
				}
			});
		});
		
		msg = "File uploaded sucessfully";
		
		collection.update({_id : objectId}, {$set : {image_path : target_path}}, function(err, records) {
			if (err) {
				res.send(500, {
					error : "Failed to update record!"
				});
			} else {
				//console.log("Record updated " );
				res.send(200,"File uploaded");
			}
		});
	} else {
		// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
		fs.unlink(tmp_path, function(err) {
			if (err)
				console.log(err);
		});
		msg = "File upload failed.File extension not allowed and size must be less than " + maxSizeOfFile;
		res.send(msg);
	}

}

function extList(ext) {
	var o = {};
	for (var i = 0; i < ext.length; i++) {
		o[ext[i]] = '';
	}
	return o;
}

exports.getIncidentImage = function(req,res)
{
	var id = req.query['id']; 
	console.log(id);
	var objectId = new ObjectID(id);	   
    collection.findOne({'_id': objectId}, {'fields': ["image_path"]},function(err, item) {
            res.sendfile(item.image_path);
    });
}

exports.getAllIncidents = function(req, res) {
	db.collection('incidents', function(err, collection) {
		collection.find({}).toArray(function(err, items) {
            GeoJSON.parse(items, {Point: ['lng', 'lat']}, function(geojson){
                res.send(JSON.stringify(geojson));
            });
		//	res.jsonp(items);
		});
	})
};

exports.getIncident = function(req,res)
{
	var type = req.query['type']; 
    collection.find({'type': type}).toArray(function(err, items) {
            res.jsonp(items);
    });
}
exports.getPointsNear = function(req, res) {
	var lat = parseFloat(req.query.lat);
	var lon = parseFloat(req.query.lon);

	db.collection('points').find({
		"pos" : {
			$near : [lon, lat]
		}
	}).toArray(function(err, names) {
		res.header("Content-Type:", "application/json");
		res.end(JSON.stringify(names));
	});
};
exports.getIncidentTypes = function(req,res) {
	db.collection('incident_types', function(err, collection) {
		collection.find({}).toArray(function(err, items) {
            res.send(items);
		});
	})
}
