var path = require('path');
var ejs = require('ejs');
var fs = require('fs');
var five = require("johnny-five");

var led;

module.exports = function (app, passport, UserDetails, Votes, VoteResults, Settings, io) {

	var profilecontent = fs.readFileSync(path.join(__dirname, '../views/profile.html'), 'utf-8');
	var profilecompiled = ejs.compile(profilecontent);

	var admincontent = fs.readFileSync(path.join(__dirname, '../views/admin.html'), 'utf-8');
	var admincompiled = ejs.compile(admincontent);

	var errorcontent = fs.readFileSync(path.join(__dirname, '../views/error.html'), 'utf-8');
	var errorcompiled = ejs.compile(errorcontent);

	var votecontent = fs.readFileSync(path.join(__dirname, '../views/vote.html'), 'utf-8');
	var votecompiled = ejs.compile(votecontent);

	var indexcontent = fs.readFileSync(path.join(__dirname, '../views/index.html'), 'utf-8');
	var indexcompiled = ejs.compile(indexcontent);

	//	old index routing. file in .old folder
	//	app.get('/', function (req, res) {
	//		console.log("index.html");
	//		console.log(path.join(__dirname, '../views/index.html'));
	//		Votes.findOne({
	//			id : '1'
	//		}, function (error, vote) {
	//			res.writeHead(200, {
	//				'Content-Type' : 'text/html'
	//			});
	//			res.end(indexcompiled({
	//					o1 : vote.option1,
	//					o2 : vote.option2,
	//					o3 : vote.option3
	//				}));
	//		});
	//	});


	app.get('/login', function (req, res) {
		console.log("login.html");

		res.sendfile(path.join(__dirname, '../views/index.html'));

	});

	app.get('/reset', function (req, res) {
		Votes.findOne({
			id : '1'
		}, function (error, vote) {
			vote.option1 = 0;
			vote.option2 = 0;
			vote.option3 = 0;
			vote.save();
		});
		res.redirect('/admin');
	});
	
	app.get('/clear', function (req, res) {
		VoteResults.remove().exec();
		
		var emptyrow = {
			vote_id: 1,
			results: "0,0,0,Can not decide."
		};
	
		var row = new VoteResults(emptyrow);
		row.save();
		var row = new VoteResults(emptyrow);
		row.save();
		var row = new VoteResults(emptyrow);
		row.save();
		res.redirect('/admin');
	});

	app.post('/login',
		passport.authenticate('local', {
			successRedirect : '/loginSuccess',
			failureRedirect : '/loginFailure'
		}));

	app.post('/signup', function (req, res) {

		UserDetails.findOne({
			'username' : req.body.username
		}, function (err, user) {
			if (user) {
				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				res.end(errorcompiled({
						errormsg : 'Username exists!'
					}));
			} else {

				if (req.body.username != '' && req.body.password != '') {
					var newuserdate = {
						username : req.body.username,
						password : req.body.password,
						fullname : req.body.fullname,
						age : req.body.age,
						role : req.body.role
					};
					var user = new UserDetails(newuserdate);

					user.save(function (error, data) {
						if (error) {
							res.json(error);
						} else {
							res.redirect('/admin');
						}
					});
				} else {
					res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					res.end(errorcompiled({
							errormsg : 'You have to fill username and password fields!'
						}));
				}

			}
		});

	});

	io.on('connection', function (socket) {
		console.log('a user connected');

		socket.on('message', function (msg) {
			console.log('message: ' + msg);

			getResult(function (data) {
				io.emit('votes', data);
				console.log(data);

			});
		});

		socket.on('disconnect', function () {
			console.log('user disconnected');
		});
	});

	app.post('/submitvote', function (req, res) {
		console.log(req.body.options);

		if (req.body.options == 'option1') {
			process.nextTick(function () {
				Votes.findOne({
					id : '1'
				}, function (error, vote) {
					vote.option1 += 1;
					vote.save();
					io.emit('votes', vote.option1 + ',' + vote.option2 + ',' + vote.option3);
				});
			});
		} else if (req.body.options == 'option2') {
			process.nextTick(function () {
				Votes.findOne({
					id : '1'
				}, function (error, vote) {
					vote.option2 += 1;
					vote.save();
					io.emit('votes', vote.option1 + ',' + vote.option2 + ',' + vote.option3);
				});
			});
		} else if (req.body.options == 'option3') {
			process.nextTick(function () {
				Votes.findOne({
					id : '1'
				}, function (error, vote) {
					vote.option3 += 1;
					vote.save();
					io.emit('votes', vote.option1 + ',' + vote.option2 + ',' + vote.option3);
				});
			});
		}

		//		getResult(function (data) {
		//			io.emit('votes', data);
		//			console.log("post: " + data);
		//
		//		});

		res.redirect('/results');

	});

	//ha tobb szavazas lenne ahol mondjuk nem csak 3 lehetosegre lehet szavazni akkor be lehet vezetni egy votid parametert
	//a votes adatbazisban id alapjan tarolodnak a szavazatok
	function getResult(callback) {
		var votes = null;
		process.nextTick(function () {
			Votes.findOne({
				id : '1'
			}, function (err, vote) {
				votes = vote.option1 + ',' + vote.option2 + ',' + vote.option3;
				callback(votes);
			});
		});
	};

	var isAuthenticated = function (req, res, next) {
		if (req.isAuthenticated())
			return next();
		console.log(req.user);
		res.redirect('/login');
	}

	app.get('/', isAuthenticated, function (req, res, next) {
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		res.end(profilecompiled({
				username : req.user.username
			}));
	});

	app.get('/personal', isAuthenticated, function (req, res, next) {
		UserDetails.findOne({
			username : req.user.username
		}, function (error, user) {
					res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		res.end(profilecompiled({
				username : user.fullname
			}));
		});
	});

	app.get('/loginFailure', function (req, res, next) {
		res.redirect('/');
	});

	app.get('/led', function (req, res, next) {
		res.sendfile(path.join(__dirname, '../views/led.html'));
	});

	//Initializing the board and the led
	var board = new five.Board();
	board.on("ready", function () {
		led = new five.Led({
				pin : 5
			});
		console.log('LED initialized!');
	});

	var brightness = 0;

	//Increase the brightness of the LED
	app.post('/ledon', function (req, res) {
		//led.on();
		if (brightness < 255) {
			brightness += 15;
			led.brightness(brightness);
			console.log('brightness: ' + brightness);
		} else if (brightness == 255) {
			brightness = 0;
			led.brightness(brightness);
			console.log('brightness: ' + brightness);
		}

		res.redirect('/led');
	});

	//Decrease the brightness of the LED
	app.post('/ledoff', function (req, res) {
		//led.off();
		if (brightness > 0) {
			brightness -= 15;
			led.brightness(brightness);
			console.log('brightness: ' + brightness);
		} else if (brightness == 0) {
			brightness = 255;
			led.brightness(brightness);
			console.log('brightness: ' + brightness);
		}
		res.redirect('/led');
	});

	app.get('/loginSuccess', function (req, res, next) {
		res.redirect('/personal');
	});

	app.get('/admin', isAuthenticated, function (req, res, next) {

		process.nextTick(function () {
			UserDetails.findOne({
				username : req.user.username
			}, function (error, user) {
				console.log(user.role)
				//json string double quoted
				if (user.role == "on") {
					res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					res.end(admincompiled({
							username : user.fullname
						}));
				} else {
					res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					res.end(errorcompiled({
							errormsg : 'You have to log in as admin to see this page!'
						}));
				}
			});
		});

	});

	app.post('/setup', function (req, res) {
		Settings.findOne({
			id : '1'
		}, function (error, set) {
			if (req.body.votetimeout != ''){
				set.votetimeout = parseInt(req.body.votetimeout);
			}
			console.log(req.body.votetimeout);
			set.save();
		});
		res.redirect('/admin');
	});
	
	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/vote', isAuthenticated, function (req, res) {
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		res.end(votecompiled({
				username : req.user.username
			}));
			
	});

	app.get('/results', function (req, res) {
		res.sendfile(path.join(__dirname, '../views/results.html'));
	});

};