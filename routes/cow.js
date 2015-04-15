module.exports = (function() {
    var router = require('express').Router();
	var mongoose = require('mongoose');

	User = mongoose.model('User');
	Cow = mongoose.model('Cow');

	router.get('/:id', function(req, res){
		Cow.findOne({ _id: req.params.id}).lean(true).exec(function (err, cow) {
			if (!cow) return res.send(500);
			User.findOne({ _id: cow.user_id}).select('name').lean(true).exec(function (err, user) {
				res.json({
					cow: cow,
					user: user
				});
			});
		});
	});
	// router.get('/:id/delete', checkAdmin, function(req, res){
	// 	Cow.findOne({ _id: req.params.id}).exec(function (err, cow) {
	// 		cow.remove();
	// 		res.send('y');
	// 	});
	// });
	// router.get('/:id/activate', checkAdmin, function(req, res){
	// 	Cow.findOne({ _id: req.params.id}).exec(function (err, cow) {
	// 		cow.is_active = !cow.is_active;
	// 		cow.save();
	// 		res.send(cow);
	// 	});
	// });
	router.post('/update', function(req, res){
		if (!req.session.user_id) {
			return res.json({ err: 'Could not pull up your user record', refresh: true });
		}
		// req.session._garbage = Date();
	 //    req.session.touch();

		Cow.findOne({ user_id: req.session.user_id, is_active: true }).exec(function (err, cow) {
			if (err) return res.send(err);
			if (!cow) return res.json({ err: 'no cow found' });
			if (req.body.h) cow.happiness = Math.floor(req.body.h);
			if (req.body.name && req.body.name.length <= 20) cow.name = req.body.name;
			if (req.body.skin) cow.skin = req.body.skin;
			if (!cow.experience) cow.experience = 0;

			if (req.body.experience) {
				if (cow.experience < req.body.experience - 10 || cow.experience > req.body.experience) return res.json({ resync: true, err: 'Your cow is out of sync', experience: cow.experience });
				cow.level = 100 * ( cow.experience / ( cow.experience + 1000 ) );
				cow.experience = req.body.experience;
			}
			if (req.body.memory) {
				if (!cow.memories) cow.memories = [];
				cow.memories.push(req.body.memory);
				cow.markModified('memories');
			}
			if (req.body.items) {
				if (req.body.items_check) {
					var b = new Buffer(req.body.items_check, 'base64');
					var s = b.toString();
					if (JSON.stringify(req.body.items) != s) {
						return res.json({ err: 'Item check failed'});
					}
				}
				for (var i = 0; i < req.body.items.length; i++) {
					var item = req.body.items[i].split('/');
					if (item[1] > 10 || item[2] > 10 || item[3] > 10) {
						req.body.items.splice(i, 1);
					}
				}
				cow.items = req.body.items;
				if (false && cow.items[cow.items.length - 1] == 'wings_bat') {
					User.findOne({ _id: req.session.user_id }, function (err, user) {
						if (user.badges.indexOf(7) == -1) {
							user.badges.unshift(7);
							user.markModified('badges');
							user.save();
						}
					});
				}
				if (cow.items.length > 12) {
					cow.items = cow.items.slice(0, 12);
				}
				cow.markModified('items');
			}
			cow.save(function (err) {
				if (err) return res.send(err);
				res.send(cow);
			});
		});
	});
	router.post('/new', function(req, res){
		if (!req.session.user_id) return res.send('please log in');
		Cow.find({ user_id: req.session.user_id }).exec(function (err, cows) {
			var len = cows.length;
			var previous_skins;
			var previous_cow;
			for (var i = 0; i < len; i++) {
				if (cows[i].is_active) {
					if (cows[i].level < 5) {
						return res.json({ err: 'Your cow is not ready (Only level ' + cows[i].level + ')'});
					}
					previous_cow = cows[i].name;
					cows[i].is_active = false;
					previous_skins = cows[i].skins_unlocked;
					cows[i].save();
				}
			}
			var newcow = new Cow({
				name: req.body.name,
				user_id: req.session.user_id,
				strength: Math.floor((Math.random() * 8) + 8 + len),
				intelligence: Math.floor((Math.random() * 8) + 8 + len),
				constitution: Math.floor((Math.random() * 8) + 8 + len),
				is_active: true,
				skins_unlocked: previous_skins,
				created_at: new Date()
			});
			newcow.save(function (err, newcow) {
				if (err) return res.send(err);
				res.send(newcow);

				if (req.body['fb_adopt_share']) {
					User.findOne({ _id: req.session.user_id }, function (err, user) {
						//facebook.postMessage(user.facebook_token, 'It is time to say good bye to my cow ' + previous_cow + ' and hello to my new cow ' + newcow.name + ' in Ice Cream Stand.', res);	
					});
				}
			});
		});
	});
	router.get('/all', function(req, res){
		Cow.find().limit(100).lean(true).exec(function (err, cows) {
			res.send(cows);
		});
	});
	return router;
})();