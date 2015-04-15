/**
	* .-. .---. .----.    .---. .----. .----.  .--.  .-.   .-.    .----..---.  .--.  .-. .-..----. 
	* | |/  ___}| {_     /  ___}| {}  }| {_   / {} \ |  `.'  |   { {__ {_   _}/ {} \ |  `| || {}  \
	* | |\     }| {__    \     }| .-. \| {__ /  /\  \| |\ /| |   .-._} } | | /  /\  \| |\  ||     /
	* `-' `---' `----'    `---' `-' `-'`----'`-'  `-'`-' ` `-'   `----'  `-' `-'  `-'`-' `-'`----'
	* Made with love - @SPGB
	* Routes -> controllers are in routes/
	* Views are in views/
	* sockets are over socket.io in io.js
 */
 
var express = require('express.io'),
	engine = require('ejs-locals'),
  	routes = require('./routes'),
  	http = require('http'),
  	https = require('https'),
  	path = require('path'),
  	bcrypt = require('bcrypt'),
  	SALT_WORK_FACTOR = 10,
  	crypto = require('crypto'),
  	assert = require('assert'),
  	fs = require('fs'),
  	nodemailer = require("nodemailer"),
  	passport = require('passport'),
  	FacebookStrategy = require('passport-facebook');

var app = express();

var bodyParser   = require('body-parser');

var morgan       = require('morgan');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var server = http.createServer(app);
var db = mongoose.connection;
// var io = require('socket.io');
// io.listen(server);
var config = require('./config.js');
var facebook = require('./facebook');
var cookieParser = require('cookie-parser')(config.cookie);
var smtpTransport = nodemailer.createTransport({
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
	rolling: true,
	resave: false,
	saveUninitialized: false
});
var cache_trend_id;
var motivationals = [
	'Always do your best. What you plant now, you will harvest later.',
	'You are never too old to set another goal or to dream a new dream.',
	'If you can dream it, you can do it.',
	'Be kind whenever possible. It is always possible.',
	'Even if you fall on your face, you\'re still moving forward.',
	'In order to succeed, we must first believe that we can.',
	'By failing to prepare, you are preparing to fail.',
	'Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.',
	'The most certain way to succeed is always to try just one more time.',
	'What you plant now, you will harvest later.',
	'Keep your eyes on the stars, and your feet on the ground.',
	'Don\'t watch the clock; do what it does. Keep going.',
	'Expect problems and eat them for breakfast.',
	'Never give up, for that is just the place and time that the tide will turn.',
	'There is no justice in following unjust laws.'
];

mongoose.connect('mongodb://localhost:' + config.db.port + '/admin', { auto_reconnect: true, user: config.db.username, pass: config.db.password });


// all environments
app.set('port', 80);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(morgan('dev'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser());
//app.use(express.methodOverride());
app.use(cookieParser);
app.use(sessionStore);
app.use(passport.initialize());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.use(new FacebookStrategy({
    clientID: config.passport.fb_id,
    clientSecret: config.passport.fb_secret,
    callbackURL: "http://icecreamstand.ca/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ $or:[
    	{ facebook_token: accessToken },
		{ $and: [
			{email: profile.emails[0].value},
			{email_verified: true},
		]}
    ]}, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
      	//CREATE A USER HERE...
      	console.log(profile);
      	return done('no user with your email (' + profile.emails[0].value + ') found');
      }
      if (user.facebook_token != accessToken) {
      	user.facebook_token = accessToken;
      	user.facebook_refresh_token = refreshToken;
      	user.facebook_id = profile.id;
      	user.save();
      }
      done(null, user);
    });
  }
));

getFbData = function(accessToken, apiPath, callback) {
    var options = {
        host: 'graph.facebook.com',
        port: 443,
        path: apiPath + '?access_token=' + accessToken, //apiPath example: '/me/friends'
        method: 'GET'
    };

    var buffer = ''; //this buffer will be populated with the chunks of the data received from facebook
    var request = https.get(options, function(result){
        result.setEncoding('utf8');
        result.on('data', function(chunk){
            buffer += chunk;
        });

        result.on('end', function(){
            callback(buffer);
        });
    });

    request.on('error', function(e){
        console.log('error from facebook.getFbData: ' + e.message)
   });

    request.end();
};

log_error('Starting up the app'); //really more of a debug..

/* OUR SCHEMA */
var userSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	ip: { type: String },
	password: { type: String, select: false },
	email: { type: String },
	email_verified: { type: Boolean },
	gold: { type: Number, default: 0 },
	total_gold: { type: Number, default: 0 },
	total_prestige_gold: { type: Number, default: 0 },
	today_gold: { type: Number, default: 0 },
	today_trending: { type: Number, default: 0 },
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
	upgrade_silo_hay: { type: Number, default: 0},
	last_flavor: { type: String, default: '5238d9bc76c2d60000000001' },
	last_addon: { type: String, default: '523d5800fbdef6f047000013' },
	last_frankenflavour: { type: String },
	created_at    : { type: Date },
	updated_at    : { type: Date },
	last_prestige_at: { type: Date },
	last_icecube_at: { type: Date },
	next_quest_at: { type: Date },
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
	chat_off: { type: Boolean, default: true },
	badge_off: { type: Boolean },
	chat_squelch: { type: Boolean },
	release_channel: { type: Number, default: 0 }, 
	prestige_level: { type: Number, default: 0 }, 
	prestige_bonus: { type: Number, default: 0 }, 
	prestige_array: { type: [Number] }, 
	friends: { type: [String] }, 
	friend_gold: { type: Number },
	friend_last: { type: Number },
	friend_total_gold: { type: Number, default: 0 }, 
	is_friend_notify: { type: Boolean, default: true }, 
	is_tooltip: { type: Boolean, default: true }, 
	is_night: { type: Boolean }, 
	is_second_row: { type: Boolean }, 
	is_admin: { type: Boolean }, 
	is_guest: { type: Boolean, default: true },
	is_mod: { type: Boolean }, 
	is_animation_clouds: { type: Boolean, default: true }, 
	is_animation_lore: { type: Boolean, default: true }, 
	is_animation_workers: { type: Boolean, default: true }, 
	is_animation_cones: { type: Boolean, default: true }, 
	is_animation_money: { type: Boolean, default: true }, 
	is_email_holiday: { type: Boolean, default: true }, 
	is_email_password: { type: Boolean, default: true }, 
	is_email_messages: { type: Boolean, default: true }, 
	is_auto_daynight: { type: Boolean, default: false }, 
	is_winter: { type: Boolean }, 
	is_display_friendcows: { type: Boolean, default: true }, 
	is_away: { type: Boolean, default: false }, 
	message_count: { type: Number, default: 0 }, 
	shadow_ban: { type: Boolean },
	mute_at: { type: Date },
	mute_reason: { type: String },
	badges: { type: [Number] },
	highest_accumulation: { type: Number, default: 0  },
	accumulation_time: { type: Number, default: 0  },
	title: { type: String },
	epic_id: { type: String },
	epic_collected: { type: Number, default: 0},
	epic_last_attack: { type: Date },
	epic_last_recruit: { type: Date },
	dunce_until: { type: Date },
	party_until: { type: Date },
	dunce_message: { type: String },
	dunce_strikes: { type: Number },
	silo_hay: { type: Number },
	room: { type: String },
	socket_id: { type: String},
	chapters_unlocked: { type: [String] },
	facebook_token: { type: String},
	facebook_refresh_token: { type: String},
	facebook_id: { type: String },
	titles: { type: [String] },
	backgrounds: { type: [String] },
	easter2: { type: [Number] },
	active_background: { type: String },
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

var chatSchema = new mongoose.Schema({
	text: { type: String, required: true },
	user: { type: String, required: true },
	badge: { type: Number },
	is_admin: Boolean,
	room: { type: String },
	created_at: { type: Date, expires: '48h', default: Date.now }
});
var Chat = mongoose.model('Chat', chatSchema);

var messageSchema = new mongoose.Schema({
	text: { type: String, required: true },
	user: { type: String, required: true },
	badge: { type: Number },
	is_admin: Boolean,
	room: { type: String },
	created_at: { type: Date, expires: '48h' }
});
var Message = mongoose.model('Message', messageSchema);

var privatemessageSchema = new mongoose.Schema({
	text: { type: String, required: true },
	from: { type: String, required: true },
	to: { type: String, required: true },
	badge_id: { type: Number },
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
	badge_id: { type: String },
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

var epicSchema = new mongoose.Schema({
	name: { type: String, index: { unique: true } },
	event: { type: String },
	text: { type: String },
	players: { type: Number, default: 0 },
	total: { type: Number, default: 0 },
	created_at: { type: Date }
});
var Epic = mongoose.model('Epic', epicSchema);
epicSchema.pre('save', function(next) {
	if (!this.created_at) this.created_at = new Date();
	next();
});

var cowSchema = new mongoose.Schema({
	name: { type: String, required: true, },
	happiness: { type: Number, default: 100},
	level: { type: Number, default: 0},
	experience: { type: Number, default: 0},
	strength: { type: Number, default: 10 },
	constitution: { type: Number, default: 10 },
	intelligence: { type: Number, default: 10 },
	memories: { type: [String] },
	skins_unlocked: { type: [String] },
	skin: { type: String },
	items: { type: [String] },
	user_id: { type: String, required: true },
	created_at: { type: Date },
	is_active: { type: Boolean, default: true }
});
var Cow = mongoose.model('Cow', cowSchema);

var chapterSchema = new mongoose.Schema({
	title: { type: String, required: true, },
	text: { type: String, required: true},
	chapter_number: { type: Number, required: true },
	saga: { type: String },
	badge_id: { type: Number }
});
var Chapter = mongoose.model('Chapter', chapterSchema);


function checkAuth(req, res, next) {
  if (req.session.user_id) {
	User.findOne({ _id: req.session.user_id }).exec(function (err, user) {
		if (err || !user) return next();
		var lang = req.session.lang;
		if (!lang) {
			req.session.lang = 'en';
			
			// if (req.headers['accept-language']) {
			// 	if (req.headers['accept-language'].indexOf('en') > -1) {
			// 		req.session.lang = 'en';
			// 	} else if (req.headers['accept-language'].indexOf('ja') > -1) {
			// 		req.session.lang = 'jp'; //should be ja
			// 	} else if (req.headers['accept-language'].indexOf('ru') > -1) {
			// 		req.session.lang = 'ru';
			// 	}
			// } else {
				
			// }
		}
		if (user.ip != req.connection.remoteAddress) {
			user.ip = req.connection.remoteAddress;
			user.save();
		}
		res.render('index_en', {lang: req.session.lang, release_channel:user.release_channel, user: user});
	});
  } else {
    next();
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

var donor_welcome_queue = [];
//var io = require('./io');
//io.listen(server);
var io = require('./io').listen(server, cache_trend_id);

/* routes */
var routes_cow = require('./routes/user');
app.use('/user', routes_cow);

var routes_cow = require('./routes/cow');
app.use('/cow', routes_cow);

var routes_admin = require('./routes/admin');
app.use('/admin', routes_admin);

var routes_stats = require('./routes/stats');
app.use('/stats', routes_stats);


app.get('/', checkAuth, function(req, res) {
	if (req.headers.host.slice(0, 4) === 'www.') {
        return res.redirect(req.protocol + '://' + req.headers.host.slice(4) + req.originalUrl);
    }

	User.find({ ip: req.connection.remoteAddress }).select("+password").limit(2).exec(function (err, users) {
		if (users.length == 0) {//create user
			var text = "guest_";
			var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < 4; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
			
			var newuser = new User({
				name: text,
				ip: req.connection.remoteAddress,
				created_at: new Date()
			});
			newuser.save(function(err, u) {
				if (err) return res.send(err);
				req.session.user_id = u._id;
				res.render('index_en', { release_channel: 0, user: u });
			});
		} else { //user already with your ip
			if (!users[0].password && users.length == 1) { //more then one user or user[0] has a password
				req.session.user_id = users[0]._id;
				//res.send(users);
				res.render('index_en', {
					release_channel: users[0].release_channel,
					user: users[0]
				});
			} else {
				res.redirect('login');
			}
		}
	});
});
app.get('/donate', function(req, res){
	res.redirect('/#!donate');
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
					var flavour;
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
						flavour = candidates[Math.floor(Math.random() * candidates.length)];
						if (!flavour) {
							flavour = flavours[Math.floor(Math.random() * flavours.length)];
						}
					}
					if (!flavour) {
						return res.json({ err: 'no flavours are trending'});
					}
					var t = new Trend({
						flavour_id: flavour._id,
						flavour_name: flavour.name,
						created_at: Date.now(),
						bonus: bonus,
						bonus_max: bonus
					});
					t.save(function (err, trend) {
						if (err) return console.log(err);
						cache_trend_id = trend._id;
						flavour.value = flavour.base_value;
						flavour.votes = 0;
						flavour.last_trend_at = new Date();
						flavour.save(function (err, f) {
							res.send(trend);
						});
					});
				});
			});
		}
	});
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['read_stream', 'publish_actions', 'email', 'user_friends'] }));

// app.get('/auth/facebook', function (req, res, next) {
//   passport.authenticate('facebook', 
//   	{ scope: ['read_stream', 'publish_actions', 'email', 'user_friends'] },
//   	function (err, user, info) {
// 	    if (err) { return next(err); }
// 	    if (!user) { return res.redirect('/login'); }

// 	    req.session.user_id = user._id;
// 	    res.redirect('/');

//   })(req, res, next);
// });

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback', function (req, res, next) {
  passport.authenticate('facebook', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

    req.session.user_id = user._id;
    res.redirect('/');

  })(req, res, next);
});
app.get('/switchtobeta', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (!user) return res.redirect('/');
		user.release_channel = 1;
		user.save();
		res.redirect('/');
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

		var current = (Math.floor(diff_mins / 8) + user.name.length) % user.toppings.length;
		Topping.find({ _id: {$in: user.toppings} }).sort('event').select('_id event').lean(true).exec(function (err, addons) {
			if (err) return res.send(err);
			if (!addons[current]) current = 0;
			res.json({
				_id: addons[current]._id,
				event: addons[current].event,
				mins: diff_mins_wrap,
			});
		});
	});
});
app.get('/edit_flavor', checkAdmin, function(req, res){ 
	var f_name = req.param('name', null);  // second parameter is default
	Flavor.findOne({name : f_name.toLowerCase()}, function (err, flavor) {
		if (!flavor || err) return res.send('cant find');
		res.send('<form action="flavors" method="POST">Name: <input name="_id" type="hidden" value="' + flavor._id + '"><input name="name" placeholder="name" value="' + flavor.name + 
			'"><br/>Description: <input name="description" placeholder="desc" value="' + flavor.description + '"><br/>Cost: <input name="cost" placeholder="cost" value=' + flavor.cost + 
			'><br/>Value: <input name="base_value" placeholder="base value" value=' + flavor.base_value + '><br /><input type="submit"></form>');
	});
});
app.get('/quests_restart', function(req, res){ 
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send(500, 'er: ' + err);
		user.trend_bonus = 0.75;
		user.quests = [];
		user.save(function (err,u) { res.redirect('/'); });
	});
});
app.get('/tutorials_restart', function(req, res){ 
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (err || !user) return res.send(500, 'er: ' + err);
		user.tutorial = 0;
		user.save(function (err,u) { res.redirect('/'); });
	});
});
app.post('/forgot', function(req, res){
	if (!req.body.email) return res.render('login', {alert: 'Please enter a valid email'});
	User.findOne({ email: req.body.email }).select('name email email_verified password').exec(function (err, user) {
		if (!user) return res.render('login', {alert: 'We couldn\'t find a player with this email - please send me a message at icecreamstandmailer@gmail.com'});
		if (!user.email_verified) return res.render('login', {alert: 'We found a user with this email, but you never confirmed it! Check your email for a confirmation email from us (or contact icecreamstandmailer@gmail.com).'});
		var name = user.name.substring(0,1).toUpperCase() + user.name.substring(1);
		var password = (Math.random().toString(36)+'00000000000000000').slice(2, 7+2);
		user.password = password;
		user.save(function (err) {
			if (err) return res.send(err);
			var subject = 'Password Reset - Ice Cream Stand';
			var mailOptions = {
				from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
				to: user.email, // list of receivers
				subject: subject, // Subject line
				text: "Hi "+name+",\r\nYou request a password reset for the Ice Cream Stand. Here is your new password: " + password + " please update it once you log in. \r\n\r\nThanks!\r\n\r\nSam",
				html: email_template("Hi "+name+",<br>You request a password reset for the Ice Cream Stand. Here is your new password: <br><br><b>" + password + "</b><br><br>please update it once you log in. <br>Thanks!<br>Sam</p>", subject)
			};
			smtpTransport.sendMail(mailOptions, function(error, response){
				if (error) {
					console.log(error);
					res.render('login', {alert: error});
					return;
				}
				res.render('login', {alert: 'Please check your email'});
			}); 
		});
	});
});
app.get('/verify/:name/:email64', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (!user) return res.json({ err: 'Please log in first'});
		if (!user.email) return res.json({ err: 'no email set'});
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
		var mailOptions = verify_mailoptions(user);
		smtpTransport.sendMail(mailOptions, function(error, response){
			res.redirect('/');
		}); 
	});
});
function verify_mailoptions(user) {
	var verify_url = 'http://icecreamstand.ca/verify/' + user.name + '/' + ( new Buffer(user.email).toString('base64') );
	var name = user.name.substring(0,1).toUpperCase() + user.name.substring(1);
	var subject = 'Welcome to the Ice Cream Stand Family';
	var mailOptions = {
		from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
		to: user.email, // list of receivers
		subject: subject, // Subject line
		text: "Hi "+name+",\r\nI just wanted to personally welcome you to Ice Cream Stand! I really hope you like it. " +
			"If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: \r\n\r\n" + verify_url + ".\r\n\r\nThanks!\r\n\r\nSam", // plaintext body
		html: email_template("Hi "+name+",<br>I just wanted to personally welcome you to the Ice Cream Stand! I really hope you like it. " +
			"If you have any questions or suggestions, please don't hesitate to send me feedback. In the meantime, please go here to verify your email address: <br><br><a href='" + verify_url + "'>" + verify_url + "</a>.<br><br>Thanks!<br>Sam</p>", subject)
		};
	return mailOptions;
}
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
app.get('/stats/monthly', checkAdmin, function(req, res){
	var now = new Date();
	var month = new Date(now.getTime() - 32*24*60*60*1000);
	User.find({ updated_at: { $gt: month} }).lean(true).exec(function (err, users) {
		var compiled = '<table><tr><td>Prestige lvl</td><td>Achievements</td><td>Quests</td><td>Email?</td><td>Email Verified</td><td>Epics</td><td>Friends</td><td>Money</td><td>Accumulation Record</td></tr>';
		var len = users.length;
		for (var i = 0; i < len; i++) {
			var u = users[i];
			compiled = compiled + '<tr>' +
			'<td>' + ((u.prestige_level)? u.prestige_level : 0) + '</td>' +
			'<td>' + ((u.achievements)? u.achievements.length : 0) + '</td>' +
			'<td>' + ((u.quests)? u.quests.length : 0) + '</td>' +
			'<td>' + ((u.email)? 1 : 0) + '</td>' +
			'<td>' + ((u.email_verified)? 1: 0) + '</td>' +
			'<td>' + ((u.epic_collected)? u.epic_collected : 0)  + '</td>' +
			'<td>' + ((u.friends)? u.friends.length : 0) + '</td>' + 
			'<td>' + u.total_gold + '</td>' + 
			'<td>' + ((u.highest_accumulation)? u.highest_accumulation : 0) + '</td>' + 
			'<td></td></tr>';
		}
		res.send(compiled + '</table>');
	});
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
					ret = ret + '<td>' + sub_value + '</td><td>' + cs[i].name + ' (' + cs[i].value + ') ' +
					'<a href="admin/combo/' + cs[i]._id + '/edit" target="_blank">edit</a>' +
					' | <a href="delete_combo?id=' + cs[i]._id + '" target="_blank">remove</a></td><td>' + (100*(cs[i].value/sub_value)) + '</td></tr>';
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
	var post = req.body;

	Flavor.findOne({name : post.flavor_name.toLowerCase()}, function (err, flavor) {
		if (!flavor) return res.send('cant find base flavor');
		Topping.findOne({name : post.topping_name.toLowerCase()}, function (err, topping) {
			if (!topping) return res.send('cant find addon');
			Flavor.findOne({name : post.franken_name.toLowerCase()}, function (err, franken) {
				
				Combo.findOne({ name: post.name.toLowerCase() }, function (err, combo) {
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
						if (franken) newcombo.franken_id = franken._id;
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

});
app.post('/vote/:flavor', function(req, res){
	User.findOne({ _id: req.session.user_id }).select('last_vote_at').exec(function (err, user) {
		if (!user) {
			return res.json({
				success: false,
				error: 'Please log in'
			});
		}
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
	var post = req.body;
	if (!post._id || post._id.length < 8) {
		var newflavor = new Flavor(post);
			newflavor.name = newflavor.name.toLowerCase();
			newflavor.value = newflavor.base_value;
			newflavor.save(function(err, f) {
				 if (err) return res.send('Error,' + err);
				 res.send(f);
			});
	} else {
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
			}
		});
	}
});
app.get('/add_toppings', checkAdmin, function(req, res){
	res.send('<form action="toppings" method="POST">' +
	'<input name="id" placeholder="optional id"><br /><input name="name" placeholder="name"><input name="base_value" placeholder="base_value"><input name="cost" placeholder="cost"><br />' + 
	'<input name="event" placeholder="optional event text">' +
	'<br /><input type="submit">');
});
app.post('/toppings', checkAdmin, function(req, res){

	var post = req.body;
	if (!post._id || post._id.length < 8) {
		var newtopping = new Topping(post);
			newtopping.name = newtopping.name.toLowerCase();
			newtopping.value = newtopping.base_value;
			newtopping.save(function(err, f) {
				 if (err) return res.send('Error,' + err);
				 res.send(f);
		});
	} else {
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
			}
		});
	}
	
});
function shop_item(item, i, user, cow, res) {
	if (item['match-expertise']) {
	    var f_pointer = user.flavors.indexOf(item['match-expertise']);
	    if (f_pointer === -1) return res.send('{"error":"Need the right flavour"}');
	    var sold = user.flavors_sold[f_pointer];
	    if (sold < 6076015 ) return res.send('{"error":"Need ' + (6076015 - sold) + ' more sales"}');
	}
	if (item['match-badge']) {
	    if ( user.badges.indexOf( item['match-badge'] ) == -1 ) return res.send('{"error":"Need a specific badge first"}');
	}
	if (item.note) {
	    return res.json({ error: item.note });
	}						

	if (item['match-item']) { //this skin has an item requirement
		var is_match;
		for (var item_i = 0; item_i < 4; item_i++) {
			if (cow.items[item_i]) {
					var split = cow.items[item_i].split('/');
					var cow_item = split[0];
					if (item['match-item'] == cow_item) is_match = true;
			}
		}
		if (!is_match) return res.send('{"error":"Need the ' + item['match-item'] + ' item."}');
	}

	if (!cow.skins_unlocked) cow.skins_unlocked = [];
	cow.skins_unlocked.push(i);
	cow.markModified('skins_unlocked');
	user.save(function (err) { if (err) console.log(err); });
	cow.save(function (err) { if (err) console.log(err); });
	return res.json({ 'unlocked_skin' : i }); 
}
app.post('/shop/item', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		fs.readFile(__dirname + '/source/json/shop.json', 'utf8', function (err, data) {
			if (err) {
				return res.json({ err: 'Mystery items are closed. Have empty box!'});
			}
			var is_found = false;
			var items = JSON.parse(data);
		    var buying = req.body.item;
		    var final_item;
		    var cost = 0;

		    var is_item = true;
		    if (buying) {
		    	var intelligence = 0, strength = 0, constitution = 0, rarity = 'common';
	        	
	        	for (var i in items) {
	        		var item = items[i];
	        		if (buying == i ) {
	        			is_found = true;
	        			if (item['match-name'] && item['match-name'] != user.name) {
	        				return res.json({ error: 'This item is not for you.'});
	        			}
	        			if (item.cost) cost = item.cost;
	        			if (isNaN(cost) || user.gold < cost) return res.send('{"error":"Need money"}');
	        			if (item.type == 'skin') {
	        				user.gold = user.gold - parseInt(cost);
	        				is_item = false;
	        				Cow.findOne({ user_id: user._id, is_active: true }).select('items skins_unlocked created_at').exec(function (err, cow) {
	        					shop_item(item, i, user, cow, res);
	        				});
	        			}
	        			if (item.type == 'badge') {
	        				user.gold = user.gold - parseInt(cost);
	        				is_item = false;
	        				var badge = item.badge;
	        				if (user.badges && user.badges.indexOf(badge) > -1) return res.send('{"error":"Already have"}');
	        				if (!user.badges) user.badges = [];
	        				user.badges.push(badge);
							user.save();
							return res.json({ 'unlocked_badge' : badge }); 
	        			}
	        			if (item.int) intelligence = item.int;
	        			if (item.str) strength = item.str;
	        			if (item.con) constitution = item.con;
	        			if (item.rarity) rarity = item.rarity;
	        			break;
	        		}
	        	}
	        	final_item = buying + '/' + intelligence + '/' + strength + '/' + constitution + '/' + rarity;
        	} else {
        		cost = 250000;
        		var chance = {
        			"common": 0,
        			"uncommon": 0.75,
        			"rare": 0.9,
        			"unique": 2,
        		};
        		var rand = Math.random();
        		var item_pool = [];
        		for (var i in items) {
        			var item = items[i];
        			if (item.rarity && rand > chance[ item.rarity ] ) {
        				var intelligence = 0, strength = 0, constitution = 0;
        				if (item.int) intelligence = item.int;
	        			if (item.str) strength = item.str;
	        			if (item.con) constitution = item.con;
        				item_pool.push(i + '/' + intelligence + '/' + strength + '/' + constitution + '/' + item.rarity);
        			}
        		}
        		final_item = item_pool [ Math.floor(Math.random() * item_pool.length) ];
        		if (!final_item) return res.send('{"error":"Your mystery item box was empty"}');
        		is_found = true;
        		
        	}

        	if (is_item) {
				if (!is_found) return res.send('{"error":"No item found"}');
				if (isNaN(cost) || user.gold < cost) return res.send('{"error":"Need money"}');
				user.gold = user.gold - parseInt(cost);

				user.save(function (err) {

				});
				Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
					if (!cow) return res.send('{"error":"No cow found"}');
					cow.items.push(final_item);
					cow.markModified('items');
					if (cow.items.length > 12) {
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
			}


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
				var cost = 250 * parseInt( Math.pow(user.upgrade_coldhands*2, 1.6) );
				if (user.gold < cost) { 
					if (amount == 10 || i == 0) { return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) }); }
					ret = 'Bought ' + i;
					break;
				}
				if ( user.upgrade_coldhands >= 1000 ) { ret = 'Maxed '; break; }
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
	} else if (post.type=='sales_cart' || post.type=='sales_employee' || post.type=='sales_truck' || 
		post.type=='sales_robot' || post.type=='sales_rocket' || post.type=='sales_alien') {

		var worker_pool = {
			'sales_cart': 'carts',
			'sales_employee': 'employees',
			'sales_truck': 'trucks',
			'sales_robot': 'robots',
			'sales_rocket': 'rockets',
			'sales_alien': 'aliens',
		};
		var worker_type = worker_pool[post.type];
		if (!worker_type) return res.json({ error: 'Worker not detected'});

		User.findOne({ _id: req.session.user_id }).select(worker_type + ' gold').exec(function (err, user) {
			if (err || !user) return res.send({ error: 'User not detected'});
			if (!user[worker_type]) user[worker_type] = 0;
				var amount = (post.amount && post.amount > 0)? post.amount : 1;
				for (var i = 0; i < amount; i++) {
					var cost = get_cost(user[worker_type], worker_type); // 25 + (Math.pow(user[worker_type], 2) / 4);
					if (user.gold < cost) { 
						if (amount == 10 || i == 0) { 
							return res.json({ error: ( (cost * (amount - i)) - user.gold ).toFixed(0) });
						}
						ret = 'Bought ' + i; break;
					}
					if (user[worker_type] >= 1000)  { ret = 'Maxed '; break; }
					user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
					user[worker_type]++;
				}
			//if (amount == 0) return res.json({ error: 'Need money'});
			if (!ret) ret = 'Bought ' + amount;
			user.save(function (err) {
				if (err) return res.send(err);
				return res.json({success:worker_type, msg:ret});
			});
		});
	} else if (post.type=='adopt_cow') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			Cow.findOne({ user_id: req.session.user_id, is_active: true }).lean(true).exec(function (err, cow) {
				if (cow) return res.json({ error: 'You already have a cow! What would ' + cow.name + ' think.'});

				var cow_names = ['Betty', 'Billy', 'Bessy', 'Bonny', 'Bucky'];
				user.save(function (err) {
					var newCow = new Cow({
						name: cow_names[ Math.floor( Math.random() * cow_names.length) ],
						user_id: user._id,
						strength: Math.floor((Math.random() * 8) + 8 ),
						intelligence: Math.floor((Math.random() * 8) + 8 ),
						constitution: Math.floor((Math.random() * 8) + 8 ),
						created_at: new Date(),
						is_active: true
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
	} else if (post.type=='silo_hay') {
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(500);
			var cost = get_cost(user.upgrade_silo_hay, 'silo');
			if (user.upgrade_silo_hay >= 12) return res.send('{"error":"You have reached the maximum level"}');
			if (user.gold < cost) return res.send('{"error":"Need money"}');
			user.gold -= Math.round(cost*Math.pow(10,2))/Math.pow(10,2);
			user.upgrade_silo_hay++;
			user.save(function (err, u) {
				if (err) return res.send(err);
				res.json({success:'upgrade_silo_hay'});
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
			if (user.upgrade_legendary == 3) return res.send('{"error":"You have reached the maximum level"}');
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
			
			var x = user.total_prestige_gold;
			var gold_bonus = 25 * (x / (x + 1000000));
			var x2 = user.flavors.length + user.toppings.length;
			var unlock_bonus = (x2 / 180) * 25; 
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
			user.total_prestige_gold = 0;
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
				baby: { cost:                    1000, prestige: 0},
				waffle: { cost:                100000, prestige: 0},
				chocolate: { cost:           50000000, prestige: 25},
				whitechocolate: { cost:    1000000000, prestige: 75},
				sugar: { cost:             5000000000, prestige: 150},
				sprinkle: { cost:         20000000000, prestige: 200},
				mintycat: { cost:        200000000000, prestige: 300},
				doublechocolate: { cost: 500000000000, prestige: 399},
			};

			var cone = cones[post.id];
			if (!cone) return res.send('{"error":"40C: Cone not found"}');
			if (!user.prestige_bonus) {
				user.prestige_bonus = 0;
			}
			if (user.prestige_bonus < cone.prestige) return res.send('{"error":"Need Prestige"}');
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
    	var n = post.name.replace(/[^a-zA-Z0-9_]/gi, '').toLowerCase();
		if (n.length < 2) return res.send('Name too short');
		if (n.length > 10) return res.send('Name too long');
		User.find({ ip: req.connection.remoteAddress}).lean(true).select('shadow_ban').exec(function (err, users) {
			var is_banned = false;
			for (var i = 0; i < users.length; i++) {
				if (users[i].shadow_ban) {
					is_banned = true;
				}
			}
			var newuser = new User({
				name: n,
				ip: req.connection.remoteAddress,
				created_at: new Date(),
				is_guest: false,
				shadow_ban: is_banned
			});
			if (post.refer) newuser.referal_code = post.refer;
			if (post.email) newuser.email = post.email;
			if (post.password) newuser.password = post.password;
			newuser.save(function(err, user) {
			  if (err) return res.render('login', {alert: 'Could not create an account. Name taken?'});
			  req.session.user_id = user._id;
			  res.redirect('/');
			});
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

		if (!u.friend_last || now_time > u.friend_last + 24 * 60 * 60 * 1000) {
			console.log('Giving friend gold for ' + u.name);
			u.friend_last = now_time;
			u.save(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
			var new_friend_gold = parseFloat(u.today_gold * .0001);
			if (new_friend_gold > 50) {
				var len = u.friends.length;
				for (var i = 0; i < len; i++) {
					User.findOne({ _id: u.friends[i] }).select('friend_gold prestige_bonus').exec(function (err, friend) {
						if (friend) {
							if (!friend.friend_gold || isNaN(friend.friend_gold)) friend.friend_gold = 0;
							friend.friend_gold = Number(friend.friend_gold) + new_friend_gold;
							if (!friend.prestige_bonus) friend.prestige_bonus = 0;
							var cap = (100000 * friend.prestige_bonus) + 1000;
							if (friend.friend_gold > cap) friend.friend_gold = cap;

							friend.save(function (err) { if (err) console.log(err); });
						}
					});
				}
				//res.send(u);
			}
		} else {
			res.send(u);
		}
	});
});
app.get('/me/cow', function(req, res){
	Cow.findOne({ user_id: req.session.user_id, is_active: true }).lean(true).exec(function (err, cow) {
		res.send(cow);
	});
});
app.post('/admin/cow', checkAdmin, function(req, res){
	var cow = new Cow(req.body.cow);
	cow.created_at = new Date();
	cow.save(function (err, cow) {
		if (err) return res.send(err);
		return res.send(cow);
	});
});
app.get('/epics', function(req, res){
	Epic.find({}).sort('-players').lean(true).exec(function (err, epics) {
		res.send(epics);
	});
});
app.get('/epic/count', function(req, res){
	Epic.find({}).select('total').lean(true).exec(function (err, epics) {
		res.send(epics);
	});
});
app.get('/epic/find', function(req, res){
	Epic.findOne({ _id: req.query.id }).lean(true).exec(function (err, epic) {
		res.send(epic);
	});
});
app.get('/epic', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (!user || user.is_epic) return res.json({ err: 'not now' });
		Epic.find({}).sort('players').lean(true).exec(function (err, epics) {
			res.send(epics[0]);
		});
	});
});
app.post('/epic/join', function(req, res){
	var epic_id = req.body.epic;
	if (!epic_id) return res.json({ err: 'No epic selected' });
	User.findOne({ _id: req.session.user_id }, function (err, user) {
		if (!user || user.is_epic) return res.json({ err: 'not now' });
		user.epic_id = epic_id;
		user.save(function (err) {
			if (err) console.log(err);
		});
		Epic.findOne({ _id: epic_id }).exec(function (err, epic) {
			epic.players = epic.players + 1;
			epic.save(function (err) {
				if (err) console.log(err);
			});
		});
		res.json({ success: true });
	});
});

app.get('/session', function(req, res){
	res.send( req.session.user_id );
});
app.get('/me/cows/friends', function(req, res){ //show my friends cows
	User.findOne({_id: req.session.user_id}).select('friends').lean(true).exec(function (err, user) { //find my friends
		if (!user || !user.friends) return false;
		Cow.find({ user_id: { $in: user.friends} }).sort('-created_at').limit(5).lean(true).exec(function (err, cows) {
			res.send(cows);
		});
	});
});
app.get('/me/cows', function(req, res){
	Cow.find({ user_id: req.session.user_id, }).lean(true).sort('is_active created_at').exec(function (err, cows) {
		res.send(cows);
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
	var cow_clear = req.param('cow_clear', null);  // second parameter is default
	var cow_remove = req.param('cow_remove', null);  // second parameter is default
	var cow_exp = req.param('cow_exp', null);  // second parameter is default
	var cow_skin = req.param('skin', null);  // second parameter is default
	var cow_remove_skin = req.param('remove_skin', null);  // second parameter is default
	var cow_age = req.param('cow_age', null);  // second parameter is default
	if (email) {
		User.findOne({ name : n }).exec(function (err, user) {
			if (!user) return res.send('user not found!');
			user.email = email;
			user.save();

			var mailOptions = verify_mailoptions(user);
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
					text: 'The mighty : has given you a badge.',
					badge_id: badge
				});
				pm.save();
				user.badges.push(parseInt(badge));
				if (badge == 1) {
					donor_welcome_queue.push({
						text: 'Please welcome our newest donor @' + user.name + '.',
						room: 'donor lounge'
					});
				}
			} else if (item) {
				Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
					if (!cow) return res.send('no cow');
					cow.items.unshift(item);
					cow.save();
					res.send(cow);
				});
				return;
			} else if (cow_exp) {
				Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
					cow.experience = cow_exp;
					cow.save();
					res.redirect('/admin');
				});
				return;
			} else if (cow_skin) {
				Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
					if (!cow.skins_unlocked) cow.skins_unlocked = [];
					cow.skins_unlocked.push(cow_skin);
					cow.markModified('skins_unlocked');
					cow.save();
					res.redirect('/admin');
				});
				return;
			} else if (cow_remove_skin) {
				Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
					if (!cow.skins_unlocked) return res.send('no skins');
					if (cow.skins_unlocked.indexOf( cow_remove_skin ) == -1) return res.send('skin not found');
					cow.skins_unlocked.splice( cow.skins_unlocked.indexOf( cow_remove_skin ), 1);
					cow.markModified('skins_unlocked');
					cow.save();
					res.redirect('/admin');
				});
				return;
			} else if (cow_age) {
				Cow.findOne({ user_id: user._id, is_active: true }, function (err, cow) {
					cow.created_at = new Date(cow_age);
					cow.save();
					res.redirect('/admin');
				});
				return;
			} else if (cow_clear == 'yes') {
				Cow.find({ user_id: user._id }, function (err, cow) {
					if (!cow) return res.send('no cow');
					for (var i = 0; i < cow.length; i++) {
						cow[i].remove();
					}
					res.redirect('/admin');
				});
				return;
			} else if (cow_remove) {
				Cow.findOne({ user_id: user._id, _id: cow_remove }, function (err, cow) {
					if (!cow) return res.send('no cow');
					cow.remove();
				});
				return res.redirect('/admin');;
			} else if (accumulation) {
				user.highest_accumulation = 0;
			} else if (mod) {
				user.is_mod = (mod == 'true');
				var pm = new PrivateMessage({
						to: user._id,
						from: ':',
						text: 'The mighty : comes down from the Ice Cream heavens above and knights you with mod status.',
						money: a
				});
				pm.save();
			} else if (title) {
				user.title = title;
			} else if (friend_gold) {
				user.friend_gold = friend_gold;
			} if (item) {
				user.items.push(item);
			} else if (a > 0) {
				user.gold = user.gold + parseInt(a);
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
				res.redirect('/admin');
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
app.get('/add_quest', checkAdmin, function(req, res){
	res.send('<form action="new_quest" method="POST">' +
	'<input name="id" placeholder="optional id"><br /><input name="name" placeholder="name"><input name="level" placeholder="level"><input name="cost" placeholder="cost"><br />' + 
	'<textarea name="description" placeholder="description"></textarea>' +
	'<br /><input type="submit">');
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
			if (post.description) quest.description = post.description;
			if (post.cost)  quest.cost = post.cost;
			if (post.name)  quest.name = post.name;
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
			if (post.description !== '') achievement.description = post.description;
			if (post.name !== '') achievement.name = post.name;
			if (post.badge_id != '') {
				achievement.badge_id = post.badge_id;
				User.find({ achievements: achievement._id }).select('badges').exec(function (err, users) {
					for (var i = 0; i < users.length; i++) {
						var u = users[i];
						if (!u.badges) u.badges = [];
						if (u.badges.indexOf(achievement.badge_id) === -1) {
							u.badges.push(achievement.badge_id);
							u.markModified('badges');
							u.save();
						}
					}
				});
			}
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
	res.send( achievement_register(post.id, req.session.user_id) );
});
app.post('/achievement/assign', function(req, res){
	res.send( achievement_register(req.body.id, req.body.user_id) );
});
app.get('/quests', function(req, res){
	Quest.find().sort('level').exec(function (err, quests) {
		res.send(quests);
	});
});
app.post('/toggle', function(req, res){
	var toggle = req.body.toggle;
	if (!toggle) return res.json( { 'err': 'Missing Toggle' });

	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		if (typeof u[toggle] == 'undefined') u[toggle] = false; //return res.json( { 'err': 'Invalid Toggle ' + toggle });
		u[toggle] = !u[toggle];
		u.save(function (err) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
	});
});
app.post('/toggle/background', function(req, res){
	User.findOne({ _id: req.session.user_id }).select('active_background').exec(function (err, u) {
		if (err || !u) return res.send(500, err);
		u.active_background = req.body.value;
		u.save(function (err) {
			if (err) return res.send(500, err);
			res.send(200, '{}');
		}); 
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
function quest_save(u, starting_point, res) {
	u.trend_bonus = Number(u.trend_bonus) + 0.25;

	var quest_split = u.quests[ u.quests.length - 1].split('&'); //split the last quest into parts
	var last_quest = quest_split[0] + '&0&' + starting_point; //add the 0 (complete) marker
	u.quests[ u.quests.length - 1] = last_quest;
	u.markModified("quests");
	u.next_quest_at = new Date(new Date().getTime() + ( 2 * u.quests.length )*60000);
	u.save(function (err) {
		if (err) return console.log(err);
		return res.json({ name: 'dynamic quest', description: last_quest });
	});
}
function quest_dynamic_check(dynamic, starting_point, u, res) {
	var cost = parseInt(dynamic[5]);
	if (dynamic[0] == 1) {
		Cow.findOne({ user_id: u._id, is_active: true }, function (err, cow) {
			var current_sold = cow.experience;
			var diff_sold = current_sold - starting_point;
			if (diff_sold < cost) {
				return res.json({ error:  (cost - diff_sold) + ' to go' });
			}
			quest_save(u, starting_point, res);
		});
	} else {
		var type = dynamic[4];
		var current = u.flavors.indexOf( type );
		var current_sold = (current > -1)? u.flavors_sold[ current ] : starting_point + cost;
		var diff_sold = current_sold - starting_point;
		if (diff_sold < cost) {
			return res.json({ error:  (cost - diff_sold) + ' to go' });
		}
		quest_save(u, starting_point, res);
	}
}
app.post('/complete_quest', function(req, res){ 
	var post = req.body;
	User.findOne({ _id: req.session.user_id }).exec(function (err, u) {
		if (err || !u || !u.quests) return res.send(500);  
		var last_quest = u.quests[ u.quests.length - 1];
		var quest_split = last_quest.split('&');
		if (quest_split[1] == '0') return res.json({error:'Already Complete'});
		if (last_quest.substring(0,2) == '!d') {
			quest_dynamic_check(quest_split[0].split(','), parseInt(quest_split[2]), u, res);
			return;
		}
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
					var quest_len = u.quests.length;
					for (var i = 0; i < quest_len; i++) {
						var q = u.quests[i];
						if (!q) return res.send('{"error":"Invalid quest"}'); 
						if (q.length === 0) return res.send('{"error":"bad quest length ' + i + '"}'); 
						if (typeof q != 'string') {
							console.log(q + ': Quest type: ' + (typeof q) );
							return res.send('{"error":"bad quest type (' + q + ')"}'); 
						}
						var q_split = u.quests[i].split('&')[0];
						if (q_split == quest._id) {
							u.quests[i] = quest._id + '&0&' + real_cost; break;
						}
					}
					u.markModified("quests");
					u.next_quest_at = new Date(new Date().getTime() + ( u.quests.length * u.quests.length )*30000);
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
	}); //end user callback
});
app.get('/new_quest', function(req, res){
	User.findOne({ _id: req.session.user_id }).select('next_quest_at quests prestige_level flavors_sold flavors').exec(function (err, u) {
		if (err || !u) return res.send('{"error":"user not found"}'); 
		if (u.quests.length >= 20) return res.send('{"info":"all quests complete"}');
		if (u.next_quest_at && new Date(u.next_quest_at) > new Date()) return res.json({ time: u.next_quest_at });
		var number_of_completed = 0;
		var quest_history = [];
		var q_len = u.quests.length;
		for (var i = 0; i < q_len; i++) {
			var n_q = u.quests[i];
			var n = n_q.split('&');
			if (n.length > 1) {
				if (n[1] == '0') {
					quest_history.push(n[0]);
					number_of_completed++;
				} else {
					return res.send('{"warn":"currently on a quest, ' + n[1] + '"}');
				}
			} 
		}
		if (u.quests.length >= 5) { //dynamic quest
			var gen = generate_dynamic(u);
			var x = new Date();
			if (gen.cow) {
				Cow.findOne({ user_id: u._id, is_active: true }, function (err, cow) {
					if (!cow) return console.log('no cow found (b4)');
					var sold = cow.experience;
					var q = gen.quest.split(',');
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
				u.next_quest_at = null;
				u.save(function (err) {
					return res.json({name: 'Dynamic Quest',dynamic_quest: gen.quest,quest: new_qest});
				});	
			}
		} else { //normal quest
			Quest.findOne({level : number_of_completed}).exec(function (err, quest) {
				if (err || !quest) return res.send(err);
				if (quest_history.indexOf(quest._id) > -1) return res.json({ warn: 'You are already on this quest' });
				var x = new Date();
				var real_cost = (quest.cost + u.prestige_level);
				if (quest._id == '52672dea3a8c980000000001') real_cost = Math.ceil(quest.cost + (u.prestige_level / 2)); //last
				if (quest._id == '52577a6288983d0000000001') real_cost = Math.ceil(quest.cost + (u.prestige_level / 4)); //strawberry
				if (quest._id == '52672bedde0b830000000001') real_cost = Math.ceil(quest.cost + (u.prestige_level * 2)); //carts

				u.quests.push(quest._id + '&' + x.toUTCString() + '&' + real_cost);
				u.next_quest_at = null;
				u.save(function (err, u) {
					if (err) return res.send(err);
					res.json({
						name: quest.name,
						description: quest.description.replace('[cost]', real_cost)
					});
				});	
			});
		}
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


// app.get('/detection', function (req, res) {
// 	if (!req.session.stat_clicks) return res.send('no data');
// 	var start = req.session.stat_clicks[req.session.stat_clicks.length - 1];
// 	var confidence = 0;
// 	var l = req.session.stat_clicks.length;
// 	for (var i = 0; i < 40; i++) {
// 		var d = Math.abs(start - req.session.stat_clicks[i]);
// 		if (d < 2) {
// 			confidence++;
// 		}
// 	}
// 	var suspic = (confidence > 30)? 100 : (confidence / 30) * 100;
// 	res.send('Your clicks are ' + (suspic).toFixed(2) + '% suspicious based on ' + l + ' data points. (Don\'t worry nothing happens, but at 100% we give you a message). <br>Based on these recent clicks/2 seconds: ' + req.session.stat_clicks.join() );
// });


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
	var now = new Date();

	if (h_type == 'cow') {
		
		
		if (req.query.show == 'friends') {
			User.findOne({ _id: req.session.user_id }).select('friends').lean(true).exec(function (err, u) {
				Cow.find({level : {$gt:1}, is_active: true, user_id: { $in: u.friends}}).sort('-level').limit(lim).lean(true).select('name level user_id').exec(function (err, cows) {
					if (err) return res.send(err);
					res.send(cows);
				});
			});
		} else {
			Cow.find({level : {$gt:1}, is_active: true}).sort('-level').limit(lim).lean(true).select('name level user_id').exec(function (err, cows) {
				if (err) return res.send(err);
				res.send(cows);
			});
		}

	} else {
		var search_query = {};
		var select;
		if (h_type == 'all') {
			search_query = {total_gold: {$gt: 0}, shadow_ban:null, is_guest: false};
			select = 'total_gold';
		} else if (h_type == 'today') {
			var dayago = new Date(now.getTime() - 24*60*60*1000);
			search_query = {today_gold: {$gt: 0}, shadow_ban:null, updated_at: { $gt: dayago}, is_guest: false };
			select = 'today_gold';
		} else if (h_type == 'upandcoming') {
			var thirtydayago = new Date(now.getTime() - 30*24*60*60*1000);
			search_query = {created_at : {$gt:thirtydayago}, total_gold: {$gt: 0}, shadow_ban:null, is_guest: false};
			select = 'total_gold';
		} else if (h_type == 'prestige') {
			search_query = {prestige_bonus : {$gt:0}, shadow_ban:null, is_guest: false};
			select = 'prestige_bonus';
		} else if (h_type == 'accumulation') {
			search_query = {highest_accumulation : {$gt:0}, shadow_ban:null, is_guest: false};
			select = 'highest_accumulation';
		} else if (h_type == 'accumulation_time') {
			search_query = {accumulation_time : {$gt:0}, shadow_ban:null, is_guest: false};
			select = 'accumulation_time';
		} else if (h_type == 'trend_today') {
			search_query = {today_trending : {$gt:0}, shadow_ban:null, is_guest: false};
			select = 'today_trending'; 
		} else {
			var dayago = new Date(now.getTime() - 3*24*60*60*1000);
			search_query = {week_gold: {$gt: 0}, shadow_ban:null, updated_at: { $gt: dayago}, is_guest: false};
			select = 'week_gold';
		}
		if (req.query.show == 'friends') {
			User.findOne({ _id: req.session.user_id }).select('friends').lean(true).exec(function (err, u) {
				search_query._id = { $in: u.friends };
				User.find(search_query).sort('-' + select).limit(lim).lean(true).select('name updated_at ' + select).exec(function (err, users) {
					if (err) return res.send(err);
					res.send(users);
				});
			});
		} else {
			User.find(search_query).sort('-' + select).limit(lim).lean(true).select('name updated_at ' + select).exec(function (err, u) {
				if (err) return res.send(err);
				res.send(u);
			});
		}
	}

});
app.get('/remove_old_users', checkAdmin, function(req, res){ 
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
app.get('/remove_old_messages', checkAdmin, function(req, res){ 
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
	User.count({}).exec(function (err, count_total) {
			res.send({ c: count_total});
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
app.get('/email/winter', checkAdmin, function(req, res){ //half implemented
	User.find({ is_email_holiday: { $ne: false }, email_verified: true }).select('name email').lean(true).exec(function (err, users) {

		var subject = 'Come play in the Winter Event';
		var msg = '';
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			var name = user.name.substring(0,1).toUpperCase() + user.name.substring(1);
			var mailOptions = {
				from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
				to: user.email, // list of receivers
				subject: subject, // Subject line
				text: "Hi "+name+",\r\n the Ice Cream Stand winter event is now live! I hope you enjoy it. Check it out at http://icecreamstand.ca/#!event/winter \r\n\r\nThanks!\r\n\r\nSam",
				html: email_template('Hi '+name+',<br>the Ice Cream Stand winter event is now live from today until Jan 1st! I hope you enjoy it. Check it out at <a href="http://icecreamstand.ca/#!event/winter">icecreamstand.ca/#!event/winter</a><br><br><br>Thanks,<br>Sam</p>', subject)
			};
			console.log('emailed holiday card to ' + user.name);
			smtpTransport.sendMail(mailOptions, function(error, response){
				if (error) console.log(error);
			});
		}
		res.send('y');
	});
});
app.get('/messages', function(req, res){
	var skip = (req.query.start )? req.query.start : 0;
	PrivateMessage.find({to: req.session.user_id}).sort('is_read -created_at').skip(skip).limit(5).lean(true).exec(function (err, pms) {
			res.send(pms);
	});
});
app.get('/messages/read', function(req, res){
	var skip = (req.query.start )? req.query.start : 0;
	PrivateMessage.find({to: req.session.user_id}).sort('is_read -created_at').select('-text').skip(skip).limit(50).lean(true).exec(function (err, pms) {
			res.send(pms);
	});
});
app.get('/messages/read/:from/:to', function(req, res){
	var skip = (req.query.start )? req.query.start : 0;
	User.findOne({ name: req.params.from }).select('_id').lean(true).exec(function (err, user) {
		if (!user) return res.json({ err: 'no user' });
		PrivateMessage.find({ $or: [ 
			{ $and: [{to: req.session.user_id }, { from: req.params.from }] },
			{ $and: [{from: req.params.to }, { to: user._id }] }
		]}).sort('-created_at').skip(skip).limit(50).lean(true).exec(function (err, pms) {
				res.send(pms);
		});
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
		User.find({_id : {$in: user.friends}}).select('name is_away updated_at').sort('name').lean(true).exec(function (err, friend_list) {

			return res.json({ friends: friend_list });

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
app.get('/messages', function(req, res){
	PrivateMessage.find({to: user._id}).sort('is_read -created_at').limit(5).lean(true).exec(function (err, pms) {
		res.send( pms );
	});
});
app.get('/chat', function(req, res){
	if (!req.xhr) { //is_ajax?
		return res.render('chat');			
	}
	var len = Number( req.param('expanded', 8) );  // second parameter is default
	User.findOne({_id: req.session.user_id}).select('room is_mod is_admin').lean(true).exec(function (err, user) {
		var query = { room: 'default'};
		if (user && user.room) query.room = user.room;

		//cap on chat for non-admin/non-mods
		if ( len > 100 && 
			(!user || (!user.is_mod && !user.is_admin))
		) {
			len = 100;
		}

		Chat.find(query).sort({$natural:-1}).limit(len).lean(true).exec(function (err, messages) {
			res.send(messages);
		});
	});
});

app.post('/friend/new', function(req, res){
	if (!req.body.friend || req.body.friend.length < 2) return res.json({err: 'Invalid friend'});
	User.findOne({ _id: req.session.user_id }).select('_id friends name').exec(function (err, u) {
		if (err || !u) return res.send(err);

		if (u.friends.length > 75) return res.json({err: 'You have the maximum number of friends, this isn\'t Facebook.'});
		User.findOne({ name: req.body.friend.toLowerCase() }).select('name').lean(true).exec(function (err, f) {
			if (err || !f) return res.json({err: 'No player found with this name.'});
			if (f.name == u.name) return res.json({err: 'You can not friend yourself.'});
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
function process_login(user, remote_ip) {
	User.find({ ip: remote_ip, shadow_ban: true }).lean(true).select('shadow_ban').exec(function (err, users) {
		var changes = false;
		if (users.length > 0) {
			user.shadow_ban = true;
			changes = true;
		}
		if (user.ip != remote_ip) {
			user.ip = remote_ip;
			changes = true;
		}
		if (changes) {
			user.save(function (err) {
				if (err) console.log(err);
			});
		}
	});
						
}
app.post('/login', function (req, res) {
	var post = req.body;
	if (!post.user) return res.render('login', { alert: 'Missing Information'});

	User.findOne({ name: post.user.toLowerCase() }).select("password ip shadow_ban").exec(function(err, user) {
		if (err || !user) return res.render('login', { alert: 'Username incorrect'});
		user.comparePassword(post.password, function(err, isMatch) {
			if (err) {
				if (!user.password || typeof user.password === 'undefined') {
					req.session.user_id = user._id;
					process_login(user, req.connection.remoteAddress);
					res.redirect('/');
				} else {
					return res.render('login', { alert: 'invalid password'});
				}
			} else {
				if (isMatch) {
					req.session.user_id = user._id;
					process_login(user, req.connection.remoteAddress);
					res.redirect('/');
				} else {
					res.render('login', { alert: 'invalid password'});
				}
			}
		});
	});
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
app.get('/facebook/friends', function (req, res) {
	User.findOne({ _id: req.session.user_id}).lean(true).select('facebook_token facebook_id').exec(function (err, user) {
		getFbData(user.facebook_token, '/me/friends', function(result){
			console.log(result);
            res.send( JSON.stringify(result.data) );
        });
	});

});

app.get('/facebook/share/frankenflavour/:flavour1/:flavour2', function (req, res) {
	User.findOne({ _id: req.session.user_id}).lean(true).select('facebook_token facebook_id last_flavor last_frankenflavour').exec(function (err, user) {
		if (!user || !user.facebook_token) return res.redirect('/auth/facebook');
		Flavor.findOne({_id: req.params.flavour1 }, function (err, flavour) {
			Flavor.findOne({_id: req.params.flavour2 }, function (err, flavour2) {
				var franken_name = helper_franken_name(flavour.name, flavour2.name);
				facebook.postMessage(user.facebook_token, 'I created ' + franken_name + ' in Ice Cream Stand by combining  ' + flavour.name + ' and ' + flavour2.name + '!', res);
			});
		});
		
	});
});
function helper_franken_name(name1, name2) {
    var f_1_half = name1.substring( 0, name1.length / 2);
    var f_2_half = name2.substring(name2.length / 2);
    return f_1_half + f_2_half;
}
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
	User.findOne({ _id: req.session.user_id }).select('name badges shadow_ban').exec(function (err, from) {
		if (err || !from) return res.send('err ' + err);
		if (from.shadow_ban && name != 'sam' && name != 'sunbucks' && name != 'xenko' && name != 'creeperkitty') return res.send('You are banned'); //can only message mods
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
				if (from.badges) pm.badge_id = from.badges[0];
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
app.get('/privacy-policy', function(req, res){
	res.render('privacy', {title: 'Privacy Policy' });
});
app.get('/mod', function(req, res){
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if ( !u || (!u.is_mod && !u.is_admin) ) return res.send('Woah woah woah, you are not a moderator.');
		User.find({ shadow_ban: true }).select('name mute_at mute_reason ip').sort('-mute_at').lean(true).exec(function (err, users) {
			User.find({ dunce_until: { $ne: null } }).select('name dunce_until dunce_message ip').sort('-mute_at').lean(true).exec(function (err, users2) {
				Chapter.find({}, function (err, chapters) {
					res.render('mod', {title: 'Moderation Panel', banned: users, dunced: users2, chapters: chapters});
				});
				
			});
		});
	});
});
app.post('/mod', function(req, res){
	var name = req.body.username.toLowerCase();
	var reason = req.body.reason;
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if ( !u || (!u.is_mod && !u.is_admin) ) return res.send('Woah woah woah, you are not a moderator.');	
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
				badge_id: 8,
				text: 'Please watch your behaviour on Ice Cream Stand. Specifically: ' + reason
			});
			pm.save();
			user.save(function (err) {
				res.redirect('/mod');
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
			if (err || !u) return res.send('err: ' + err);
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
app.get('/me/avatar', function(req, res){
	User.findOne({ _id: req.session.user_id }).select("email").lean(true).exec(function (err, user) {
		var gravatar_hash;
		if (user.email) {
			gravatar_hash = crypto.createHash('md5').update(user.email).digest('hex');
		}
		return res.json({ avatar: gravatar_hash });
	});
});
app.get('/lang/:lang', function(req, res){
	req.session.lang = req.params.lang;
	res.redirect('/');
});
app.get('/chapters', function(req, res){
	var off = (req.query.offset)? req.query.offset : 0;
	User.findOne({ _id: req.session.user_id }, function (err, u) {
		if (!u) return res.json({ warn: 'not logged in' });
		Chapter.find({ _id: { $in: u.chapters_unlocked } }).skip(off).limit(6).select('title chapter_number saga badge_id').sort('-saga chapter_number').lean(true).exec(function (err, chapters) {
			res.send(chapters);
		});
	});
});
app.get('/chapter/:id', function(req, res){
	Chapter.findOne({ _id: req.params.id }).lean(true).exec(function (err, chapter) {
		res.send(chapter);
	});
});


app.get('/easter/:num/:str', function(req, res){
	//return res.send('All fled, all done, so lift me on the pyre. The feast is over and the lamps expire.');
	User.findOne({ _id: req.session.user_id }).select('easter2 name badges').exec(function (err, u) {
		var str = new Buffer(req.params.str, 'base64').toString('ascii');
		var n = parseInt(req.params.num);
		if (n != 6 && n != 4 && str != 'e2 at ics' + n + 'pleasedontcheat' + u.name) {
			return res.send('That\'s a bad egg.');
		}
		if (n == 6 && req.params.str != 'Pvj4f2') return res.send('That\'s a bad egg (2).');
		if (n == 4 && req.params.str != 's9lpj62') return res.send('That\'s a bad egg (2).');

		if (u.easter2.indexOf(n) > -1) {
			var append = '';
			if (!req.xhr) append = " - Returning to the game in 5 seconds.... <script>setTimeout(function(){window.location.href='/'},5000);</script>";
			return res.send('You have already found this egg' + append);
		}
		u.easter2.push(n);
		if (u.easter2.length == 10 && u.badges.indexOf(18) == -1) {
			u.badges.push(18);
			u.save(function (err, u) {
				donor_welcome_queue.push({
					text: '@' + u.name + ' has found all of the eggs and unlocked the Easter badge and cow skin!',
					badge: 18,
					room: 'default'
				});
				
				var append = '';
				if (!req.xhr) append = " - Returning to the game in 5 seconds.... <script>setTimeout(function(){window.location.href='/'},5000);</script>";
				res.send('Congratulations! You have unlocked the Easter badge. (Refresh to see your updated badges).' + append);
			});
		} else {
			u.save(function (err, u) {
				if (err) return res.send(err);
				var append = '';
				if (!req.xhr) append = " - Returning to the game in 5 seconds.... <script>setTimeout(function(){window.location.href='/'},5000);</script>";
				res.send('You\'ve found an egg! That\'s ' + u.easter2.length + ' out of 10' + append);
			});
		}
	});
});
app.get('/epic/aoc/award/', checkAdmin, function(req, res){
	User.find({ epic_last_attack: { $ne: null }  }).select('titles epic_id epic_collected').exec(function (err, users) {
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			user.epic_collected = 0;
			user.epic_id = null;
			if (!user.titles) user.titles = [];
			user.titles.push('The Usurper');
			user.markModified('titles');
			user.save(function (err) { if (err) console.log(err); });
		}
		res.send('yes!');
	});
});
app.get('/cheetah/award/:name', checkAdmin, function(req, res){
	User.find({ name: req.params.name  }).select('name _id').lean(true).sort('-today_trending').limit(1).exec(function (err, users) {
		var user = users[0];
		achievement_register('54d42ff931c311f51ada227b', user._id);
		donor_welcome_queue.push({
			text: '@' + user.name + ' has unlocked a rare skin.',
			room: 'default',
			cow_sync: user._id
		});
		console.log(donor_welcome_queue);
		Cow.findOne({ user_id: user._id, is_active: true }).select('skins_unlocked').exec(function (err, cow) {
			if (!cow) return false;
			if (!cow.skins_unlocked) cow.skins_unlocked = [];
			if (cow.skins_unlocked.indexOf('cheetah') > -1) return false;
			cow.skins_unlocked.push('cheetah');
			cow.markModified('skins_unlocked');
			cow.save();
		});
	});
});

app.get('*', function(req, res){
  res.send('<head><title>404 - Ice Cream Stand</title></head><body><h1 style="padding-top: 100px;">404</h1><h2>Ice Cream Not Found <a href="http://icecreamstand.ca/">Back</a></h2><link rel="stylesheet" href="http://static.icecreamstand.ca/common.css.gz" /></body>', 404);
});

server.listen(app.get('port'), function(){
		console.log('Express server listening on port ' + app.get('port'));
});

process.on('uncaughtException', function (err) {
  	log_error(err.stack);
});


/* helper functions */
function get_cost(x, type) {
	if (type == 'carts') return 25 + (Math.pow(x, 2) / 4);
	if (type == 'employees') return 150 + (x * 100);
	if (type == 'trucks') return 1000 + (x * x * 50);
	if (type == 'robots') return 5000 + (x * x * 100);
	if (type == 'rockets') return 50000 + (x * x * 500);
	if (type == 'aliens') return 500000+(30 * Math.pow(x,2.5));
	if (type == 'silo') return 500000+(30 * Math.pow(x,6));
}
function log_error(err) {
	var path_log = path.join(__dirname, 'error.log'),
	buffer = new Buffer(new Date() + ": " + err + "\n");

	fs.open(path_log, 'a', function(err2, fd) {
	    if (err2) {
	        console.log('error opening error log: ' + err2);
	    } else {
	        fs.write(fd, buffer, 0, buffer.length, null, function(err3) {
	            if (err3)  console.log('error writing error log: ' + err3);
	            fs.close(fd, function() {
	                console.log('Caught exception: ' + buffer);
	            })
	        });
	    }
	});
}
function generate_dynamic(user) {
	var c_i = Math.floor( Math.random() * 4), //category
		d_i = Math.floor( Math.random() * 14), //disaster
		name_i = Math.floor( Math.random() * 22),
		title_i = Math.floor( Math.random() * 14),
		a_i = 150 * (3 * user.quests.length) * (0.5 * (user.prestige_level + 1) ); //amount
	if (c_i == 1) {
		a_i = a_i / 100;
		return {
			quest: '!d' + c_i +','+ d_i +','+ name_i +','+ title_i +', ,'+ a_i,
			cow: true
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
function email_template(msg, subject) {
	return '<!doctype html><html><body style="background-color: #7F7DC7;">' +
		' &nbsp; <br> <div style="background-color: #fff; color: #444; font-size: 14px; padding: 20px 10px 50px; display: block; max-width: 600px; margin: 20px auto;">' +
		'<a href="http://icecreamstand.ca"><img src="http://static.icecreamstand.ca/flogo.png" alt="Logo" style="display: block; width: 100px; height: 100px; margin: 0 auto 30px;" /></a>' + 
		'<h1>' + subject + '</h1>' + msg + '<center><a href="http://icecreamstand.ca" style="background-color: #0da673; box-shadow: 0 2px 0 #097752; color: #fff; border-radius: 4px; padding: 10px; margin: 10px auto; text-align: center; text-decoration: none; font-size: 20px;">Play at Icecreamstand.ca</a></center>' +
		'<br><br><br><small>Unsubcribe at any time from there emails by going to <a href="http://icecreamstand.ca/#!settings">http://icecreamstand.ca/#!settings</a></small>' +
		'</div> &nbsp; <br> </body></html>';
}
function achievement_register(id, user_id) {
	Achievement.findOne({_id : id}).lean(true).exec(function (err, achievement) {
		if (err || !achievement) return '{"error":"' + err + '"}';

		User.findOne({ _id: user_id }).select('achievements badges').exec(function (err, u) {
			if (!u) return '{"success":"false"}';
			if (!u.achievements) u.achievements = [];
			if (u.achievements.indexOf(achievement._id) > -1) return '{"success":"false"}';

			u.achievements.push(achievement._id);
			u.markModified('achievements');

			if (achievement.badge_id) {
				if (!u.badges) u.badges = [];
				u.badges.push(achievement.badge_id);
				u.markModified('badges');
			}
			u.save(function (err) {
				if (err) console.log(err);
			});
			return achievement;
		});

	});
}

function helper_update_object(obj, object_name) {
	var compiled = '';
	for (var key in obj) {
		if (obj[key] && obj[key].length < 140) {
			compiled = compiled + '<label>' + key + '</label>' +
			'<input type="text" value="' + obj[key] + '" name="' + object_name + '[' + key + ']"><br>';
		} else {
			compiled = compiled + '<label>' + key + '</label>' +
			'<textarea name="' + object_name + '[' + key + ']">' + obj[key]  + '</textarea><br>';
		}
	}
	return '<form action="http://icecreamstand.ca/admin/' + object_name + '/' + obj._id + '/edit" method="post">' + compiled + '<input type="submit" value="update"></form>';
}
function helper_email_if_unread(user, d) {
	PrivateMessage.find({ created_at: { $lt: d}, is_read: { $ne: true } }).select('text from').limit(3).exec(function (err, messages) {
		var msg_len = messages.length;
		if (msg_len == 0) return;

		var name = user.name.substring(0, 1).toUpperCase() + user.name.substring(1);
		var compiled = '';
		for (var i = 0; i < msg_len; i++) {
			var msg = messages[i];
			compiled = compiled + '<p>' + msg.text + '<br>From ' + msg.from + ', <a href="http://icecreamstand.ca">Reply here</a></p>';
			msg.is_read = true;
			msg.save(function (err) { if (err) console.log(err); });
		}

		var mailOptions = {
			from: "Ice Cream Stand <icecreamstandmailer@gmail.com>", // sender address
			to: user.email, // list of receivers
			subject: "Here are some messages you might have missed!", // Subject line
			text: "Hi "+name+",\r\nYou have " + msg_len	+ ' unread messages at Ice Cream Stand',
			html: email_template('Hi '+name+',<br>You have ' + msg_len + ' unread messages at Ice Cream Stand!<br><br>Here they are: ' + compiled + '</p>', 'Here are some messages you might have missed!')
		};
		smtpTransport.sendMail(mailOptions, function(error, response){
			if (error) console.log(error);
		}); 

	});
}

//reset daily
schedule.scheduleJob({hour: 0, minute: 3}, function(){
	User.find( { today_gold: { $gt: 0} }).select('today_gold today_trending').sort('-today_gold').limit(100).exec(function (err, users) {
		var l = users.length;
		console.log('todo/reset: ' + l + ' players');
		for (var i = 0; i < l; i++) {
			var u = users[i];
			u.today_gold = 0;
			u.today_trending = 0;
			u.save(function (err) { if (err) console.log(err); });
		}
	});
});
//reset daily
schedule.scheduleJob({hour: 0, minute: 4}, function(){
	User.find( { today_gold: { $gt: 0} }).select('today_gold today_trending').sort('-today_gold').limit(100).exec(function (err, users) {
		var l = users.length;
		console.log('todo/reset: ' + l + ' players');
		for (var i = 0; i < l; i++) {
			var u = users[i];
			u.today_gold = 0;
			u.today_trending = 0;
			u.save(function (err) { if (err) console.log(err); });
		}
	});
});
//reset daily
schedule.scheduleJob({hour: 1, minute: 0}, function(){
	User.find( { today_gold: { $gt: 0} }).select('today_gold today_trending').sort('-today_gold').limit(500).exec(function (err, users) {
		var l = users.length;
		console.log('todo/reset: ' + l + ' players');
		for (var i = 0; i < l; i++) {
			var u = users[i];
			u.today_gold = 0;
			u.today_trending = 0;
			u.save(function (err) { if (err) console.log(err); });
		}
	});
});

//reset weekly
schedule.scheduleJob({hour: 0, minute: 10, dayOfWeek: 0}, function(){
	User.find( { week_gold: { $gt: 0} }).select('week_gold').sort('-week_gold').limit(200).exec(function (err, users) {
		var l = users.length;
		for (var i = 0; i < l; i++) {
			var u = users[i];
			u.week_gold = 0;
			u.save(function (err) { if (err) console.log(err); });
		}
	});
});

//reset weekly
schedule.scheduleJob({hour: 0, minute: 12, dayOfWeek: 0}, function(){
	User.find( { week_gold: { $gt: 0} }).select('week_gold').limit(200).sort('-week_gold').exec(function (err, users) {
		var l = users.length;
		for (var i = 0; i < l; i++) {
			var u = users[i];
			u.week_gold = 0;
			u.save(function (err) { if (err) console.log(err); });
		}
	});
});

//cheetah skin giveaway
schedule.scheduleJob({hour: 0, minute: 2}, function(){
	console.log('searching for Cheetah skin');
	User.find({ today_trending: { $gt: 1000}, achievements : { $ne: '54d42ff931c311f51ada227b' }  }).select('name _id').lean(true).sort('-today_trending').limit(1).exec(function (err, users) {
		var user = users[0];
		if (!user) return false;
		achievement_register('54d42ff931c311f51ada227b', user._id);
		donor_welcome_queue.push({
			text: '@' + user.name + ' has unlocked a rare skin.',
			room: 'default',
			cow_sync: user._id
		});
		console.log(donor_welcome_queue);
		Cow.findOne({ user_id: user._id, is_active: true }).select('skins_unlocked').exec(function (err, cow) {
			if (!cow) return false;
			if (!cow.skins_unlocked) cow.skins_unlocked = [];
			if (cow.skins_unlocked.indexOf('cheetah') > -1) return false;
			cow.skins_unlocked.push('cheetah');
			cow.markModified('skins_unlocked');
			cow.save();
		});
	});
	
});

// schedule.scheduleJob({ hour: 14, minute: 30 }, function(){
// 	console.log('Sending out missed private messages');
// 	var d_default = new Date();
// 	var d_msg = new Date( new Date() - ( 1000 * 60 * 60 * 24 * 2) );
// 	var d_user = new Date( new Date() - ( 1000 * 60 * 60 * 24) );
//     User.find({ 
//     	release_channel: 2,
//     	is_email_messages: true,
//     	updated_at: {$lt: d_user}
//     }).select('name email').lean(true).exec(function (err, users) {
    	
//     	var len = users.length;
    	
//     	for (var i = 0; i < len; i++) { //loop through all users
//     		var user = users[i];
//     		helper_email_if_unread(user, d_msg);

//     	}

//     });
// });