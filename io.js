var socketio = require('socket.io');

module.exports.listen = function(app, cache_trend_id){
	io = socketio.listen(app);
    clients = {};
    var is_default_locked = false;
	var mongoose = require('mongoose');

	User = mongoose.model('User');
	Cow = mongoose.model('Cow');
	Flavor = mongoose.model('Flavor');
	Topping = mongoose.model('Topping');
	Message = mongoose.model('Message');
	PrivateMessage = mongoose.model('PrivateMessage');
	Chat = mongoose.model('Chat');

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
			if (!handshake.client._peername || !user) {
				return callback('could not complete handshake', false);
			}
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

//var tgives = [];
var donor_welcome_queue = [];

io.on('connection', function ( socket ) {	
  	
  	socket.broadcast.emit('join', { _id: socket.handshake.query.id, name: socket.handshake.query.name });
  	User.findOne({ _id: socket.handshake.query.id }).select('socket_id').exec(function (err, user) {
	  	user.socket_id = socket.id;
	  	console.log('socket: ' + socket.handshake.query.name + ' LOG IN');
	  	user.save(function (err) { if (err) console.log(err); });
  	});

  	socket.on('disconnect', function() {
  		socket.broadcast.emit('leave', { _id: socket.handshake.query.id, name: socket.handshake.query.name });
  		User.findOne({ _id: socket.handshake.query.id }).select('socket_id').exec(function (err, user) {
  			user.socket_id = null;
  			console.log('socket: ' + socket.handshake.query.name + ' LOG OUT');
  			user.save(function (err) { if (err) console.log(err); });
  		});
  	});
  	socket.on('typing', function(msg){
  		if (!msg.room) msg.room = 'default';
  		io.sockets.in(msg.room).emit('typing', { _id: socket.handshake.query.id, name: socket.handshake.query.name });
  	});
  	socket.on('sleep', function(msg){
  		User.findOne({ _id: socket.handshake.query.id }).select('is_away room').exec(function (err, user) {
  			var changes = false;
  			if (msg.room) {
				
				if (user.room != msg.room) {
					io.sockets.connected[ socket.id ].emit("chat message", {
						_id: Math.random() + 'update',
						text: 'Welcome to the ' + msg.room + ' room.',
						badge: 1,
						user: ':',
						is_admin: true,
						created_at: new Date()
					});
					socket.leave(user.room);
					user.room = msg.room;
					changes = true;
				}
				socket.join( msg.room );
			}
  			if (!user.is_away || user.is_away != msg.sleep) {
  				user.is_away = msg.sleep;
  				changes = true;
  			}
  			if (changes) {
  				user.save(function (err) {
  					if (err) return console.log(err);
  					io.emit('sleep', {
  						_id: user._id,
  						sleep: user.is_away
  					});
  				});
  			}
  		});

  		if ( donor_welcome_queue.length > 0 && donor_welcome_queue[0].text ) {
		  	var donor = donor_welcome_queue[0];
		  	donor_welcome_queue = [];
		  	if (!donor.room) donor.room = 'default';
		  	console.log( 'New welcome_queue message: ' + donor.text );
		  	io.emit("chat message", {
				_id: Math.random() * 9999999 + 'donor',
				text: donor.text,
				badge: 1,
				user: ':',
				room: donor.room,
				created_at: new Date(),
				cow_sync: donor.cow_sync
			});	
			var newchat = new Chat({
				text: donor.text,
				badge: 1,
				user: ':',
				user_id: ':',
				room: donor.room,
				created_at: new Date()
			});
			newchat.save(function (err, m) { if (err) return console.log('socket msg error: ' + err); });
		}
  	});
  	socket.on('item/sell', function(msg){
  		User.findOne({ _id: socket.handshake.query.id }).select('gold').exec(function (err, user) {
  			if ( !msg.value || isNaN(msg.value) || msg.value > 100000 ) return false;
  			user.gold = user.gold + parseInt(msg.value);
  			user.save();
  		});
  	});
  	socket.on('cow/update', function(msg){
  		User.findOne({ _id: socket.handshake.query.id }).select('chapters_unlocked silo_hay').exec(function (err, user) {

		Cow.findOne({ user_id: socket.handshake.query.id, is_active: true }).exec(function (err, cow) {
		if (!cow) return io.sockets.connected[ socket.id ].emit("alert", { error: '40C - Cow not found' });

		if (msg.h) cow.happiness = Math.floor( Number(msg.h) );
		if (msg.name && msg.name.length <= 20) cow.name = msg.name;
		if (msg.skin) cow.skin = msg.skin;
		if (!cow.experience) cow.experience = 0;


		if (msg.silo) {
			var s = Number(msg.silo);
			user.silo_hay = (isNaN(s))? 0 : s;
			user.save(function (err) { if(err) console.log(err); });
		}

		if (msg.experience) {
			// if (cow.experience < msg.experience - 10 || cow.experience > msg.experience) {
			// 	return io.sockets.connected[ socket.id ].emit("alert", { error: 'Your cow is out of sync' });
			// }
			cow.experience = msg.experience;
			var new_level = 100 * ( cow.experience / ( cow.experience + 1000 ) );
			if (new_level > 10 && cow.level != new_level) {

				//new chapter unlock
				
					if (!user.chapters_unlocked.length) user.chapters_unlocked = [];
					var chance_to_unlock = 0.5 - (0.1 * user.chapters_unlocked.length);
					if (chance_to_unlock < 0.025) chance_to_unlock = 0.025;
					if (Math.random() < chance_to_unlock) {
						Chapter.find({ _id: { $nin: user.chapters_unlocked }, saga: 'Side Stories' }).sort('chapter_number').limit(1).exec(function (err, chap) {
		  					if (chap.length > 0) {
		  						user.chapters_unlocked.push(chap[0]._id);
		  						user.markModified('chapters_unlocked');
		  						io.sockets.connected[ socket.id ].emit("update", { chapter: chap[0].title });
		  					}
		  					user.save();
		  				});
					}
			}
			cow.level = new_level;
		}
		if (msg.memory) {
			if (!cow.memories) cow.memories = [];
			cow.memories.push(msg.memory);
			cow.markModified('memories');
		}
		if (msg.items) {
			// if (msg.items_check) {
			// 	var b = new Buffer(msg.items_check, 'base64');
			// 	var s = b.toString();
			// 	if (JSON.stringify(msg.items) != s) {
			// 		return io.sockets.connected[ socket.id ].emit("aler", { error: 'Item check failed' }); //res.json({ err: 'Item check failed'});
			// 	}
			// }

			// for (var i = 0; i < msg.items.length; i++) {
			// 	if (msg.items[i]) {
			// 		var item = msg.items[i].split('/');
			// 		if (item[1] > 10 || item[2] > 10 || item[3] > 10) {
			// 			msg.items.splice(i, 1);
			// 			i--;
			// 		}
			// 	}
			// }
			
			cow.items = msg.items;
			if (cow.items.length > 12) {
				cow.items = cow.items.slice(0, 12);
			}
			cow.markModified('items');
		}
		if (io.sockets.connected[ socket.id ]) io.sockets.connected[ socket.id ].emit("cow", { level: cow.level, experience: cow.experience, happiness: cow.happiness, item_change: Boolean(msg.items) });

		cow.save(function (err) { if (err) console.log(err); });
  	});
	});
});
  	socket.on('epic', function(msg){
  		User.findOne({ _id: socket.handshake.query.id }).select('name epic_id epic_collected badges').exec(function (err, user) {
  			user.epic_collected += 10;
  			if (user.epic_collected > 200 && user.badges.indexOf(10) === -1) {
  				user.badges.push(10);
  				user.markModified('badges');
  				io.sockets.connected[ socket.id ].emit("chat message", {
			  		_id: Math.random() * 9999999 + 'TGives',
			  		text: '(Winter badge) @' + socket.handshake.query.name + ', Congratulations on earning the team badge. Now bring your team to victory.',
			  		badge: 10,
			  		user: ':',
			  		is_admin: true,
			  		created_at: new Date()
			  	});
  			}
  			user.save(function () { 
  			  	if (user.epic_collected >= 100 && user.epic_collected < 500) {
	  				Cow.findOne({ user_id: user._id, is_active: true}, function (err, cow) {

	  					var skin = (user.epic_id === '5481119c19e7a1c726d1b3f7')? 'Polar Bear' : 'Moose';
	  					if (!cow.skins_unlocked || cow.skins_unlocked.indexOf(skin) === -1) {
	  						if (!cow.skins_unlocked) cow.skins_unlocked = [];
	  						cow.skins_unlocked.push(skin);
	  						cow.markModified('skins_unlocked');
	  						cow.save(function (err) {
	  							if (err) return console.log(err);
	  							console.log('winter event unlocked for ' + cow.name);
	  						});
	  					} else {
	  						console.log('skin already unlocked for '+ user.name);
	  					}
	  				});
  				} else {
  					console.log('epic collected: ' + user.epic_collected);
  				}
  			});
  			Epic.findOne({ _id: user.epic_id }).select('total').exec(function (err, epic) {
  				epic.total += 10;
  				epic.save(function () { });
  			});
  		});
  	});

  	socket.on('epic/aoc/invite', function(msg){
  		User.findOne({ _id: socket.handshake.query.id}).select('epic_last_recruit').exec(function (err, user2) {
	  		var d = new Date();
	  		var delta = (d - new Date(user2.epic_last_recruit)) / 60000;
	  		if (user2.epic_last_recruit && delta < 10) {
		  		return io.sockets.connected[ socket.id ].emit("alert", { error: 'You can not recruit again so soon, please wait ' + (delta).toFixed(1) + ' minutes.' });
		  	}
	  		user2.epic_last_recruit = new Date();

	  		user2.save(function () {
		  		
		  		User.findOne({ name: msg.user.toLowerCase() }).select('name epic_id socket_id is_mod is_admin').exec(function (err, user) {
		  			if (!user || socket.handshake.query.name == user.name || user.is_mod || user.is_admin || (user.epic_id && user.epic_id.indexOf('aoc') > -1)) {
		  				return io.sockets.connected[ socket.id ].emit("alert", { error: 'Can not recruit that player' });
		  			}
		  			user.epic_id = 'aoc_pend,' + socket.handshake.query.name;
		  			if (user.socket_id && io.sockets.connected[ user.socket_id ]) io.sockets.connected[ user.socket_id ].emit("update", { refresh: true });
		  			io.sockets.connected[ socket.id ].emit("alert", { message: 'You have sent ' + user.name + ' an invite.', title: 'Sent' });  	
		  			user.save(function (err) {
		  				if (err) console.log(err);
		  			});

		  		});
	  		}); //user2 save callback
  		}); //user2 find
  	});

  	socket.on('epic/aoc/attack', function(msg){ //for upgrading the AoC civvies weapons
  		User.findOne({ _id: socket.handshake.query.id}).select('epic_collected epic_last_attack').exec(function (err, user) {
  			Epic.findOne({ _id: '54c3f61c195ce39c30982562' }).select('total').exec(function (err, civvies) {
  				if (!civvies) return io.sockets.connected[ socket.id ].emit("alert", { error: 'Can not attack at the moment' });
	  			var power = user.epic_collected;
	  			var cap = (200 + (civvies.total / 100)).toFixed(2);
	  			if (power < cap) {
	  				user.epic_collected = 0;
	  			} else {
	  				power = cap;
	  				user.epic_collected -= cap;
	  			}
	  			civvies.total += 1;
	  			civvies.save(function (err) { if (err) console.log(err); });
	  			if (msg.is_chained) {
	  				power = power * 1.5;
	  			}
	  			var d = new Date();
	  			var delta = d - new Date(user.epic_last_attack);
	  			if (user.epic_last_attack && delta < 60000 * 10) {
	  				return io.sockets.connected[ socket.id ].emit("alert", { error: 'You can not attack again so soon' });
	  			}
	  			user.epic_last_attack = new Date();
	  			user.save(function (err) {
	  				Epic.find({ total: { $gt: 0 }, name: { $ne: 'Civilians' } }).select('total name text').sort('players').limit(1).exec(function (err, forts) {
	  					forts[0].total = Math.floor( forts[0].total - power);
	  					if (forts[0].total <= 0) {
	  						io.emit('alert', { message: forts[0].text, title: forts[0].name + ' has fallen!' });
	  					}
	  					io.emit('update', { fort: forts[0]._id, fort_health: forts[0].total });
	  					forts[0].save();
	  					io.sockets.connected[ socket.id ].emit("alert", { message: 'You attack fort "' + forts[0].name + '" for ' + power + ' health.', title: 'Attack!' });
	  					if (power > 0) io.emit("epic/aoc/log", { player: socket.handshake.query.name, power: power, fort: forts[0].name });
	  				});
	  			});
  			});
  		});
  	});
  	socket.on('epic/aoc/signup', function(msg){ //for upgrading the AoC civvies weapons
  		return false;
  		User.findOne({ _id: socket.handshake.query.id }).select('epic_collected epic_id').exec(function (err, user) {
  			if (msg.join) {
  				user.epic_id = 'aoc_civ';
  				Epic.findOne({ _id: '54c3f61c195ce39c30982562' }).select('players').exec(function (err, epic) {
  					epic.players = epic.players + 1;
  					epic.save();
  				});
  				io.emit("chat message", {
					_id: Math.random() + 'aoc',
					text: '@' + socket.handshake.query.name + ' marks their door with a red X.',
					badge: 15,
					user: ':',
					created_at: new Date(),
					sync: user._id
				});
				var newmessage = new Chat({
					text: '@' + socket.handshake.query.name + ' marks their door with a red X.',
					user: ':',
					created_at: new Date(),
					badge: 15,
					room: 'default'
				});
				newmessage.save(function (err, m) {
					console.log(err + m);
				});
  			} else {
				user.epic_id = null;
  			}
  			user.epic_collected = 0;
  			user.save(); 
  		});
  	});
  	socket.on('epic/aoc/upgrade', function(msg){ //for upgrading the AoC civvies weapons
  		User.findOne({ _id: socket.handshake.query.id }).select('epic_collected gold').exec(function (err, user) {
  			var power = Number(msg.power);
  			var cost = { 1: 100000, 5: 450000, 10: 875000 };
  			if (cost[power] > user.gold) return;
  			user.gold -= cost[power];
  			user.epic_collected += power;
  			user.save();
  			io.sockets.connected[ socket.id ].emit("update", { gold: user.gold, epic: user.epic_collected });
  		});
  	});

  	socket.on('epic/aoc/knight', function(msg){ //for upgrading the AoC knights (+2 scaling fort health)
  		Epic.findOne({ _id: '54c3f61c195ce39c30982562' }).select('total').exec(function (err, civvies) {
	  		User.findOne({ _id: socket.handshake.query.id }).select('epic_last_attack gold').exec(function (err, user) {
	  			if (err || !user) return console.log('no user found');
	  			var health = (msg.health)? Number(msg.health) : 2;
	  			var gold = Number(user.gold);
	  			var cost = 10000000;

	  			if (user.epic_last_attack) {
	  				var d = new Date();
		  			var delta =  new Date(user.epic_last_attack) - d; //last_attack is the future date
			        if (delta > 0) {
			             return io.sockets.connected[ socket.id ].emit("alert", { error: 'Repair too soon' });
			        }
		    	}
	  			var cooldown  = 0.5 + (1 / ((0.0002 * civvies.total) + 1)); //minutes to wait
        		user.epic_last_attack = new Date(new Date().getTime() + (cooldown * 60000)); //that number of minutes in the future
        		console.log('cooldown for knights: ' + cooldown);

		  		//console.log(socket.handshake.query.name + ' -> ' + gold + ' -> ' + (gold < cost) + ' -> ' + (gold - cost));
	  			if (gold < cost) return io.sockets.connected[ socket.id ].emit("alert", { error: 'Not enough money.' });
	  			gold -= cost;
	  			user.gold = gold;
		  		user.save(function (err, user) {
		  			if (err) return console.log(err);
			  		Epic.findOne({ _id: msg.fort }).select('total name players').exec(function (err, fort) {
			  			fort.total += Number(health);
			  			var cap = 30000 * fort.players;
			  			if (fort.name != 'The Castle' && fort.total > cap) fort.total = cap;
			  			io.sockets.connected[ socket.id ].emit("update", { gold: user.gold, fort: fort._id, fort_health: fort.total });
			  			io.emit("epic/aoc/log", { player: socket.handshake.query.name, health: health, fort: fort.name });
			  			fort.save();
			  		});
		  		});
		  	});
		});
  	});
  	socket.on('accumulation', function(msg){

  		User.findOne({ _id: socket.handshake.query.id }).select('highest_accumulation last_icecube_at accumulation_time chapters_unlocked').exec(function (err, user) {
  			if (!user.highest_accumulation || msg.a > user.highest_accumulation) user.highest_accumulation = msg.a;
  			if (!user.accumulation_time || msg.t > user.accumulation_time) user.accumulation_time = msg.t;
  			if (msg.is_first_win) {
  				user.last_icecube_at = new Date();
  			}

  			if (msg.t > 20) {
	  			if (!user.chapters_unlocked) user.chapters_unlocked = [];
	  			var chance_to_unlock = 0.75 - (0.15 * user.chapters_unlocked.length);
	  			if (chance_to_unlock < 0.05) chance_to_unlock = 0.05;
	  			if (msg.t > 60) chance_to_unlock += 0.025;
	  			if (msg.t > 120) chance_to_unlock += 0.025;

	  			var chapter_unlock = (Math.random() < chance_to_unlock);
	  			if (!chapter_unlock && msg.flavour && msg.addon && msg.flavour == '523d5ea90a0d080000000002' && msg.addon == '523d5bb9fbdef6f047000023') chapter_unlock = (Math.random() < chance_to_unlock);
	  			if (chapter_unlock) {
	  				Chapter.find({ _id: { $nin: user.chapters_unlocked }, saga: 'The Chronicles of Ice Cream Stand' }).sort('chapter_number').limit(1).exec(function (err, chap) {
	  					if (chap.length > 0) {
	  						user.chapters_unlocked.push(chap[0]._id);
	  						user.markModified('chapters_unlocked');
	  						io.sockets.connected[ socket.id ].emit("update", { chapter: chap[0].title });
	  					}
	  					
	  					user.save();
	  				});
	  				return;
	  			}
  			}
  			user.save(function (err) {
  				if (err) return console.log(err);
  			});
  		});
  	});
  	socket.on('sell', function(post){
		if (!post.v || parseFloat(post.v) < 1.45) return io.sockets.connected[ socket.id ].emit("alert", { error: 'Please update to the latest version.' });
		User.findOne({ _id: socket.handshake.query.id }).select('achievements updated_at today_trending badges socket_id gold total_gold today_gold total_prestige_gold week_gold last_flavor last_frankenflavour last_frankenflavour_at upgrade_frankenflavour highest_accumulation items upgrade_coldhands trend_bonus prestige_bonus icecream_sold flavors_sold last_addon').exec(function (err, u) {
		
		if (!u || err) return io.sockets.connected[ socket.id ].emit("alert", { error: 'Please log in.' });;
		if (u.socket_id != socket.id) {
			if (u.socket_id && io.sockets.connected[ u.socket_id ]) {
				return io.sockets.connected[ u.socket_id ].emit("update", { refresh: true, error: 'You. Must. Refresh. (I see you in a new location)' });
			}
			u.socket_id = socket.id;
			console.log(socket.handshake.query.name + ' socket id mismatch >:( ');
		} 
		var amount = parseInt(post.a);
		var infer_amount;
		var now = new Date();
		var now_time = now.getTime();

		if (parseFloat(post.addon) > 7) return io.sockets.connected[ socket.id ].emit("alert", { error: 'invalid add-on amount' });
		if (amount > ((u.upgrade_coldhands+1) * 100) + u.upgrade_autopilot || amount < 0) return io.sockets.connected[ socket.id ].emit("alert", { error: 'Slow down, you move too fast.' });
		var cone = parseFloat(post.cone);
		if (cone > 4.5) return io.sockets.connected[ socket.id ].emit("alert", { error: 'invalid cone amount' });
		var base = parseFloat(post.cbv);
		if (base > 7) return io.sockets.connected[ socket.id ].emit("alert", { error: 'invalid base amount' });
		var combo = parseFloat(post.c);
		if (combo > 3) return io.sockets.connected[ socket.id ].emit("alert", { error: 'invalid combo amount (' + combo  + ')' });
		var expertise = (post.e)? parseInt(post.e) : 0;
		if (expertise > 15) return io.sockets.connected[ socket.id ].emit("alert", { error: 'invalid expertise amount (' + expertise  + ')' });

		var trending_flavour = parseFloat(post.t);
		var flavour_position = parseInt(post.fp);
		var is_franken_refresh = null;

		if (post.ha && parseFloat(post.ha) > u.highest_accumulation) {
			u.highest_accumulation = parseFloat(post.ha);
		}
		if (u.last_frankenflavour && now_time - new Date(u.last_frankenflavour_at) > 1200000) { //1200000 == 20 mins
			u.last_frankenflavour = null;
			is_franken_refresh = true;
		}

		//var on_autopilot = (!workers && u.upgrade_autopilot && amount === u.upgrade_autopilot);
		if (trending_flavour) base += trending_flavour; //trending flavor
		if (post.ta == 'true') base += u.trend_bonus;   //trending event	
		if (!isNaN(combo)) { base += combo; } //combo bonus
		if (!isNaN(cone)) { base += cone; } //combo bonus
		

		var prestige_bonus = base * (u.prestige_bonus / 100); //base includes the modifiers here
		var expertise_bonus = base * (.1 * expertise);
		infer_amount =  base + parseFloat(post.addon) + expertise_bonus + prestige_bonus; 
		var infer_change = amount * infer_amount;
		var infer_gold = parseFloat(u.gold + infer_change).toFixed(2);
				
		if (isNaN(infer_gold)) { return io.sockets.connected[ socket.id ].emit("alert", { error: 'incorrect amount of money', reload: true }); }
		//update totals
		if (!u.total_prestige_gold) u.total_prestige_gold = 0;

		//The real magic happens here
		u.gold = infer_gold;
		u.total_gold += infer_change;
		u.total_prestige_gold += infer_change;
		u.today_gold += infer_change;
		u.week_gold += infer_change;
		u.icecream_sold += amount;
		if (cache_trend_id === u.last_flavor) u.today_trending += amount;

		//flavours sold
		if (!flavour_position) flavour_position = 0;
		var f_sold =  parseInt(u.flavors_sold[flavour_position]) || 0;
		u.flavors_sold[flavour_position] = f_sold + amount;
		u.markModified("flavors_sold");
		u.updated_at = new Date();

		//dalek
		if (f_sold > 6076015 && u.achievements.indexOf('54e6a76b22de6de049288f5e') == -1) {
			var e_count = 0;
			var e_len = u.flavors_sold.length;
			for (var i = 0; i < e_len; i++) {
				if (u.flavors_sold[i] > 6076015) e_count++;
				if (e_count == 10) break;
			}
			if (e_count >= 10) {
				Cow.findOne({ user_id: u._id, is_active: true }, function (err, cow) {
					if (!cow) return false;
					if (!cow.skins_unlocked) cow.skins_unlocked = [];
					if (cow.skins_unlocked.indexOf('dalek') > -1) return false;
					cow.skins_unlocked.push('dalek');
					cow.markModified('skins_unlocked');
					cow.save();

					achievement_register('54e6a76b22de6de049288f5e', u._id);
					u.save(function (err) {
							io.emit("chat message", {
					  			_id: Math.random() + 'unlock',
					  			text: '@' + socket.handshake.query.name + ' has unlocked a rare skin. Exterminate.',
					  			badge: 1,
					  			user: ':',
					  			created_at: new Date(),
					  			cow_sync: u._id
					  	});
					});

				});
				return false;
			}
		}

		u.save(function (err) {
			var randomnumber = Math.random()*10000; 
			if (randomnumber < 15) { //lower flavour value
				Flavor.findOne({ _id: u.last_flavor}).select('value base_value name').exec(function (err, flavor) {
					if (flavor.value > 0.10 && flavor.base_value > 1) {
						flavor.value = Math.round( (flavor.value - 0.05) * Math.pow(10,3) ) / Math.pow(10,3);
						if (flavor.value < 0.10) flavor.value = 0.20;
					} else if (flavor.value > 0.35 && flavor.base_value <= 1) {
						flavor.value = Math.round( (flavor.value - 0.01) * Math.pow(10,3) ) / Math.pow(10,3);
					} else { return; }
					flavor.save(function (err) { if (err) console.log(err); });
				});
			} else if (randomnumber < 20) { //add vote
				Flavor.findOne({ _id: u.last_flavor}).select('votes value').exec(function (err, flavor) {
					if (!flavor.votes) flavor.votes = 0;
					flavor.votes++;
					flavor.save(function (err) { if (err) console.log(err); });
				});
			} else if (randomnumber < 125 && u.last_flavor == '524dd6ce8c8b720000000002' && u.last_addon == '523d5bb9fbdef6f047000023' && u.upgrade_frankenflavour == 1 && (!u.items || u.items.indexOf('lab parts') === -1)) {
							if (!u.items) u.items = [];
							u.items.push('lab parts');
							u.save(function (err) {
								io.emit("chat message", {
						  			_id: Math.random() + 'unlock',
						  			text: '@' + socket.handshake.query.name + ' has discovered the second Lab Part.',
						  			badge: 1,
						  			user: ':',
						  			created_at: new Date(),
						  			sync: u._id
						  		});
							});
			} else if (randomnumber < 112 && u.last_flavor == '5238fe64c719600000000001' && u.last_addon == '52ec468c0b26820000000002' && u.upgrade_frankenflavour == 2 && (!u.items || u.items.indexOf('lab parts') === -1)) {
							if (!u.items) u.items = [];
							u.items.push('lab parts');
							u.save(function (err) {
								io.emit("chat message", {
						  			_id: Math.random() + 'unlock',
						  			text: '@' + socket.handshake.query.name + ' has discovered the final Lab Part.',
						  			badge: 1,
						  			user: ':',
						  			created_at: new Date(),
						  			sync: u._id
						  		});
							});
			} else if (randomnumber < 50 && u.last_flavor == '524d106b132031000000000f' && u.last_addon == '523d5bb9fbdef6f047000023' && u.last_frankenflavour == '524dd6fc8c8b720000000004') {
				Cow.findOne({ user_id: u._id, is_active: true }, function (err, cow) {
					if (!cow) return false;
					if (!cow.skins_unlocked) cow.skins_unlocked = [];
					if (cow.skins_unlocked.indexOf('toy') > -1) return false;
					cow.skins_unlocked.push('toy');
					cow.markModified('skins_unlocked');
					cow.save();

					achievement_register('5494854f378bcd8043101d59', u._id);
					u.save(function (err) {
						io.emit("chat message", {
				  			_id: Math.random() + 'unlock',
				  			text: '@' + socket.handshake.query.name + ' has unlocked a rare skin.',
				  			badge: 1,
				  			user: ':',
				  			created_at: new Date(),
				  			cow_sync: u._id
				  		});
					});

				});
							
			} else if (randomnumber < 50 && u.last_flavor == '5238fe64c719600000000001' && u.last_addon == '52ec468c0b26820000000002') {
				Cow.findOne({ user_id: u._id, is_active: true }, function (err, cow) {
					if (!cow) return false;
					if (!cow.skins_unlocked) cow.skins_unlocked = [];
					if (cow.skins_unlocked.indexOf('cyber') > -1) return false;
					cow.skins_unlocked.push('cyber');
					cow.markModified('skins_unlocked');
					cow.save();

					achievement_register('54d2f2c1e6183d601a14d04b', u._id);
					u.save(function (err) {
						io.emit("chat message", {
				  			_id: Math.random() + 'unlock',
				  			text: '@' + socket.handshake.query.name + ' has unlocked a rare skin.',
				  			badge: 1,
				  			user: ':',
				  			created_at: new Date(),
				  			cow_sync: u._id
				  		});
					});

				});
							
			} else if (cache_trend_id === u.last_flavor) {
				Trend.findOne({ $and: [ {total_sold: {$lt: 75000}}, {total_sold: {$gte: 0}} ] }, function (err, trend) {
					if (!trend) return;
					var next_bonus = 76000 - (20000 * trend.bonus);
					var delta = (amount > 100 || amount < 0)? 100 : amount;
					trend.total_sold += delta;
					if (trend.total_sold > next_bonus) { trend.bonus = trend.bonus - 0.05; }
					trend.save(function (err) { if (err) console.log(err); });
				});
			}
			if (io.sockets.connected[ socket.id ]) {
				io.sockets.connected[ socket.id ].emit("update", {
					gold: u.gold,
					ifr: is_franken_refresh,
					expertise: u.flavors_sold[flavour_position],
					expertise_position: flavour_position
				});
			}
			}); //end user save
		}); //end user findOne
  	});
  	socket.on('sell/worker', function(post){
		if (!post.v || parseFloat(post.v) < 1.45) return io.sockets.connected[ socket.id ].emit("alert", { error: 'Please update to the latest version.' });

		User.findOne({ _id: socket.handshake.query.id }).select('socket_id updated_at gold total_gold total_prestige_gold today_gold week_gold upgrade_machinery').exec(function (err, u) {
			if (!u || err) return io.sockets.connected[ socket.id ].emit("alert", { error: 'Please log in.' });
			if (u.socket_id != socket.id) {
				if (u.socket_id && io.sockets.connected[ u.socket_id ]) {
					return io.sockets.connected[ u.socket_id ].emit("update", { refresh: true, error: 'You. Must. Refresh. (I see you in a new location)' });
				}
				u.socket_id = socket.id;
				console.log(socket.handshake.query.name + ' socket id mismatch >:( ');
			} 
			var amount = parseInt(post.a);
			var infer_amount = parseFloat(post.d); //post.d is the average ice cream flavor value
			var infer_sleep_amount = parseFloat(post.dsq); //post.d is the average ice cream flavor value
			if (!infer_sleep_amount) infer_sleep_amount = 0;
			if (infer_amount > 200) return io.sockets.connected[ socket.id ].emit("alert", { error: 'worker amount too high ($' + infer_amount + ')' });
			var infer_change = amount * (1 + infer_sleep_amount) * infer_amount * (1 + (0.1 * u.upgrade_machinery) );
			if (post.ds =='true') { infer_change = infer_change * 30; } //deep sleep
			if (!u.total_prestige_gold) u.total_prestige_gold = 0;

			u.gold = parseFloat(u.gold + infer_change).toFixed(2); //instead interfer the new gold total
			u.total_gold += infer_change;
			u.total_prestige_gold += infer_change;
			if (u.gold > u.total_prestige_gold) u.total_prestige_gold = u.gold;
			u.today_gold += infer_change;
			u.week_gold += infer_change;
			u.updated_at = new Date();
			u.save(function (err) {
				if (err) console.log(socket.handshake.query + ': cant update user, err: ' + err);
			});
			if (io.sockets.connected[ socket.id ]) io.sockets.connected[ socket.id ].emit("update", { gold: u.gold });
		});

	});

	//TODO move the whole message creation block to the socket layer
  	socket.on('message', function(msg){ //for pushing updates to a player after they are messaged

  		User.findOne({ name: msg.to }).select('socket_id').exec(function (err, user) {  //find the player being messages
  			if ( user.socket_id && io.sockets.connected[ user.socket_id ] ) { //if that player is connected

  				PrivateMessage.find({to: user._id, from: socket.handshake.query.name, is_read : { $ne: true } }).lean(true).exec(function (err, messages) { //find the unread messages
  					io.sockets.connected[ user.socket_id ].emit("update", { messages: messages });  //send out the unread messages
  				});

  			}
  		});
  	});

  	socket.on('chat message', function(msg){
  		if (!msg.text) return false;
  		var t = msg.text.replace(/^\s+|\s+$/g,'');
  		Message.find().sort({$natural:-1}).limit(1).lean(true).exec(function (err, messages) {
			if (t == messages[0].text) {
				io.sockets.connected[ socket.id ].emit("alert", {
					'title': 'Error',
					'message': 'This message has already been sent'
				});
				return false;
			}
			
	  		User.findOne({ _id: socket.handshake.query.id }).select('dunce_until room party_until dunce_message shadow_ban is_admin is_mod name last_flavor quests prestige_level badges').lean(true).exec(function (err, user) {
		  		if (!user.room) user.room = 'default';
		  		if (user.room == 'default' && is_default_locked && !user.is_mod && !user.is_admin) {
					io.sockets.connected[ socket.id ].emit("alert", {
						'title': 'Error',
						'message': 'This chat room is currently LOCKED, only mods can talk.'
					});
					return false;
				}
		  		if (user.shadow_ban && user.room != 'swamp') {
		  			io.sockets.connected[ socket.id ].emit("alert", { 'title': 'Error', 'message': 'You can not talk at this time.' });
		  			return false;
		  		}
		  		if (msg.badge && user.badges && user.badges.indexOf(parseInt(msg.badge) ) === -1) {
		  			io.sockets.connected[ socket.id ].emit("alert", { 'title': 'Error', 'message': 'Invalid Badge' });
		  			return false;
		  		}
		  		if (user.prestige_level === 0 && user.quests.length < 2) {
		  			io.sockets.connected[ socket.id ].emit("alert", { 'title': 'Error', 'message': 'Please play the game a bit first. Sorry for any interuption.' });
		  			return false;
		  		}

		  		if (user.dunce_until) {
		  			var d = new Date();
		  			if (new Date(user.dunce_until) < d) {
		  				User.findOne({ _id: user._id }).select('dunce_until').exec(function (err, dunce) {
		  					dunce.dunce_until = null;
		  					dunce.save();
		  				});
		  			} else {
		  				msg.badge = 13;
		  			}
		  		}
		  		
		  		if (t.toLowerCase().substring(0, 4) == '/ban') {
		  			if (!user.is_mod && !user.is_admin) {
		  				io.sockets.connected[ socket.id ].emit("alert", {
							'title': 'Error',
							'message': 'I can\'t let you do that @' + user.name
						});
			  			return false;
		  			}
		  			var parts = t.substring(5).split(' ');
		  			var target = parts[0].toLowerCase().trim();
		  			var message = '';
		  			for (var i = 1; i < parts.length; i++) { message = message + parts[i] + ' '; }
		  			var find = (target.length > 20)? { _id: target} : { name: target };
		  			User.findOne(find).select('name room shadow_ban socket_id').exec(function (err, user_dunce) {
		  				if (!user_dunce) {
		  					io.sockets.connected[ socket.id ].emit("alert", {
								'title': 'Could not find',
								'message': 'could not find player: @' + target 
							});
							return;
		  				}
		  				if (user_dunce.shadow_ban) {
		  					user_dunce.shadow_ban = null;

		  					io.sockets.connected[ socket.id ].emit("alert", {
								'title': 'Banned',
								'message': 'Unbanned @' + user_dunce.name + '.'
							});
		  					
							
						} else {
							user_dunce.shadow_ban = true;
							user_dunce.room = 'swamp';
							io.sockets.connected[ socket.id ].emit("alert", {
								'title': 'Banned',
								'message': 'Banned ' + user_dunce.name + '. Reason: ' + message 
							});

			  				var pm = new PrivateMessage({
								from: user.name,
								to: user_dunce._id,
								text: 'You have been muted. Reason: ' + message
							});
							pm.save();

							if (user_dunce.socket_id && io.sockets.connected[ user_dunce.socket_id ]) {
								io.sockets.connected[ socket.id ].emit("update", {
									'room': 'swamp',
								});
							}
						}
						user_dunce.save();
		  			});
		  			return false;
		  		}

		  		if (t.toLowerCase().substring(0, 5) == '/roll') {
		  			var rand_num = Math.floor( Math.random() * 20 ) + 1;
		  			var msg_info = (t.length > 5)? ' (' + t.substring(5, t.length) + ')' : '';
		  			if ( is_swear(msg_info.toLowerCase()) ) {
		  				msg_info = ' *beep*';
		  			}
		  			io.emit("chat message", {
						_id: Math.random() * 9999999 + 'roll',
						text: socket.handshake.query.name + ' has rolled a ' + rand_num + msg_info,
						badge: 1,
						user: ':',
						created_at: new Date(),
						is_system: true
					});
					return false;
		  		}

		  		if (t.toLowerCase().substring(0, 5) == '/lock') {
		  			if (!user.is_mod && !user.is_admin) {
		  				io.sockets.connected[ socket.id ].emit("alert", {
							'title': 'Error',
							'message': 'I can\'t let you do that @' + user.name
						});
			  			return false;
		  			}
		  			is_default_locked = !is_default_locked;
		  			io.sockets.connected[ socket.id ].emit("alert", {
						'title': 'Chat Lock',
						'message': 'Chat is now ' + ( is_default_locked? 'locked' : 'unlocked') 
					});
					return false;
		  		}
		  		if (t.toLowerCase().substring(0, 10) == '/party off') {
		  			if (!user.is_mod && !user.is_admin) {
		  				io.sockets.connected[ socket.id ].emit("alert", {
							'title': 'Error',
							'message': 'I can\'t let you do that @' + user.name
						});
		  			}
		  			User.find({ party_until: { $ne: null} }).select('party_until').exec(function (err, users) {
		  				for (var i = 0; i < users.length; i++) {
		  					users[i].party_until = null;
		  					users[i].save(function (err) { if (err) console.log(err); });
		  				}
		  				if (users.length > 0) {
			  				io.emit("chat message", {
						  		_id: Math.random() * 9999999 + 'party',
						  		text: '(Party) THIS PARTY IS OVER',
						  		badge: 14,
						  		user: ':',
						  		is_admin: true,
						  		created_at: new Date(),
						  		party: '?'
					  		});
		  				}
		  			});
		  			return false;
		  		}
		  		if (t.toLowerCase().substring(0, 6) == '/party') {
		  			Cow.findOne({ user_id: user._id, is_active: true}, function (err, cow) {
		  				var is_match = false;
		  				if (cow && cow.items) {
			  				for (var i = 0; i < 4; i++) {
			  					if (cow.items[i] && cow.items[i].indexOf('hat_birthday') > -1) {
			  						is_match = true;
			  						break;
			  					}
			  				}
		  				}
		  				if (!is_match && !user.party_until && !user.is_admin) {
		  					io.sockets.connected[ socket.id ].emit("alert", {
								'title': 'Error',
								'message': 'I can\'t let you do that @' + user.name
							});
							return;
		  				}
		  				var target = t.substring(7).replace(/[^a-zA-Z0-9_]/gi, '').toLowerCase().trim();
		  				User.findOne({ name: target }).select('is_away name shadow_ban party_until dunce_until').exec(function (err, user2) {
		  					if (!user2 || user2.shadow_ban) {
			  					io.sockets.connected[ socket.id ].emit("alert", {
									'title': 'Error',
									'message': 'cant find person to party: @' + target
								});
								return;
		  					}
		  					if (user2.is_away) {
			  					io.sockets.connected[ socket.id ].emit("alert", {
									'title': 'Error',
									'message': 'This player is away and can\'t party right now :('
								});
								return;
		  					}
		  					if (user._id == user2._id) {
			  					io.sockets.connected[ socket.id ].emit("alert", {
									'title': 'Error',
									'message': 'You cant party yourself. (Especially in public).'
								});
								return;
		  					}
		  					if (user2.party_until) {
		  						io.sockets.connected[ socket.id ].emit("alert", {
									'title': 'Error',
									'message': '@' + user2.name + ' is already partying!'
								});
		  						return;
		  					} 
		  					if (user2.dunce_until) {
		  						if (new Date(user2.dunce_until) > new Date()) {
			  						io.sockets.connected[ socket.id ].emit("alert", {
										'title': 'Error',
										'message': '@' + user2.name + ' is in the corner. :*('
									});
			  						return;
		  						}
		  						user2.dunce_until = null;
		  					} 
			  				var d = new Date();
			  				user2.party_until = new Date(d.getTime() + (1000 * 60 * 10));

		  					user2.save(function (err) {
			  					if (err) console.log(err);
			  					io.emit("chat message", {
					  				_id: Math.random() * 9999999 + 'party',
					  				text: '(Party) @' + user2.name.substring(0,1).toUpperCase() + user2.name.substring(1) + ' must now party (10 minutes, partied by @' + socket.handshake.query.name + ').',
					  				badge: 14,
					  				user: ':',
					  				is_admin: true,
					  				created_at: new Date(),
					  				party: user2.name
				  				});
		  					});
		  				});
		  			});
			  		return false;
		  		}

		  		if (t.toLowerCase().substring(0, 6) == '/dunce') {
		  			if (!user.is_mod && !user.is_admin) {
		  				io.sockets.connected[ socket.id ].emit("alert", { 'title': 'Error', 'message': 'I can\'t let you do that ' + user.name });
			  			return false;
		  			}
		  			var parts = t.substring(7).split(' ');
		  			var dunce = parts[0].toLowerCase();
		  			var minutes = (isNaN(parts[1]))? null : parts[1];
		  			var message = '';
		  			for (var i = (minutes)? 2 : 1; i < parts.length; i++) { message = message + parts[i] + ' '; }

		  			var find = (dunce.length > 20)? { _id: dunce} : { name: dunce };
		  			User.findOne( find ).select('name dunce_message dunce_strikes dunce_until').exec(function (err, user_dunce) {
		  				if (!user_dunce) {
		  					io.sockets.connected[ socket.id ].emit("alert", {
								'title': 'Error',
								'message': 'cant find user: @' + dunce
							});
		  				}
		  				if (user_dunce.dunce_until) {
		  					user_dunce.dunce_until = null;
		  				} else {
		  					var d = new Date();
		  					if (!minutes) minutes = 60;
		  					user_dunce.party_until = null;
		  					user_dunce.dunce_until = new Date(d.getTime() + (1000 * 60 * minutes));
		  					user_dunce.dunce_message = message;
		  					if (!user_dunce.dunce_strikes) user_dunce.dunce_strikes = 0;
		  					user_dunce.dunce_strikes++;
		  				}
		  				user_dunce.save(function (err) {
		  					if (err) console.log(err);
		  					io.emit("chat message", {
				  				_id: Math.random() * 9999999 + 'TGives',
				  				text: (user_dunce.dunce_until)? '(Dunce) @' + user_dunce.name.substring(0,1).toUpperCase() + user_dunce.name.substring(1) + '  has been dunced for ' + minutes + ' minutes by @' + socket.handshake.query.name + '. Reason: ' + message : '(Dunce) ' + user_dunce.name + ' is no longer a dunce according to @' + socket.handshake.query.name,
				  				badge: 13,
				  				user: ':',
				  				is_admin: true,
				  				created_at: new Date(),
				  				dunce: user_dunce.name
			  				});
		  				});
		  			});
		  			return false;
		  		}

		  		if (user.party_until) {
		  			var d = new Date();
		  			if (new Date(user.party_until) < d) {
		  				User.findOne({ _id: user._id }).select('party_until').exec(function (err, user2) {
		  					user2.party_until = null;
		  					user2.save();
		  				});
		  			} else {
		  				t = ':party: ' + t;
		  			}
		  		}
				if (t.toLowerCase() == '/motivate' || (!user.is_admin && !user.is_mod && is_swear(t.toLowerCase())) ) {
					t = motivationals[Math.floor( Math.random() * motivationals.length )];
				}

				t = t.trim();
				var newchat = new Chat({
		  				is_admin: user.is_admin,
						text: t,
						badge: msg.badge,
						user: user.name,
						user_id: user._id,
						room: user.room,
						created_at: new Date()
				});
				newchat.save(function (err, m) {
					if (err) return console.log('socket msg error: ' + err);
					io.emit('chat message', newchat);
				});
				
  			});
		});
  });
});

	function is_swear(input) {
		var patt = /(fuck|shit|damn|dammit|nigga|pussy|blowjob|cunt|bitch|nigger|slut|asshole|tits|dick)/g;
		return patt.test(input);
	}

	return io;
};