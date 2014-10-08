var mongoose = require('mongoose');

module.exports = function(mongoose) {
var Schema = mongoose.Schema;
var Vote = new Schema({
		id : Number,
		option1 : Number,
		option2 : Number,
		option3 : Number
	}, {
		collection : 'votes'
	});
	
	var model= mongoose.model('votes', Vote);

return model;
}