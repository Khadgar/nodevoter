var express = require('express');
var path = require('path');

var ejs = require('ejs');
var fs = require('fs');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var io = require('socket.io')(http);


//configure the app
app.set('port', process.env.PORT || 3000);
app.use(express.cookieParser('dandroid'));
app.use(express.session({secret: 'cookie_secret'}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(passport.initialize());
app.use(passport.session());

//alapertelmezetten a connect 5 kapcsolatot nyit. poolSize-zal lehet szabalyozni
//mongo.Db.connect('mongodb://localhost:27017/testDB', {server: {poolSize: 1}});

//mongoose.connect('mongodb://localhost/MyDatabase');

mongoose.connect('mongodb://dani:dani@ds063859.mongolab.com:63859/mydatabase')


//user model in user.js
var UserDetails = require(path.join(__dirname, './models/user.js'))(mongoose);

//vote model in vote.js
var Votes = require(path.join(__dirname, './models/votes.js'))(mongoose);

//authentication in auth.js
require(path.join(__dirname, './auth.js'))(passport, LocalStrategy, UserDetails);

//routing in routes.js
require(path.join(__dirname, './routes/routes.js'))(app,passport,UserDetails,Votes,io);

//timer begin
//todo: ezt a logikat at kellene rakni masik fajlba. 
//az utolso lezart szavas eredmenyet el lehetne tarolni adatbazisban igy barmelyik oldalon lekerdezheto lenne
var sec = 20;
var timeout = setTimeout(function() {}, sec * 1000);


setInterval(function() {
    console.log('Time left: '+getTimeLeft(timeout)+'s');
	
	//elküldi a klienseknek hogy mennyi van hatra a kovetkezo szavazasig
	io.emit('timeleft', getTimeLeft(timeout));
	
	//itt resetelem a timert, ide lehetne beirni, hogy mi tortenjen ha lejar az ido
	if(getTimeLeft(timeout) == '0'){
		timeout = setTimeout(function() {}, sec * 1000);
		
//		getResult(function (data) {
//				io.emit('lastres', data);
//				console.log(data);
//			});

		//itt meghivom a getResult(callback) fuggvenyt de parameternek az altalam definialt query-t adom
		//lefutasa vegen a getresults meghivja a parameterenek adott fuggvenyt aminek a lekerdezes eredmenyet adta parameternek 
		
		getResult(query);
	}
}, 1000);

//itt definialom a a callback fuggvenyt parameterrel. ha ezt nem tennem meg akkor a getresults vegen a callback(votes) -nak nem lenne ertelme

function query(mydata){
	io.emit('lastres',mydata);
	console.log(mydata);
}

function getTimeLeft(timeout) {
    return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
}

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
//timer end

//create server
http.listen(app.get('port'), function () {
	console.log('Express server listening on localhost:' + app.get('port'));
});
