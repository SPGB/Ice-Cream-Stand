/**
	* .-. .---. .----.    .---. .----. .----.  .--.  .-.   .-.    .----..---.  .--.  .-. .-..----. 
	* | |/  ___}| {_     /  ___}| {}  }| {_   / {} \ |  `.'  |   { {__ {_   _}/ {} \ |  `| || {}  \
	* | |\     }| {__    \     }| .-. \| {__ /  /\  \| |\ /| |   .-._} } | | /  /\  \| |\  ||     /
	* `-' `---' `----'    `---' `-' `-'`----'`-'  `-'`-' ` `-'   `----'  `-' `-'  `-'`-' `-'`----'
	* NOW OPEN SOURCED - V 1.42
 */
 
var express = require('express.io')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10
  , crypto = require('crypto')
  , assert = require('assert')
  , fs = require('fs')
  , nodemailer = require("nodemailer");

var app = express();

var bodyParser   = require('body-parser');

var morgan       = require('morgan');

var mongoose = require('mongoose');
var server = http.createServer(app);
var db = mongoose.connection;
var io = require('socket.io').listen(server);
var config = require('./config.js');
var cookieParser = require('cookie-parser')(config.cookie);
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: config.gmail.username,
        pass: config.gmail.password
    }
});
var session = require('express-session'); 
var MongoStore  = require('connect-mongo')(session);
var sessionStore = session( {
	store: new MongoStore(config.db),
	secret: config.secret,
	cookie: { maxAge: 86400000 },
});
var cache_trend_id;
mongoose.connect('mongodb://localhost:' + config.db.port + '/admin', { auto_reconnect: true, user: config.db.username, pass: config.db.password });


// all environments
app.set('port', 80);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(morgan('dev'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser());
//app.use(express.methodOverride());
app.use(cookieParser);
app.use(sessionStore);


/* OUR SCHEMA */
var userSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	ip: { type: String },
	password: { type: String, select: false },
	email: { type: String },
	email_verified: { type: Boolean },
	gold: { type: Number, default: 0 },
	total_gold: { type: Number, default: 0 },
	today_gold: { type: Number, default: 0 },
	today_date: { type: Number, default: 0 },
	week_gold: { type: Number, default: 0 },
	week_date: { type: Number, default: 0 },
	flavors: { type: [String], default: '5238d9bc76c2d60000000001'},
	flavors_sold: { type: [String], default: '0'},
	toppings: { type: [String], default: '523d5800fbdef6f047000013' },
	combos: { type: [String] },
	cones: { type: [String] },
	quests: { type: [String]},
	achievements: { type: [String]},
	items: { type: [String]},
	ignore: { type: String},
	employees: { type: Number, default: 0},
	carts: { type: Number, default: 0},
	trucks: { type: Number, default: 0},
	robots: { type: Number, default: 0},
	rockets: { type: Number, default: 0},
	aliens: { type: Number, default: 0},
	upgrade_machinery: { type: Number, default: 0},
	upgrade_autopilot: { type: Number, default: 0},
	upgrade_coldhands: { type: Number, default: 0},
	upgrade_flavor: { type: Number, default: 0},
	upgrade_addon: { type: Number, default: 0},
	upgrade_heroic: { type: Number, default: 0},
	upgrade_legendary: { type: Number, default: 0},
	upgrade_frankenflavour: { type: Number, default: 0},
	last_flavor: { type: String, default: '5238d9bc76c2d60000000001' },
	last_addon: { type: String, default: '523d5800fbdef6f047000013' },
	last_frankenflavour: { type: String },
	created_at    : { type: Date },
	updated_at    : { type: Date },
	last_prestige_at: { type: Date },
	last_vote_at: { type: Date },
	last_frankenflavour_at: { type: Date },
	icecream_sold: { type: Number, default: 0 },
	trend_bonus: { type: Number, default: 1.00 },
	tutorial: { type: Number, default: 0 },
	workers_sold: { type: Number, default: 0 },
	referals: { type: Number, default: 0 },
	referal_code: { type: String },
	display_settings: { type: [Number]},
	animations_off: { type: Boolean },
	chat_off: { type: Boolean },
	badge_off: { type: Boolean },
	chat_squelch: { type: Boolean },
	release_channel: { type: Number, default: 0 }, 
	prestige_level: { type: Number, default: 0 }, 
	prestige_bonus: { type: Number, default: 0 }, 
	prestige_array: { type: [Number] }, 
	friends: { type: [String] }, 
	friend_gold: { type: Number },
	friend_last: { type: Number },
	is_friend_notify: { type: Boolean, default: true }, 
	is_tooltip: { type: Boolean, default: true }, 
	is_night: { type: Boolean }, 
	is_second_row: { type: Boolean }, 
	is_admin: { type: Boolean }, 
	is_guest: { type: Boolean, default: true },
	is_mod: { type: Boolean }, 
	friend_total_gold: { type: Number, default: 0 }, 
	message_count: { type: Number, default: 0 }, 
	shadow_ban: { type: Boolean },
	mute_at: { type: Date },
	mute_reason: { type: String },
	badges: { type: [Number] },
	highest_accumulation: { type: Number, default: 0  },
	title: { type: String },
	easter: { type: [Number] },
	cow_name: { type: String, default: 'Cow' },
	cow_level: { type: Number, default: 0 },
	cow_clicks: { type: Number, default: 0 },
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
		cones: this.cones,
		quests: this.quests,
		achievements: this.achievements,
		employees: this.employees,
		carts: this.carts,
		trucks: this.trucks,
		robots: this.robots,
		rockets: this.rockets,
		aliens: this.aliens,
		upgrade_autopilot: this.upgrade_autopilot,
		upgrade_coldhands: this.upgrade_coldhands,
		upgrade_machinery: this.upgrade_machinery,
		upgrade_flavor: this.upgrade_flavor,
		upgrade_addon: this.upgrade_addon,
		upgrade_heroic: this.upgrade_heroic,
		last_flavor: this.last_flavor,
		last_addon: this.last_addon,
		last_frankenflavour: this.last_frankenflavour,
		updated_at: this.updated_at,
		trend_bonus: this.trend_bonus,
		tutorial: this.tutorial,
		workers_sold: this.workers_sold,
		is_guest: this.is_guest,
		referals: this.referals,
		referal_code: this.referal_code,
		display_settings: this.display_settings,
		animations_off: this.animations_off,
		chat_off: this.chat_off,
		badge_off: this.badge_off,
		release_channel: this.release_channel,
		prestige_level: this.prestige_level,
		prestige_bonus: this.prestige_bonus,
		prestige_array: this.prestige_array,
		friends: this.friends,
		friend_total_gold: this.friend_total_gold,
		badges: this.badges,
		highest_accumulation: this.highest_accumulation,
		friend_last: this.friend_last,
		friend_gold: this.friend_gold,
		is_tooltip: this.is_tooltip,
		ignore: this.ignore
    };
    return returnObject;
};
userSchema.pre('save', function(next) {
    var user = this;
	if (!user.isModified('friend_gold')) user.updated_at = new Date;
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
var User = mongoose.model('User', userSchema);


var messageSchema = new mongoose.Schema({
	text: { type: String, required: true },
	user: { type: String, required: true },
	badge: { type: Number },
	is_admin: Boolean,
	created_at: { type: Date },
},
{
	capped: { max: 100, size: 1000000 }
});
var Message = mongoose.model('Message', messageSchema);

var privatemessageSchema = new mongoose.Schema({
	text: { type: String, required: true },
	from: { type: String, required: true },
	to: { type: String, required: true },
	is_read: { type: Boolean },
	created_at: { type: Date }
});
privatemessageSchema.pre('save', function(next) {
	this.created_at = new Date;
	next();
});
var PrivateMessage = mongoose.model('PrivateMessage', privatemessageSchema);

var flavorSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	description: { type: String },
	cost: { type: Number, required: true, default: 250 },
	base_value: { type: Number, default: 2.0 },
	value: { type: Number, default: 2.0 },
	votes: { type: Number, default: 0 },
	last_trend_at: { type: Date }
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
	franken_id: { type: String },
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

var trendSchema = new mongoose.Schema({
	flavour_id: { type: String, index: { unique: true } },
	flavour_name: { type: String },
	bonus: { type: Number, default: 2.5 },
	bonus_max: { type: Number, default: 2.5 },
	total_sold: { type: Number, default: 0 },
	created_at: { type: Number }
});
var Trend = mongoose.model('Trend', trendSchema);


var cowSchema = new mongoose.Schema({
	name: { type: String, required: true, },
	happiness: { type: Number, default: 100},
	level: { type: Number, default: 1},
	experience: { type: Number, default: 1},
	strength: { type: Number, default: 10 },
	constitution: { type: Number, default: 10 },
	intelligence: { type: Number, default: 10 },
	memories: { type: [String] },
	items: { type: [String] },
	user_id: { type: String, required: true },
	created_at: { type: Date },
	is_active: { type: Boolean, default: true }
});
var Cow = mongoose.model('Cow', cowSchema);
cowSchema.pre('save', function(next) {
    var cow = this;
	if (!cow.created_at) cow.created_at = new Date();
	next();
});

function checkAuth(req, res, next) {
  if (req.session.user_id) {
	User.findOne({ _id: req.session.user_id }).select('release_channel ip').exec(function (err, user) {
		if (err || !user) return next();
		var lang = req.session.lang;
		if (!lang) {
			if (req.headers['accept-language'] && req.headers['accept-language'].indexOf('ja') > -1) {
				req.session.lang = 'jp'; //I DIDNT KNOW FORGIVE ME
			} else {
				req.session.lang = 'en';
			}
		}
		if (user.ip != req.connection.remoteAddress) {
			user.ip = req.connection.remoteAddress;
			user.save();
		}
		res.render('index_' + req.session.lang, {release_channel:user.release_channel});
	});
  } else {
    next();
  }
}
function checkAdmin(req, res, next) {
  if (req.session.user_id) {
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user.is_admin) return res.render('index_en', {release_channel:0});
		next();
	});
  } else {
    res.render('index_en', {release_channel:0});
  }
}

/* CHAT */
//cookieParser is out cookie parser
io.set('authorization', function (handshake, callback) {
	//var ip = handshake.client;
	handshake.foo = 'bar';
	if (!handshake._query.id) {
		console.log('Missing ID: ' + handshake._query);
		return callback('Missing ID.', false);
	}
	if (!handshake._query.name) {
		console.log('Missing name');
		return callback('Missing Name.', false);
	}
	User.findOne({ _id: handshake._query.id }).lean(true).select('name ip').exec(function (err, user) {
		if (user.ip != handshake.client._peername.address) {
			console.log(handshake.client._peername.address + ' vs ' + user.ip);
			//console.log(handshake.address + ' vs ' + user.ip);
			return callback('Incorrect IP', false);
		}
		if (user.name != handshake._query.name) {
			console.log('Incorrect name: ' + handshake._query.name);
			//console.log(handshake.address + ' vs ' + user.ip);
			return callback('Incorrect name', false);
		}
		callback(null, true);
	});
});

io.on('connection', function ( socket ) {
  	socket.broadcast.emit('join', { _id: socket.handshake.query.id, name: socket.handshake.query.name });

  	socket.on('typing', function(msg){
  		io.emit('typing', { _id: socket.handshake.query.id, name: socket.handshake.query.name });
  	});

  	socket.on('chat message', function(msg){
  		var t = msg.text;
  		Message.find().sort({$natural:-1}).limit(1).lean(true).exec(function (err, messages) {
			if (t == messages[0].text) return res.json({error: 'This message has already been sent!'});
	  		User.findOne({ _id: socket.handshake.query.id }).select('shadow_ban last_flavor badges').lean(true).exec(function (err, user) {
		  		if (user.shadow_ban) return false;
		  		if (msg.badge && user.badges && user.badges.indexOf(parseInt(msg.badge) ) === -1) {
		  			console.log('user ' + user.badges + ', ' + msg.badge);
		  			return false;
		  		}
		  		/*
		  		if (tgives.indexOf(socket.id) > -1 && user.last_flavor == '523d5e603095960000000001' && t.toLowerCase().indexOf('thanksgiving') > -1) {
		  			console.log('Badge!');
		  			
		  			User.findOne({ _id: socket.handshake.query.id }).exec(function (err, user_badge) {
		  				if (!user_badge.badges) user_badge.badges = [];
		  				user_badge.badges.push(6);
		  				user_badge.save();

		  				io.emit("chat message", {
			  				_id: Math.random() * 9999999 + 'TGives',
			  				text: socket.handshake.query.name + ' has earned their Thanksgiving badge',
			  				badge: 6,
			  				user: ':',
			  				created_at: new Date(),
			  				add_badge: 6,
			  				add_badge_id: socket.handshake.query.id
			  			});
			  			tgives.splice(tgives.indexOf(socket.id), 1);

		  			});
		  			if (!user.badges) user.badges = [];
		  			user.badges.push(6);
		  		}

		  		if (user.last_flavor == '523d5e603095960000000001' && (!user.badges || user.badges.indexOf(6) == -1) && tgives.indexOf(socket.id) == -1) {
		  			tgives.push( socket.id );
		  			console.log(tgives);
		  			io.sockets.connected[ socket.id ].emit("chat message", {
		  				_id: Math.random() * 9999999 + 'TGives',
		  				text: socket.handshake.query.name + ', in the spirit of thanksgiving, what are you grateful for?',
		  				badge: 6,
		  				user: ':',
		  				created_at: new Date()
		  			});
		  		}
		  		*/
		  		
		  		var patt = /(fuck|shit|damn|pussy|penis|blowjob|cunt|bitch|nigger|slut|asshole)/g;
					if (patt.test(t.toLowerCase().replace(/\s/g, ''))) {
					var motivationals = [
							'Always do your best. What you plant now, you will harvest later.',
							'You are never too old to set another goal or to dream a new dream.',
							'If you can dream it, you can do it.',
							'Be kind whenever possible. It is always possible.',
							'Even if you fall on your face, you\'re still moving forward.',
							'In order to succeed, we must first believe that we can.',
							'By failing to prepare, you are preparing to fail.',
							'Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.'
					];
					t = motivationals[Math.floor( Math.random() * motivationals.length )];
				}
				t = t.trim();
		  		var newmessage = new Message({
		  				is_admin: (socket.handshake.query.name === 'sam' || socket.handshake.query.name === 'babyboo'),
						text: t,
						badge: msg.badge,
						user: socket.handshake.query.name,
						created_at: new Date()
				});
				newmessage.save(function (err, m) {
					if (err) return console.log('socket msg error: ' + err);
					io.emit('chat message', m);
				});
  			});
		});
  });
});

/* routes */
app.get('/', checkAuth, function(req, res) {
	var lang = req.session.lang;
	if (!req.session.lang) {
		if (req.headers['accept-language'] && req.headers['accept-language'].indexOf('ja') > -1) {
			req.session.lang = 'jp'; //I DIDNT KNOW FORGIVE ME
		} else {
			req.session.lang = 'en';
		}
	}
	User.find({ ip: req.connection.remoteAddress }).select("+password").limit(2).exec(function (err, users) {
		if (users.length == 0) {//create user
			var text = "guest_";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < 5; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
			
			var newuser = new User({
				name: text.toLowerCase(),
				ip: req.connection.remoteAddress,
				created_at: new Date
			});
			newuser.save(function(err, u) {
				if (err) return res.send(err);
				req.session.user_id = u._id;
				res.render('index_' + req.session.lang, {
					release_channel:u.release_channel
				});
			});
		} else { //user already with your ip
			if (!users[0].password && users.length == 1) { //more then one user or user[0] has a password
				req.session.user_id = users[0]._id;
				//res.send(users);
				res.render('index_' + req.session.lang, {
					release_channel:users[0].release_channel,
				});
			} else {
				res.redirect('login');
			}
		}
	});
});
app.post('/me', function(req, res){
	if (!req.session || !req.session.user_id) return res.send('{"error": "You are not signed in"}');
	var post = req.body;
	var now = new Date();
	var now_time = now.getTime();
	var query_select_user;
	var workers = (post.w == 'true');
	var version = post.v;
	if (!version || parseFloat(version) < 1.42) {
		console.log('user has an older version');
		return res.send('{"error": "Please update to the latest version.","reload":true}');
	}
	var is_deep_sleep = post.ds;
	if (workers) { 
		if (!req.session.last_worker_click) req.session.last_worker_click = 0;
		var dif = now_time - req.session.last_worker_click;
		req.session.last_worker_click = now_time;
		var deep_sleep_time = (post.ds == 'true')? 15000 : 0;
		if (dif < 500 + deep_sleep_time) {
			console.log(req.session.user_id + ' workers clicking too quickly -' + dif + 'ms');
			return res.send('{"notice":"Customers aren\'t interested in your workers ice cream (' + dif + 'ms)"}');
		}
		query_select_user = 'gold total_gold today_gold week_gold carts';
	} else {
		if (!req.session.last_click) req.session.last_click = 0;
		var dif = now_time - req.session.last_click;
		req.session.last_click = now_time;
		if (dif < 500) {
			console.log(req.session.user_id + ': clicking too quickly - ' + dif + 'ms');
			return res.send('{"notice": "Customers aren\'t interested in your ice cream (' + dif + 'ms)"}');
		}
		//query_select_user = '-quests -flavors -friends -toppings -prestige_array -combos -cones -achievements';
		query_select_user = 'gold total_gold today_gold week_gold today_date week_date last_flavor last_frankenflavour last_frankenflavour_at upgrade_frankenflavour name highest_accumulation items upgrade_coldhands trend_bonus prestige_bonus icecream_sold flavors_sold last_addon';
	}
	User.findOne({ _id: req.session.user_id }).select(query_select_user).exec(function (err, u) {
		if (!u || err) return res.send(err);

		var amount = parseInt(post.a);
		var combo = parseFloat(post.c);
		var trending_flavour = parseFloat(post.t);
		var infer_amount;
		
		if (workers) {
			infer_amount = parseFloat(post.d); //post.d is the average ice cream flavor value
			var cow_clicks = parseFloat(post.cc);
			if (infer_amount > 100 || u.carts == 0) return res.send('{"notice":"worker amount too high ($' + post.d  + ')"}');
			var infer_change = amount * infer_amount;
			if (is_deep_sleep =='true') {
				infer_change = infer_change * 10;
			}
			var infer_gold = parseFloat(u.gold + infer_change).toFixed(2);
			u.gold = infer_gold; //instead interfer the new gold total
			u.total_gold += infer_change;
			u.today_gold += infer_change;
			u.week_gold += infer_change;

			// if (!isNaN(cow_clicks) && cow_clicks != u.cow_clicks) {
			// 	if (cow_clicks < u.cow_clicks || cow_clicks > u.cow_clicks + 50) {
			// 		return res.send('{"notice":"invalid cow clicks (' + cow_clicks + ' vs ' + u.cow_clicks + ')"}');
			// 	}
			// 	u.cow_clicks = cow_clicks;
			// 	u.cow_level = 100 * ( cow_clicks / ( cow_clicks + 1000 ) );
			// }

			u.save(function (err) {
				if (!u || err) {
					console.log(req.session.user_id + ': cant update user, err: ' + err);
					return res.json({notice: err});
				}
				return res.json({ gold: infer_gold, cow: u.cow_level });
			});
		} else {
			var now_date = now.getDate();
			var trending_flavour = parseFloat(post.t);
			var base = parseFloat(post.cbv);
			var combo = parseFloat(post.c);
			var cone = parseFloat(post.cone);
			var flavour_position = parseInt(post.fp);
			var is_franken_refresh = null;
			if (cone > 4.5) return res.send('{"error":"invalid cone amount"}');
			if (parseFloat(post.addon) > 4.5) return res.send('{"error":"invalid add-on amount"}');
			if (post.ha && parseFloat(post.ha) > u.highest_accumulation) {
				u.highest_accumulation = parseFloat(post.ha);
			}
			if (u.last_frankenflavour) {
				//var twenty_mins_ago = new Date(now.getTime() - 20*60*1000);
				if (now_time - new Date(u.last_frankenflavour_at) > 1200000) { //1200000 == 20 mins
					u.last_frankenflavour = null;
					is_franken_refresh = true;
				}
			}
			if (base > 7) return res.send('{"error":"invalid base amount"}');
			if (combo > 3) return res.send('{"error":"invalid combo amount (' + combo  + ')"}');

			//var on_autopilot = (!workers && u.upgrade_autopilot && amount === u.upgrade_autopilot);
			var expertise = (post.e)? parseInt(post.e) : 0;
			if (expertise > 15) return res.send('{"error":"invalid expertise amount (' + expertise  + ')"}');

			if (amount > ((u.upgrade_coldhands+1) * 100) + u.upgrade_autopilot || amount < 0) {
					if (trending_flavour) base += trending_flavour; //trending flavor
					return res.send('{"error":"Slow down, you move too fast."}');
			}
				if (post.ta == 'true') base += u.trend_bonus;   //trending event
					var prestige_bonus = base * (u.prestige_bonus / 100); //base includes the modifiers here
			if (!isNaN(combo)) { base += combo; } //combo bonus
				if (!isNaN(cone)) { base += cone; } //combo bonus
				var expertise_bonus = base * (.1 * expertise);
				infer_amount =  base + expertise_bonus + prestige_bonus; 
				infer_amount += parseFloat(post.addon); //add addon value to your clicks
				var infer_change = amount * infer_amount;
				var infer_gold = parseFloat(u.gold + infer_change).toFixed(2);
				
				if (isNaN(infer_gold)) { return res.send('{"error":"incorrect amount of money","reload":true}'); }
				//update totals
				
				//The real magic happens here
				u.gold = infer_gold;
				u.total_gold += infer_change;
				u.today_gold += infer_change;
				u.week_gold += infer_change;
				u.icecream_sold += amount;

				if (now_date != u.today_date) {
					u.today_gold = 0;
					u.today_date = now_date;
				}
				var now_day = now.getDay();
				if (now_day < u.week_date) { //when the current day of week is less than what's recorded, e.g. after day of week resets to 0
					u.week_gold = 0;
					u.week_date = 0;
				} else if (u.week_date != now_day) {
					u.week_date = now_day; 
				}

				if (!flavour_position) flavour_position = 0;
				var f_sold =  parseInt(u.flavors_sold[flavour_position]) || 0;
				u.flavors_sold[flavour_position] = f_sold + amount;
				u.markModified("flavors_sold");

				u.save(function (err) {
					var randomnumber = Math.random()*10000; 
					if (randomnumber < 10) {
						Flavor.findOne({ _id: u.last_flavor}).select('value base_value name').exec(function (err, flavor) {
							if (flavor.value > 0.10 && flavor.base_value > 1) {
								flavor.value = Math.round( (flavor.value - 0.05) * Math.pow(10,3) ) / Math.pow(10,3);
								if (flavor.value < 0.10) flavor.value = 0.20;
							} else if (flavor.value > 0.35 && flavor.base_value <= 1) {
								flavor.value = Math.round( (flavor.value - 0.01) * Math.pow(10,3) ) / Math.pow(10,3);
							} else {
								return res.send(flavor);
							}
							flavor.save(function (err) {
								if (infer_gold != post.g) { 
									return res.send('{"gold":' + infer_gold + ',"diff":' + (infer_gold-parseFloat(post.g)) + ',"infer_change":' + infer_change + ',"value":' + flavor.value + ', "_id": "' + flavor._id + '"}');
								}
								res.send(flavor);
							});
						});
					} else if (randomnumber < 15) {
						Flavor.findOne({ _id: u.last_flavor}).select('votes value').exec(function (err, flavor) {
							if (!flavor.votes) flavor.votes = 0;
							flavor.votes++;
							flavor.save(function (err) {
								if (infer_gold != post.g) { 
									return res.send('{"gold":' + infer_gold + ',"diff":' + (infer_gold-parseFloat(post.g)) + ',"infer_change":' + infer_change + ',"value":' + flavor.value + ', "_id": "' + flavor._id + '"}');
								}
								res.send(flavor);
							});
						});
					} else if (false && !on_autopilot && (randomnumber < 5 || ( u.last_addon == '524f805b3269bc0000000004' && randomnumber < 10 ) ) && flavor_id == '5238fd1f523fdc0000000003' && u.badges.indexOf(3) === -1) {
							u.badges.push(3);
							u.save(function (err, u) {
								var newmessage = new Message({
									text: u.name + ' has unlocked the St. Patrick\'s Day badge!',
									user: ':',
									created_at: new Date(),
									badge: 3
								});
								newmessage.save(function (err, m) {
									console.log(err + m);
									if (err) return res.send(err);
									res.json({reload:true});
								});
							});
					} else if (randomnumber < 125 && u.last_flavor == '524dd6ce8c8b720000000002' && u.last_addon == '523d5bb9fbdef6f047000023' && u.upgrade_frankenflavour == 1 && (!u.items || u.items.indexOf('lab parts') === -1)) {
							if (!u.items) u.items = [];
							u.items.push('lab parts');
							u.save(function (err, u) {
								var newmessage = new Message({
									text: u.name + ' has discovered the second Lab Part.',
									user: ':',
									created_at: new Date(),
									badge: 0
								});
								newmessage.save(function (err, m) {
									console.log(err + m);
									if (err) return res.send(err);
									res.json({reload:true});
								});
							});
					} else if (randomnumber < 112 && u.last_flavor == '5238fe64c719600000000001' && u.last_addon == '52ec468c0b26820000000002' && u.upgrade_frankenflavour == 2 && (!u.items || u.items.indexOf('lab parts') === -1)) {
							if (!u.items) u.items = [];
							u.items.push('lab parts');
							u.save(function (err, u) {
								var newmessage = new Message({
									text: u.name + ' has discovered the final Lab Part.',
									user: ':',
									created_at: new Date(),
									badge: 0
								});
								newmessage.save(function (err, m) {
									console.log(err + m);
									if (err) return res.send(err);
									res.json({reload:true});
								});
							});
					} else if (cache_trend_id === u.last_flavor) {
						Trend.findOne({
							$and: [ {total_sold: {$lt: 75000}}, {total_sold: {$gte: 0}} ]
						}, function (err, trend) {
							if (!trend) return res.send('{"gold":' + infer_gold + '}');
							var next_bonus = 76000 - (20000 * trend.bonus);
							var delta = (amount > 100 || amount < 0)? 100 : amount;
							trend.total_sold += delta;
							if (trend.total_sold > next_bonus) {
								trend.bonus = trend.bonus - 0.05;
							}
							trend.save(function (err, trend) {
									return res.send('{"gold":' + infer_gold + ',"trend":' + trend.total_sold + ',"ifr":' + is_franken_refresh + '}');
							});
						});
					} else {
						if (u.icecream_sold < 20 && u.icecream_sold > 10) return res.send('{"quest":true}');
						return res.send('{"gold":' + infer_gold + ',"ifr":' + is_franken_refresh + '}');
					}
				});
		}
	}); //end user findOne
});
app.get('/flavors', function(req, res){	
	var show_mine = Boolean(req.param('show_mine', false) );
	User.findOne({ _id: req.session.user_id }).select('upgrade_flavor' + ((show_mine)? ' flavors' : '') ).lean(true).exec(function (err, user) {
		if (err || !user) return res.send('[{}]');
		if (!user.upgrade_flavor) user.upgrade_flavor = 0;

		var sort = req.param('sort', 'cost');
		var lim = req.param('limit', (user.upgrade_flavor + 1) * 3);
		
		
		Flavor.find( (show_mine)? { _id : { $in: user.flavors }} : {}).sort(sort).limit(lim).lean(true).exec(function (err, flavors) {
			if (err || !flavors) return res.send(500, err);
			res.send( flavors );
		});

	});
});
app.get('/toppings', function(req, res){
	try {
	if (!req.xhr) return res.redirect('/');
	User.findOne({ _id: req.session.user_id }).select('upgrade_addon').lean(true).exec(function (err, user) {
		if (err || !user) return res.send('{}');
		Topping.find().sort('cost').limit((user.upgrade_addon + 1) * 3).lean(true).exec(function (err, toppings) {
			res.send( toppings );
		});
	});
	} catch (err) {
		res.send(500, err);
	}
});
app.get('/combos', function(req, res){
	if (!req.xhr) return res.redirect('/');
	User.findOne({ _id: req.session.user_id }).select('combos').lean(true).exec(function (err, user) {
		Combo.find({ _id: {$in: user.combos} }).lean(true).exec(function (err, combos) {  
			res.send( combos );
		});
	});
});
app.get('/achievements', function(req, res){
	if (!req.xhr) return res.redirect('/');
	Achievement.find().lean(true).exec(function (err, a) {
		for (var i = 0; i < a.length; i++) {
			a[i].name = a[i].name;
		}  
		res.send( a );
	});
});
app.get('/trends', function(req, res){
	Trend.find({}).lean(true).exec(function (err, trends) {
		res.send(trends);
	});
});
app.get('/trends/purge', function(req, res){
	Trend.find({ 
		$or: [ { total_sold: {$gte: 75000}}, {total_sold: {$lte: 0}} ] 
	}, function (err, trends) {
		for (var i = 0; i < trends.length; i++) {
			trends[i].remove();
		}
		res.send('purged');
	});
});
app.get('/trending', function(req, res){
	Trend.findOne({
			$and: [ {total_sold: {$lt: 75000}}, {total_sold: {$gte: 0}} ]
		}).lean(true).exec(function (err, trend) {
		if (trend) {
			if (cache_trend_id !== trend._id) cache_trend_id = trend.flavour_id;
			return res.send(trend);
		} else {
			Trend.find({ 
				total_sold: {$gte: 75000} 
			}, function (err, trends) {
				for (var i = 0; i < trends.length; i++) {
					trends[i].remove();
				}
				Flavor.find().select('base_value value name votes').sort('-votes last_trend_at').exec(function (err, flavours) {
					var bonus = 2.5;
					if (flavours[0].votes >= 10) {
						flavour = flavours[0];
						bonus = 2 + (flavours[0].votes * 0.05);
						if (bonus > 10) bonus = 10;
					} else {
						var candidates = [];
						for (var i = 0; i < flavours.length; i++) {
							var f = flavours[i];
							if (f.value / f.base_value <= 0.8) {
								candidates.push(f);
							}
						}
						var flavour = candidates[Math.floor(Math.random() * candidates.length)];
						if (!flavour) {
							flavour = flavours[Math.floor(Math.random() * flavours.length)];
						}
					}
					var t = new Trend({
						flavour_id: flavour._id,
						flavour_name: flavour.name,
						created_at: Date.now(),
						bonus: bonus,
						bonus_max: bonus
					});
					t.save(function (err, t) {
						cache_trend_id = t._id;
						flavour.value = flavour.base_value;
						flavour.votes = 0;
						flavour.last_trend_at = new Date();
						flavour.save(function (err, f) {
							res.send(t);
						});
					});
				});
			});
		}
	});
});
app.get('/switchtobeta', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		user.release_channel = 1;
		user.save();
		res.redirect('/');
	});
});
app.get('/event/edit', checkAdmin, function(req, res){
	Topping.find({ }).sort('event').select('name event').exec(function (err, addons) {
		var ret = '<table>';
		for (var i = 0; i < addons.length; i++) {
			var addon = addons[i];
			ret = ret + '<tr><Td>' + addon.name + '</td><td>' + addon.event + '</td><td><a href="/edit_addon?name=' + addon.name + '">edit</td></tr>';
		}
		res.send(ret);
	});
});
app.get('/event', function(req, res){
	User.findOne({ _id: req.session.user_id }).select('toppings name').lean(true).exec(function (err, user) {
		if (err || !user) return res.send('{"event":false}');
		if (!user.toppings || user.toppings.length < 1) return res.send('{"event":false}');
		var x = new Date( );
		var hours = x.getHours();
		var current_mins = (hours * 60) + x.getMinutes(); //current minutes in the day
		var max_mins = (24 * 60); //total minutes in the day
		var diff_mins = max_mins - current_mins; //time difference
		var diff_mins_wrap = diff_mins % 8;
		if (diff_mins_wrap > 7) {
			return res.send('{"success":false}');
		}
		var current = (Math.floor(diff_mins / 8) + user.name.length) % user.toppings.length;
		Topping.find({ _id: {$in: user.toppings} }).sort('event').select('_id event').lean(true).exec(function (err, addons) {
			if (err) return res.send(err);
			if (!addons[current]) current = 0;
			var event_text = (addons[current].event)? addons[current].event : 'That\'s numberwang!';
			var f = {
				_id: addons[current]._id,
				event: event_text,
				mins: diff_mins_wrap,
			};
			res.send( f );
		});
	});
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
app.get('/quests_restart', function(req, res){ //admin function
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send(500, 'er: ' + err);
		user.trend_bonus = 0.75;
		user.quests = [];
		user.save(function (err,u) { res.redirect('/'); });
	});
});
app.get('/tutorials_restart', function(req, res){ //admin function
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send(500, 'er: ' + err);
		user.tutorial = 0;
		user.save(function (err,u) { res.redirect('/'); });
	});
});
app.get('/gold_restart', checkAdmin, function(req, res){ //admin function
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
app.get('/password_restart', checkAdmin, function(req, res){ //admin function
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
app.get('/squelch', checkAdmin, function(req, res){ //admin function
	try {
	var f_name = req.param('name', null);  // second parameter is default
	User.findOne({ name: f_name }).exec(function (err, user) {
		if (err || !user) return res.send(500, 'er: ' + err);
		user.chat_squelch = !user.chat_squelch;
		user.save(function (err,u) { res.send(u); });
	});
	} catch (err) { res.send(500, err); }
});
app.post('/forgot', function(req, res){
	User.findOne({ email: req.body.email }).select('name email password').exec(function (err, user) {
		if (!user) return res.send('We couldn\'t find a player with this email - please send me a message at icecreamstandmailer@gmail.com');
		if (!user.email_verified) return res.send('We found a user with this email, but you never confirmed it! Check your email for a confirmation email from us (or contact icecreamstandmailer@gmail.com).');
		var name = user.name.substring(0,1).toUpperCase() + user.name.substring(1);
		var password = (Math.random().toString(36)+'00000000000000000').slice(2, 7+2);
		user.password = password;
		user.save(function (err) {
			if (err) return res.send(err);
			var mailOptions = {
				from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
				to: user.email, // list of receivers
				subject: "Password Reset - Ice Cream Stand", // Subject line
				text: "Hi "+name+",\r\nYou request a password reset for the Ice Cream Stand. Here is your new password: " + password + " please update it once you log in. \r\n\r\nThanks!\r\n\r\nSam",
				html: "<!doctype html><html><body style='background-color: #A3E1FF; background-image: url(http://static.icecreamstand.ca/background.png);'><img src='http://static.icecreamstand.ca/icslogo.png' alt='Logo' style='display: block; width: 455px; height: 80px; margin: 0 auto 30px;' /> " + 
				    "<p style='color: #444; font-family: 14px \"Lucida Grande\",Helvetica,Arial,sans-serif; padding: 20px 10px 50px; display: block; max-width: 600px; margin: 20px auto 0; background-color: #FFF1C6;'>" +
				    "Hi "+name+",<br>You request a password reset for the Ice Cream Stand. Here is your new password: <br><br><b>" + password + "</b><br><br>please update it once you log in. <br>Thanks!<br>Sam</p></body></html>"
			}
			smtpTransport.sendMail(mailOptions, function(error, response){
				if (error) console.log(error);
				res.render('login', {alert: 'Please check your email'});
			}); 
		});
	});
});
app.get('/verify/:name/:email64', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		var b64 = new Buffer(user.email).toString('base64');
		if (req.params.email64 != b64) {
			return res.render('login', { alert: 'Invalid verify email link'});
		}
		user.email_verified = true;
		user.save(function () {
			res.redirect('/');
		});
	});
});
app.get('/verify/resend', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (user.email_verified) return res.send('Already Verified!');
		if (!user.email) return res.send('Please add your email first!');
		var verify_url = 'http://icecreamstand.ca/verify/' + user.name + '/' + ( new Buffer(user.email).toString('base64') );
		var name = user.name.substring(0,1).toUpperCase() + user.name.substring(1);
		var mailOptions = {
			from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
			to: user.email, // list of receivers
			subject: "Welcome to the Ice Cream Stand Family", // Subject line
			text: "Hi "+name+",\r\nI just wanted to personally welcome you to Ice Cream Stand! I really hope you like it. " +
				    "If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: \r\n\r\n" + verify_url + ".\r\n\r\nThanks!\r\n\r\nSam", // plaintext body
			html: "<!doctype html><html><body style='background-color: #A3E1FF; background-image: url(http://static.icecreamstand.ca/background.png);'><img src='http://static.icecreamstand.ca/icslogo.png' alt='Logo' style='display: block; width: 455px; height: 80px; margin: 0 auto 30px;' /> " + 
				    "<p style='color: #444; font-family: 14px \"Lucida Grande\",Helvetica,Arial,sans-serif; padding: 20px 10px 50px; display: block; max-width: 600px; margin: 20px auto 0; background-color: #FFF1C6;'>" +
				    "Hi "+name+",<br>I just wanted to personally welcome you to the Ice Cream Stand! I really hope you like it. " +
				    "If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: <br><br><a href='" + verify_url + "'>" + verify_url + "</a>.<br><br>Thanks!<br>Sam</p></body></html>"
		};
		smtpTransport.sendMail(mailOptions, function(error, response){
			res.redirect('/');
		}); 
	});
});
app.post('/user_update', function(req, res){
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send(err);
		var username = post.username.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/[^\w\s]/gi, '').toLowerCase();
		if (username.length > 14) return res.send('name too long');
		if (username.length < 2) return res.send('name too short');
		user.name = username;
		if (post.password) user.password = post.password;
		if (post.email && user.email != post.email) {
			user.email = post.email.toLowerCase();
			user.email_verified = false;
			var verify_url = 'http://icecreamstand.ca/verify/' + user.name + '/' + ( new Buffer(user.email).toString('base64') );
			var name = user.name.substring(0,1).toUpperCase() + user.name.substring(1);
			var mailOptions = {
			    from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
			    to: user.email, // list of receivers
			    subject: "Welcome to the Ice Cream Stand Family", // Subject line
			    text: "Hi "+name+",\r\nI just wanted to personally welcome you to Ice Cream Stand! I really hope you like it. " +
			    "If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: \r\n\r\n" + verify_url + ".\r\n\r\nThanks!\r\n\r\nSam", // plaintext body
			    html: "<!doctype html><html><body style='background-color: #A3E1FF; background-image: url(http://static.icecreamstand.ca/background.png);'><img src='http://static.icecreamstand.ca/icslogo.png' alt='Logo' style='display: block; width: 455px; height: 80px; margin: 0 auto 30px;' /> " + 
			    "<p style='color: #444; font-family: 14px \"Lucida Grande\",Helvetica,Arial,sans-serif; padding: 20px 10px 50px; display: block; max-width: 600px; margin: 20px auto 0; background-color: #FFF1C6;'>" +
			    "Hi "+name+",<br>I just wanted to personally welcome you to the Ice Cream Stand! I really hope you like it. " +
			    "If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: <br><br><a href='" + verify_url + "'>" + verify_url + "</a>.<br><br>Thanks!<br>Sam</p></body></html>"
			}
			smtpTransport.sendMail(mailOptions, function(error, response){
					if (error) console.log(error);
					console.log(response);
			}); 
		}
		if (post.worker_increment && !isNaN(post.worker_increment)) {
			if (post.worker_increment > 100) post.worker_increment = 100;
			user.worker_increment = post.worker_increment;
		}
		if (post.release_channel) {
			if (post.release_channel == 2 && (!user.badges || user.badges.indexOf(1) == -1)) post.release_channel = 1; //need donor status
			user.release_channel = post.release_channel;
		}
		if (post.cow_name) {
			if (post.cow_name.length < 2 || post.cow_name.length > 12) return res.send('Invalid Cow Name');
			user.cow_name = post.cow_name.replace(/(<|>)/gi, '');
		}
		user.ignore = post.ignore.trim().toLowerCase();
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
				var ret = '<style>td { background: #f1f1f1; padding: 5px; margin: 5px; width: 10%;} </style>' +
				'<table><tr><td>Frankenflavour</td><td><b>flavor</b></td><td><b>addon</b></td><td><b>total value</b></td><td><b>combo</b></td><td><b>percentage</b></td></tr>';
				for ( i in cs) {
					var sub_value = 0;
					ret = ret + '<tr>';
					if (cs[i].franken_id) {
						for (j in fs) {
							if (fs[j]._id == cs[i].franken_id) { sub_value += fs[j].base_value; ret = ret + '<td>' + fs[j].name + ' (' + fs[j].base_value + ')</td>'; break; }
						}
					} else {
						ret = ret + '<td>none</td>'
					}
					for (j in fs) {
						if (fs[j]._id == cs[i].flavor_id) { sub_value += fs[j].base_value; ret = ret + '<td>' + fs[j].name + ' (' + fs[j].base_value + ')</td>'; break; }
					}
					for (j in ts) {
						if (ts[j]._id == cs[i].topping_id) { sub_value += ts[j].base_value; ret = ret + '<td>' + ts[j].name + ' (' + ts[j].base_value + ')</td>'; break; }
					}
					ret = ret + '<td>' + sub_value + '</td><td>' + cs[i].name + ' (' + cs[i].value + ') <a href="delete_combo?id=' + cs[i]._id + '" target="_blank">delete</a></td><td>' + (100*(cs[i].value/sub_value)) + '</td></tr>';
				}
				res.send(ret + '<form action="combo" method="POST">' +
					'<input name="flavor_name" placeholder="Base flavor Name">' +
					'<input name="topping_name" placeholder="add-on name">' + 
					'<input name="franken_name" placeholder="Secondary Flavour Name(frankenflavour)">' + 
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
			Flavor.findOne({name : post.franken_name.toLowerCase()}, function (err, franken) {
				if (!franken) return res.send('cant find frankenflavor');
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
						newcombo.franken_id = franken._id;
						newcombo.topping_id = topping._id;
						newcombo.flavour_sold = post.sold;
						newcombo.save(function(err, f) {
							 if (err) return res.send('Error,' + err);
							 res.send(f);
						});
					}
				});
			});
		});
	}); 
	} catch (err) { res.send(500, err); }
});
app.post('/vote/:flavor', function(req, res){
	User.findOne({ _id: req.session.user_id }).select('last_vote_at').exec(function (err, user) {
		var now = new Date();
		var tenmins = new Date(now.getTime() - 10*60*1000);
		if (user.last_vote_at && user.last_vote_at > tenmins) {
			return res.json({
				success: false,
				error: 'Please wait ' + ((user.last_vote_at - tenmins)/60000).toFixed(1) + ' minutes before voting again!'
			});
		}
		Flavor.findOne({_id : req.params.flavor}, function (err, flavor) {
			user.last_vote_at = new Date();
			if (!flavor.votes) flavor.votes = 0;
			flavor.votes++;
			user.save(function (err) {
				if (err) return res.send(err);
				flavor.save(function (err) {
					if (err) return res.send(err);
					res.json({
						success: 'voted for ' + flavor.name,
						flavor: flavor
					});
				});
			});
			
		});
	});
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
app.get('/add_toppings', checkAdmin, function(req, res){
	res.send('<form action="toppings" method="POST">' +
	'<input name="id" placeholder="optional id"><br /><input name="name" placeholder="name"><input name="base_value" placeholder="base_value"><input name="cost" placeholder="cost"><br />' + 
	'<input name="event" placeholder="optional event text">' +
	'<br /><input type="submit">');
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
app.post('/shop/item', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		fs.readFile('source/json/shop.json', 'utf8', function (err, data) {
			if (err) throw err;
			items = JSON.parse(data);
		    var buying = req.body.item;
		    var final_item;
		    if (buying) {
		    	var intelligence = 0, strength = 0, constitution = 0;
	        	var cost;
	        	for (var item in items) {
	        		if (buying == item ) {
	        			cost = items[item].cost;
	        			if (items[item].int) intelligence = items[item].int;
	        			if (items[item].str) strength = items[item].str;
	        			if (items[item].con) constitution = items[item].con;
	        			break;
	        		}
	        	}
	        	final_item = buying + '/' + intelligence + '/' + strength + '/' + constitution;
        	} else {
        		cost = 250000;
        		var chance = {
        			"common": 0,
        			"uncommon": 0.75,
        			"rare": 0.9,
        		};
        		var rand = Math.random();
        		var item_pool = [];
        		for (var item in items) {
        			if (items[item].rarity && rand > chance[ items[item].rarity ] ) {
        				var intelligence = 0, strength = 0, constitution = 0;
        				if (items[item].int) intelligence = items[item].int;
	        			if (items[item].str) strength = items[item].str;
	        			if (items[item].con) constitution = items[item].con;
        				item_pool.push(item + '/' + intelligence + '/' + strength + '/' + constitution + '/' + items[item].rarity);
        			}
        		}
        		final_item = item_pool [ Math.floor(Math.random() * item_pool.length) ];
        		if (!final_item) return res.send('{"error":"Your mystery item box was empty"}');
        		
        	}
			if (!cost) return res.send('{"error":"No item found"}');
			if (isNaN(cost) || user.gold < cost) return res.send('{"error":"Need money"}');
			user.gold = user.gold - parseInt(cost);

			user.save(function (err) {

			});
			Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
				if (!cow) return res.send('{"error":"No cow found"}');
				cow.items.push(final_item);
				cow.markModified('items');
				if (cow.items.length > 9) {
					return res.send('{"error":"Your Inventory is Full"}');
				}
				cow.save(function (err, cow) {
					if (err) return res.send(err);
					if (!buying) {
						return res.json({ 'gamble' : final_item, 'cow': cow });
					}
					res.send(cow);
				});
			}); //end cow
		}); //end user


	});
});
app.post('/unlock', function(req, res){
	var post = req.body;
	var ret = null;
	if (post.type === 'base') {
		Flavor.findOne({ _id : post.id }, function (err, flavor) {
			if (err || !flavor) return res.send('{"error":"invalid flavor"}');
			User.findOne({ _id: req.session.user_id }, function (err, user) {
				if (err || !user) return res.send(500);
				if (user.gold < flavor.cost) return res.send('{"error":"Need money"}');
				if (user.flavors.indexOf(flavor._id) > -1) return res.send('{"error":"already unlocked"}');
				user.gold -= Math.round(flavor.cost*Math.pow(10,2))/Math.pow(10,2);
				var index = (user.is_second_row && user.flavors.length >= 5)? 5 : 0;
				user.flavors.splice(index, 0, flavor._id); //puts at beginning
				user.flavors_sold.splice(index, 0,  0); //puts at beginning
				user.save(function (err, u) {
					if (err) return res.send(err);
					res.json({success:'base', user: u});
				});
			});
		});
	} else if (post.type === 'addon') {
		Topping.findOne({ _id : post.id }, function (err, topping) {
			if (err || !topping) return res.send('{"error":"invalid addon"}');
			User.findOne({ _id: req.session.user_id }, function (err, user) {
				if (err || !user) return res.send(500);
				if (user.gold < topping.cost) return res.send('{"error":"Need money"}');
				for (i in user.toppings) {
					if (user.toppings[i] == topping._id) return res.send('{"error":"already unlocked"}');
				}
				user.gold -= Math.round(topping.cost*Math.pow(10,2))/Math.pow(10,2);
				var index = (user.is_second_row && user.toppings.length >= 5)? 5 : 0;
				user.toppings.splice(index, 0, topping._id);
				if (user.last_addon == '') user.last_addon = topping._id;
				user.save(function (err, u) {
					if (err) return res.send(err);
					res.json({success:'addon', user: u});
				});
			});
		});
	} else if (post.type === 'autopilot') {
		User.findOne({ _id: req.session.user_id }).select('upgrade_autopilot gold').exec(function (err, user) {
			if (err || !user) return res.send(500);
			var amount = (post.amount && post.amount > 0)? post.amount : 1;
			for (var i = 0; i < amount; i++) {
				var cost = (250 * (user.upgrade_autopilot+1) * (user.upgrade_autopilot+1) ) + parseInt(Math.pow(1.05, user.upgrade_autopilot*2));
				if (user.gold < cost) { 
					if (amount == 10 || i == 0) {
						return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) });
					}
					ret = 'Bought ' + i;
					break;
				}
				if ( user.upgrade_autopilot >= 250 ) { ret = 'Maxed '; break; }
				user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
				user.upgrade_autopilot++;
			}
			if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err) {
				if (err) return res.send(err);
				return res.json({success:'autopilot', msg:ret});
			});
		});
	} else if (post.type === 'coldhands') {
		User.findOne({ _id: req.session.user_id }).select('upgrade_coldhands gold').exec(function (err, user) {
			if (err || !user) return res.send(500);
			var amount = (post.amount && post.amount > 0)? post.amount : 1;
			for (var i = 0; i < amount; i++) {
				var cost = (250 * (user.upgrade_coldhands+1) * (user.upgrade_coldhands+1) ) + parseInt(Math.pow(1.05, user.upgrade_coldhands*2));
				if (user.gold < cost) { 
					if (amount == 10 || i == 0) { return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) }); }
					ret = 'Bought ' + i;
					break;
				}
				if ( user.upgrade_coldhands >= 100 ) { ret = 'Maxed '; break; }
				user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
				user.upgrade_coldhands++;
			}
			if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err) {
				if (err) return res.send(err);
				return res.json({success:'coldhands', msg:ret});
			});
		});
	} else if (post.type=='sales_cart') {
		User.findOne({ _id: req.session.user_id }).select('carts gold').exec(function (err, user) {
			if (err || !user) return res.send(500);
				var amount = (post.amount && post.amount > 0)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 25 + (Math.pow(user.carts, 2) / 4);
					if (user.gold < cost) { 
						if (amount == 10 || i == 0) { return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) }); }
						ret = 'Bought ' + i; break;
					}
					if (user.carts >= 1000)  { ret = 'Maxed '; break; }
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.carts++;
				}
			if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err) {
				if (err) return res.send(err);
				return res.json({success:'cart', msg:ret});
			});
		});
	} else if (post.type=='sales_employee') {
		User.findOne({ _id: req.session.user_id }).select('employees gold').exec(function (err, user) {
			if (err || !user) return res.send(500);
				var amount = (post.amount && post.amount > 0)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 150 + (user.employees * 100);
					if (user.gold < cost) {
						if (amount == 10 || i == 0) { return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) }); }
						ret = 'Bought ' + i; break;
					}
					if (user.employees >= 1000)  { ret = 'Maxed '; break; }
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.employees++;
				}
			if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err, u) {
				if (err) return res.send(err);
				return res.json({success:'employee', msg:ret});
			});
		});
	} else if (post.type=='sales_truck') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
				var amount = (post.amount && post.amount > 0)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 1000 + (user.trucks * user.trucks * 50);
					if (user.gold < cost) { 
						if (amount == 10 || i == 0) { return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) }); }
						ret = 'Bought ' + i;
						break;
					}
					if (user.trucks >= 1000) { ret = 'Maxed '; break; }
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.trucks++;
				}
			if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err, u) {
				if (err) return res.send(err);
				return res.json({success:'truck', msg:ret});
			});
		});
	} else if (post.type=='sales_robot') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
				var amount = (post.amount && post.amount > 0)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 5000 + (user.robots * user.robots * 100); 
					if (user.gold < cost) {
						if (amount == 10 || i == 0) { return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) }); }
						ret = 'Bought ' + i;
						break;
					}
					if (user.robots >= 1000)  { ret = 'Maxed '; break; }
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.robots++;
				}
			if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err, u) {
				if (err) return res.send(err);
				return res.json({success:'robot', msg:ret});
			});
		});
	} else if (post.type=='sales_rocket') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
				var amount = (post.amount && post.amount > 0)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 50000 + (user.rockets * user.rockets * 500);
					if (user.gold < cost) {
						if (amount == 10 || i == 0) { return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) }); }
						ret = 'Bought ' + i;
						break;
					}
					if (user.rockets >= 1000)  { ret = 'Maxed '; break; }
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.rockets++;
				}
			if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err, u) {
				if (err) return res.send(err);
				return res.json({success:'rocket', msg:ret});
			});
		});
	} else if (post.type=='sales_alien') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
				var amount = (post.amount && post.amount > 0)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = 500000+(30 * Math.pow(user.aliens,2.5));
					if (user.gold < cost) {
						if (amount == 10 || i === 0) {
							return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) });
						}
						ret = 'Bought ' + i;
						break;
					}
					if (user.aliens >= 1000)  { ret = 'Maxed '; break; }
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user.aliens++;
				}
			if (amount === 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err, u) {
				if (err) return res.send(err);
				return res.json({success:'alien', msg:ret});
			});
		});
	} else if (post.type=='adopt_cow') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 1000;
			if (user.gold < cost) return res.json({ error: 'Not enough money'});
			Cow.findOne({ user_id: req.session.user_id, is_active: true }).lean(true).exec(function (err, cow) {
				if (cow) return res.json({ error: 'You already have a cow! What would ' + cow.name + ' think.'});
				user.gold -= cost;
				user.save(function (err) {
					var newCow = new Cow({
						name: 'Betty',
						user_id: req.session.user_id,
						strength: Math.floor((Math.random() * 8) + 8 ),
						intelligence: Math.floor((Math.random() * 8) + 8 ),
						constitution: Math.floor((Math.random() * 8) + 8 ),
					});
					newCow.save(function (err, cow) {
						if (err) return res.send(err);
						return res.json({success:'cow', cow:cow});
					});
				});
			});
		});
	} else if (post.type=='machine') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 15000 + (user.upgrade_machinery * 150000);
			if (user.upgrade_machinery == 10) return res.send('{"error":"You have reached the maximum level"}');
			if (user.gold < cost) return res.send('{"error":"Need money"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_machinery++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'machine'});
			});
		});  
	} else if (post.type=='research') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 50 + (user.upgrade_flavor * user.upgrade_flavor * 100);
			if (user.upgrade_flavor >= 23) return res.send('{"error":"You have reached the maximum level"}');
			if (user.flavors.length < (user.upgrade_flavor + 1) * 3) return res.send('{"error":"Please unlock all of the new flavors first (' + user.flavors.length + '/' + ((user.upgrade_flavor + 1) * 3) + '"}');
			if (user.gold < cost) return res.send('{"error":"Need money"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_flavor++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'research'});
			}); 
		});  
	} else if (post.type=='research_addon') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 75+ (user.upgrade_addon * user.upgrade_addon * 100);
			if (user.upgrade_addon >= 23) return res.send('{"error":"You have reached the maximum level"}');
			if (user.toppings.length < (user.upgrade_addon + 1) * 3) return res.send('{"error":"Please unlock all of the new add-ons first"}');
			if (user.gold < cost) return res.send('{"error":"Need money"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_addon++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'research_addon'});
			});
		});
	} else if (post.type=='heroic') { 
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 1000000 + (user.upgrade_heroic * 3000000);
			if (user.upgrade_heroic == 3) return res.send('{"error":"You have reached the maximum level"}');
			if (user.upgrade_flavor < 23 || user.upgrade_addon < 23) return res.send('{"error":"Please research more"}');
			if (user.gold < cost) return res.send('{"error":"Need money"}');
			if (user.flavors.length < (user.upgrade_flavor + 1) * 3) return res.send('{"error":"Please unlock all of the new flavors first"}');
			if (user.toppings.length < (user.upgrade_addon + 1) * 3) return res.send('{"error":"Please unlock all of the new add-ons first"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_heroic++; 
			user.upgrade_addon++;
			user.upgrade_flavor++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'heroic'});
			});
		});
	} else if (post.type=='legendary') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = 50000000 + (user.upgrade_legendary * 100000000);
			if (user.upgrade_legendary == 2) return res.send('{"error":"You have reached the maximum level"}');
			if (user.gold < cost) return res.send('{"error":"Need money"}');
			if (user.flavors.length < (user.upgrade_flavor + 1) * 3) return res.send('{"error":"Please unlock all of the new flavors first"}');
			if (user.toppings.length < (user.upgrade_addon + 1) * 3) return res.send('{"error":"Please unlock all of the new add-ons first"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_legendary++; 
			user.upgrade_addon++;
			user.upgrade_flavor++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'legendary'});
			});
		}); 
	} else if (post.type=='frankenflavour') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (!user.items || user.items.indexOf('lab parts') == -1) {
				return res.send('{"error":"Requires 1x Lab Parts"}');
			}
			if (user.upgrade_frankenflavour && user.upgrade_frankenflavour >= 3) return res.send('{"error":"Maxed"}');
			if (!user.upgrade_frankenflavour) user.upgrade_frankenflavour = 0;
			user.upgrade_frankenflavour++;
			user.items = [];
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'frankenflavour'});
			});
		}); 
	} else if (post.type=='prestige') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			if (user.quests.length < 5) return res.send('{"error":"Complete quests"}');
			
			var x = user.gold;
			var gold_bonus = 25 * (x / (x + 1000000));
			var x2 = user.flavors.length + user.toppings.length;
			var unlock_bonus = (x2 / 174) * 25; 
			var x_total = gold_bonus + unlock_bonus;
			if (x_total > 50) x_total = 50;

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
			user.prestige_level++;
			user.prestige_array.push(x_total);

			var new_prestige = 0;
			for (var i = 0; i < user.prestige_array.length; i++) {
				new_prestige += parseFloat(user.prestige_array[i]);
			}
			if (parseFloat(new_prestige) < user.prestige_bonus ) return res.send('{"error":"This would lower your total prestige"}');
			user.prestige_bonus = parseFloat(new_prestige).toFixed(5);
			if (user.prestige_bonus > 400) user.prestige_bonus = 400;

			//reset it all EH HEH HEH!
			user.gold = 0;
			user.carts = 0;
			user.employees = 0;
			user.trucks = 0;
			user.robots = 0;
			user.rockets = 0;
			user.aliens = 0;
			user.upgrade_machinery = 0;
			user.upgrade_autopilot = 0;
			user.upgrade_coldhands = 0;
			user.upgrade_flavor = 0;
			user.upgrade_addon = 0;
			user.upgrade_heroic = 0;
			user.upgrade_legendary = 0;
			user.upgrade_frankenflavour = 0;
			user.flavors = '5238d9bc76c2d60000000001';
			user.flavors_sold = '0';
			user.toppings = '523d5800fbdef6f047000013';
			user.combos = [];
			user.quests = [];
			user.last_flavor = '5238d9bc76c2d60000000001';
			user.last_frankenflavour = '';
			user.last_addon = '523d5800fbdef6f047000013';
			user.trend_bonus = 1.0;
			user.workers_sold = 0;
			user.gross_sold = 0;
			user.friend_gold = 0;
			user.last_prestige_at = new Date();
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({reload:true});
			});
		});
	} else if (post.type=='cone') { 
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			var cones = {
				babycone: { cost: 1000000, prestige: 25},
				chocolate: { cost: 10000000, prestige: 75},
				sprinkle: { cost: 500000000, prestige: 150},
				sprinkle: { cost: 500000000, prestige: 150},
				sugarcone: { cost: 1000000000, prestige: 200},
				waffle: { cost: 5000000000, prestige: 300},
				whitechocolate: { cost: 20000000000, prestige: 399},
			}
			var cone = cones[post.id];
			if (!cone) return res.send('{"error":"40C: Cone not found"}');
			if (!user.prestige_bonus || user.prestige_bonus < cone.prestige) return res.send('{"error":"Need Prestige"}');
			if (user.gold < cone.cost) return res.send('{"error":"not enough money"}');
			if (user.cones && user.cones.indexOf(post.id) !== -1) return res.send('{"error":"Already unlocked"}');
			user.cones.push(post.id);
			user.gold -= Math.round(cone.cost*Math.pow(10,2))/Math.pow(10,2);
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'cone'});
			});
		});
	} else {
		res.send('{"error":"error"}');
	}
});
app.post('/signup', function(req, res){
	try {
	var post = req.body;
    if (post.name) {
    	var n = post.name.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/[^\w\s]/gi, '').toLowerCase();
		if (n.length < 2) return res.send('Name too short');
		if (n.length > 10) return res.send('Name too long');
		var newuser = new User({
			name: n,
			ip: req.connection.remoteAddress,
			created_at: new Date,
			is_guest: false
		});
		if (post.refer) newuser.referal_code = post.refer;
		if (post.email) newuser.email = post.email;
		if (post.password) newuser.password = post.password;
		newuser.save(function(err, user) {
		  if (err) return res.render('login', {alert: 'Could not create an account. Name taken?'});
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
		var now_time = new Date().getTime();
		//console.log(u.name + ': ' + now_time + ' vs ' + (u.friend_last + 24 * 60 * 60 * 1000));
		if (!u.friend_last || now_time > u.friend_last + 24 * 60 * 60 * 1000) {
			console.log('Giving friend gold for ' + u.name);
			u.friend_last = now_time;
			u.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
			var new_friend_gold = parseFloat(u.today_gold * .0001);
			if (new_friend_gold > 50) {
				for (var i = 0; i < u.friends.length; i++) {
					User.findOne({ _id: u.friends[i] }).select('friend_gold').exec(function (err, friend) {
						if (!friend.friend_gold || isNaN(friend.friend_gold)) friend.friend_gold = 0;
						friend.friend_gold = Number(friend.friend_gold) + new_friend_gold;
						if (friend.friend_gold > 10000000) friend.friend_gold = 10000000;
						friend.save();
					});
				}
				//res.send(u);
			}
		} else {
			res.send(u);
		}
	});
});
app.get('/cow/:id', function(req, res){
	Cow.findOne({ _id: req.params.id}).lean(true).exec(function (err, cow) {
		User.findOne({ _id: cow.user_id}).select('name').lean(true).exec(function (err, user) {
			res.json({
				cow: cow,
				user: user
			});
		});
	});
});
app.get('/cow/:id/delete', checkAdmin, function(req, res){
	Cow.findOne({ _id: req.params.id}).exec(function (err, cow) {
		cow.remove();
		res.send('y');
	});
});
app.get('/cow/:id/activate', checkAdmin, function(req, res){
	Cow.findOne({ _id: req.params.id}).exec(function (err, cow) {
		cow.is_active = !cow.is_active;
		cow.save();
		res.send(cow);
	});
});
app.get('/me/cow', function(req, res){
	Cow.findOne({ user_id: req.session.user_id, is_active: true }).lean(true).exec(function (err, cow) {
		res.send(cow);
	});
});
app.get('/me/cows', function(req, res){
	Cow.find({ user_id: req.session.user_id, }).lean(true).exec(function (err, cows) {
		res.send(cows);
	});
});
app.post('/cow/update', function(req, res){
	Cow.findOne({ user_id: req.session.user_id, is_active: true }).exec(function (err, cow) {
		if (!cow) return res.json({ err: 'no cow found' });
		if (err) return res.send(err);
		if (req.body.h) cow.happiness = req.body.h;
		if (req.body.name) cow.name = req.body.name;
		if (req.body.experience && (!cow.experience || cow.experience > req.body.experience - 10)) {
			cow.level = 100 * ( cow.experience / ( cow.experience + 1000 ) );
			cow.experience = req.body.experience;
		}
		if (req.body.memory) {
			if (!cow.memories) cow.memories = [];
			cow.memories.push(req.body.memory);
			cow.markModified('memories');
		}
		if (req.body.items) {
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
			if (cow.items.length > 9) {
				cow.items = cow.items.slice(0, 9);
			}
			cow.markModified('items');
		}
		//cow.is_active = true;
		cow.save(function (err) {
			if (err) return res.send(err);
			res.send(cow);
		});
	});
});
app.post('/cow/new', function(req, res){
	Cow.find({ user_id: req.session.user_id }).exec(function (err, cows) {
		var len = cows.length;
		for (var i = 0; i < len; i++) {
			if (cows[i].is_active) {
				cows[i].is_active = false;
				cows[i].save();
			}
		}
		var newcow = new Cow({
			name: req.body.name,
			user_id: req.session.user_id,
			strength: Math.floor((Math.random() * 8) + 8 + len),
			intelligence: Math.floor((Math.random() * 8) + 8 + len),
			constitution: Math.floor((Math.random() * 8) + 8 + len),
		});
		newcow.save(function (err, newcow) {
			if (err) return res.send(err);
			res.send(newcow);
		});
	});
});
app.get('/suggestion/user', function(req, res){
	User.findOne({ _id: req.session.user_id }).select('friends').exec(function (err, me) {
		var now = new Date();
		var dayago = new Date(now.getTime() - 24*60*60*1000);
		User.find({ 
			email: {'$ne': null },
			_id: {'$ne': me._id },
			_id: { '$nin': me.friends },
			updated_at: { $gt: dayago}
		}).lean(true).sort('-updated_at').select('name friends').limit(25).exec(function (err, users) {

			for (var i = 0; i < users.length; i++) {
				if (users[0].friends.length < 2) {
					return res.json({ user: users[i].name });
				}
			}

			return res.json({ user: users[0].name });
		});
	});
});
app.get('/user/:name/cow', function(req, res){
	User.findOne({ name: req.params.name }).lean(true).exec(function (err, user) {
		Cow.findOne({ user_id: user._id, is_active: true }).lean(true).exec(function (err, cow) {
			res.send(cow);
		});
	});
});
app.get('/user/:name/cows', function(req, res){
	User.findOne({ name: req.params.name }).lean(true).exec(function (err, user) {
		Cow.find({ user_id: user._id }).lean(true).exec(function (err, cows) {
			res.send(cows);
		});
	});
});
app.get('/user/:name/cow/:item', checkAdmin, function(req, res){
	User.findOne({ name: req.params.name }).lean(true).exec(function (err, user) {
		Cow.findOne({ user_id: user._id }).exec(function (err, cow) {
			cow.items.unshift(req.params.item);
			cow.markModified('items');
			cow.save();
			res.send(cow);
		});
	});
});
app.get('/reward', checkAdmin, function(req, res){
	var n = req.param('n', null);  // second parameter is default
	var a = parseInt(req.param('a', 0));  // second parameter is default
	var badge = req.param('badge', null);  // second parameter is default
	var item = req.param('item', null);  // second parameter is default
	var cone = req.param('cone', null);  // second parameter is default
	var mod = req.param('mod', null);  // second parameter is default
	var title = req.param('title', null);  // second parameter is default
	var email = req.param('email', null);  // second parameter is default
	var friend_gold = req.param('friend_gold', null);  // second parameter is default
	var accumulation = req.param('accumulation', null);  // second parameter is default
	var item = req.param('item', null);  // second parameter is default
	if (email) {
		User.findOne({ name : n }).exec(function (err, user) {
			if (!user) return res.send('user not found!');
			user.email = email;
			user.save();
			var verify_url = 'http://icecreamstand.ca/verify/' + user.name + '/' + ( new Buffer(user.email).toString('base64') );
			var name = user.name.substring(0,1).toUpperCase() + user.name.substring(1);
			var mailOptions = {
			from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
			to: user.email, // list of receivers
			subject: "Welcome to the Ice Cream Stand Family", // Subject line
			text: "Hi "+name+",\r\nI just wanted to personally welcome you to Ice Cream Stand! I really hope you like it. " +
				    "If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: \r\n\r\n" + verify_url + ".\r\n\r\nThanks!\r\n\r\nSam", // plaintext body
			html: "<!doctype html><html><body style='background-color: #A3E1FF; background-image: url(http://static.icecreamstand.ca/background.png);'><img src='http://static.icecreamstand.ca/icslogo.png' alt='Logo' style='display: block; width: 455px; height: 80px; margin: 0 auto 30px;' /> " + 
				    "<p style='color: #444; font-family: 14px \"Lucida Grande\",Helvetica,Arial,sans-serif; padding: 20px 10px 50px; display: block; max-width: 600px; margin: 20px auto 0; background-color: #FFF1C6;'>" +
				    "Hi "+name+",<br>I just wanted to personally welcome you to the Ice Cream Stand! I really hope you like it. " +
				    "If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: <br><br><a href='" + verify_url + "'>" + verify_url + "</a>.<br><br>Thanks!<br>Sam</p></body></html>"
			};
			smtpTransport.sendMail(mailOptions, function(error, response){
				res.send(user);
			}); 
		});
	} else if (badge == 'highscores') {
		var now = new Date();
		User.find({today_date : now.getDate(), today_gold: {$gt: 0}, shadow_ban:null,is_guest: false }).sort('-today_gold').limit(100).select('name badges').exec(function (err, u) {
			for (i in u) {
				user = u[i];
				if (user.badges.indexOf(4) === -1) {
					user.badges.push(4);
					var pm = new PrivateMessage({
						to: user._id,
						from: ':',
						text: 'You have escaped hell and earned a badge!',
					});
					pm.save();
					user.save();
				}
			}
		});
	} else {
		badge = parseInt(badge);
		User.findOne({ name : n }).exec(function (err, user) {
			if (!user) return res.send('user not found!');
			if (err || !user) return res.send('err ' + err);
			if (badge) {
				if (user.badges.indexOf(badge) > -1) { return res.send('already has that badge.'); }
				var pm = new PrivateMessage({
					to: user._id,
					from: ':',
					text: 'The mighty : has given you a badge.'
				});
				pm.save();
				user.badges.push(parseInt(badge));
			} else if (item) {
				Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
					if (!cow) return res.send('no cow');
					cow.items.push(item);
					cow.save();
					res.send(cow);
				});
			} else if (accumulation) {
				user.highest_accumulation = 0;
			} else if (mod) {
				user.is_mod = (mod == 'true');
			} else if (title) {
				user.title = title;
			} else if (friend_gold) {
				user.friend_gold = friend_gold;
			} if (item) {
				user.items.push(item);
			} else if (a > 0) {
					var pm = new PrivateMessage({
						to: user._id,
						from: ':',
						text: 'The mighty : has given you money.',
						money: a
					});
					pm.save();
			}
			user.save(function (err, u) {
				if (err) return res.send('err' + err);
				res.send(u);
			});
		});
	}
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
app.get('/ban', checkAdmin, function(req, res){
	try {
	var n = req.param('n', null);  // second parameter is default
	User.findOne({ name : n }, function(err, user) {
		if (err || !user) return res.send('err');
		user.shadow_ban = (user.shadow_ban)? null : true;
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
		User.findOne({ _id: req.session.user_id }).select('achievements').exec(function (err, u) {
			if (!u) return res.send('{"success":"false"}');
			if (!u.achievements) u.achievements = [];
			for (i in u.achievements) {
				if (u.achievements[i] == achievement._id) return res.send('{"success":"false"}');
			}
			u.achievements.push(achievement._id);
			u.save(function (err) {
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
app.post('/toggle/night', function(req, res){
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		if (!u.is_night) u.is_night = false;
		u.is_night = !u.is_night;
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
	} catch (err) { res.send(500, err); }
});
app.post('/toggle/friend_notify', function(req, res){
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		if (!u.is_friend_notify) u.is_friend_notify = false;
		u.is_friend_notify = !u.is_friend_notify;
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
	} catch (err) { res.send(500, err); }
});
app.post('/toggle/second_row', function(req, res){
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		if (!u.is_second_row) u.is_second_row = false;
		u.is_second_row = !u.is_second_row;
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
});
app.post('/toggle_display', function(req, res){
	try {
	var type_array = ['flavor', 'quests', 'achievements', 'chat'];
	var type = type_array.indexOf(req.body.type);
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		if (u.display_settings.length < 3) u.display_settings = [1,1,1,1];
		u.display_settings[type] = (u.display_settings[type] === 0)? 1 : 0;
		u.markModified('display_settings');
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.json( { t: type, display_settings: u.display_settings});
		}); 
	});
	} catch (err) { res.send(500, err); }
});
app.post('/toggle_chat', function(req, res){ //holy DRY batman!
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		u.chat_off = !u.chat_off;
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
});
app.post('/toggle_tooltip', function(req, res){ //holy DRY batman!
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		u.is_tooltip = !u.is_tooltip;
		u.save(function (err,u) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
});
app.post('/toggle_badge', function(req, res){ //holy DRY batman!
	try {
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		u.badge_off = !u.badge_off;
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
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500);  
		var last_quest = u.quests[ u.quests.length - 1];
		var quest_split = last_quest.split('&');
		if (quest_split[1] == '0') return res.json({error:'Already Complete'});
		if (last_quest.substring(0,2) == '!d') {
			var starting_point = parseInt(quest_split[2]);
			var dynamic = quest_split[0].split(',');
			var cost = parseInt(dynamic[5]);
			var type = dynamic[4];
			var current = u.flavors.indexOf( type );
			var current_sold = (current > -1)? u.flavors_sold[ current ] : starting_point + cost;
			var diff_sold = current_sold - starting_point;
			if (diff_sold < cost) {
				return res.json({
					error:  (cost - diff_sold) + ' to go'
				});
			}
			u.trend_bonus = Number(u.trend_bonus) + 0.25;
			last_quest = quest_split[0] + '&0&' + starting_point;
			u.quests[ u.quests.length - 1] = last_quest;
			u.markModified("quests");
			u.save(function (err) {
				if (err) return res.send(500, err);
				return res.json({ name: 'dynamic quest', description: last_quest });
			});
		} else {
			Quest.findOne({_id : post.id}).exec(function (err, quest) {
				if (err || !quest || !u) return res.send(500, err);
				var quest_complete = true;
				var new_refer = false;
				var real_cost = parseInt(quest_split[2]);
				if (quest.level == 0) {
					new_refer = true;
					var position_of_strawberry = u.flavors.indexOf('5238d9d376c2d60000000002');
					if (position_of_strawberry < 0) return res.send('{"error":"Unlock her favourite flavor first!"}');
					var flavor_sold = u.flavors_sold[position_of_strawberry];
					var strawberry_flavor_req = [15,50,150,300,600,900,1600,2400,4000,10000,50000, 95000, 225000, 1000000, 5000000, 10000000];
					if (flavor_sold < strawberry_flavor_req[real_cost-1]) return res.send('{"error":"Sell ' + (strawberry_flavor_req[real_cost-1] - flavor_sold) + ' more of her favourite"}');
				} else if (quest.level == 1) { 
					if (u.carts < real_cost) return res.send('{"error":"' + (real_cost - u.carts) + ' more ' + ((real_cost - u.carts == 1)? 'cart' : 'carts') + '"}');
				} else if (quest.level == 2) { 
					if (u.combos.length < real_cost) return res.send('{"error":"Need  ' + (real_cost - u.combos.length) + ' Combos"}');
				} else if (quest.level == 3) { 
					if (u.trucks < real_cost) return res.send('{"error":"buy ' + (real_cost - u.trucks) + ' more truck(s)"}');
					u.upgrade_frankenflavour = 1;
				} else if (quest.level == 4) { 
					var num_above_100 = 0;
					var last_flavor_cull = '';
					var outstanding = [];
					for (var i = 0; i < u.flavors.length; i++) {
						if (u.flavors_sold[i] && u.flavors_sold[i] > 99) {
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
					} else if (num_above_100 < real_cost) {
						return res.send('{"error":"Only ' + num_above_100 + ' flavors past 100"}'); 
					}
				}
				if (quest_complete) {
					if (quest.level > 1) u.trend_bonus = Number(u.trend_bonus) + 1;
					for (i in u.quests) {
						if (!u.quests[i]) return res.send('{"error":"Invalid quest"}'); 
						if (u.quests[i].length === 0) return res.send('{"error":"bad quest length ' + i + '"}'); 
						if (typeof u.quests[i] != 'string') return res.send('{"error":"bad quest type"}'); 
						var q = u.quests[i].split('&')[0];
						if (q == quest._id) {
							u.quests[i] = quest._id + '&0&' + real_cost; break;
						}
					}
					u.markModified("quests");
					u.save(function (err) {
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
		}
	}); //end user callback
});
app.get('/new_quest', function(req, res){
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send('{"error":"user not found"}'); 
		if (u.quests.length >= 20) return res.send('{"error":"all quests complete"}'); 
		if (u.total_gold < (u.quests.length * u.quests.length * 10) + 10) return res.send('{"error":"not enough money"}');
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
		if (u.quests.length >= 5) {
			var gen = generate_dynamic(u);
			var x = new Date();
			if (gen.trend) {
				Trend.findOne({ }, function (err, trend) {
					var flavour = trend.flavour_id;
					var sold_i = u.flavors.indexOf(flavour);
					var sold = u.flavors_sold[sold_i];
					var q = gen.quest.split(',');
					q[4] = flavour;
					var new_qest = q.join(',') + '&' + x.toUTCString() + '&' + sold;
					u.quests.push( new_qest );
					u.save(function (err) { });	
					return res.json({
						name: "Dynamic Quest",
						dynamic_quest: gen.quest,
						quest: new_qest
					});
				});
			} else {
				var new_qest = gen.quest + '&' + x.toUTCString() + '&' + gen.sold;
				u.quests.push( new_qest );
				u.save(function (err) {
					return res.json({name: 'Dynamic Quest',dynamic_quest: gen.quest,quest: new_qest});
				});	
			}
		}
		Quest.findOne({level : number_of_completed}).exec(function (err, quest) {
			if (err || !quest) return res.send(err);
			var x = new Date();
			var real_cost = (quest.cost + u.prestige_level);
			if (quest._id == '52672dea3a8c980000000001') real_cost = Math.ceil(quest.cost + (u.prestige_level / 2)); //last
			if (quest._id == '52577a6288983d0000000001') real_cost = Math.ceil(quest.cost + (u.prestige_level / 4)); //strawberry
			if (quest._id == '52672bedde0b830000000001') real_cost = Math.ceil(quest.cost + (u.prestige_level * 2)); //carts
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
});
app.get('/remove', function(req, res){
	var n = req.param('n', null);  // second parameter is default
	User.findOne({ name : n }).exec(function (err, user) {
		if (err || !user) return res.send('cant find');
		user.remove();
		res.send('removed');
	});
});


app.get('/detection', function (req, res) {
	if (!req.session.stat_clicks) return res.send('no data');
	var start = req.session.stat_clicks[req.session.stat_clicks.length - 1];
	var confidence = 0;
	var l = req.session.stat_clicks.length;
	for (var i = 0; i < 40; i++) {
		var d = Math.abs(start - req.session.stat_clicks[i]);
		if (d < 2) {
			confidence++;
		}
	}
	var suspic = (confidence > 30)? 100 : (confidence / 30) * 100;
	res.send('Your clicks are ' + (suspic).toFixed(2) + '% suspicious based on ' + l + ' data points. (Don\'t worry nothing happens, but at 100% we give you a message). <br>Based on these recent clicks/2 seconds: ' + req.session.stat_clicks.join() );
});

app.post('/switch', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).select('flavors flavors_sold').exec(function (err, u) {
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
		u.save(function (err) {
			if (err) return res.send(500, err);
			res.send(200, '{"i1":"' + base1_index + '"}');
		});
	});
	} catch (err) { res.send(500, err); }
});
app.post('/switch/addon', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).select('toppings').exec(function (err, u) {
		if (err || !u) return res.send(500, 'missing');
		var base1 = req.param('1', null);  // second parameter is default
		var base2 = req.param('2', null);  // second parameter is default
		var spot = req.param('spot', null);  // second parameter is default
		var base1_index = u.toppings.indexOf(base1);
		if (!base1 || base1_index < 0) return res.send(500, 'missing');
		
		if (base2) {
			var base2_index = u.toppings.indexOf(base2);
			if (base2_index < 0) return res.send(500, 'missing (2)');
			u.toppings[base2_index] = base1;
			u.toppings[base1_index] = base2;
		}
		
		u.markModified("toppings"); 
		u.save(function (err) {
			if (err) return res.send(500, err);
			res.send(200, '{"i1":"' + base1_index + '"}');
		});
	});
	} catch (err) { res.send(500, err); }
});
app.post('/switch/combo', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).select('combos').exec(function (err, u) {
		if (err || !u) return res.send(500, 'missing user');
		var base1 = req.param('1', null);  // second parameter is default
		var base2 = req.param('2', null);  // second parameter is default
		var spot = req.param('spot', null);  // second parameter is default
		var base1_index = u.combos.indexOf(base1);
		if (!base1 || base1_index < 0) return res.send(500, 'missing');
		
		if (base2) {
			var base2_index = u.combos.indexOf(base2);
			if (base2_index < 0) return res.send(500, 'missing (2)');
			u.combos[base2_index] = base1;
			u.combos[base1_index] = base2;
		}
		
		u.markModified("combos"); 
		u.save(function (err) {
			if (err) return res.send(500, err);
			res.send(200, '{"i1":"' + base1_index + '"}');
		});
	});
	} catch (err) { res.send(500, err); }
});
app.post('/switch/cone', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).select('cones').exec(function (err, u) {
		if (err || !u) return res.send(500, 'missing user');
		if (u.cones.indexOf('default') === -1) u.cones.push('default');
		var base1 = req.param('1', null);  // second parameter is default
		var base2 = req.param('2', null);  // second parameter is default
		var spot = req.param('spot', null);  // second parameter is default
		var base1_index = u.cones.indexOf(base1);
		if (!base1 || base1_index < 0) return res.send(500, 'missing');
		
		if (base2) {
			var base2_index = u.cones.indexOf(base2);
			if (base2_index < 0) return res.send(500, 'missing (2)');
			u.cones[base2_index] = base1;
			u.cones[base1_index] = base2;
		}
		
		u.markModified("cones"); 
		u.save(function (err) {
			if (err) return res.send(500, err);
			res.send(200, '{"i1":"' + base1_index + '"}');
		});
	});
	} catch (err) { res.send(500, err); }
});
app.get('/highscores', function(req, res){
	if (!req.session.user_id) return res.send('not logged in');
	var h_type = req.param('type', null);  // second parameter is default
	var lim = req.param('limit', 100);  // second parameter is default
	if (h_type == 'all') {
		User.find({total_gold: {$gt: 0}, shadow_ban:null, is_guest: false}).sort('-total_gold').limit(lim).lean(true).select('name total_gold updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else if (h_type == 'today') {
		var now = new Date();
		var dayago = new Date(now.getTime() - 24*60*60*1000);
		User.find({today_date : now.getDate(), today_gold: {$gt: 0}, shadow_ban:null, updated_at: { $gt: dayago}, is_guest: false }).lean(true).sort('-today_gold').limit(lim).select('name today_gold updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else if (h_type == 'upandcoming') {
		var now = new Date();
		var thirtydayago = new Date(now.getTime() - 30*24*60*60*1000);
		User.find({created_at : {$gt:thirtydayago}, total_gold: {$gt: 0}, shadow_ban:null, is_guest: false}).sort('-total_gold').limit(lim).select('name total_gold updated_at').lean(true).exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else if (h_type == 'prestige') {
		var now = new Date();
		User.find({prestige_bonus : {$gt:0}, shadow_ban:null, is_guest: false}).sort('-prestige_bonus').limit(lim).lean(true).select('name prestige_bonus updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else if (h_type == 'accumulation') {
		var now = new Date();
		User.find({highest_accumulation : {$gt:0}, shadow_ban:null, is_guest: false}).sort('-highest_accumulation').limit(lim).lean(true).select('name highest_accumulation updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else if (h_type == 'cow') {
		var now = new Date();
		Cow.find({level : {$gt:1}, is_active: true}).sort('-level').limit(lim).lean(true).select('name level user_id').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	} else {
		var now = new Date();
		var week_num = now.getDay();
		var dayago = new Date(now.getTime() - 3*24*60*60*1000);
		User.find({week_gold: {$gt: 0}, week_date: week_num, shadow_ban:null, updated_at: { $gt: dayago}, is_guest: false}).sort('-week_gold').limit(lim).lean(true).select('name week_gold updated_at').exec(function (err, u) {
			if (err) return res.send(err);
			res.send(u);
		});
	}
});
app.get('/remove_old_users', checkAdmin, function(req, res){ //admin function
	var now = new Date();
	var dayago = new Date(now.getTime() - 24*60*60*1000);
	User.find({updated_at : {$lt: dayago}, total_gold: { $lt: 1000 }}).select('_id name').limit(2000).exec(function (err, users) {
		var l = users.length;
		var ret = '';
		for (var i = 0; i < l; i++) {
			ret = ret + users[i].name + ' removed<br>';
			users[i].remove();

		}
		res.send(l + ' removed<hr>' + ret);
	});
});
app.get('/remove_old_messages', checkAdmin, function(req, res){ //admin function
	var now = new Date();
	var dayago = new Date(now.getTime() - 24*60*60*1000);
	PrivateMessage.find({}, function (err, messages) {
		var l = messages.length;
		for (var i = 0; i < l; i++) {
			messages[i].remove();
		}
		res.send(l + ' removed');
	});
});
app.get('/online/all', function(req, res){
	var now = new Date();
	var fiveminago = new Date(now.getTime() - 30*60*1000);
	User.count( {updated_at : {$gt: fiveminago}} ).exec(function (err, count) {
			res.send({ c: count});
	});
});
app.get('/online/total', function(req, res){
	User.count({}).exec(function (err, count_total) {
		var now = new Date();
		var fiveminago = new Date(now.getTime() - 30*60*1000);
		User.count( {updated_at : {$gt: fiveminago}} ).exec(function (err, count_online) {
				res.send({ c: count_online, t: count_total });
		});
	});
});
app.get('/online/alpha', function(req, res){
	User.count( { release_channel : { $gt: 0 } } ).exec(function (err, count) {
		res.send({ c: count});
	});
});
app.get('/online/email_send', function(req, res){
	var now = new Date();
	var weekago = new Date(now.getTime() - 7*24*60*60*1000);
	User.find({ updated_at : {$lt: weekago}, email: {$ne: null} }).select('name email').lean(true).exec(function (err, users) {
		var mailOptions = {
		    from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
		    to: "avonwodahs@gmail.com", // list of receivers
		    subject: "Your ice cream stand misses you", // Subject line
		    text: "users: " + users.length, // plaintext body
		    html: '<b>Hello world ' + users.length + ' ✔</b>'
		}
		// send mail with defined transport object
		smtpTransport.sendMail(mailOptions, function(error, response){
			console.log(error);
			console.log(response);
		    if(error) {
		    	return res.json({ err: error});
		    }
		    res.send('sent');
		}); 
	});
});
app.get('/messages', function(req, res){
	PrivateMessage.find({to: req.session.user_id}).sort('is_read -created_at').limit(100).lean(true).exec(function (err, pms) {
			res.send(pms);
	});
});
app.get('/cows', function(req, res){
	Cow.find().limit(100).lean(true).exec(function (err, cows) {
		res.send(cows);
	});
});
app.get('/redeem_friend', function(req, res){
	User.findOne({_id: req.session.user_id}).select('friend_gold friend_total_gold gold').exec(function (err, user) {
		if (!user || user.friend_gold == 0 ) return res.json({ err: 'Invalid' }); 
		user.friend_total_gold = user.friend_total_gold + user.friend_gold;
		user.gold = user.gold + parseFloat(user.friend_gold);
		user.friend_gold = 0;
		user.save(function (err) {
			if (err) return res.json({ err: 'Error: ' + err }); 
			res.json({ success: true }); 
		});
	});
});
app.get('/online', function(req, res){
	User.findOne({_id: req.session.user_id}).select('friends messages').lean(true).exec(function (err, user) {
		if (err || !user) return res.send('err ' + err);
		User.find({_id : {$in: user.friends}}).select('name updated_at').sort('name').lean(true).exec(function (err, friend_list) {
			if (user.message_count == 0) {
				res.json({ friends: friend_list, messages: [] });
			} else {
				PrivateMessage.find({to: user._id}).sort('is_read -created_at').limit(5).lean(true).exec(function (err, pms) {
					res.json({ friends: friend_list,	messages: pms });
				});
			}
		});
	});
});
app.get('/chat', function(req, res){
	var len = req.param('expanded', 8);  // second parameter is default
	Message.find().sort({$natural:-1}).limit(len).lean(true).exec(function (err, messages) {
			if (req.xhr) { //is_ajax?
				return res.send(messages);
			} else {
				var ret = '';
				for (var i = 0; i < messages.length; i++) {
					ret = ret + messages[i].user + ': ' + messages[i].text + '\n';
				}
				res.send(ret);
			}
	});
});
app.post('/chat', function(req, res){
	if (!req.body.text) return res.json({error: 'Message blank'});
	if (req.body.text.length > 240) return res.json({error: 'Message too long'});
	var re = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
	var t = req.body.text.replace(re, "");
	Message.find().sort({$natural:-1}).limit(1).lean(true).exec(function (err, messages) {
		if (t == messages[0].text) return res.json({error: 'This message has already been sent!'});

		User.findOne({_id: req.session.user_id }).select('is_quest name quests badge is_admin prestige_level shadow_ban easter').lean(true).exec(function (err, user) {
			if (err || !user || !req.body.text) return res.json({error: 'An error has occured'});
			if (user.shadow_ban) return res.json({error: 'You are muted, If you feel this was an error please send us Feedback.'});
			if (user.is_guest) return res.json({error: 'Please set a username first under settings'});
			if (user.prestige_level == 0 && (!user.quests || user.quests.length < 1)) return res.json({error: 'Please enjoy the game a bit before chatting'});
			
			var patt = /(fuck|shit|damn|pussy|penis|blowjob|cunt|bitch|nigger|slut|asshole)/g;
			if (patt.test(t.toLowerCase().replace(/\s/g, ''))) {
				var motivationals = [
					'Always do your best. What you plant now, you will harvest later.',
					'You are never too old to set another goal or to dream a new dream.',
					'If you can dream it, you can do it.',
					'Be kind whenever possible. It is always possible.',
					'Even if you fall on your face, you\'re still moving forward.',
					'In order to succeed, we must first believe that we can.',
					'By failing to prepare, you are preparing to fail.',
					'Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.'
				];
				t = motivationals[Math.floor( Math.random() * motivationals.length )];
			}
			var newmessage = new Message({
				text: t,
				user: user.name,
				created_at: new Date
			});
			if (req.body.badge && !isNaN( req.body.badge )) newmessage.badge = req.body.badge;
			if (user.is_admin) newmessage.is_admin = true;
			newmessage.save(function (err, m) {
				if (err) return res.send(err);
				res.send(m);
			});
		});

	});
});

app.post('/friend/new', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if (err || !u) return res.send(err);
		if (!req.body.friend || req.body.friend.length < 2) return res.json({err: 'Invalid friend'});
		if (u.name == req.body.friend) return res.json({err: 'You can not friend yourself.'});
		if (u.friends.length > 75) return res.json({err: 'You have the maximum number of friends, this isn\'t Facebook.'});
		User.findOne({ name: req.body.friend.toLowerCase() }).lean(true).exec(function (err, f) {
			if (err || !f) return res.json({err: 'No player found with this name.'});
			if (u.friends.indexOf(f._id) !== -1) return res.json({err: f.name + ' is already your friend.'});
			u.friends.push(f._id);
			u.save(function (err, u) {
				var pm = new PrivateMessage({
					to: f._id,
					from: u.name,
					text: 'Added you as a friend!'
				});
				pm.save(function () {
					res.json({success: true, friends: u.friends});
				});
			});
		});
	});
});
app.post('/last_flavor', function(req, res){
	try {
	User.findOne({ _id: req.session.user_id }).select('flavors flavors_sold toppings combos last_addon last_flavor last_frankenflavour').exec(function (err, u) {
		if (err || !u) return res.send('{"success":false}'); 
		if (req.body.f && u.flavors.indexOf(req.body.f) === -1) return res.json({error: 'You do not have that flavour'}); 
		var active_flavours = [req.body.f];
	    var active_addons = [req.body.a];
	    if (u.last_flavor != req.body.f) {
	    	u.last_frankenflavour = null;
	    	u.last_flavor = req.body.f;
	    }
	    
	    u.last_addon = req.body.a;
		for (var i = 0; i < 5; i++) {
			if (u.flavors[i]) active_flavours.push(u.flavors[i]);
			if (u.toppings[i]) active_addons.push(u.toppings[i]);
		}
		Combo.find({
			$or: [
			{ 
				$and: [
					{flavor_id: { $in: active_flavours}},
					{topping_id: { $in: active_addons}}
				]
			}, {
				topping_id: u.last_addon,
				$or: [
					{
						flavor_id: u.last_flavor,
						franken_id: u.last_frankenflavour,
					},
					{
						franken_id: u.last_flavor,
						flavor_id: u.last_frankenflavour,
					}
				]
			}
			]
		}).sort('flavor_sold').exec(function (err, combos) {
			if (err) return res.send('{"error":' + err + '}');
			if (combos) {
				for (var i = 0; i < combos.length; i++) {
					var combo = combos[i];
					if (combo && u.combos.indexOf(combo._id) === -1) {
						if (!u.combos) u.combos = [];
						u.combos.push(combo._id);
					}
				}
			}
			u.save(function (err, u) {
				if (err) return res.send('{"success":false}');
				res.send(combos); 
			});
		});
	});
	} catch (err) { res.send(500, err); }
});
app.post('/last/franken', function(req, res){
	User.findOne({ _id: req.session.user_id }).select('flavors combos last_frankenflavour_at last_frankenflavour last_flavor last_addon').exec(function (err, u) {
		if (err || !u) return res.send('{"success":false}'); 
		if (u.flavors.indexOf(req.body.one) == -1 || u.flavors.indexOf(req.body.two) == -1) return res.json({
			success: false,
			message: 'Could not find a frankenflavour'
		});
	    u.last_flavor = req.body.one;
	    u.last_frankenflavour = req.body.two;
	    u.last_frankenflavour_at = new Date();
		Combo.findOne({
			topping_id: u.last_addon,
			$or: [
				{
					flavor_id: u.last_flavor,
					franken_id: u.last_frankenflavour,
				},
				{
					franken_id: u.last_flavor,
					flavor_id: u.last_frankenflavour,
				}
			]
		}).lean(true).exec(function (err, combo) {
			if (combo && u.combos.indexOf(combo._id) === -1) {
				u.combos.push(combo._id);
			}
			u.save(function (err) {
				if (err) return res.send('{"success":false}');
				res.send( (combo)? combo : {}); 
			});
		});
	});
});
app.post('/login', function (req, res) {
	try {
	var post = req.body;
	if (!post.user) return res.render('login', { alert: 'Missing Information'});
	User.findOne({ name: post.user.toLowerCase() }).select("password ip").exec(function(err, user) {
		if (err || !user) return res.render('login', { alert: 'Username incorrect'});
		user.comparePassword(post.password, function(err, isMatch) {
			if (err) {
				if (!user.password || typeof user.password === 'undefined') {
					req.session.user_id = user._id;
					if (user.ip == req.connection.remoteAddress) return res.redirect('/');
					user.ip = req.connection.remoteAddress;
					user.save(function (err, u) {
						return res.redirect('/');
					});
				} else {
					return res.render('login', { alert: 'invalid password'});
				}
			}
			if (isMatch) {
				req.session.user_id = user._id;
				user.ip = req.connection.remoteAddress;
				user.save(function (err, u) {
					res.redirect('/');
				});
			} else {
				res.render('login', { alert: 'invalid password'});
			}
		});
	});
	} catch (err) { res.send(500, 'error: ' + err); }
});
app.get('/login', function (req, res) {
	if (req.session.user_id) {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.render('login');
			res.redirect('/');
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
app.post('/read_message', function(req, res){
	PrivateMessage.find({to: req.session.user_id}, function (err, pms) {
		for (var i = 0; i < pms.length; i++) {
			pms[i].remove();
		}
		res.send('1');
	});
});
app.post('/message/read/:message', function(req, res) {
	PrivateMessage.findOne({_id: req.params.message}, function (err, pm) {
		if (err || !pm) return res.json({error: err});
		User.findOne({ _id: pm.to }).select('messages').exec(function (err, user) {
			if (err || !user) return res.json({error:err});
			if (!user.message_count || user.message_count < 1) user.message_count = 1;
			user.save(function (err) {
				pm.is_read = !pm.is_read;
				pm.save(function (err) {
					if (err) return res.json({error:err});
					res.json({success:true});
				});
			});
		});
	});
});
app.post('/message/remove/:message', function(req, res) {
	PrivateMessage.findOne({_id: req.params.message}, function (err, pm) {
		if (err || !pm) return res.json({error: err});
		User.findOne({ _id: pm.to }).select('messages').exec(function (err, user) {
			if (err || !user) return res.json({error:err});
			if (!user.message_count || user.message_count < 1) user.message_count = 1;
			user.message_count = user.message_count - 1;
			user.save(function (err) {
				pm.remove();
				res.json({success:true});
			});
		});
	});
});
app.get('/poke/:name', function(req, res){
	res.json({'success':true});
});
app.post('/badge/update/:b', function(req, res){
	var b = parseInt(req.params.b);
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		var i = u.badges.indexOf(b);
		console.log(u.badges + ',' + b);
		if (i === -1) { return res.send(500); }
		u.badges.splice(i, 1);
		u.badges.unshift(b);
		u.save(function (err, u) {
			res.json({badges: u.badges });
		});
	});
});
app.post('/message/:name', function(req, res){
	var message = req.body.message;
	if (!message || message == '') return res.json({'error': 'No message'});
	if (message.length < 1 || message.length > 1000) return res.json({'error': 'Invalid message length (' + message.length + ')'});
	var name = req.params.name.toLowerCase();
	User.findOne({ _id: req.session.user_id }).select('name shadow_ban').exec(function (err, from) {
		if (err || !from) return res.send('err ' + err);
		if (from.shadow_ban) return res.send('You are banned');
		User.findOne({name : name }, function (err, to) {
			if (err || !to || !req.session.user_id) return res.json({'error': 'No player exists with that name'});
			//if (to.chat_off) return res.json({'error':'This person has "Do not Disturb" on'});
			if (!to.message_count) to.message_count = 0;
			to.message_count = to.message_count + 1;
			to.save(function (err) {
				var pm = new PrivateMessage({
					from: from.name,
					to: to._id,
					text: message,
				});
				pm.save(function (err, pm) {
					if (err) res.json({error: err});
					res.json({'success':true});
				});
			});
		});
	});
});
app.get('/delete/:name', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, from) {
		if (err || !from) return res.send('err ' + err);
		var name = req.params.name;
		User.findOne({name : name }, function (err, user) {
			if (err || !user) return res.json({'error':'not a friend'});
			from.friends.splice(from.friends.indexOf(user._id), 1);
			from.save(function () {
				res.json({'success':true});
			});
		});
	});
});
app.get('/mod', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if (!u.is_mod && !u.is_admin) return res.send('Woah woah woah, you are not a moderator.');
		User.find({ shadow_ban: true }).select('name mute_at mute_reason ip').sort('name').lean(true).exec(function (err, users) {
			res.render('mod', {banned: users});
		});
	});
});
app.post('/mod', function(req, res){
	var name = req.body.username.toLowerCase();
	var reason = req.body.reason;
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if (!u.is_mod && !u.is_admin) return res.send('Woah woah woah, you are not a moderator.');	
		User.findOne({ name : name }).exec(function (err, user) {
			if (!user) return res.render('mod', { alert: 'Could not find ' + name});
			var shadow_ban = (user.shadow_ban)? null : true;
			user.shadow_ban = shadow_ban;
			if (shadow_ban) {
				user.mute_at = new Date;
				user.mute_reason = reason;
			}
			var pm = new PrivateMessage({
				from: u.name,
				to: user._id,
				text: 'You have been muted. Reason: ' + reason
			});
			pm.save();
			user.save(function (err) {
				User.find({ shadow_ban: true }).select('name mute_at mute_reason ip').sort('name').lean(true).exec(function (err, users) {
					res.render('mod', {banned: users, alert: ((shadow_ban)?'Shadowbanned ': 'unmuted ') + user.name});
				});
			});
		});
	});
});
app.get('/info/:name', checkAdmin, function(req, res){
	var name = req.params.name;
	User.findOne( { name : name }).exec(function (err, user) {
		if (err || !user) return res.send(err);
		res.send(user);
	});
});
app.get('/info/id/:name', checkAdmin, function(req, res){
	var name = req.params.name;
	User.findOne( { _id : name }).exec(function (err, user) {
		if (err || !user) return res.send(err);
		res.send(user);
	});
});
app.get('/info/email/:name', checkAdmin, function(req, res){
	var name = req.params.name;
	User.findOne({ email : name }).exec(function (err, user) {
		if (err || !user) return res.send(err);
		res.send(user);
	});
});
app.get('/sort_flavour/:type', function(req, res){
	var type = req.params.type;	
	Flavor.find().select('_id').sort(type).lean(true).exec(function (err, flavours) {
		if (err) return res.send('err: ' + err);
		User.findOne({ _id: req.session.user_id }).select('flavors flavors_sold').exec(function (err, u) {
			var new_f = [];
			var new_fs = [];
			for (var i = 0; i < 5; i++) {
				new_f.push( u.flavors.shift() ); //shift removes first in array and returns that item
				new_fs.push( u.flavors_sold.shift() ); //shift removes first in array and returns that item
			}
			for (var i = 0; i < flavours.length; i++) {
				var f = flavours[i];
				var index = u.flavors.indexOf(f._id);
				if (index > -1) {
					new_f.push(f._id);
					new_fs.push( u.flavors_sold[index] ); 
				}
			}
			u.flavors = new_f;
			u.flavors_sold = new_fs;
			u.save(function (err) {
				res.send(flavours);
			});
		});
	});
});
app.get('/sort_addon/:type', function(req, res){
	var type = req.params.type;	
	Topping.find().select('_id').sort(type).lean(true).exec(function (err, toppings) {
		if (err) return res.send('err: ' + err);
		User.findOne({ _id: req.session.user_id }).select('toppings').exec(function (err, u) {
			var new_t = [];
			for (var i = 0; i < 5; i++) {
				new_t.push( u.toppings.shift() ); //shift removes first in array and returns that item
			}
			for (var i = 0; i < toppings.length; i++) {
				var f = toppings[i];
				if (u.toppings.indexOf(f._id) > -1) {
					new_t.push(f._id);
				}
			}
			u.toppings = new_t;
			u.save(function (err) {
				res.send(toppings);
			});
		});
	});
});
app.get('/user/:name', function(req, res){
	if (!req.session.user_id) return res.send('please sign in');
	var name = req.params.name;
	User.findOne({name : name }).select("-ip").lean(true).exec(function (err, user) {
		if (err || !user) return res.json({error: 'can\'t find user'});
		Flavor.findOne({_id:user.last_flavor}).select('name').lean(true).exec(function (err, f) {
			Topping.findOne({_id:user.last_addon }).select('name').lean(true).exec(function (err, a) {
				Cow.findOne({ user_id: user._id, is_active: true }).lean(true).exec(function (err, cow) {
					if (err || !f) return res.send(err);
					var release = ['main', 'beta', 'alpha'];
					var t = 'Ice Creamizen';
					var t_array = ['Artisan', 'Stand Mogul', 'King Sherbet'];
					if (user.prestige_bonus > 25) t = t_array[0];
					if (user.prestige_bonus > 75) t = t_array[1];
					if (user.carts === 1000) t = 'Cart Lord';
					if (user.employees === 1000) t = 'Employee Lord';
					if (user.trucks === 1000) t = 'Truck King';
					if (user.robots === 1000) t = 'Robot Over-lord';
					if (user.rockets === 1000) t = 'Rocketman';
					if (user.aliens === 1000) t = 'Martian';
					if (user.combos.length > 90) t = 'Combo Chief';
					for (var i = 0; i < user.flavors_sold.length; i++) {
						if (user.flavors_sold[i] >= 5000000) {
							t = 'Stone Cold'; break;
						}
					}
					if (user.prestige_bonus > 398) t = t_array[2];
					if (user.is_mod) t = 'Moderator';
					if (user.is_admin) t = 'Admin';
					if (user._id == '536b8c9d769cf0202d501e4e') t = 'Lore Master';
					if (user._id == '543d5b077a4c5bd020298ff1') t = 'Designer';
					if (user.title) t = user.title;

					var gravatar_hash;
					if (user.email) {
						gravatar_hash = crypto.createHash('md5').update(user.email).digest('hex');
					}
					res.json({
						_id: user._id,
						name: user.name,
						last_flavor: f.name,
						last_addon: a.name,
						flavors: user.flavors.length,
						combos: user.combos.length,
						cold_hands: user.upgrade_coldhands,
						cone: (user.cones && user.cones.length > 0)? user.cones[user.cones.length - 1] : 'default',
						badges: user.badges,
						toppings: user.toppings.length,
						quests: user.quests.length,
						achievements: user.achievements.length,
						carts: user.carts,
						employees: user.employees,
						trucks: user.trucks,
						robots: user.robots,
						rockets: user.rockets,
						aliens: (user.aliens)? user.aliens : 0,
						autopilot: user.upgrade_autopilot,
						release_channel: release[user.release_channel],
						sold: user.icecream_sold,
						updated_at: timeSince(user.updated_at),
						prestige_level: user.prestige_level,
						prestige_bonus: user.prestige_bonus,
						gold: user.gold,
						title: t,
						cow_level: user.cow_level,
						cow: cow,
						friend: (user.friends && user.friends.indexOf(req.session.user_id) > -1),
						gravatar: gravatar_hash,
						is_night: user.is_night
					}); 
				});
			});
		});
	});
});
app.post('/user/find/ip', function(req, res){
	var name =  req.body.name.toLowerCase();
	if (!name) return res.send('name missing');
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if (!u.is_mod && !u.is_admin) return res.send('Woah woah woah, you are not a moderator.');
		User.findOne({ name: name }).select('name ip').lean(true).exec(function (err, initial) {
			if (!initial) return res.send('Could not find user');
			if (!initial.ip) return res.send('Missing IP');
			User.find({ ip: initial.ip }).select('name ip').sort('name').lean(true).exec(function (err, users) {
				res.send(users);
			});
		});
	});
});
app.get('/jp', function(req, res){
	req.session.lang = 'jp';
	res.redirect('/');
});
app.get('/en', function(req, res){
	req.session.lang = 'en';
	res.redirect('/');
});
app.get('/easter/:num/:str', function(req, res){
	return res.send('All fled, all done, so lift me on the pyre. The feast is over and the lamps expire.');
	User.findOne({ _id: req.session.user_id }).select('easter name badges').exec(function (err, u) {
		var str = new Buffer(req.params.str, 'base64').toString('ascii');
		var n = parseInt(req.params.num);
		if (n != 6 && n != 4 && str != 'e at ics' + n + 'pleasedontcheat' + u.name) {
			return res.send('That\'s a bad egg.');
		}
		if (n == 6 && req.params.str != 'Pvj4f') return res.send('That\'s a bad egg (2).');
		if (n == 4 && req.params.str != 's9lpj6') return res.send('That\'s a bad egg (2).');

		if (u.easter.indexOf(n) > -1) {
			var append = '';
			if (!req.xhr) append = " - Returning to the game in 5 seconds.... <script>setTimeout(function(){window.location.href='/'},5000);</script>";
			return res.send('You have already found this egg' + append);
		}
		u.easter.push(n);
		if (u.easter.length == 10 && u.badges.indexOf(5) == -1) {
			u.badges.push(5);
			u.save(function (err, u) {
				var newmessage = new Message({
					text: u.name + ' has found all of the eggs and unlocked the Easter badge!',
					user: ':',
					created_at: new Date,
					badge: 5
				});
				newmessage.save(function (err, m) {
					if (err) return res.send(err);
					var append = '';
					if (!req.xhr) append = " - Returning to the game in 5 seconds.... <script>setTimeout(function(){window.location.href='/'},5000);</script>";
					res.send('Congratulations! You have unlocked the Easter badge. (Refresh to see your updated badges).' + append);
				});
			});
		} else {
			u.save(function (err, u) {
				if (err) return res.send(err);
				var append = '';
				if (!req.xhr) append = " - Returning to the game in 5 seconds.... <script>setTimeout(function(){window.location.href='/'},5000);</script>";
				res.send('You\'ve found an egg! That\'s ' + u.easter.length + ' out of 10' + append);
			});
		}
	});
});
app.get('/stats', function(req, res){
	res.send('<body><script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script><script src="https://s3.amazonaws.com/icecreamstand.com/stats.js.gz"></script></body>');
});
app.get('*', function(req, res){
  res.send('<head><title>404 - Ice Cream Stand</title></head><body><h1>404</h1><h2>Ice Cream Not Found</h2><link rel="stylesheet" href="http://static.icecreamstand.ca/common.css.gz" /></body>', 404);
});

server.listen(app.get('port'), function(){
		console.log('Express server listening on port ' + app.get('port'));
});

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
  console.log(err.stack);
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
function generate_dynamic(user) {
	var c_i = Math.floor( Math.random() * 4), 
		d_i = Math.floor( Math.random() * 14),
		name_i = Math.floor( Math.random() * 22),
		title_i = Math.floor( Math.random() * 14),
		a_i = 150 * (3 * user.quests.length) * (0.5 * (user.prestige_level + 1) );
	if (c_i == 1) {
		return {
			quest: '!d' + c_i +','+ d_i +','+ name_i +','+ title_i +', ,'+ a_i,
			trend: true
		};
	} else {
		var lowest = user.flavors_sold[0];
		var pointer = 0;
		for (var i = 0; i < user.flavors.length; i++) {
			if (user.flavors_sold[i] < lowest) {
				lowest = user.flavors_sold[i];
				pointer = i;
				if (lowest == 0) break;
			}
		}
		flavour = user.flavors[pointer];
		if ( c_i == 2 ) a_i = 20015 - lowest;
		return {
			quest: '!d' + c_i +','+ d_i +','+ name_i +','+ title_i +','+ flavour +','+ a_i,
			sold: lowest
		};
	}
}
