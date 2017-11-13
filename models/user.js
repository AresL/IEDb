var mongoose = require('mongoose');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
const K = 150;	//Constant K is used by the elo function (the bigger, the more impact a given solution will have)
const USER_MIN_ELO = 1000;
const USER_MAX_ELO = 2000;

//Creating the Schemas
var UserSchema = new Schema({
	//	An exercise is added when a user reads it
	_id: ObjectId
	, isAdmin: {type: Boolean, required: true, "default": false}
	, username: { type: String, required: true, index: {unique: true} }
	, password_hash: { type: String, required: true }
	, first_name: { type: String, required: true }
	, last_name: { type: String, required: true }
});
var ChapterSchema = new Schema({
	ability_level: {type : Number , "default" : (USER_MAX_ELO-USER_MIN_ELO)/2 + USER_MIN_ELO , min: USER_MIN_ELO, max: USER_MAX_ELO, required: true}
});
var ExerciseSchema = new Schema({
	isRead: {type: Boolean, "default": false, required: true}
	, isSolved: {type: Boolean, "default": false, required: true}
	, isRated: {type: Boolean, "default": false, required: true}
	, rating: {type: Number}
});
var AnswerSchema = new Schema({
	answer: {type: Schema.Types.Mixed, required: true}
	, isCorrect: {type: Boolean, required: true}
});

//Adding references to Schemas
ExerciseSchema.add({
	answers: {type: [AnswerSchema], default: []}
	, rating: {type: Number}
	});
ChapterSchema.add({
	exercises: {type: [ExerciseSchema], default: []}
	});
UserSchema.add({
	chapters: {type: [ChapterSchema], default: []}
	});


UserSchema.methods.findExercise = function(chapter_num, exercise_num, cb) {
	
	//Create empty Exercise arrays to store exercises for all chapters up to the one given (nothing happens, if they already exist)
	var pending_chapters = chapter_num - this.chapters.length ;
	while(pending_chapters-- > 0){
		// This line has to change, if Chapter is redefined
		this.chapters.push({chapters: new module.exports.UserChapter()});
	}
	//Create empty exercises up to the one given (nothing happens, if they already exist)
	var pending_exercises = exercise_num - this.chapters[chapter_num-1].exercises.length ;
	while(pending_exercises-- > 0){
		this.chapters[chapter_num-1].exercises.push({exercises: new module.exports.UserExercise()});
	}
	this.save();
	return cb(this.chapters[chapter_num-1].exercises[exercise_num-1]);
};

UserSchema.methods.readExercise = function(chapter_num, exercise_num, cb) {
	
	//Create empty Exercise arrays to store exercises for all chapters up to the one given (nothing happens, if they already exist)
	var pending_chapters = chapter_num - this.chapters.length ;
	while(pending_chapters-- > 0){
		// This line has to change, if Chapter is redefined
		this.chapters.push({chapters: new module.exports.UserChapter()});
	}
	//Create empty exercises up to the one given (nothing happens, if they already exist)
	var pending_exercises = exercise_num - this.chapters[chapter_num-1].exercises.length ;
	while(pending_exercises-- > 0){
		this.chapters[chapter_num-1].exercises.push({exercises: new module.exports.UserExercise()});
	}
	
	this.chapters[chapter_num-1].exercises[exercise_num-1].isRead = true;
	this.save();
	
	cb();
}

UserSchema.methods.solveExercise = function(chapter_num, exercise_num, exercise_elo_equivalent, answers, cb) {
	
	//Create empty Exercise arrays to store exercises for all chapters up to the one given (nothing happens, if they already exist)
	var pending_chapters = chapter_num - this.chapters.length ;
	while(pending_chapters-- > 0){
		// This line has to change, if Chapter is redefined
		this.chapters.push({chapters: new module.exports.UserChapter()});
	}
	//Create empty exercises up to the one given (nothing happens, if they already exist)
	var solution_correct = true;
	var pending_exercises = exercise_num - this.chapters[chapter_num-1].exercises.length ;
	while(pending_exercises-- > 0){
		this.chapters[chapter_num-1].exercises.push({exercises: new module.exports.UserExercise()});
	}
	
	for(var i = 0; i<answers.length; i++){
		var answer = new module.exports.UserAnswer();
		answer.answer = answers[i].answer;
		answer.isCorrect = answers[i].isCorrect;
		this.chapters[chapter_num-1].exercises[exercise_num-1].answers.push(answer);
		
		if(!answers[i].isCorrect){
			solution_correct = false;
		}
	}
	
	this.chapters[chapter_num-1].exercises[exercise_num-1].isSolved = true;
	
	//Update user's Ability Level
	//Any wrong answer marks the whole Exercise as wrongly answered. This is because the difficulty is determined by the hardest part of the Exercise. 
	var old_elo = this.chapters[chapter_num-1].ability_level;
	var correct_probability = 1/( 1 + (Math.pow(10, (exercise_elo_equivalent - old_elo)/400 ) ) );	//This is one of the official elo rating functions
	var new_elo = Math.floor(old_elo + K*(solution_correct-correct_probability));
	
	//Check for max/min values
	if(new_elo < USER_MIN_ELO){
		console.log(this.username + ": max elo reached");
		new_elo = USER_MIN_ELO;
	}
	else if(new_elo > USER_MAX_ELO){
		console.log(this.username + ": min elo reached");
		new_elo = USER_MAX_ELO;
	}
	
	this.chapters[chapter_num-1].ability_level = new_elo;
	
	console.log("Elo update:");
	console.log("\tCorrect answer: " + solution_correct);
	console.log("\texercise_elo_equivalent: " + exercise_elo_equivalent);
	console.log("\tOld elo: " + old_elo);
	console.log("\tNew elo: " + this.chapters[chapter_num-1].ability_level);
	console.log("\tcorrect_probability: " + correct_probability);
	
	//Store updated user
	this.save();
	cb();
}

UserSchema.methods.rateExercise = function(chapter_num, exercise_num, rating, cb) {
	
	//Create empty Exercise arrays to store exercises for all chapters up to the one given (nothing happens, if they already exist)
	var pending_chapters = chapter_num - this.chapters.length ;
	while(pending_chapters-- > 0){
		// This line has to change, if Chapter is redefined
		this.chapters.push({chapters: new module.exports.UserChapter()});
	}
	//Create empty exercises up to the one given (nothing happens, if they already exist)
	var pending_exercises = exercise_num - this.chapters[chapter_num-1].exercises.length ;
	while(pending_exercises-- > 0){
		this.chapters[chapter_num-1].exercises.push({exercises: new module.exports.UserExercise()});
	}
	
	this.chapters[chapter_num-1].exercises[exercise_num-1].rating = rating;
	this.chapters[chapter_num-1].exercises[exercise_num-1].isRated = true;
	this.save();
	
	cb(chapter_num, exercise_num, rating);
}

UserSchema.methods.getElo = function(chapter_num) {
	if(this.chapters.length >= chapter_num){
		return this.chapters[chapter_num-1].ability_level;
	}
	else{
		console.log("UserSchema.methods.getElo: Unable to find ability level for chapter " + chapter_num)
		return 1000;
	}
}

module.exports.UserAnswer = mongoose.model('UserAnswer', AnswerSchema);
module.exports.UserExercise = mongoose.model('UserExercise', ExerciseSchema);
module.exports.UserChapter = mongoose.model('UserChapter', ChapterSchema);
module.exports.User = mongoose.model('User', UserSchema);