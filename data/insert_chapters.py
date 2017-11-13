from pymongo import MongoClient


def insert_chapter_to_db(db, chapter):

	filename = "exercises_chapter_" + str(chapter) + ".txt"
	exercises_added = 0;
	
	#Open exercise' text file
	file = open(filename, "r")
	
	for exercise_text in iter(lambda: file.readline()[:-1], ''):
		
		exercise_number = exercises_added + 1
		
		#Read the questions
		exercise_question_line = file.readline()[:-1];
		exercise_questions = exercise_question_line.split('|')
		
		#Read the answers
		exercise_answer_line = file.readline()[:-1];
		exercise_answers = exercise_answer_line.split('|')
		
		#Read initial difficulty
		exercise_difficulty = file.readline()[:-1];
		
		if len(exercise_questions) != len(exercise_answers):
			print("Error inserting Exercise " + str(exercise_number) + " in Chapter " + str(chapter))
			print("Number of questions different than number of answers")
			file.close()
			return
		
		else:
			
			#Create the 'questions' collection
			questions = []
			for question in exercise_questions:
				answer = exercise_answers.pop(0)
				questions.append({"question": question, "options": [], "answer": answer})
			
			#Save to DB
			key = {
				"chapter": chapter
				, "number": exercise_number
			}
			
			data = {
				"title": "Exercise " + str(exercise_number) + " of Chapter " + str(chapter)
				, "chapter": chapter
				, "number": exercise_number
				, "text": exercise_text
				, "questions": questions
				, "difficulties": [
					{
					"average_rating": exercise_difficulty
					, "lowestElo": 500
					, "highestElo": 2500
					}
					]
			};
			
			db.iedb.exercises.update(key, data, upsert=True);
			
		#Print exercise
		'''
		print("title: " + "Exercise " + str(chapter))
		print("chapter: " + str(chapter))
		print("number: " + str(exercise_number))
		print("text: " + exercise_text)
		print("question: " + exercise_question)
		print("answer: " + str(exercise_answer))
		print("exercise_difficulty: " + str(exercise_difficulty))
		print()
		'''
		
		exercises_added += 1	#Increase exercises_added, in order to heve the next exercise' number
		file.readline()	#Skip the empty line
	
	#Close file
	file.close()
	
	
	
def insert_chapters():

	num_of_chapters = 6;
	
	print("Chapter insertion started.")
	
	#Connect to DB
	client = MongoClient('localhost', 27017)
	
	for current_chapter in range(1, num_of_chapters+1):
		print("Inserting chapter " + str(current_chapter))
		insert_chapter_to_db(client, current_chapter)
	
	print("Chapter insertion complete.")
	
insert_chapters();
