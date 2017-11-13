# IEDb

IEDb (Internet Exercise Database) is a web platform, based on Node.js, where Exercises can be stored and then be solved and rated by users of different Ability Levels.
Through this process the system produces a personalized difficulty for the users that will attempt to solve the Exercise.
The accuracy of the presiction increases as more users rate the Exercise.

For demonstration purposes a number of physics Exercises has been added to the system. 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

In order to run the system the following packeges must be installed:

* Node.js 6.11+
* MongoDB 3.4+
* Python 3.6+

### Installing

1. Clone the latest repository:
	
	```
	git clone https://github.com/AresL/IEDb
	```

2. A MongoDB must exist in the following address:
	
	```
	localhost:27017/iedb
	```

3. Initialize DB:
	
	```
	node ./db/create_db.js
	```

4. Run Node.js server:
	
	```
	node ./iedb.js
	```

5. The system must be up and running. To access it go to:

	```
	http://localhost:3000/iedb/
	```

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Node.js 6.11](https://nodejs.org/en/blog/release/v6.11.0/) - The web framework used
* [Python 3.6](https://docs.python.org/3.6/whatsnew/3.6.html) - The script used to import Exercises (out of plain text)
* [MongoDB 3.4](https://www.mongodb.com/mongodb-3.4) - db implementation

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Ares Lianos** - *Initial work* - [AresL](https://github.com/AresL)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc

