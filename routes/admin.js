module.exports = (function() {
    var router = require('express').Router();
	var mongoose = require('mongoose');
	User = mongoose.model('User');
	Epic = mongoose.model('Epic');
	Chapter = mongoose.model('Chapter');

    function checkAdmin(req, res, next) {
	  if (req.session.user_id) {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user.is_admin) return res.redirect('/');
			next();
		});
	  } else {
	    res.redirect('/');
	  }
	}

	function checkMod(req, res, next) {
	  if (req.session.user_id) {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || (!user.is_mod && !user.is_admin)) return res.redirect('/');
			next();
		});
	  } else {
	    res.redirect('/');
	  }
	}

    router.get('/', checkAdmin, function(req, res){
		Epic.find({}, function (err, epics) {
			Chapter.find({}).sort('saga chapter_number').exec(function (err, chapters) {
				res.render('admin', { epics: epics, chapters: chapters });
			});
		});
	});

	router.get('/check', checkAdmin, function(req, res){
    	res.send('y');
    });
	router.post('/chapter', checkMod, function(req, res){
		var newChapter = new Chapter(req.body.chapter);
		newChapter.save(function (err, chap) {
			if (err) return res.send(err);
			res.redirect('/admin');
		});
	});
	router.get('/chapter/:id/remove', checkMod, function(req, res){
		Chapter.findOne({ _id: req.params.id }).exec(function (err, chapter) {
			chapter.remove();
			res.redirect('/admin');
		});
	});
	router.get('/chapter/:id/edit', checkMod, function(req, res){
		Chapter.findOne({ _id: req.params.id }).lean(true).exec(function (err, chapter) {
			if (!chapter.badge_id) chapter.badge_id = 0;
			res.send( helper_update_object(chapter, 'chapter') );
		});
	});
	router.post('/chapter/:id/edit', checkMod, function(req, res){
		Chapter.findOne({ _id: req.params.id }, function (err, chapter) {
			if (!chapter) return res.send('no chapter found');
			var changes = '';
			for (var i in req.body.chapter) {
				if (chapter[i] != req.body.chapter[i]) {
					changes = changes + '<br> Updated: ' + i;
					chapter[i] = req.body.chapter[i];
				}
			}

			chapter.save(function (err, chapter) {
				if (err) return res.send(err);
				res.send(changes);
			});
		});
	});

	router.post('/epic', checkAdmin, function(req, res){
		var epic = new Epic(req.body.epic);
		epic.save(function (err, epic) {
			if (err) return res.send(err);
			return res.send(epic);
		});
	});
	router.get('/epic/:id/remove', checkAdmin, function(req, res){
		Epic.findOne({ _id: req.params.id }, function (err, epic) {
			epic.remove();
			res.redirect('/admin');
		});
	});
	router.get('/combo/:id/edit', checkAdmin, function(req, res){
		Combo.findOne({ _id: req.params.id }).lean(true).exec(function (err, combo) {
			res.send( helper_update_object(combo, 'combo') );
		});
	});
	router.post('/combo/:id/edit', checkAdmin, function(req, res){
		Combo.findOne({ _id: req.params.id }, function (err, combo) {
			if (!req.body) return res.send('no combo updates');

			combo.name = req.body.combo.name;
			combo.topping_id = req.body.combo.topping_id;
			combo.flavor_id = req.body.combo.flavor_id;
			combo.flavor_id = req.body.combo.flavor_id;
			combo.value = req.body.combo.value;

			combo.save(function (err, combo) {
				res.redirect('/admin');
			});
		});
	});
	router.get('/epic/:id/edit', checkAdmin, function(req, res){
		Epic.findOne({ _id: req.params.id }).select('name total text event players').lean(true).exec(function (err, epic) {
			res.send( helper_update_object(epic, 'epic') );
		});
	});
	router.post('/epic/:id/edit', checkAdmin, function(req, res){
		Epic.findOne({ _id: req.params.id }, function (err, epic) {
			if (!req.body) return res.send('no epic updates');
			epic.name = req.body.epic.name;
			epic.total = req.body.epic.total;
			epic.text = req.body.epic.text;
			epic.event = req.body.epic.event;
			epic.players = req.body.epic.players;
			epic.save(function (err, epic2) {
				res.redirect('/admin');
			});
		});
	});
	router.get('/epic/clear', checkAdmin, function(req, res){
		User.find({
			epic_id: { $ne: null}
		}).select('epic_id epic_collected').exec(function (e, users) {
			for (var i = 0; i < users.length; i++) {
				var u = users[i];
				u.epic_id = null;
				u.epic_collected = 0;
				u.save();
			}
			
		});

		Epic.find({}, function (e, epics) {
					for (var i = 0; i < epics.length; i++) {
						var epic = epics[i];
						epic.total = 0;
						epic.players = 0;
						epic.save();
					}
					
			});

		res.send('CLEARED');
	});
	router.get('/event/edit', checkAdmin, function(req, res){
		Topping.find({ }).sort('event').select('name event').exec(function (err, addons) {
			var ret = '<table>';
			for (var i = 0; i < addons.length; i++) {
				var addon = addons[i];
				ret = ret + '<tr><Td>' + addon.name + '</td><td>' + addon.event + '</td><td><a href="/edit_addon?name=' + addon.name + '">edit</td></tr>';
			}
			res.send(ret);
		});
	});
	router.get('/gold_restart', checkAdmin, function(req, res){ 
		try {
		var f_name = req.param('name', null);  // second parameter is default
		User.findOne({ name: f_name }, function (err, user) {
			if (err || !user) return res.send(500, 'er: ' + err);
			user.total_gold = 0;
			user.gold = 0;
			user.save(function (err,u) { res.send(u); });
		});
		} catch (err) { res.send(500, err); }
	});
	router.get('/password_restart', checkAdmin, function(req, res){ 
		try {
		var f_name = req.param('name', null);  // second parameter is default
		var pass = req.param('password', null);  // second parameter is default
		User.findOne({ name: f_name }).select('+password').exec(function (err, user) {
			if (err || !user) return res.send(500, 'er: ' + err);
			user.password = pass;
			user.save(function (err,u) { res.send(u); });
		});
		} catch (err) { res.send(500, err); }
	});
	router.get('/squelch', checkAdmin, function(req, res){ 
		try {
		var f_name = req.param('name', null);  // second parameter is default
		User.findOne({ name: f_name }).exec(function (err, user) {
			if (err || !user) return res.send(500, 'er: ' + err);
			user.chat_squelch = !user.chat_squelch;
			user.save(function (err,u) { res.send(u); });
		});
		} catch (err) { res.send(500, err); }
	});
	return router;
})();