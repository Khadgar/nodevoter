var mongoose = require('mongoose');

module.exports = function(mongoose) {
var Schema = mongoose.Schema;
var VoteResults = new Schema({
		vote_id : Number,
		results : String
	}, {
		collection : 'voteresults'
	});
	
	var model= mongoose.model('voteresults', VoteResults);

return model;
}