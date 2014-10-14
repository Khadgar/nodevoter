module.exports = function (VoteResults, Votes, io) {
	//timer begin
	//todo: ezt a logikat at kellene rakni masik fajlba.
	//az utolso lezart szavas eredmenyet el lehetne tarolni adatbazisban igy barmelyik oldalon lekerdezheto lenne
	var sec = 20;
	var timeout = setTimeout(function () {}, sec * 1000);

	setInterval(function () {
		console.log('Time left: ' + getTimeLeft(timeout) + 's');

		//elk�ldi a klienseknek hogy mennyi van hatra a kovetkezo szavazasig
		io.emit('timeleft', getTimeLeft(timeout));

		//itt resetelem a timert, ide lehetne beirni, hogy mi tortenjen ha lejar az ido
		if (getTimeLeft(timeout) == '0') {
			timeout = setTimeout(function () {}, sec * 1000);
			
			//itt meghivom a insertResults(callback) fuggvenyt de parameternek az altalam definialt query-t adom
			//lefutasa vegen a getresults meghivja a parameterenek adott fuggvenyt aminek a lekerdezes eredmenyet adta parameternek

			insertResults(query);
			//getAllResults(sendallresults);
		}
	}, 1000);

	//itt definialom a a callback fuggvenyt parameterrel. ha ezt nem tennem meg akkor a insertResults vegen a callback(votes) -nak nem lenne ertelme
	function query(mydata) {
		io.emit('lastres', mydata);
		console.log(mydata);
	}
	
	function sendallresults(mydata) {
		io.emit('allresults', mydata);
		console.log(mydata);
	}

	function getTimeLeft(timeout) {
		return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
	}
	
	//insert the closed vote result into the database
	function insertResults(callback) {
		var votes = null;

		process.nextTick(function () {
		//send the results to the client/clients
			Votes.findOne({
				id : '1'
			}, function (err, vote) {
				votes = vote.id + ',' + vote.option1 + ',' + vote.option2 + ',' + vote.option3;
				callback(votes);
		
		//insert the results into VoteResults collection
				var newresults = {
					vote_id : vote.id,
					results : vote.option1 + ',' + vote.option2 + ',' + vote.option3
				};
				var voteresult = new VoteResults(newresults);

				voteresult.save();
		
		//reset the vote
				Votes.findOne({
					id : '1'
				}, function (error, vote) {
					vote.option1 = 0;
					vote.option2 = 0;
					vote.option3 = 0;
					vote.save();
				});
				
				//utolso 3 lezart szavazas eredmenye. a kliens oldalon majd meg kell jeleniteni a dontessel egyutt.
				VoteResults.find({}, 'vote_id results').sort({'_id': -1}).limit(3).exec(function (err, result) {
					io.emit('allresults', result);
					console.log(result);
				});
				
			});
		});
	};
	//timer end
	
	
	function getAllResults(callback) {
		process.nextTick(function () {
		
			VoteResults.find({}, 'vote_id results').sort({'_id': -1}).limit(3).exec(function (err, result) {
				callback(result);
			});
			
		});
	};

}