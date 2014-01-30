/**
	* .-. .---. .----.    .---. .----. .----.  .--.  .-.   .-.    .----..---.  .--.  .-. .-..----. 
	* | |/  ___}| {_     /  ___}| {}  }| {_   / {} \ |  `.'  |   { {__ {_   _}/ {} \ |  `| || {}  \
	* | |\     }| {__    \     }| .-. \| {__ /  /\  \| |\ /| |   .-._} } | | /  /\  \| |\  ||     /
	* `-' `---' `----'    `---' `-' `-'`----'`-'  `-'`-' ` `-'   `----'  `-' `-'  `-'`-' `-'`----'
	* NOW OPEN SOURCED - V 1.13C
	* 
	* Module dependencies.
	* RUN THIS IN webapps/mongodb_master: nohup $HOME/webapps/mongodb_master/mongodb-linux-i686-2.4.6/bin/mongod --auth --dbpath $HOME/webapps/mongodb_master/data/ --port 17916 &
	* 
	* 
	* forever start -w -e $HOME/webapps/icecream/err --spinSleeptime 10000  $HOME/webapps/icecream/main/app.js 
	* misc: NODE_ENV=production forever start index.js
 */
 
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10
  , crypto = require('crypto')
  , assert = require('assert');
 
var MongoStore  = require('connect-mongo')(express);
var mongoose = require('mongoose');
var db = mongoose.connection;

var session_conf = {
  db: {
    db: 'admin', 
    host: 'localhost', 
    port: 17916,  // optional, default: 27017
    username: 'username here', // optional
    password: 'password here', // optional
    collection: 'mySessions' // optional, default: sessions
  },
  secret: 'secret here'
};
mongoose.connect('mongodb://localhost:17916/admin', { auto_reconnect: true, user: session_conf.db.username, pass: session_conf.db.password });

var app = express();

// all environments
app.set('port', process.env.PORT || 15888);
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(express.logger('dev'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session({ 
	secret: session_conf.secret, 
	cookie: { maxAge: 360000000000 },
	store: new MongoStore(session_conf.db)
}));
app.use(app.router);

/* OUR SCHEMA */
var userSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	ip: { type: String },
	password: { type: String, select: false },
	gold: { type: Number, default: 0 },
	total_gold: { type: Number, default: 0 },
	today_gold: { type: Number, default: 0 },
	today_date: { type: Number, default: 0 },
	week_gold: { type: Number, default: 0 },
	week_date: { type: Number, default: 0 },
	flavors: { type: [String], default: '5238d9bc76c2d60000000001'},
	flavors_sold: { type: [String], default: '0'},
	toppings: { type: [String], default: '523d42d376a5e10000000001' },
	combos: { type: [String] },
	quests: { type: [String]},
	achievements: { type: [String]},
	employees: { type: Number, default: 0},
	carts: { type: Number, default: 0},
	trucks: { type: Number, default: 0},
	robots: { type: Number, default: 0},
	rockets: { type: Number, default: 0},
	upgrade_machinery: { type: Number, default: 0},
	upgrade_storesize: { type: Number, default: 0},
	upgrade_flavor: { type: Number, default: 0},
	upgrade_addon: { type: Number, default: 0},
	upgrade_heroic: { type: Number, default: 0},
	upgrade_legendary: { type: Number, default: 0},
	last_flavor: { type: String, default: '5238d9bc76c2d60000000001' },
	last_addon: { type: String, default: '523d42d376a5e10000000001' },
	created_at    : { type: Date },
	updated_at    : { type: Date },
	last_employee_at : { type: Date },
	icecream_sold: { type: Number, default: 0 },
	trend_bonus: { type: Number, default: 0.75 },
	tutorial: { type: Number, default: 0 },
	workers_sold: { type: Number, default: 0 },
	is_guest: { type: Boolean, default: true },
	referals: { type: Number, default: 0 },
	referal_code: { type: String },
	gross_sold: { type: Number, default: 0 },
	badge_quests: { type: Boolean },
	animations_off: { type: Boolean },
	chat_off: { type: Boolean },
	release_channel: { type: Number, default: 0 }, 
	prestige_level: { type: Number, default: 0 }, 
	prestige_bonus: { type: Number, default: 0 }, 
	prestige_array: { type: [Number] }, 
	friends: { type: [String] }, 
	is_admin: { type: Boolean }, 
});
userSchema.methods.getPublicFields = function () {
    var returnObject = { //holy giant return statement batman
        name: this.name,
        ip: this.ip,
        gold: this.gold,
        total_gold: this.total_gold,
        icecream_sold: this.icecream_sold,
		flavors: this.flavors,
		flavors_sold: this.flavors_sold,
		toppings: this.toppings,
		combos: this.combos,
		quests: this.quests,
		achievements: this.achievements,
		employees: this.employees,
		carts: this.carts,
		trucks: this.trucks,
		robots: this.robots,
		rockets: this.rockets,
		upgrade_storesize: this.upgrade_storesize,
		upgrade_machinery: this.upgrade_machinery,
		upgrade_flavor: this.upgrade_flavor,
		upgrade_addon: this.upgrade_addon,
		upgrade_heroic: this.upgrade_heroic,
		last_flavor: this.last_flavor,
		last_addon: this.last_addon,
		last_employee_at: this.last_employee_at,
		updated_at: this.updated_at,
		trend_bonus: this.trend_bonus,
		tutorial: this.tutorial,
		workers_sold: this.workers_sold,
		is_guest: this.is_guest,
		referals: this.referals,
		referal_code: this.referal_code,
		gross_sold: this.gross_sold,
		badge_quests: this.badge_quests,
		animations_off: this.animations_off,
		chat_off: this.chat_off,
		release_channel: this.release_channel,
		prestige_level: this.prestige_level,
		prestige_bonus: this.prestige_bonus,
		prestige_array: this.prestige_array,
		friends: this.friends,
    };
    return returnObject;
};
userSchema.pre('save', function(next) {
    var user = this;
	user.updated_at = new Date;
	if ( !user.created_at ) {
		user.created_at = new Date;
	}
	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) return next();

	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) return next(err);

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
function checkAuth(req, res, next) {
  if (req.session.user_id) {
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return next();
		res.render('index', {release_channel:user.release_channel});
	});
  } else {
    next();
  }
}
function checkAdmin(req, res, next) {
  if (req.session.user_id) {
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user.is_admin) return res.render('index', {release_channel:0});
		next();
	});
  } else {
    res.render('index', {release_channel:0});
  }
}
var User = mongoose.model('User', userSchema);


var messageSchema = new mongoose.Schema({
	text: { type: String, required: true },
	user: { type: String, required: true },
	is_admin: Boolean,
	created_at: { type: Date },
});
var Message = mongoose.model('Message', messageSchema);

var flavorSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	description: { type: String },
	cost: { type: Number, required: true, default: 250 },
	base_value: { type: Number, default: 2.0 },
	value: { type: Number, default: 2.0 },
	svg: { type: Boolean, default: false }
});
var Flavor = mongoose.model('Flavor', flavorSchema);

var toppingSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	event: { type: String },
	cost: { type: Number, required: true, default: 250 },
	base_value: { type: Number, default: 1.0 },
	value: { type: Number, default: 1.0 }
});
var Topping = mongoose.model('Topping', toppingSchema);

var comboSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	flavor_id: { type: String, required: true  },
	topping_id: { type: String, required: true },
	value: { type: Number, required: true }
});
var Combo = mongoose.model('Combo', comboSchema);

var questSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	level: { type: Number, required: true  },
	cost: { type: Number, required: true  },
	description: { type: String, required: true },
});
var Quest = mongoose.model('Quest', questSchema);

var achievementSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	description: { type: String, required: true },
});
var Achievement = mongoose.model('Achievement', achievementSchema);

app.get('/', checkAuth, function(req, res) {
	try {
	User.find({ ip: req.headers['x-forwarded-for'] }).select("+password").exec(function (err, users) {
		if (users.length == 0) {//create user
			var text = "guest_";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < 5; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
			
			var newuser = new User({
				name: text.toLowerCase(),
				ip: req.headers['x-forwarded-for']
			});
			newuser.save(function(err, u) {
				if (err) return res.send(err);
				req.session.user_id = u._id;
				res.render('index', {release_channel:u.release_channel});
			});
		} else { //user already with your ip
			if (!users[0].password && users.length == 1) { //more then one user or user[0] has a password
				req.session.user_id = users[0]._id;
				//res.send(users);
				res.render('index', {release_channel:users[0].release_channel});
			} else {
				res.redirect('login');
			}
		}
	});
	} catch (err) { res.redirect('login'); }
});

app.get('/flavors', function(req, res){
	try {
	if (!req.xhr) return res.redirect('/');
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (!user) return res.send('[{}]'); 
		if (!user.upgrade_flavor) user.upgrade_flavor = 0;
		if (err || !user) return res.send('[{}]');
		Flavor.find().sort('cost').limit((user.upgrade_flavor + 1) * 3).exec(function (err, flavors) {
			if (err || !flavors) return res.send(500, err);
			res.send( flavors );
		});
	});
	} catch (err) { res.send(500, err); }
});
app.get('/toppings', function(req, res){
	try {
	if (!req.xhr) return res.redirect('/');
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send('{}');
		Topping.find().sort('cost').limit((user.upgrade_addon + 1) * 3).exec(function (err, toppings) {
			res.send( toppings );
		});
	});
	} catch (err) {
		res.send(500, err);
	}
});
app.get('/combos', function(req, res){
	if (!req.xhr) return res.redirect('/');
	Combo.find().exec(function (err, combos) {  
		res.send( combos );
	});
});
app.get('/achievements', function(req, res){
	if (!req.xhr) return res.redirect('/');
	Achievement.find().exec(function (err, a) {  
		res.send( a );
	});
});
app.get('/trending', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send(500, err);
		var len = user.flavors.length - 1;
		if (user.flavors.length == 1) len = 2;
		Flavor.find({ 'base_value' : {'$lt' : 3}, name: {'$ne': 'vanilla' } }).sort('cost').limit(len).sort('description').exec(function (err, flavors) { 
			if (err || !flavors) return res.send(500, err);
			var x = new Date( );
			var hours = x.getHours();
			var total_mins = (hours * 60) + x.getMinutes();
			var y = Math.floor(total_mins/5) % flavors.length;
			var f_array = [];
			for (var counter = 0; counter < 5; counter++) {
				if (!flavors[y + counter]) y = 0 - counter;
				var f = {
					_id : flavors[y + counter]._id,
					name : flavors[y + counter].name,
					mins : 5 - (total_mins%5),
					y : y
				};
				f_array.push(f);
			}

			res.send( f_array );
		});
	});
	} catch (err) {
		res.send(err);
	}
});
app.get('/event', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send('{"event":false}');
		if (!user.toppings || user.toppings.length < 2) return res.send('{"event":false}');
		var x = new Date( );
		var hours = x.getHours();
		var current_mins = Math.floor( ((hours * 60) + x.getMinutes())/20 ); //current minutes in the day divided by 20
		var total_mins = Math.floor( ((24 * 60) + x.getMinutes())/20 ); //total minutes in the day divided by 20
		var y = Math.floor((current_mins*user.toppings.length)/total_mins); //current/total scaled to x/55
		var z = ((hours * 60) + x.getMinutes()) % 20;
		if (z < 3) {
			Topping.find({ 'base_value' : {'$lt' : 1.1} }).sort('event').exec(function (err, addons) {
				if (err) return res.send(err);
				if (!addons[y]) y = 0;
				var f = {
					_id : addons[y]._id,
					name : addons[y].name,
					event : addons[y].event,
					mins : (3 - z)
				};
				res.send( f );
			});
		} else {
			res.send('{"event":false,"time":' + z + '}');
		}
	});
	} catch (err) { res.send(500, err); }
});
app.get('/edit_flavor', checkAdmin, function(req, res){ //admin function
	try {
	var f_name = req.param('name', null);  // second parameter is default
	Flavor.findOne({name : f_name.toLowerCase()}, function (err, flavor) {
		if (!flavor || err) return res.send('cant find');
		res.send('<form action="flavors" method="POST">Name: <input name="_id" type="hidden" value="' + flavor._id + '"><input name="name" placeholder="name" value="' + flavor.name + 
			'"><br/>Description: <input name="description" placeholder="desc" value="' + flavor.description + '"><br/>Cost: <input name="cost" placeholder="cost" value=' + flavor.cost + 
			'><br/>Value: <input name="base_value" placeholder="base value" value=' + flavor.base_value + '><br />svg support: <input name="svg" type="checkbox"><input type="submit"></form>');
	});
	} catch (err) { res.send(500, err); }
});
app.get('/quests_restart', checkAdmin, function(req, res){ //admin function
	try {
	var f_name = req.param('name', null);  // second parameter is default
	User.findOne({ name: f_name }, function (err, user) {
		if (err || !user) return res.send(500, 'er: ' + err);
		user.trend_bonus = 0.75;
		user.quests = [];
		user.save(function (err,u) { res.send(u); });
	});
	} catch (err) { res.send(500, err); }
});
app.get('/gold_restart', checkAdmin, function(req, res){ //admin function
	try {
	var f_name = req.param('name', null);  // second parameter is default
	User.findOne({ name: f_name }, function (err, user) {
		if (err || !user) return res.send(500, 'er: ' + err);
		user.total_gold = 0;
		user.save(function (err,u) { res.send(u); });
	});
	} catch (err) { res.send(500, err); }
});

app.post('/user_update', function(req, res){
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send(err);
		if (post.username.length > 10) return res.send('name too long');
		if (post.username.length < 2) return res.send('name too short');
		user.name = post.username.toLowerCase();
		if (post.password) user.password = post.password.toLowerCase();
		if (post.release_channel) user.release_channel = post.release_channel;
		user.is_guest = false;
		user.save(function (err, u) {
			if (err) return res.send('can\'t update - maybe the username is taken?');
			res.redirect('/');
		});
	});
	} catch (err) { res.send(500, err); }
});
app.get('/edit_addon', checkAdmin, function(req, res){
	try {
	var f_name = req.param('name', null);  // second parameter is default
	Topping.findOne({name : f_name.toLowerCase()}, function (err, a) {
		if (!a || err) return res.send('cant find addon with that name');
		res.send('<form action="toppings" method="POST"><input name="_id" type="hidden" value="' + a._id + '">' +
			'Name: <input name="name" placeholder="name" value="' + a.name + '"><br/>' +
			'Event text: <input name="event" placeholder="event text" value="' + a.event + '"><br/>' +
			'Cost: <input name="cost" placeholder="cost" value=' + a.cost + '><br/>' +
			'Value: <input name="base_value" placeholder="base value" value=' + a.base_value + '><br/>' +
			'Delete: <input type="checkbox" name="remove"><input type="submit"></form>');
	});
	} catch (err) { res.send(500, err); }
});
app.get('/delete_combo', checkAdmin, function(req, res){
	try {
	var f_name = req.param('id', null);  // second parameter is default
	Combo.findOne({_id : f_name}, function (err, a) {
		a.remove();
		res.send('y');
	});
	} catch (err) { res.send(500, err); }
});
app.get('/add_combo', checkAdmin, function(req, res){
	try {
	Flavor.find().exec(function (err, fs) {
		Topping.find().exec(function (err, ts) {
			Combo.find().exec(function (err, cs) {
				var ret = '<style>td { background: #f1f1f1; padding: 5px; margin: 5px; width: 10%;}</style>' +
				'<table><tr><td><b>addon</b></td><td><b>flavor</b></td><td><b>total value</b></td><td><b>combo</b></td><td><b>percentage</b></td></tr>';
				for ( i in cs) {
					var sub_value = 0;
					ret = ret + '<tr>';
					for (j in ts) {
						if (ts[j]._id == cs[i].topping_id) { sub_value += ts[j].base_value; ret = ret + '<td>' + ts[j].name + ' (' + ts[j].base_value + ')</td>'; break; }
					}
					for (j in fs) {
						if (fs[j]._id == cs[i].flavor_id) { sub_value += fs[j].base_value; ret = ret + '<td>' + fs[j].name + ' (' + fs[j].base_value + ')</td>'; break; }
					}
					ret = ret + '<td>' + sub_value + '</td><td>' + cs[i].name + ' (' + cs[i].value + ') <a href="delete_combo?id=' + cs[i]._id + '" target="_blank">delete</a></td><td>' + (100*(cs[i].value/sub_value)) + '</td></tr>';
				}
				res.send(ret + '<form action="combo" method="POST">' +
					'<input name="topping_name" placeholder="add-on name">' + 
					'<input name="flavor_name" placeholder="base flavor name">' +
					'<input name="name" placeholder="Combination name">' +
					'<input name="value" placeholder="Value (+.05 to +.75)"><input type="submit" class="button" value="CREATE"></form>');
			});
		});
	});
	} catch (err) { res.send(500, err); }
}); 
app.post('/combo', checkAdmin, function(req, res){
	try {
	var post = req.body;
	Flavor.findOne({name : post.flavor_name.toLowerCase()}, function (err, flavor) {
		if (!flavor) return res.send('cant find base flavor');
		Topping.findOne({name : post.topping_name.toLowerCase()}, function (err, topping) {
			if (!topping) return res.send('cant find addon');
			Combo.findOne({flavor_id : flavor._id, topping_id : topping._id}, function (err, combo) {
				if (combo) {
					combo.value = post.value;
					combo.save(function(err, f) {
					 if (err) return res.send('Error,' + err);
					 res.send(f);
					});
				} else {
					var newcombo = new Combo(post);
					newcombo.name = post.name.toLowerCase();
					newcombo.value = post.value;
					newcombo.flavor_id = flavor._id;
					newcombo.topping_id = topping._id;
					newcombo.save(function(err, f) {
						 if (err) return res.send('Error,' + err);
						 res.send(f);
					});
				}
			});
		});
	}); 
	} catch (err) { res.send(500, err); }
});
app.post('/flavors', checkAdmin, function(req, res){
	try {
	var post = req.body;
	Flavor.findOne({_id : post._id}, function (err, flavor) {
		if (flavor) {
			flavor.name = post.name.toLowerCase();
			flavor.description = post.description;
			flavor.cost = post.cost;
			flavor.base_value = post.base_value;
			flavor.svg = post.svg;
			flavor.save(function(err, f) {
				 if (err) return res.send('Error,' + err);
				 res.send(f);
			});
		} else {
			var newflavor = new Flavor(post);
			newflavor.name = newflavor.name.toLowerCase();
			newflavor.value = newflavor.base_value;
			newflavor.save(function(err, f) {
				 if (err) return res.send('Error,' + err);
				 res.send(f);
			});
		}
	});
	} catch (err) { res.send(500, err); }
});
app.post('/toppings', checkAdmin, function(req, res){
	try {
	var post = req.body;
	Topping.findOne({_id : post._id}, function (err, topping) {
		if (topping) {
			topping.name = post.name.toLowerCase();
			topping.event = post.event;
			topping.cost = post.cost;
			topping.base_value = post.base_value;
			topping.value = topping.base_value;
			if (post.remove) {
				topping.remove();
				return res.send('deleted');
			}
			topping.save(function(err, f) {
				 if (err) return res.send('Error,' + err);
				 res.send(f);
			});
		} else {
			var newtopping = new Topping(post);
			newtopping.name = newtopping.name.toLowerCase();
			newtopping.value = newtopping.base_value;
			newtopping.save(function(err, f) {
				 if (err) return res.send('Error,' + err);
				 res.send(f);
			});
		}
	});
	} catch (err) { res.send(500, err); }
});
app.post('/unlock', function(req, res){
	try {
	var post = req.body;
	if (post.type == 'base') {
		Flavor.findOne({ _id : post.id }, function (err, flavor) {
			User.findOne({ _id: req.session.user_id }, function (err, user) {
				if (err || !user) return res.send(500);
				if (user.gold < flavor.cost) return res.send('{"error":"not enough money"}');
				for (i in user.flavors) {
					if (user.flavors[i] == flavor._id) return res.send('{"error":"already unlocked"}');
				}
				user.gold -= Math.round(flavor.cost*Math.pow(10,2))/Math.pow(10,2);
				user.flavors.unshift(flavor._id); //puts at beginning
				user.flavors_sold.unshift('0'); //puts at beginning
				user.save(function (err, u) {
					if (err) return res.send(err);
					res.send(u);
				});
			});
		});
	} else if (post.type == 'addon') {
		Topping.findOne({ _id : post.id }, function (err, topping) {
			User.findOne({ _id: req.session.user_id }, function (err, user) {
				if (err || !user) return res.send(500);
				if (user.gold < topping.cost) return res.send('{"error":"not enough money"}');
				for (i in user.toppings) {
					if (user.toppings[i] == topping._id) return res.send('{"error":"already unlocked"}');
				}
				user.gold -= Math.round(topping.cost*Math.pow(10,2))/Math.pow(10,2);
				user.toppings.push(topping._id);
				if (user.last_addon == '') user.last_addon = topping._id;
				user.save(function (err, u) {
					if (err) return res.send(err);
					res.send(u);
				});
			});
		});
	} else if (post.type=='sales_cart') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (post.sell == 'true') {
				if (user.carts <= 0) return res.send('{"error":"no carts left"}');
				user.carts--;
				var cost = 25 + (Math.pow(user.carts, 2) / 4);
				user.gold += Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
				user.workers_sold++;
			} else {
				var amount = (post.amount && post.amount > 0 && post.amount < 100)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 25 + (Math.pow(user.carts, 2) / 4);
					if (user.gold < cost) return res.send('{"error":"not enough money"}');
					if (user.carts >= 200 + (user.prestige_level * 100)) return res.send('{"error":"upgrade prestige"}');
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.carts++;
				}
			}
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});
	} else if (post.type=='sales_employee') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (post.sell == 'true') {
				if (user.employees <= 0) return res.send('{"error":"no workers left"}');
				user.employees--;
				var cost = 150 + (user.employees * 100);
				user.gold += Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
				user.workers_sold++;
			} else {
				var amount = (post.amount && post.amount > 0 && post.amount < 100)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 150 + (user.employees * 100);
					if (user.gold < cost) return res.send('{"error":"not enough money"}');
					if (user.employees >= 200 + (user.prestige_level * 100)) return res.send('{"error":"upgrade prestige"}');
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.employees++;
				}
			}
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});
	} else if (post.type=='sales_truck') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (post.sell == 'true') {
				if (user.trucks <= 0) return res.send('{"error":"no workers left"}');
				user.trucks--;
				var cost = 1000 + (user.trucks * user.trucks * 50);
				user.gold += Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
				user.workers_sold++;
			} else {
				var amount = (post.amount && post.amount > 0 && post.amount < 100)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 1000 + (user.trucks * user.trucks * 50);
					if (user.gold < cost) return res.send('{"error":"not enough money"}');
					if (user.trucks >= 200 + (user.prestige_level * 100)) return res.send('{"error":"upgrade prestige"}');
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.trucks++;
				}
			}
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});
	} else if (post.type=='sales_robot') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (post.sell == 'true') {
				if (user.robots <= 0) return res.send('{"error":"no workers left"}');
				user.robots--;
				var cost = 5000 + (user.robots * user.robots * 100);
				user.gold += Math.round(cost*Math.pow(10,2))/Math.pow(10,2);	
				user.workers_sold++;				
			} else {
				var amount = (post.amount && post.amount > 0 && post.amount < 100)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 5000 + (user.robots * user.robots * 100); 
					if (user.gold < cost) return res.send('{"error":"not enough money"}');
					if (user.robots >= 200 + (user.prestige_level * 100)) return res.send('{"error":"upgrade prestige"}');
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.robots++;
				}
			}
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});
	} else if (post.type=='sales_rocket') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (post.sell == 'true') {
				if (user.rockets <= 0) return res.send('{"error":"no workers left"}');
				user.rockets--;
				var cost = 50000 + (user.rockets * user.rockets * 500);
				user.gold += Math.round(cost*Math.pow(10,2))/Math.pow(10,2);	
				user.workers_sold++;				
			} else {
				var amount = (post.amount && post.amount > 0 && post.amount < 100)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 50000 + (user.rockets * user.rockets * 500);
					if (user.gold < cost) return res.send('{"error":"not enough money"}');
					if (user.rockets >= 200 + (user.prestige_level * 100)) return res.send('{"error":"upgrade prestige"}');
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.rockets++;
				}
			}
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});
	} else if (post.type=='machine') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 15000 + (user.upgrade_machinery * 150000);
			if (user.upgrade_machinery == 10) return res.send('{"error":"You have reached the maximum level"}');
			if (user.gold < cost) return res.send('{"error":"not enough money"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_machinery++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});  
	} else if (post.type=='research') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 50 + (user.upgrade_flavor * user.upgrade_flavor * 100);
			if (user.upgrade_flavor >= 23) return res.send('{"error":"You have reached the maximum level"}');
			if (user.flavors.length < (user.upgrade_flavor + 1) * 3) return res.send('{"error":"Please unlock all of the new flavors first"}');
			if (user.gold < cost) return res.send('{"error":"not enough money"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_flavor++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u); 
			}); 
		});  
	} else if (post.type=='research_addon') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 75+ (user.upgrade_addon * user.upgrade_addon * 100);
			if (user.upgrade_addon >= 23) return res.send('{"error":"You have reached the maximum level"}');
			if (user.toppings.length < (user.upgrade_addon + 1) * 3) return res.send('{"error":"Please unlock all of the new add-ons first"}');
			if (user.gold < cost) return res.send('{"error":"not enough money"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_addon++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});
	} else if (post.type=='heroic') { 
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 1000000 + (user.upgrade_heroic * 3000000);
			if (user.upgrade_heroic == 3) return res.send('{"error":"You have reached the maximum level"}');
			if (user.gold < cost) return res.send('{"error":"not enough money"}');
			if (user.flavors.length < (user.upgrade_flavor + 1) * 3) return res.send('{"error":"Please unlock all of the new flavors first"}');
			if (user.toppings.length < (user.upgrade_addon + 1) * 3) return res.send('{"error":"Please unlock all of the new add-ons first"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_heroic++; 
			user.upgrade_addon++;
			user.upgrade_flavor++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		});
	} else if (post.type=='legendary') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 50000000 + (user.upgrade_legendary * 100000000);
			if (user.upgrade_legendary == 2) return res.send('{"error":"You have reached the maximum level"}');
			if (user.gold < cost) return res.send('{"error":"not enough money"}');
			if (user.flavors.length < (user.upgrade_flavor + 1) * 3) return res.send('{"error":"Please unlock all of the new flavors first"}');
			if (user.toppings.length < (user.upgrade_addon + 1) * 3) return res.send('{"error":"Please unlock all of the new add-ons first"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_legendary++; 
			user.upgrade_addon++;
			user.upgrade_flavor++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		}); 
	} else if (post.type=='prestige') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (user.prestige_level >= 8) {
				var smallest_amount = user.prestige_array[0];
				var smallest_amount_index = 0;
				for (var i = 1; i < user.prestige_array.length; i++) {
					if (user.prestige_array[i] < smallest_amount) {
						smallest_amount = user.prestige_array[i];
						smallest_amount_index = i;
					}
				}
				user.prestige_bonus -= smallest_amount;
				user.prestige_level--;
				user.prestige_array.splice(smallest_amount_index, 1);
			}
			if (user.quests.length < 5) return res.send('{"error":"Complete quests"}');
			var x = user.gold;
			var gold_bonus = 25 * (x / (x + 1000000));
			var x2 = user.flavors.length + user.toppings.length;
			var unlock_bonus = (x2 / 171) * 25; 
			var x_total = gold_bonus + unlock_bonus;
			user.prestige_bonus = parseFloat(user.prestige_bonus + x_total).toFixed(2);
			user.prestige_level++;
			user.prestige_array.push(x_total);
			//reset it all
			user.gold = 0;
			user.carts = 0;
			user.employees = 0;
			user.trucks = 0;
			user.robots = 0;
			user.rockets = 0;
			user.upgrade_machinery = 0;
			user.upgrade_storesize = 0;
			user.upgrade_flavor = 0;
			user.upgrade_addon = 0;
			user.upgrade_heroic = 0;
			user.upgrade_legendary = 0;
			user.flavors = '5238d9bc76c2d60000000001';
			user.flavors_sold = '0';
			user.toppings = '523d42d376a5e10000000001';
			user.combos = [];
			user.quests = [];
			user.last_flavor = '5238d9bc76c2d60000000001';
			user.last_addon = '523d42d376a5e10000000001';
			user.trend_bonus = .75;
			user.workers_sold = 0;
			user.gross_sold = 0;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({reload:true});
			});
		});
	} else {
		res.send('{"error":"error"}');
	}
	} catch (err) { res.send(500, err); }
});
app.post('/signup', function(req, res){
	try {
	var post = req.body;
    if (post.name) {
		if (post.name.length < 2) return res.send('Name too short');
		if (post.name.length > 10) return res.send('Name too long');
		var newuser = new User({
			name: post.name.toLowerCase()
		});
		if (post.refer) newuser.referal_code = post.refer;
		if (post.password) newuser.password = post.password;
		newuser.save(function(err, user) {
		  if (err) return res.redirect('/?signed_succes=0');
		  req.session.user_id = user._id;
		  res.redirect('/');
		});
	} else {
		res.send("missing info!");
	}
	} catch (err) { res.send(500, err); }
});
app.get('/me', function(req, res){
	if (!req.session.user_id) return res.send('not logged in');
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(err);
		res.send(u);
	});
});
app.get('/reward', checkAdmin, function(req, res){
	try {
	var n = req.param('n', null);  // second parameter is default
	var a = req.param('a', null);  // second parameter is default
	User.findOne({ name : n }).exec(function (err, user) {
		user.gold += parseInt(a); 
		user.save(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	});
	} catch (err) { res.send(500, err); }
});
app.get('/promote', checkAdmin, function(req, res){
	try {
	var n = req.param('n', null);  // second parameter is default
	User.findOne({ name : n }, function(err, user) {
		if (err || !user) return res.send('err');
		user.is_admin = !(user.is_admin);
		user.save(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	});
	} catch (err) { res.send(500, err); }
});
app.get('/add_achievement', checkAdmin, function(req, res){
	res.send('<form action="add_achievement" method="POST">' +
	'<input name="id" placeholder="optional id"><br /><input name="name" placeholder="name">' + 
	'<textarea name="description" placeholder="description"></textarea>' +
	'<br /><input type="submit">');
});
app.get('/add_quest', checkAdmin, function(req, res){
	res.send('<form action="new_quest" method="POST">' +
	'<input name="id" placeholder="optional id"><br /><input name="name" placeholder="name"><input name="level" placeholder="level"><input name="cost" placeholder="cost"><br />' + 
	'<textarea name="description" placeholder="description"></textarea>' +
	'<br /><input type="submit">');
});
app.get('/addons_to_flavors', function(req, res){
	var n = req.param('n', null);  // second parameter is default
	User.findOne({ name : n }).exec(function (err, user) {
		if (err || !user) return res.send('cant find');
		user.upgrade_addon = user.upgrade_flavor;
		user.save(function (err, user) {
			res.send(user);
		});
	});
});
app.post('/new_quest', function(req, res){
	try {
	var post = req.body;
	if (post.id == '') {
		var newq = new Quest(post);
		newq.save(function (err, q) {
			if (err) return res.send(err); 
			res.send(q);
		});
	} else { 
		Quest.findOne({_id : post.id}).exec(function (err, quest) {
			if (err || !quest) return res.send(500, err);
			if (post.description != '') quest.description = post.description;
			if (post.cost != '')  quest.cost = post.cost;
			if (post.name != '')  quest.name = post.name;
			quest.save(function (err, q) {
				if (err) return res.send(err);
				res.send(q);
			});
		});
	}
	} catch (err) { res.send(500, err); }
});
app.post('/add_achievement', checkAdmin, function(req, res){
	try {
	var post = req.body;
	if (post.id == '') {
		var newa = new Achievement(post);
		newa.save(function (err, a) {
			if (err) return res.send(err); 
			res.send(a);
		});
	} else { 
		Achievement.findOne({_id : post.id}).exec(function (err, achievement) {
			if (err || !achievement) return res.send(500, err);
			if (post.description != '') achievement.description = post.description;
			if (post.name != '')  achievement.name = post.name;
			achievement.save(function (err, q) {
				if (err) return res.send(err);
				res.send(q);
			});
		});
	}
	} catch (err) { res.send(500, err); }
});
app.post('/register_achievement', function(req, res){
	var post = req.body;
	if (post.id == '') return res.send('{"error":"no achievement specified"}');
	Achievement.findOne({_id : post.id}).exec(function (err, achievement) {
		if (err || !achievement) return res.send('{"error":"' + err + '"}');
		User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
			for (i in u.achievements) {
				if (u.achievements[i] == achievement._id) return res.send('{"success":"false"}');
			}
			u.achievements.push(achievement._id);
			u.save(function (err, u) {
				res.send(achievement);
			});
		});
	});
});
app.get('/quests', function(req, res){
	Quest.find().sort('level').exec(function (err, quests) {
		res.send(quests);
	});
});
app.post('/toggle_animations', function(req, res){
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		u.animations_off = !u.animations_off;
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
	} catch (err) { res.send(500, err); }
});
app.post('/toggle_chat', function(req, res){ //holy DRY batman!
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		u.chat_off = !u.chat_off;
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
	} catch (err) { res.send(500, err); }
});

app.post('/tutorial', function(req, res){
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		u.tutorial = parseInt(post.tutorial);
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
	} catch (err) { res.send(500, err); }
});
app.post('/complete_quest', function(req, res){ 
	try { 
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500);  
		Quest.findOne({_id : post.id}).exec(function (err, quest) {
			if (err || !quest || !u) return res.send(500, err);
			var quest_complete = true;
			var new_refer = false;
			var quest_split = u.quests[u.quests.length - 1].split('&');
			var real_cost = parseInt(quest_split[2]);
			if (quest.level == 0) {
				if (u.carts < real_cost) return res.send('{"error":"' + (real_cost - u.carts) + ' more ' + ((real_cost - u.carts == 1)? 'cart' : 'carts') + '"}');
				new_refer = true;
			} else if (quest.level == 1) { 
				if (u.upgrade_flavor < real_cost) return res.send('{"error":"Need  ' + (real_cost - u.upgrade_flavor) + ' Flavor Research"}');
				if (u.upgrade_addon < real_cost) return res.send('{"error":"Need ' + (real_cost - u.upgrade_addon) + ' Addon Research"}');
			} else if (quest.level == 2) { 
				var position_of_strawberry = u.flavors.indexOf('5238d9d376c2d60000000002');
				if (position_of_strawberry < 0) return res.send('{"error":"Unlock her favourite flavor first!"}');
				var flavor_sold = u.flavors_sold[position_of_strawberry];
				var strawberry_flavor_req = [85,230,330,480,680,980,1680,2480,4080,10080,10080];
				if (flavor_sold < strawberry_flavor_req[real_cost-1]) return res.send('{"error":"Sell ' + (strawberry_flavor_req[real_cost-1] - flavor_sold) + ' more of her favourite"}');
			} else if (quest.level == 3) { 
				if (u.rockets < real_cost) return res.send('{"error":"buy ' + (real_cost - u.rockets) + ' more rockets"}');
			} else if (quest.level == 4) { 
				var num_above_100 = 0;
				var last_flavor_cull = '';
				var outstanding = [];
				for (var i = 0; i < u.flavors.length; i++) {
					if (u.flavors_sold[i] && u.flavors_sold[i] > 100) {
						num_above_100++;
						outstanding.push(u.flavors[i]);
					}
					for (var j = i+1; j < u.flavors.length; j++) {
						if (u.flavors[i] === u.flavors[j] || u.flavors[j].length == 26) {
							u.flavors.splice(j, 1);
							last_flavor_cull = u.flavors[i];
						}
					}
				}
				if (last_flavor_cull.length > 0) {
					quest_complete = false;
					u.save(function (err, u) {
						return res.send('{"error":"please retry - duplicates remove"}'); 
					});
				} else {
					if (num_above_100 < real_cost) {
						quest_complete = false;
						Flavor.find({}, function (err, f) {
							res.send('{"error":"Only ' + num_above_100 + ' flavors past 100"}'); 
						});
					} else {
						u.badge_quests = true;
						u.trend_bonus += 0.75; //for a total of +1
					}
				}
			}
			if (quest_complete) {
				u.trend_bonus += 0.25;
				for (i in u.quests) {
					var q = u.quests[i].split('&')[0];
					if (q == quest._id) {
						u.quests[i] = quest._id + '&0&' + real_cost; break;
					}
				}
				u.markModified("quests");
				u.save(function (err, u) {
					if (err) return res.send(500, err);
					if (new_refer && u.referal_code) {
						User.findOne({name : u.referal_code}, function (err, u2) {
							if (err || !u2) return res.send(500, err);
							u2.referals++;
							u2.save(function (err, u2) {
								if (err) return res.send(500, err);
								return res.send(quest);
							});
						});
					} else {
						return res.send(quest);
					}
				});
			}
		});
	});
	} catch(err) {
		res.send(500, err);
	}
});
app.get('/new_quest', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send('{"error":"user not found"}'); 
		if (u.total_gold < 150 + (u.quests.length * 1000) + (u.prestige_level * u.prestige_level * 1000)) return res.send('{"error":"not enough gold"}');
		if (u.prestige_level > 0 && u.gold < (200 * u.prestige_level)) return res.send('{"error":"not enough current gold"}');
		var number_of_completed = 0;
		if (u.quests.length > 0) { 
			for (var i = 0; i < u.quests.length; i++) {
				var n_q = u.quests[i];
				var n = n_q.split('&');
				if (n.length > 1) {
					if (n[1] == '0') {
						number_of_completed++;
					} else {
						return res.send('{"error":"currently on a quest, ' + n[1] + '"}');
					}
				} 
			}
		}
		Quest.findOne({level : number_of_completed}).exec(function (err, quest) {
			if (err || !quest) return res.send('');
			var x = new Date();
			var real_cost = (quest.cost + u.prestige_level);
			if (quest._id == '52672dea3a8c980000000001') real_cost = Math.ceil(quest.cost + (u.prestige_level / 2));
			u.quests.push(quest._id + '&' + x.toUTCString() + '&' + real_cost);
			u.save(function (err, u) {
				if (err) return res.send(err);
				res.json({
					name: quest.name,
					description: quest.description.replace('[cost]', real_cost)
				});
			});	
		});
	});
	} catch (err) {
		res.send(err); 
	}
});
app.get('/remove', function(req, res){
	var n = req.param('n', null);  // second parameter is default
	User.findOne({ name : n }).exec(function (err, user) {
		if (err || !user) return res.send('cant find');
		user.remove();
		res.send('removed');
	});
});
app.post('/switch', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, 'missing');
		var base1 = req.param('1', null);  // second parameter is default
		var base2 = req.param('2', null);  // second parameter is default
		var spot = req.param('spot', null);  // second parameter is default
		var base1_index = u.flavors.indexOf(base1);
		if (!base1 || base1_index < 0) return res.send(500, 'missing');
		
		while (u.flavors.length > u.flavors_sold.length) {
			u.flavors_sold.push(0);
		}
		//return res.send(u.flavors_sold);
		
		if (base2) {
			var base2_index = u.flavors.indexOf(base2);
			if (base2_index < 0) return res.send(500, 'missing (2)');
			u.flavors[base2_index] = base1;
			u.flavors[base1_index] = base2;
			
			var flavor_sold_interim = u.flavors_sold[base1_index];
			u.flavors_sold[base1_index] = u.flavors_sold[base2_index];
			u.flavors_sold[base2_index] = flavor_sold_interim;
		} else {
			var f_sold = u.flavors_sold[base1_index];
			u.flavors.splice(base1_index, 1);
			u.flavors_sold.splice(base1_index, 1);
			if (spot) {
				u.flavors.splice(spot, 0, base1);
				u.flavors_sold.splice(spot, 0, f_sold);
			} else {
				u.flavors.push(base1);
				u.flavors_sold.push(base1);
			}
		}
		
		u.markModified("flavors"); 
		u.markModified("flavors_sold"); 
		u.save(function (err, u) {
			if (err) return res.send(500, err);
			res.send(200, '{"i1":"' + base1_index + '"}');
		});
	});
	} catch (err) { res.send(500, err); }
});
app.get('/highscores', function(req, res){
	try {
	if (!req.session.user_id) return res.send('not logged in');
	var h_type = req.param('type', null);  // second parameter is default
	if (h_type == 'all') {
		User.find({total_gold: {$gt: 0}}).sort('-total_gold').limit(100).select('name total_gold updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else if (h_type == 'today') {
		var now = new Date();
		User.find({today_date : now.getDate(), today_gold: {$gt: 0}}).sort('-today_gold').limit(100).select('name today_gold updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else if (h_type == 'refer') {
		var now = new Date();
		User.find({referals : {$gt:0}}).sort('-referals').limit(100).select('name referals updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else {
		var now = new Date();
		var week_num = now.getDate();
		User.find({week_gold: {$gt: 0}, week_date: week_num}).sort('-week_gold').limit(100).select('name week_gold updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	}
	} catch (err) { res.send(500, err); }
});
app.get('/online', function(req, res){
	try {
	var now = new Date();
	var fiveminago = new Date(now.getTime() - 30*60*1000);
	User.findOne({_id: req.session.user_id}, function (err, user) {
		User.find({updated_at : {$gt: fiveminago}}).select('name is_guest').sort('-total_gold').exec(function (err, users) {
			if (err) return res.send(err);
			User.count({}, function (err, total_count) {
				User.count({release_channel : 1}, function (err, beta_count) {
					User.count({release_channel : 2}, function (err, alpha_count) {
						var users_len = users.length;
						var online_list = [];
						var friend_list = [];
						for (var i = 0; i < users_len; i++) {
							var u = users[i];
							if (!u.is_guest) online_list.push(u.name);
							if (user.friends && user.friends.indexOf(u._id) != -1) friend_list.push(u)
						}
						res.json({
							currently_online: users.length,
							number_of_accounts: total_count,
							beta_accounts: beta_count,
							alpha_accounts: alpha_count,
							online: online_list,
							friends: friend_list
						});
					});
				});
			});
		});
	});
	} catch (err) { res.send('error ' + err); }
});
app.get('/chat', function(req, res){
	var len = req.param('expanded', 12);  // second parameter is default
	Message.find().sort('-created_at').limit(len).exec(function (err, messages) {
		var m_len = messages.length;	
		var m = [];
		for (var i = 0; i < m_len; i++) {
			var msg = messages[i];
			var new_msg = {
				text: msg.text,
				created_at: msg.creaated_at,
				user: msg.user,
				timeago: timeSince(msg.created_at)
			};
			if (msg.is_admin) new_msg.is_admin = true;
			m.push(new_msg); 
		}
		res.send(m);
		
	});
});
app.post('/chat', function(req, res){
	try {
	User.findOne({_id: req.session.user_id}, function (err, user) {
		if (err || !user || !req.body.text) return res.send('');
		var newmessage = new Message({
			text: req.body.text,
			user: user.name,
			created_at: new Date
		});
		if (user.is_admin) newmessage.is_admin = true;
		newmessage.save(function (err, m) {
			if (err) return res.send(err);
			res.send(m);
		});
	});
	} catch (err) { res.send('err ' + err); }
});

app.post('/friend/new', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if (err || !u) return res.send(err);
		if (!req.body.friend || req.body.friend.length < 2 || u.name == req.body.friend) return res.json({err: 'invalid friend'});
		if (u.friends.length > 25) return res.json({err: 'Too many friends (25)!'});
		User.findOne({ name: req.body.friend }, function (err, f) {
			if (err || !f) return res.send(err);
			if (u.friends.indexOf(f._id) !== -1) return res.json({err: 'already friend'});
			u.friends.push(f._id);
			u.save(function (err, u) {
				res.json({success: true, friends: u.friends});
			});
		});
	});
});
app.post('/last_flavor', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send('{"success":false}'); 
		u.last_flavor = req.body.f;
		u.last_addon = req.body.a;
		Combo.findOne({flavor_id : u.last_flavor, topping_id : u.last_addon}).exec(function (err, combo) {
			var already_known = false;
			if (combo && u.combos instanceof Array) {
				for (i in u.combos) {
					if (u.combos[i] == combo._id) { already_known = true; break; }
				}
			} 
			if (!already_known && combo) {
				u.combos.push(combo._id);
			}
			
			u.save(function (err, u) {
				if (err || !combo) return res.send('{"success":false}');
				res.send(combo); 
			});
		});
	});
	} catch (err) { res.send(500, err); }
});
app.post('/me', function(req, res){
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (!u || err) return res.send(err);
		var workers_num = ((2*parseFloat(u.employees)) + parseFloat(u.carts) + (3*parseFloat(u.trucks)) + (5*parseFloat(u.robots)) + (10*parseFloat(u.rockets)));
		var workers = (post.w == 'true');
		var amount = parseInt(post.a);
		var flavor_id = u.last_flavor;
		
		//errors
		if (parseFloat(post.addon) > 3) return res.send('{"error":"invalid add-on amount"}');
		if (parseFloat(post.c) > 1) return res.send('{"error":"invalid combo amount"}');
		if (workers && post.a > workers_num) return res.send('{"error":"Your number of workers are too damn high (have: ' + post.a + ', expect: ' + workers_num + ')"}');
		if (post.d > 50) return res.send('{"error":"invalid worker amount (' + post.d  + ')"}');
		if (post.e > 10) return res.send('{"error":"invalid expertise amount (' + post.e  + ')"}');
		if (!post.w) return res.send('{"error":"please refresh"');
		if (workers) { //workers
			var now = new Date();
			var sec_ago = new Date(now.getTime() - 2000);
			if ( new Date(u.last_employee_at).getTime() > sec_ago ) {
				return res.send('too soon');
			}
			u.last_employee_at = new Date; 
			
			//select a random flavor from your workers flavors
			flavor_id = (u.flavors.length > 5)? u.flavors[ Math.floor(Math.random() * 5) ] : u.flavors[ Math.floor(Math.random() * (u.flavors.length)) ];
		} else {
			if (amount > 50) return res.send('{"error":"you are clicking too fast!"}');
		}
		
		Flavor.findOne({ _id: flavor_id }).select('value base_value').exec(function (err, flavor) {
			if (err || !flavor) return res.send('{"error":"' + err + '"}');
			var expertise = (post.e)? parseInt(post.e) : 0;
			
			//infer the amount the client gains
			var infer_amount = (workers)? parseFloat(post.d) : flavor.value * (1 + (.1 * expertise)) * (1 + (u.prestige_bonus / 100)); //post.d is the average ice cream flavor value
			if (!workers) {
				infer_amount += parseFloat(post.addon); //add addon value to your clicks
				if (post.tf == 'true') infer_amount += (u.upgrade_heroic > 0 && u.release_channel == 0)? 1.50 : u.trend_bonus; //trending flavor
				if (post.ta == 'true') infer_amount += (u.upgrade_heroic > 0)? 1.00 : 0.75;   //trending event
				if (!isNaN(post.c) && amount == 1) { infer_amount += parseFloat(post.c); } //combo bonus
			}
			var infer_change = post.a * infer_amount;
			var random_event = false;
			if (u.gold > 5000 && !workers && Math.floor(Math.random()*2000) < 1) {
				infer_change = (infer_change * 100) + infer_change;
				random_event = 'A bus full of tourists stops at your ice cream stand.<br/>You sell 100 times as much ice cream!'; 
			}
			var infer_gold = parseFloat(u.gold + infer_change).toFixed(2);
			
			//update totals
			u.gold = infer_gold; //instead interfer the new gold total
			u.total_gold += infer_change;
			var now = new Date();
			if (now.getDate() != u.today_date) {
				u.today_gold = 0;
				u.today_date = now.getDate();
			}
			if (now.getDay() == 0 && u.week_date != 0) {
				u.week_gold = 0;
				u.week_date = 0;
			} else {
				u.week_date = now.getDate(); 
			}
			u.today_gold += infer_change;
			u.week_gold += infer_change;
			u.icecream_sold += parseInt(post.a);
			
			if (!workers) {
				var index_f = u.flavors.indexOf(flavor_id);
				if (index_f >= 0) {
					if (u.flavors_sold.length > index_f) {
						u.flavors_sold[index_f] = parseInt(u.flavors_sold[index_f]) + parseInt(amount);
						u.markModified("flavors_sold");
					}
				}
				if (u.last_addon == '523d5ba8fbdef6f047000022') u.gross_sold += amount;
			}
			u.save(function (err, u) {
				if (err || !flavor) return res.send(err);
				var randomnumber = Math.floor(Math.random()*5000); 
				if (randomnumber < 1 + (0.05 * post.a)) {
					if (flavor.value > 0.10 && flavor.base_value > 1) flavor.value = Math.round( (flavor.value - 0.01) * Math.pow(10,3) ) / Math.pow(10,3);
					if (flavor.value > 0.35 && flavor.base_value <= 1) flavor.value = Math.round( (flavor.value - 0.01) * Math.pow(10,3) ) / Math.pow(10,3);
					flavor.save(function (err, flavor) {
						if (random_event) return res.send('{"event":"' + random_event + '","gold":' + infer_gold + '}');
						if (infer_gold != post.g) { return res.send('{"gold":' + infer_gold + ',"diff":' + (infer_gold-parseFloat(post.g)) + ',"infer_change":' + infer_change + ',"value":' + flavor.value + ', "_id": "' + flavor._id + '"}'); }
						res.send(flavor);
					});
				} else {
					var randomnumber2 = Math.floor(Math.random()*5000);
					if (randomnumber2 <= 1) { //reset value
						Flavor.find({_id : { $ne: u.last_flavor }}, function (err, flavors) {
							if (!flavors) return res.send(500, 'no flavors (2c)');
							var flavor = flavors[Math.floor(Math.random()*(flavors.length - 1))];
							if (!flavor) flavor = flavors[0];
							flavor.value = flavor.base_value;
							flavor.save(function (err, flavor) {
								return res.send(flavor);
							});
						});
					} else {
						if (random_event) return res.send('{"event":"' + random_event + '","gold":' + infer_gold + '}');
						if (infer_gold != post.g) { return res.send('{"gold":' + infer_gold + ',"diff":' + (infer_gold-parseFloat(post.g)) + ',"infer_change":' + infer_change + ',"value":' + flavor.value + ', "_id": "' + flavor._id + '"}'); }
						res.send(flavor);
					}
				}
			});
		});
	});
	} catch(err) {
		res.send(500, err);
	}
});
app.post('/login', function (req, res) {
	try {
	var post = req.body;
	if (!post.user) return res.redirect('/failure=0');
	User.findOne({ name: post.user.toLowerCase() }).select("+password").exec(function(err, user) {
		if (err) return res.send(err);
		if (!user) return res.send('could not log in');
		user.comparePassword(post.password.replace(/^\s+|\s+$/g,''), function(err, isMatch) {
			if (err) return res.send(err);
			if (isMatch) {
				req.session.user_id = user._id;
				user.ip = req.headers['x-forwarded-for'];
				user.save(function (err, u) {
					res.redirect('/');
				});
			} else {
				res.redirect('/login?error=mismatch');
			}
		});
	});
	} catch (err) { res.send(500, err); }
});
app.get('/login', function (req, res) {
	if (req.session.user_id) {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.render('login');
			res.render('index', {release_channel:user.release_channel});
		});
	} else {
		res.render('login');
	}
});
app.get('/sign_up', function (req, res) {
	res.render('login', {sign_up : true});
});
app.get('/logout', function(req, res){
	  delete req.session.user_id;
	  res.redirect('/login'); 
});
app.get('/user/:name', function(req, res){
	var name = req.params.name;
	User.findOne({name : name }).select("-ip").exec(function (err, user) {
		if (err || !user) return res.send(err);
		var most_sold = 0;
		var most_sold_flavor = '5238d9bc76c2d60000000001'; //vanilla
		for (var i = 0; i < user.flavors.length; i++) {
			if (user.flavors_sold[i] > most_sold) {
				most_sold = user.flavors_sold[i];
				most_sold_flavor = user.flavors[i];
			}
		}
		Flavor.find({_id:most_sold_flavor}, function (err, f) {
			if (err || !f) return res.send(err);
			var release = ['main', 'beta', 'alpha'];
			res.json({
				name: user.name,
				favourite: f,
				flavors: user.flavors.length,
				toppings: user.toppings.length,
				quests: user.quests.length,
				carts: user.carts,
				employees: user.employees,
				trucks: user.trucks,
				robots: user.robots,
				rockets: user.rockets,
				release_channel: release[user.release_channel],
				sold: user.icecream_sold,
				updated_at: timeSince(user.updated_at),
				prestige_level: user.prestige_level,
				prestige_bonus: user.prestige_bonus,
				gold: user.gold
			}); 
		});
	});
});
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/* helper functions */

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return "<1 minute";
}

