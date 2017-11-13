
/*
	Included middleware
*/

var MongoClient = require('mongodb').MongoClient	//DB connector
	, mongoose = require('mongoose')	//DB schema manager
	, expressValidator = require('express-validator')	//Input validator
	, multer = require('multer')	//Parses POST forms
	, session = require('express-session')	//Stores user's session
	, builder = require('xmlbuilder')	//Creates xml text. It is used to create the svg graph It is not currently used.
	, userModels = require(__dirname+'/models/User')
	, exerciseModels= require(__dirname+'/models/Exercise')
	, User = userModels.User
	, UserExercise = userModels.UserExercise
	, UserAnswer = userModels.UserAnswer
	, Exercise = exerciseModels.Exercise
	, Question = exerciseModels.Question
	
//var url = 'mongodb://192.168.137.1:27017/iedb';	// Connection URL
var url = 'mongodb://localhost:27017/iedb';	// Connection URL
	
const express = require('express')
	, app = express();


/*
	Configure middleware
*/
app.set('view engine', 'pug')	//Pug is the template engine used to provide dynamic pages
app.use(express.static('public'))	//There is a folder named 'public', where .css and image files are stored. No auth required.
app.use(multer().array()); // For parsing multipart/form-data
app.use(expressValidator());	//A validator library. it is used to validate user input
app.use(expressValidator());	//A validator library. it is used to validate user input
app.use(session({
		secret: 'oberyngizmo'
		, resave: false
		, saveUninitialized: true
		}));	//User session handler

/*
	Run Server
*/
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})


/*
	Database operations
*/

// Use connect method to connect to the server
mongoose.Promise = global.Promise;	//Just to surpress an error
mongoose.connect(url);


/*
	Routing
*/
app.get('/iedb/', function (req, res) {
	
	//If user has signed in
	if(req.session.user){
		res.render('index', {
				user: req.session.user
				, current_path: []
				});
	}
	else{
		res.render('index', {
				current_path: []
		});
	}
})

app.post('/iedb/signin/', function (req, res) {
	
	//Check if username-password combination is correct. 
	User.findOne( {'username': req.body.signin_username}, function (err, person) {
		if(err) {
			console.log("Signin error: DB error on 'findOne'");
			console.log(err);
			res.render('signin', {
				input_error: "DB error"
				, current_path: [{path: "signin", name: "Sign In"}]
				});
		}
		else{
			
			//If user was not found
			if(!person){
				console.log("Signin error: Unable to find user \"" + req.body.signin_username + "\"");
				res.render('signin', {
					user_error: "Unable to find user \"" + req.body.signin_username + "\""
					, current_path: [{path: "signin", name: "Sign In"}]
					});
			}
			
			//Else verify password
			else{
				//Invalid password
				if(person.password_hash != req.body.signin_password){
					console.log("Signin error: Invalid password.");
					res.render('signin', {
						password_error: "Invalid password"
						, current_path: [{path: "signin", name: "Sign In"}]
						});
				}
				//Successful signin
				else {
					console.log("User \"" + req.body.signin_username + "\" successfully signed in.");
					req.session.user = {
						isAdmin: person.isAdmin
						, username: person.username
						, first_name: person.first_name
						, last_name: person.last_name
					}
					res.redirect(req.get('referer'));
				}
			}
		}
	})
})

app.get('/iedb/signin/', function (req, res) {
	//If user has already signed in
	if(req.session.user){
		res.redirect('/iedb/');
	}
	else{
		res.render('signin', {
			current_path: [{path: "signin", name: "Sign In"}]
		});
	}
})

app.get('/iedb/signout/', function (req, res) {
	
	//If the request is made by a signed in user
	if(req.session.user){
		console.log("User \"" + req.session.user.username + "\" successfully signed out.");
		req.session.destroy();
	}
	res.redirect('/iedb/');
})

app.get('/iedb/signup/', function (req, res) {
	
	//If user has already signed in
	if(req.session.user){
		console.log("User \"" + req.session.user.username + "\" attempted to signed up again.");
		res.redirect('/iedb/');
	}
	else{
		res.render('signup', {
			current_path: [{path: "signup", name: "Sign Up"}]
		});
	}
})

app.post('/iedb/signup/', function (req, res) {
	
	//If user has already signed in
	if(req.session.user){
		console.log("User \"" + req.session.user.username + "\" attempted to signed up again.");
		res.redirect('/iedb/');
	}
	else{
		
		//INPUT VALIDATION
		//	Username check
		req.checkBody('username')
			.notEmpty().withMessage('Username is required')
			.matches(/^[a-zA-Z0-9]{5,20}$/).withMessage('Username must consist of 5-20 non-special characters')
		
		//	Password check
		req.checkBody('pass')
			.notEmpty().withMessage('Passwords is required')
			.matches(/^[a-zA-Z0-9]{5,20}$/).withMessage('Password must consist of 5-20 non-special characters')
		
		//	Confirm Password check
		req.checkBody('conf_pass', 'Passwords do not match').equals(req.body.pass);
		
		//	First Name check
		req.checkBody('first_name')
			.notEmpty().withMessage('First Name is required')
			.matches(/^[a-zA-Z]{2,20}$/).withMessage('First Name must consist of 2-20 alphabetic characters')
			
		//	Last Name check
		req.checkBody('last_name')
			.notEmpty().withMessage('Last Name is required')
			.matches(/^[a-zA-Z]{2,20}$/).withMessage('Last Name must consist of 2-20 alphabetic characters')
			
		req.getValidationResult().then(function(result) {
			//If any error occured, notify user
			if(!result.isEmpty()){
				
				res.render('signup', {
					input_error: result.mapped()
					, current_path: [{path: "signup", name: "Sign Up"}]
					});
				
			}
			//Else create new user
			else{
				var userInfo = req.body;
				var user = new User({
					_id: mongoose.Types.ObjectId(),
					username: userInfo.username,
					password_hash: userInfo.pass,
					first_name: userInfo.first_name,
					last_name: userInfo.last_name,
					//This has to change when more chapters are added
					chapters: [
						{ability_level: 1000}
						, {ability_level: 1000}
						, {ability_level: 1000}
						, {ability_level: 1000}
						, {ability_level: 1000}
						, {ability_level: 1000}
						]
					});
				user.save(function(err, Person){
					if(err){
						console.log("Database Error " + err);
						res.render('signup', {
							input_error: {username: {msg:"Username '" + userInfo.username + "' already exists."}} 	//This message will be used for all DB errors.
							, current_path: [{path: "signup", name: "Sign Up"}]
						});
					}
					else{
						console.log("New user \"" + userInfo.username + "\" created.");
						res.render('signup', {
							current_path: [{path: "signup", name: "Sign Up"}]
							, username: userInfo.username
						});
					}
				});
			}
		})
	}
});

app.get('/iedb/users/:user', function (req, res) {
	
	//If user has already signed in
	if(!req.session.user){
		console.log("Attempt to access User \"" + req.params.user + "\".");
		res.redirect('/iedb/signin');
	}
	else{
		//Check if this is an attempt to access another user
		if(req.session.user.username !== req.params.user && req.session.user.isAdmin == false){
			res.render('error', {error_msg: "You have not access to that user."});
		}
		else {
			User.findOne( {'username': req.params.user}, function (err, user_requested) {
			if(err) {
				console.log("Error: DB error on 'findOne'");
				console.log(err);
				res.render('error', {error_msg: "DB error."});
			}
			else{
				//If user was not found
				if(!user_requested){
					console.log("Error: Unable to find user \"" + req.params.user + "\"");
					res.render('error', {error_msg: "Error: Unable to find user \"" + req.body.signin_username + "\""});
				}
				
				else{
					console.log("Rendering user " + req.params.user);
					console.log("user_requested " + user_requested);
					
					//Plot user's  graph and render page
					plot_graph(user_requested, function(){
						res.render('user', {
							user_requested: user_requested
							, user: req.session.user
							, current_path: [{path: "users/" + req.params.user, name: req.params.user}]
							});
						}
					
					);
				}
			}
		})
		}
	}
});

app.get('/iedb/chapter_:chapter', function(req, res) {
	//Check if a valid chapter number is given
	if (isNaN(req.params.chapter)) {
		console.log('Exercise: Error: Invalid chapter.');
		res.redirect('/iedb/chapter_1');	//Default chapter is Chapter 1
	}
	else{
		//Load Chapter's exercises
		Exercise.find({'chapter': req.params.chapter}, function (err, exercises) {
			//If a DB error occured
			if(err) {
				console.log("Exercise: Error: Error while looking for Chapter " + req.params.chapter);
				console.log(err);
				res.redirect('/iedb/error', {
					error_msg: "Error while looking for Chapter " + req.params.chapter,
					});
			}
			else{
				//If user has signed in
				if(typeof req.session.user !== 'undefined' && req.session.user){
					//Load User's data
					User.findOne({'username': req.session.user.username}, function (err, user) {
						//If a DB error occured
						if(err) {
							console.log("Exercise: Error: Error while loading user's history.");
							console.log(err);
							res.redirect('/iedb/error', {error_msg: "Error while while loading user's history"});
						}
						else{
							res.render('chapter', {
								number: req.params.chapter
								, user: req.session.user
								, userElo: user.getElo(req.params.chapter)
								, exercises: exercises
								, current_path: [{path: "chapter_" + req.params.chapter, name: "Chapter " + req.params.chapter},]
							});
						}
					});
				}
				else{
					res.render('chapter', {
						number: req.params.chapter
						, userElo: 1500
						, exercises: exercises
						, current_path: [{path: "chapter_" + req.params.chapter, name: "Chapter " + req.params.chapter},]
					});
				}
			}
		}).select({  title: 1, number: 1, difficulties: 1});
	}
});

app.get('/iedb/chapter_:chapter_num/exercise_:exercise_num', function (req, res) {
	//Check if a valid exercise number is given
	if (isNaN(req.params.exercise_num)
		|| isNaN(req.params.chapter_num)) {
		console.log('Exercise: Error: Invalid exercise.');
		res.render('exercise/exercise', {invalid_exercise: true});
	}
	//In case of a valid exercise number, load exercise from DB (if exists)
	else{
		//If user has signed in
		if(!req.session.user){
			console.log("Attempt to submit an answer before signing in.");
			res.redirect('/iedb/signin');
		}
		else{
			Exercise.findOne({
				'chapter': req.params.chapter_num,
				'number': req.params.exercise_num
				},
				function (err, exercise) {
					if(err) {
						console.log("Exercise: Error: Unable to look for Exercise "
							+ req.params.chapter_num + "."
							+ req.params.exercise_num);
						console.log(err);
						res.render('error', {error_msg: "Unable to look for Exercise "
							+ req.params.chapter_num + "."
							+ req.params.exercise_num})
					}
					else{
						//If exercise not found
						if(!exercise){
							console.log("Exercise: Error: Unable to find Exercise "
								+ req.params.chapter_num + "."
								+ req.params.exercise_num);
							console.log(err);
							res.render('error', {error_msg: "Exercise: Error: Unable to find Exercise "
								+ req.params.chapter_num + "."
								+ req.params.exercise_num});
						}
						else{
							//Load User's data
							User.findOne({'username': req.session.user.username}, function (err, user) {
								//If a DB error occured
								if(err) {
									console.log("Exercise: Error: Error while loading user's history.");
									console.log(err);
									res.redirect('/iedb/error', {error_msg: "Error while while loading user's history"});
								}
								else{
									
									user.findExercise(req.params.chapter_num, req.params.exercise_num, function (userExercise) {
										//Check user's progress and load the appropriate options
										//Case 1: Unread, unsolved, unrated
										if(!userExercise.isRead){
											console.log("Exercise unread");
										}
										
										//Case 2: Read, unsolved, unrated
										else if(!userExercise.isSolved){
											console.log("Exercise unsolved");
										}
										
										//Case 3: Read, solved, unrated
										else if(!userExercise.isRated){
											console.log("Exercise unrated");
										}
										
										//Case 4: Read, solved, rated
										else{
											console.log("Exercise complete");
										}
										
										res.render('exercise/exercise', {
											exercise: exercise
											, user: req.session.user
											, userExercise: userExercise
											, current_path: [{path: "chapter_" + req.params.chapter_num, name: "Chapter " + req.params.chapter_num}
												, {path: "chapter_" + req.params.chapter_num + "/exercise_" + req.params.exercise_num, name: "Exercise " + req.params.exercise_num}]
										});
									});
								}
							});
						}
					}
				})
		}
	}
})

app.post('/iedb/read', function(req, res){
	//This page is visited, when a User presses "Start solving" button.
	//It adds the Exercise to the User's Exercise list.
	
	//If user has signed in
	if(!req.session.user){
		console.log("Attempt to start solving before signing in.");
		res.redirect('/iedb/signin');
	}
	else{
			
		//Load User's data
		User.findOne({'username': req.session.user.username}, function (err, user) {
			//If a DB error occured
			if(err) {
				console.log("Reading exercise: Error: Error while loading user's history.");
				console.log(err);
				res.redirect('/iedb/error', {error_msg: "Error while while loading user's history"});
			}
			else{
				console.log("Reading exercise: " + req.body.chapter_num + "." + req.body.exercise_num);
				user.readExercise(req.body.chapter_num, req.body.exercise_num, function () {
					res.redirect(req.get('referer'));
				});
			}
		});
	}
})

app.post('/iedb/solve', function(req, res){
	//This page is visited, when a User presses "Submit Amswer" button.
	//It adds the Answer to the User's Exercise's Answer list.
	
	//If user has signed in
	if(!req.session.user){
		console.log("Attempt to submit an answer before signing in.");
		res.redirect('/iedb/signin');
	}
	else{
			
		//Load User's data
		User.findOne({'username': req.session.user.username}, function (err, user) {
			//If a DB error occured
			if(err) {
				console.log("Solving exercise: Error: Error while loading user's history.");
				console.log(err);
				res.redirect('/iedb/error', {error_msg: "Error while while loading user's history"});
			}
			else{
				console.log("Solving exercise: " + req.body.chapter_num + "." + req.body.exercise_num);
				
				//Load Exercise's solution
				Exercise.findOne(
					{
						'chapter': req.body.chapter_num,
						'number': req.body.exercise_num
					}, function(err, exercise) {
						//If a DB error occured
						if(err) {
							console.log("Solving exercise: Error: Error while loading exercise's solution");
							console.log(err);
							res.redirect('/iedb/error', {error_msg: "Error while while loading exercise's solution"});
						}
						else{
							
							//If exercise not found
							if(!exercise){
								console.log("Exercise: Error: Unable to find Exercise "
									+ req.params.chapter_num + "."
									+ req.params.exercise_num);
								console.log(err);
								res.render('error', {error_msg: "Exercise: Error: Unable to find Exercise "
									+ req.params.chapter_num + "."
									+ req.params.exercise_num});
							}
							else{
								var solution = [];
								
								exercise.questions.forEach(function(question, i) {
										
									if(req.body.answer[i] == question.answer){
										solution.push({answer: req.body.answer[i], isCorrect: true});
									}
									else{
										solution.push({answer: req.body.answer[i], isCorrect: false});
									}
								});
								
								var exercise_elo_equivalent = exercise.getEloEquivalent(user.getElo(req.body.chapter_num))
								user.solveExercise(req.body.chapter_num, req.body.exercise_num, exercise_elo_equivalent, solution, function () {
									res.redirect(req.get('referer'));
								});
							}
						}
					}
				);
				//).select({  questions: 1 });	//I don;t remember why I used this :,(
			}
		});
	}
});

app.post('/iedb/rate', function(req, res){
	//This page is visited, when a User presses "Rate it" button.
	//It adds User's rating to User's Exercise's rating and to Exresice's ratings, paired with User's current elo.
	console.log("Rating");
	//If user has signed in
	if(!req.session.user){
		console.log("Attempt to submit an answer before signing in.");
		res.redirect('/iedb/signin');
	}
	else{
			
		//Load User's data
		User.findOne({'username': req.session.user.username}, function (err, user) {
			//If a DB error occured
			if(err) {
				console.log("Rating exercise: Error: Error while loading user's history.");
				console.log(err);
				res.redirect('/iedb/error', {error_msg: "Error while while loading user's history"});
			}
			else{
				console.log("Rating exercise: " + req.body.chapter_num + "." + req.body.exercise_num);
				
				//Load Exercise's solution
				Exercise.findOne(
					{
						'chapter': req.body.chapter_num,
						'number': req.body.exercise_num
					}, function(err, exercise) {
						//If a DB error occured
						if(err) {
							console.log("Rating exercise: Error: Error while loading exercise");
							console.log(err);
							res.redirect('/iedb/error', {error_msg: "Error while while loading exercise"});
						}
						else{
							
							//If exercise not found
							if(!exercise){
								console.log("Exercise: Error: Unable to find Exercise "
									+ req.params.chapter_num + "."
									+ req.params.exercise_num);
								console.log(err);
								res.render('error', {error_msg: "Exercise: Error: Unable to find Exercise "
									+ req.params.chapter_num + "."
									+ req.params.exercise_num});
							}
							else{
								user.rateExercise(req.body.chapter_num, req.body.exercise_num, req.body.rating, function(chapter_num, exercise_num, rating){
									exercise.rateExercise(chapter_num, exercise_num, rating, user.getElo(chapter_num), function(chapter_num){
										res.redirect("/iedb/chapter_" + chapter_num);
									});
								});
							}
						}
					}
				);
			}
		});
	}
});

//THIS FUNCTION IS NOT USED YET. PROGRESS BARS ARE ADDED INSTEAD
//This function is used to plot the graph that visualizes one user's skills in each chapter
function plot_graph(user_requested, cb){
	
	/*
	console.log("Plotting graph for " + user_requested.username);
	
	//Initializes 'xmlbuilder' Object to built the xml output
	var builder = require('xmlbuilder');
	var xml = builder.create('root')
	  .ele('svg')
		.ele('circle', {
			'cx': '10'
			, 'cy': '10'
			, 'r': '3'
			, 'stroke': 'green'
			, 'stroke-width': '1'
			, 'fill': 'none'
			});
			
	var plotted_graph = xml.ele('root').toString({ pretty: true});

	console.log(plotted_graph);
	*/
	cb();
}