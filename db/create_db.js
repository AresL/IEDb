var MongoClient = require('mongodb').MongoClient, assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/iedb';


// Use connect method to connect to the server
MongoClient.connect(url, function(err, db){
			assert.equal(null, err);
			create_exercise_collection(db);
			create_user_collection(db);
		}
	);
	
var create_exercise_collection = function(db, callback){
	db.createCollection( "exercises", function(err, res){
	assert.equal(null, err);
		console.log("Exercise Collection created!");
		}
	);
}

var create_user_collection = function(db, callback){
	db.createCollection( "users", function(err, res) {
			assert.equal(null, err);
			console.log("User Collection created!");
			db.close();
		}
	);
}
