module.exports = (function() {
    var router = require('express').Router();
	var mongoose = require('mongoose');
	var crypto = require('crypto');

	User = mongoose.model('User');
	Cow = mongoose.model('Cow');
	Flavor = mongoose.model('Flavor');
	Topping = mongoose.model('Topping');

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
	router.get('/suggestion', function(req, res){
		User.findOne({ _id: req.session.user_id }).select('friends').exec(function (err, me) {
			if (!me) return res.json({ err: 'not signed in' });
			var now = new Date();
			var dayago = new Date(now.getTime() - 48*60*60*1000);
			if (!me.friends) me.friends = [];
			User.find({ 
				email_verified: true,
				_id: {'$ne': me._id },
				_id: { '$nin': me.friends },
				updated_at: { '$gt': dayago }
			}).lean(true).sort('-updated_at').select('name friends').limit(25).exec(function (err, users) {
				if (!users) return res.send(500);
				for (var i = 0; i < users.length; i++) {
					if (users[0].friends.length < 5) {
						return res.json({ user: users[i].name });
					}
				}

				return res.json({ user: users[0].name });
			});
		});
	});
	router.get('/full/:name', checkAdmin, function(req, res){
		User.findOne({ name: req.params.name }).lean(true).exec(function (err, user) {
				res.send(user);
		});
	});
	router.get('/operation/save/xenko', checkAdmin, function (req, res) {
		User.findOne({ _id: '525a162c29cb6f0000000020' }, function (err, user) {
			//var backup = { "achievements" : [ "5280ef12b61b420000000008", "5280ef02b61b420000000006", "5280ef1cb61b420000000009", "5280eeeab61b420000000005", "5280eee1b61b420000000004", "5280ee78b61b420000000003", "5280ee5fb61b420000000001", "52857dd1def8030000000001", "5287a7dd1834ee0000000002", "5287a8051834ee0000000003", "52b535fd174e8f0000000001", "52b53613174e8f0000000002", "52b5361e174e8f0000000003", "537bebae2b2b13b56a283b44", "53eac41538574559408a53e1", "545dad616c43abdf66d01472", "545dad806c43abdf66d01473", "546b81c020a4efc62a12e68d", "547c13af8ea9309921367dca", "5494854f378bcd8043101d59" ], "aliens" : 1000, "animations_off" : true, "badge_quests" : true, "badges" : [ 1006, 2, 15, 12, 10, 8, 7, 3, 6, 5, 4, 1 ], "carts" : 1000, "chat_off" : false, "combos" : [ "524d9b744ef328b8bd000011", "5280ccfe77116c0000000002", "524b6d85d0dd240000000003", "53070f659410340000000001", "52ee16d4fa9549000000003d", "524b6d00d0dd240000000001", "53d85b92937941a87324594d", "524b6da3d0dd240000000004", "5307cb6c1b5d8e00000000f6", "529563bc93c8290000000001", "53196a4833359404259b502f", "5307b6371b5d8e0000000053", "52ee1354fa95490000000025", "535b32487649e9ea16f831c9", "53092550a746880000000019", "5361a9eb654266df6f9379a8", "52ee1a70fa95490000000066", "52ee1268fa9549000000001d", "52ef09f438ebe60000000027", "5361a9d2654266df6f9379a7", "534095c023aa3f7243ad6df2", "52ee19cbfa9549000000005c", "52ee137efa95490000000027", "524b7142d0dd240000000012", "54b4827c850b432f05e45b64", "52ee12f0fa95490000000023", "5307cb1a1b5d8e00000000f2", "52ed7b178778820000000027", "52ec54dda873d3000000000b", "530d05fa708987d86631754e", "5493a2f5ea096d3e41ebb6ff" ], "cones" : [ "babycone", "chocolate", "sprinkle", "sugarcone", "waffle", "whitechocolate" ], "created_at" : Date( 1393528249192 ), "display_settings" : [ 1, 0, 1, 1 ], "easter" : [ 5, 2, 6, 3, 1, 7, 4, 8, 9, 10 ], "email" : "xenko22@gmail.com", "email_verified" : true, "employees" : 1000, "flavors" : [ "525baa7865c3460000000006", "525baa5e65c3460000000005", "524f6873cb2c150000000005", "525baa4265c3460000000004", "525ba93e65c3460000000002", "525ba8f565c3460000000001", "525baa0c65c3460000000003", "524f6854cb2c150000000004", "524f6830cb2c150000000003", "524d10d11320310000000012", "523a1948750f2c0000000002", "5238fe64c719600000000001", "524dd72e8c8b720000000005", "524dd6fc8c8b720000000004", "524dd6e68c8b720000000003", "524dd6ce8c8b720000000002", "52390802dc30780000000002", "5238fd1f523fdc0000000003", "524d10ac1320310000000011", "524d10e21320310000000013", "5238fd44523fdc0000000004", "524d108a1320310000000010", "5239088301b9e30000000001", "5238fb7d3bd8030000000001", "523d5ea90a0d080000000002", "524d106b132031000000000f", "524d105e132031000000000e", "524d0fa3132031000000000b", "524d0ff0132031000000000d", "524d0fc1132031000000000c", "524d0ef81320310000000009", "524d0f65132031000000000a", "5238fc23f1b1e70000000003", "524d0edc1320310000000008", "5239031bb057290000000001", "523906ca4ececd0000000003", "5239079888ef8e0000000001", "524d0e4b1320310000000007", "524d0e2d1320310000000006", "5239049b2b72920000000001", "524d0e141320310000000005", "523904c12b72920000000002", "52390969e8188a0000000001", "523907c0dc30780000000001", "524d0d1e1320310000000004", "5239089a01b9e30000000002", "523903de9e47060000000002", "523d5fa0135fb30000000003", "523d5e603095960000000001", "524dd6ad8c8b720000000001", "5239046d4bf8640000000001", "523d5d75171d3e0000000003", "524d0cac1320310000000003", "523909d4dbe8e90000000001", "52390a5b16e3b60000000001", "523906874ececd0000000001", "52390027a4cc590000000002", "524d0c801320310000000002", "5238fff2a4cc590000000001", "523d5f88135fb30000000002", "5238fdbe9902500000000001", "523d6051135fb30000000004", "523d5ee30a0d080000000003", "52390593971a180000000001", "52390616971a180000000002", "5239013da4cc590000000004", "5238fbfaf1b1e70000000001", "524d0c641320310000000001", "52390634971a180000000003", "523d5e820a0d080000000001", "52390186a4cc590000000006", "523906f94ececd0000000004", "5238ff1bc719600000000002", "523900b7a4cc590000000003", "5238fce3523fdc0000000002", "5238fb905271c60000000001", "5239037a9e47060000000001", "523901fba4cc590000000007", "5238fe5f9902500000000002", "5238fd9c4484d90000000002", "5238fd874484d90000000001", "523909b336e1ba0000000001", "5238ff7b4da22f0000000001", "523909f3e9b58f0000000001", "5238d9d376c2d60000000002", "5238d7ac00770e0000000001", "5238d9bc76c2d60000000001" ], "flavors_sold" : [ 10089854, "7844844", "10674311", "11652254", "6976036", "27936", "22818", "18424", "20188", "2857", "54463", "29300", "21792", "2280", "20139", "14151", "29826", "27460", "38428", "0", "0", "0", "0", "0", "10306250", "304608", "0", "0", "0", "0", "5244", "0", "0", "655", "0", "0", "0", "0", "0", "0", "0", "0", "0", "420", "0", "0", "0", "0", "0", "36", "0", "0", "0", "181", "0", "0", "0", "315", "0", "0", "0", "0", "0", "0", "0", "0", "140", "0", "0", "0", "12", "0", "0", "292", "0", "0", "0", "516", "244", "90", "0", "0", "83", "1", "310", "6948560", "1128875" ], "friend_gold" : 39262869.51828227, "friend_last" : 1422921670084, "friend_total_gold" : 4298201352.977442, "friends" : [ "5287defbfde1780000000015", "525dc866d752f70000000005", "52ea8f42f87ff500000000eb", "5246103a8f980e0000000001", "52f12d16bf54d8000000018d", "524741a585899b0000000001", "52f6b2f7fed0ff0000000020", "5281b936637bdf0000000003", "53278fcd170bf2b8484c752f", "532870fe259a33f655edcf3e", "5324daf7f83509d20ef988c3", "530422ce88bad70000000035", "5320f3ca85cc61727f38486e", "53547fccb26376b942bf03bc", "53309b31001409cb04ee15dc", "53c6c33450c80ad2348b720a", "53bc4a3575e0ea4938df034f", "53b0f9c2f5fab06a032825d4", "5327a366dc725ed84ab1f69a", "5387497f2565522f50f73762", "5344c02e1ec90094095f9125", "52eaaf0717ac98000000000c", "541f237b37421bca209217a1", "531ed748d5720f3160f26371", "545786bbc4706ea0625c97cd", "543d5b077a4c5bd020298ff1", "5424cf08846531a353c9a9ec", "536b8c9d769cf0202d501e4e", "53edf4f0768ce0d54553a489", "5429ea30846531a353c9c450", "54718ab4bf20c3c947d2ea6d", "54369e6127ff34a94894cb9f", "533b04686e9a6221695eadfa", "54b573627c40adaa3b0ac395", "548660c6777fa3220852193c" ], "gold" : 2840108830141.62, "gross_sold" : 0, "highest_accumulation" : 61479736.91, "icecream_sold" : 10920478216, "is_guest" : false, "is_mod" : true, "last_addon" : "523d5800fbdef6f047000013", "last_click_at" : Date( 1391818864686 ), "last_employee_at" : Date( 1391818866592 ), "last_flavor" : "525baa7865c3460000000006", "last_vote_at" : Date( 1422984698278 ), "message_count" : 1, "mute_at" : Date( 1395380252075 ), "name" : "xenko", "password" : "$2a$10$XAB3o35MUmYBlLaSvUC7HuZS6A5kNMvBXR6bxNnQFr7d7CEZcwp4u", "prestige_array" : [ 49.99657383028553, 49.99999882974473, 49.99669179551029, 49.99938321311409, 49.9990481041129, 49.99900816769237, 49.99999506440984, 49.99999502879234 ], "prestige_bonus" : 399.99069, "prestige_level" : 8, "quests" : [ "52577a6288983d0000000001&0&3", "52672bedde0b830000000001&0&18", "52672dea3a8c980000000001&0&7", "526744f40fc3180000000001&0&9", "526745240fc3180000000002&0&13", "!d3,4,1,12,524dd6e68c8b720000000003,10125&0&0", "!d1,9,4,8, ,121.5&0&5358", "!d3,1,20,4,524f6830cb2c150000000003,14175&0&0", "!d1,12,19,9, ,162&0&5377", "!d0,5,20,7,524f6854cb2c150000000004,18225&0&0", "!d2,9,2,13,525ba8f565c3460000000001,20015&0&0", "!d1,3,16,3, ,222.75&0&5563", "!d0,7,2,2,5238fe64c719600000000001,24300&0&0", "!d2,11,11,3,524dd72e8c8b720000000005,20015&0&0", "!d3,8,9,9,52390802dc30780000000002,28350&0&0", "!d2,6,2,13,5238fd1f523fdc0000000003,20015&0&0", "!d1,3,15,4, ,324&0&5912", "!d0,13,13,9,524d10ac1320310000000011,34425&0&0", "!d1,6,6,7, ,364.5&0&5972", "!d1,9,11,9, ,384.75&0&5972" ], "referals" : 16, "release_channel" : 2, "robots" : 1000, "rockets" : 1000, "shadow_ban" : null, "time_click_tick" : 1393002650393, "time_worker_tick" : 1393002653672, "today_date" : 3, "today_gold" : 99526048029.73715, "toppings" : [ "523d5800fbdef6f047000013", "52ec46740b26820000000001", "52ec46a80b26820000000003", "525bab2165c3460000000009", "523d6240d130d00000000002", "52ec468c0b26820000000002", "523d58c0fbdef6f047000019", "523d6324d130d00000000009", "528bedb46c8cd4000000004d", "528bed9d6c8cd4000000004c", "528bed846c8cd4000000004b", "525bab0b65c3460000000008", "525baaf765c3460000000007", "524f846cbae26a0000000001", "524f80e03269bc0000000008", "524f80ca3269bc0000000007", "524f80913269bc0000000006", "524f80793269bc0000000005", "524f805b3269bc0000000004", "523d5c66fbdef6f047000026", "524f80223269bc0000000003", "524f7fa03269bc0000000002", "523d5abafbdef6f047000020", "523d5c51fbdef6f047000025", "524e30b35d1de1000000000f", "524e30bc5d1de10000000010", "524e30c45d1de10000000011", "524e30dc5d1de10000000012", "524e30905d1de1000000000c", "524e30985d1de1000000000d", "524e30a25d1de1000000000e", "523d5d97171d3e0000000004", "523d5dbf171d3e0000000005", "524e305a5d1de1000000000b", "523d5cbefbdef6f047000027", "524e30215d1de10000000009", "524e30375d1de1000000000a", "523d5bb9fbdef6f047000023", "524e2fef5d1de10000000008", "524e2fad5d1de10000000005", "524e2fb85d1de10000000006", "524e2fbe5d1de10000000007", "523d5727fbdef6f04700000c", "523d574dfbdef6f04700000d", "523d5a4afbdef6f04700001f", "523d5787fbdef6f04700000f", "524e2f7c5d1de10000000003", "524e2f845d1de10000000004", "523d5ccd171d3e0000000001", "523d62f6d130d00000000008", "524e2f375d1de10000000002", "523d5a1efbdef6f04700001e", "523d5bf2fbdef6f047000024", "524e2ee55d1de10000000001", "523d57c7fbdef6f047000011", "523d57ddfbdef6f047000012", "523d5842fbdef6f047000015", "523d62c3d130d00000000007", "523d6270d130d00000000003", "523d539efbdef6f047000001", "523d54ecfbdef6f047000003", "523d5ba8fbdef6f047000022", "523d5861fbdef6f047000016", "523d5878fbdef6f047000017", "523d59f2fbdef6f04700001d", "523d55e1fbdef6f047000006", "523d5613fbdef6f047000007", "523d59a9fbdef6f04700001c", "523d566afbdef6f047000008", "523d567bfbdef6f047000009", "523d56cefbdef6f04700000a", "523d5568fbdef6f047000005", "523d56d7fbdef6f04700000b", "523d60775e47350000000001", "523d58f4fbdef6f04700001a", "523d5f53135fb30000000001", "523d6229d130d00000000001", "523d62a4d130d00000000005", "523d6347d130d0000000000a", "523d62afd130d00000000006", "523d5772fbdef6f04700000e", "523d57a4fbdef6f047000010", "523d581dfbdef6f047000014", "524e2dc729deb20000000001", "524e2de129deb20000000002", "523d42d376a5e10000000001", "523d5518fbdef6f047000004" ], "total_gold" : 15744706197235.1, "trend_bonus" : 7.75, "trucks" : 1000, "tutorial" : 6, "updated_at" : Date( 1423015660092 ), "upgrade_addon" : 28, "upgrade_autopilot" : 250, "upgrade_coldhands" : 110, "upgrade_flavor" : 28, "upgrade_heroic" : 3, "upgrade_legendary" : 2, "upgrade_machinery" : 10, "upgrade_storesize" : 0, "week_date" : 2, "week_gold" : 688109378824.0778, "workers_sold" : 0, "cow_name" : "I'm The Cow!", "cow_clicks" : 23296, "cow_level" : 95.884096147514, "ignore" : "", "items" : [], "upgrade_frankenflavour" : 3, "last_frankenflavour" : null, "last_frankenflavour_at" : Date( 1422982240538 ), "is_night" : false, "last_prestige_at" : Date( 1418571169351 ), "is_second_row" : true, "ip" : "68.147.234.209", "is_friend_notify" : false, "is_away" : true, "badge_off" : false, "is_animation_clouds" : false, "is_animation_cones" : false, "is_animation_workers" : false, "is_animation_money" : false, "accumulation_time" : 134.162, "epic_id" : null, "epic_collected" : 32, "is_winter" : false, "total_prestige_gold" : 3277637004862.816, "dunce_message" : "YEAH! ", "dunce_until" : null, "party_until" : null, "is_tooltip" : true, "last_icecube_at" : Date( 1422924546964 ), "socket_id" : "L5t3VzJTbPlWbkhIAA9c", "room" : "default", "epic_last_attack" : Date( 1423013517534 ), "chapters_unlocked" : [ "54c9aa48b87c7c96540f6733", "54c9aa8ab87c7c96540f673a", "54c9aadfb87c7c96540f673e", "54c9ab8cb87c7c96540f6748", "54c9abb9b87c7c96540f674a", "54c9ada2b87c7c96540f675c", "54c9addfb87c7c96540f6763" ] };
			//for (var i in backup) {
			//	user[i] = backup[i];
			//}
			user.total_gold = user.total_gold - 1220000000000;
			user.gold = user.gold - 1220000000000;
			user.created_at = new Date('Oct 24, 2013');
			user.save();
		});
	});
	router.get('/id/:id', checkAdmin, function(req, res){
		User.findOne({ _id: req.params.id }).lean(true).exec(function (err, user) {
				res.send(user);
		});
	});
	router.get('/email/:email', checkAdmin, function(req, res){
		User.find({ email: req.params.email }).lean(true).exec(function (err, user) {
				res.send(user);
		});
	});
	router.get('/mods', checkAdmin, function(req, res){
		User.find({ is_mod: true }).lean(true).exec(function (err, user) {
				res.send(user);
		});
	});
	router.get('/:name/cow', function(req, res){
		User.findOne({ name: req.params.name }).lean(true).exec(function (err, user) {
			Cow.findOne({ user_id: user._id, is_active: true }).lean(true).exec(function (err, cow) {
				res.send(cow);
			});
		});
	});
	router.get('/:name/cows', function(req, res){
		User.findOne({ name: req.params.name }).lean(true).exec(function (err, user) {
			Cow.find({ user_id: user._id }).lean(true).exec(function (err, cows) {
				res.send(cows);
			});
		});
	});
	router.get('/:name/cow/:item', checkAdmin, function(req, res){
		User.findOne({ name: req.params.name }).lean(true).exec(function (err, user) {
			Cow.findOne({ user_id: user._id }).exec(function (err, cow) {
				cow.items.unshift(req.params.item);
				cow.markModified('items');
				cow.save();
				res.send(cow);
			});
		});
	});

	router.get('/:name', function(req, res){
		//if (!req.session.user_id) return res.send('please sign in');
		var name = req.params.name;
		User.findOne({name : name }).select("-ip").lean(true).exec(function (err, user) {
			if (err || !user) return res.json({error: 'can\'t find user'});
			Flavor.findOne({_id:user.last_flavor}).select('name').lean(true).exec(function (err, f) {
				Topping.findOne({_id:user.last_addon }).select('name').lean(true).exec(function (err, a) {
					if (!a) a = { name: 'mystery'};
					if (!f) f = { name: 'mystery'};
					Cow.find({ user_id: user._id }).sort('-created_at').limit(3).lean(true).exec(function (err, cows) {
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
						if (user.combos && user.combos.length > 90) t = 'Combo Chief';
						if (user.flavors_sold) {
							for (var i = 0; i < user.flavors_sold.length; i++) {
								if (user.flavors_sold[i] >= 5000000) {
									t = 'Stone Cold'; break;
								}
							}
						}
						if (user.prestige_bonus > 398) t = t_array[2];
						if (user.titles && user.titles.length > 0) t = user.titles[0];
						if (user.is_mod) t = 'Moderator';
						if (user.is_admin) t = 'Admin';
						if (user._id == '536b8c9d769cf0202d501e4e') t = 'Lore Master';
						if (user._id == '543d5b077a4c5bd020298ff1') t = 'Designer';
						if (user.title) t = user.title;

						var gravatar_hash;
						if (user.email) {
							gravatar_hash = crypto.createHash('md5').update(user.email).digest('hex');
						}
						if (user.dunce_until && new Date(user.dunce_until) > new Date()) {
							if (!user.badges) user.badges = [];
							user.badges.unshift(13);
						}
						if (user.party_until && new Date(user.party_until) > new Date()) {
							if (!user.badges) user.badges = [];
							user.badges.unshift(14);
						}
						if (!user.quests) user.quests = [];
						if (!user.achievements) user.achievements = [];
						res.json({
							_id: user._id,
							name: user.name,
							created_at: user.created_at,
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
							release_channel: user.release_channel,
							accumulation_time: user.accumulation_time,
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
							cows: cows,
							cow: cows[0],
							friend: (user.friends && user.friends.indexOf(req.session.user_id) > -1),
							gravatar: gravatar_hash,
							is_night: user.is_night,
							is_away: user.is_away
						}); 
					});
				});
			});
		});
	});
	router.post('/find/ip', function(req, res){
		var name =  req.body.name.toLowerCase();
		if (!name) return res.send('name missing');
		User.findOne({ _id: req.session.user_id }, function (err, u) {
			if (!u.is_mod && !u.is_admin) return res.send('Woah woah woah, you are not a moderator.');
			User.findOne({ name: name }).select('name ip').lean(true).exec(function (err, initial) {
				if (!initial) return res.send('Could not find user');
				if (!initial.ip) return res.send('Missing IP');
				User.find({ ip: initial.ip }).select('name ip shadow_ban mute_reason updated_at').sort('-updated_at').lean(true).exec(function (err, users) {
					res.send(users);
				});
			});
		});
	});
	router.post('/update', function(req, res){
		var post = req.body;
		User.findOne({ _id: req.session.user_id }, function (err, user) {
			if (err || !user) return res.send(err);
			var username = post.username.replace(/[^a-zA-Z0-9_]/gi, '', '').toLowerCase();
			if (username.length > 14) return res.send('name too long');
			if (username.length < 2) return res.send('name too short');
			user.name = username;
			if (post.password) user.password = post.password;
			if (post.email && user.email != post.email) {
				user.email = post.email.toLowerCase();
				user.email_verified = false;
				// var mailOptions = verify_mailoptions(user);
				// smtpTransport.sendMail(mailOptions, function(error, response){
				// 		if (error) console.log(error);
				// 		console.log(response);
				// }); 
			}
			if (post.worker_increment && !isNaN(post.worker_increment)) {
				if (post.worker_increment > 100) post.worker_increment = 100;
				user.worker_increment = post.worker_increment;
			}
			if (post.release_channel) {
				if (post.release_channel == 2 && (!user.badges || user.badges.indexOf(1) == -1)) post.release_channel = 1; //need donor status
				user.release_channel = post.release_channel;
			}
			user.ignore = post.ignore.trim().toLowerCase();
			user.is_guest = false;
			user.save(function (err, u) {
				if (err) return res.send('can\'t update - maybe the username is taken?');
				res.redirect('/');
			});
		});
	});

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
	return router;
})();