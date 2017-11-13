var mongoose = require('mongoose');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
var cluster = require('hierarchical-clustering');
const EXERCISE_MIN_ELO = 500;
const EXERCISE_MAX_ELO = 2500;
const EXERCISE_MAX_RATING = 4;

//Clustering Algorithms
//Distance 
function distance(a, b) {
  return Math.abs(a.rater_ability_level-b.rater_ability_level);
}

//Exercise
//	Difficulty refers to a specific range of user's ability levels. Over time this range will get narrower and each ability level will have a different difficulty.
var ExerciseSchema = new Schema({
	_id: ObjectId
	, title: { type: String, required: true}
	, chapter: { type: Number, required: true }
	, number: { type: Number, required: true }
	, text: { type: String, required: true}
});

//Question
var QuestionSchema = new Schema({
	question: { type: String, required: true}
	, options: { type: [String]}	//[] if the answer in numeric
	, answer: { type: Number, required: true}
});

//Rating
var RatingSchema = new Schema({
	rating: { type: Number, required: true}
	, rater_ability_level: { type: Number, required: true}
});

//Difficulty
//Each Exercise doesn't have a single difficulty value, but develops different values for Users of different elo.
var DifficultySchema = new Schema({
	average_rating: {type : Number , "default" : EXERCISE_MAX_RATING/2, min:0, max: EXERCISE_MAX_RATING, required: true}
	, lowestElo: { type: Number, "default" : EXERCISE_MIN_ELO, required: true}
	, highestElo: { type: Number, "default" : EXERCISE_MAX_ELO, required: true}
});

ExerciseSchema.index({ chapter: 1, number: -1 }, { unique: true });

ExerciseSchema.add( {ratings: {type : [RatingSchema] , "default" : []}} );
ExerciseSchema.add({questions: {type : [QuestionSchema] }});
ExerciseSchema.add({difficulties: {type : [DifficultySchema] }});

ExerciseSchema.methods.getDifficulty = function(userElo) {
	
	//If there are enough ratings to determine difficulty
	if(typeof this.difficulties == 'undefined' || !this.difficulties){
		console.log("ExerciseSchema.methods.getDifficulty: Unable to find difficulties array");
		return 0;
	}
	else{
		for(var difficulty_index=0;  difficulty_index < this.difficulties.length; difficulty_index++){
			var difficulty = this.difficulties[difficulty_index];
			
			if(userElo >= difficulty.lowestElo && userElo <= difficulty.highestElo){
				return difficulty.average_rating;
			}
		}
		
		//Else return 0 difficulty
		console.log("ExerciseSchema.methods.getDifficulty: Unable to find average rating for given Elo: " + userElo);
		return 0;
	}
	
}
ExerciseSchema.methods.getEloEquivalent = function(userElo){
	var user_difficulty = this.getDifficulty(userElo);
	var elo_equivalent = EXERCISE_MAX_ELO - ( (EXERCISE_MAX_RATING-user_difficulty)/EXERCISE_MAX_RATING ) * (EXERCISE_MAX_ELO-EXERCISE_MIN_ELO)
	
	return elo_equivalent;
}
ExerciseSchema.methods.rateExercise = function(chapter_num, exercise_num, rating, rater_ability_level, cb) {
	
	var new_rating = new module.exports.Rating();
	new_rating.rating = rating;
	new_rating.rater_ability_level = rater_ability_level;
	this.ratings.push(new_rating);
	var ratings = this.ratings;
	
	//Update difficulties after 10 new entries
	//if(this.ratings.length % 10 == 0){
	if(this.ratings.length % 1 == 0){
		
		console.log("Clustering test: Start");

		var levels = cluster({
			input: this.ratings
			, distance: distance
			, linkage: "single"	// Single-linkage clustering 
			, minClusters: 1
		});

		//Find the ideal num of clusters (subjective)

		var previous_linkage_gap = 0;
		var max_linkage_gap = 0;
		var max_linkage_gap_index = 0;
		var min_elo = Math.min.apply(null, this.ratings.map(function(rating){
			return rating.rater_ability_level;
		}));
		var max_elo = Math.max.apply(null, this.ratings.map(function(rating){
			return rating.rater_ability_level;
		}));
		

		for(var i = 1; i < levels.length; i++){
			
			//Check if current linkage increase is the maximum one yet (or equals to the max, since the higher the trea the better)
			if(levels[i].linkage - previous_linkage_gap >= max_linkage_gap){
				max_linkage_gap_index = i - 1;
				max_linkage_gap = levels[i].linkage - previous_linkage_gap;
			}
			
		}
		
		//The ideal level has been found at this point, but it could have only entries of a single rater_ability_level. In that case the levels with the same rater_ability_level values will be merged
		for(var i = max_linkage_gap_index; i < levels.length; i++){
			
			var current_level_approved = true;
			max_linkage_gap_index = i;
			
			//If the current level has a cluster with equal min and max, go to the level above
			for(var j = 0; j < levels[i].clusters.length; j++){
				
				var current_min_elo = Math.min.apply(null, levels[i].clusters[j].map(function(index){
						return ratings[index].rater_ability_level;
					}));
				var current_max_elo = Math.max.apply(null, levels[i].clusters[j].map(function(index){
						return ratings[index].rater_ability_level;
					}));
					
				if(current_min_elo == current_max_elo){
					current_level_approved = false;
					break;
				}
			}
			
			if(current_level_approved){
				break;
			}
		}
		

		//For each cluster, determine the interval and the average difficulty

		var difficulties = [];
		var number_of_clusters = levels[max_linkage_gap_index].clusters.length;

		for(var i = 0; i < number_of_clusters; i++){
			
			var current_min_elo = Math.min.apply(null, levels[max_linkage_gap_index].clusters[i].map(function(index){
				return ratings[index].rater_ability_level;
			}));
			var current_max_elo = Math.max.apply(null, levels[max_linkage_gap_index].clusters[i].map(function(index){
				return ratings[index].rater_ability_level;
			}));
			
			var sum = 0;
			var ratings_count = levels[max_linkage_gap_index].clusters[i].length;
			for(var j=0; j<ratings_count; j++){
				sum += ratings[levels[max_linkage_gap_index].clusters[i][j]].rating;
			}
			
			
			var difficulty = new module.exports.Difficulty();
			
			difficulty.average_rating = sum/ratings_count;
			
			//If this is the lowest end of elos, set the bottom limit to 0
			if(current_min_elo == min_elo){
				difficulty.lowestElo = EXERCISE_MIN_ELO;
			}
			else{
				difficulty.lowestElo = current_min_elo;
			}
			
			//If this is the highest end of elos, set the upper limit to 10000
			if(current_max_elo == max_elo){
				difficulty.highestElo = EXERCISE_MAX_ELO;
			}
			else{
				difficulty.highestElo = current_max_elo;
			}
			
			console.log(difficulty);
			difficulties.push(difficulty);
			
		}


		console.log("Clustering test: Complete");
		this.difficulties = difficulties;
		this.save();
		console.log(chapter_num + "." + exercise_num + ": Difficulty updated");
		cb(chapter_num);
		
		
	}
	else{
		this.save();
		cb(chapter_num);
	}
}




module.exports.Difficulty = mongoose.model('Difficulty', DifficultySchema);
module.exports.Rating = mongoose.model('Rating', RatingSchema);
module.exports.Question = mongoose.model('Question', QuestionSchema);
module.exports.Exercise = mongoose.model('Exercise', ExerciseSchema);