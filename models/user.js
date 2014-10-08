var mongoose = require('mongoose');

module.exports = function(mongoose) {
var Schema = mongoose.Schema;
var UserDetail = new Schema({
		username : String,
		password : String
	}, {
		collection : 'userInfo'
	});
	
	var model= mongoose.model('userInfo', UserDetail);

return model;
}