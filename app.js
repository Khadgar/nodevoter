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

//host https://mongolab.com
mongoose.connect('mongodb://dani:dani@ds063859.mongolab.com:63859/mydatabase')


//user model in user.js
var UserDetails = require(path.join(__dirname, './models/user.js'))(mongoose);

//vote model in vote.js
var Votes = require(path.join(__dirname, './models/votes.js'))(mongoose);

//voteresults collection
var VoteResults = require(path.join(__dirname, './models/voteresults.js'))(mongoose);

//settings collection
var Settings = require(path.join(__dirname, './models/settings.js'))(mongoose);

//authentication in auth.js
require(path.join(__dirname, './auth.js'))(passport, LocalStrategy, UserDetails);

//routing in routes.js
require(path.join(__dirname, './routes/routes.js'))(app,passport,UserDetails,Votes,VoteResults,Settings,io);

//decision making in decision.js
require(path.join(__dirname, './decision.js'))(VoteResults, Votes, Settings, io);


//create server
http.listen(app.get('port'), function () {
	console.log('Express server listening on localhost:' + app.get('port'));
});
