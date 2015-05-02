var new_art_addons = ['cherries', 'sprinkles', 'jelly beans', 'peanuts', 'gummy worms', 'peanut butter', 'onions', 'honey', 'berry jelly',
'gummy sodas', 'blackberries', 'raspberries', 'chopped strawberries', 'marshmallow cream', 'vanilla frosting', 'chocolate frosting', 'crumbled candy bars', 'sugar cookies',
'crumbled brownies', 'crumbled fudge', 'red velvet cake', 'cookie dough', 'm&m\'s', 'oreo',
'chocolate chips', 'white chocolate chips', 'dark chocolate chips', 'pecans', 'acorns', 'almonds', 'gumballs', 'mini marshmallows', 'candied lemon rinds',
'rice', 'chili peppers', 'gravy', 'coconut', 'peas', 'fudge ripple', 'chopped peaches', 'chopped pineapple',
'croutons', 'fries', 'olives', 'candied bacon', 'bacon', 'shrimp', 'blueberries', 'raisins', 'waffles', 'cheese',
 'eyeballs', 'bat wings', 'nuts and bolts', 'warts', 'oil', 'sausage', 'pepperoni', 'ram', 'egg',
 'gold nuggets', 'pearls', 'gun powder', 'flowers', 'coffee beans', 'caviar', 'ice cubes', 'snowflakes', 'mint',
 'telescope', 'calculator', 'constellation'];
var image_prepend = 'http://static.icecreamstand.ca';
var cones = [
	{ name: 'baby',	cost: '1000' },
	{ name: 'waffle',	cost: '100000' },
	{ name: 'chocolate',	cost: '50000000' },
	{ name: 'whitechocolate',	cost: '1000000000' },
	{ name: 'sugar',	cost: '5000000000' },
	{ name: 'sprinkle',	cost: '20000000000' },
	{ name: 'mintycat',	cost: '200000000000' },
	{ name: 'doublechocolate',	cost: '500000000000' },
];
var workers = [
	{ name: 'cart',	cost: '0' },
	{ name: 'employee',	cost: '0' },
	{ name: 'truck',	cost: '0' },
	{ name: 'robot',	cost: '0' },
	{ name: 'rocket',	cost: '0' },
	{ name: 'alien',	cost: '0' },
];
var flavors = [];
var cache_flavour_len = 0, cache_addon_len = 0;
var socket;

var ics = angular.module('ics', []);

	ics.controller('highscores', function ($scope) {
	})
	.controller('flavourController', function ($scope, upgradesService, flavourService, $interval) {
		$scope.flavours_unlocked = [];
		$scope.addons_unlocked = [];
		$scope.cones_unlocked = (user.cones)? user.cones : [];
		$scope.combos = [];
		for (var i = 0; i < $scope.cones_unlocked.length; i++) {
			if ($scope.cones_unlocked[i] == 'babycone') $scope.cones_unlocked[i] = 'baby';
    		if ($scope.cones_unlocked[i] == 'sugarcone') $scope.cones_unlocked[i] = 'sugar';
		}

		$scope.currentPage = 0;
		$scope.pageSize = 20;
		$scope.is_expanded = false;
		$scope.numberOfPages=function(){
        	return Math.ceil($scope.flavours_unlocked.length/$scope.pageSize);                
    	};
    	$scope.update_page = function(new_page) {
    		if (new_page > 6) new_page = 6;
    		if (new_page < 0) new_page = 0;
    		$scope.currentPage = new_page;
    	};
    	$scope.expand = function() {
    		$scope.is_expanded = !$scope.is_expanded;
    	};
    	$scope.pages_flavour = function() {
    		var arr_len = cache_flavour_len / $scope.pageSize;
    		return new Array( (arr_len > 1)? Math.ceil(arr_len) : 1 );
    	};
    	$scope.pages_addons = function() {
    		var arr_len = cache_addon_len / $scope.pageSize;
    		return new Array( (arr_len > 1)? Math.ceil(arr_len) : 1 );
    	};
    	$scope.pages_combos = function() {
    		var arr_len = $scope.combos.length / $scope.pageSize;
    		return new Array( (arr_len > 1)? Math.ceil(arr_len) : 1 );
    	};
    	$scope.load_combos = function () {
    		flavourService.get_combos().then(function (raw) {
    			$scope.combos = flavourService.format_combos(raw);
    		});
    	};
		$interval(function(){
			var temp_flavours = upgradesService.get_unlocked_flavours();
			if (cache_flavour_len != temp_flavours.length) {
        		$scope.flavours_unlocked = upgradesService.order_by_id(temp_flavours, user.flavors);
        		cache_flavour_len = $scope.flavours_unlocked.length;
        	}

        	var temp_addons = upgradesService.get_unlocked_addons();
        	if (cache_addon_len != temp_addons.length) {
        		$scope.addons_unlocked = upgradesService.order_by_id(temp_addons, user.toppings);
        		cache_addon_len = $scope.addons_unlocked.length;
        	}
        }, 2000);
	})
	.controller('quests', function ($scope) {
	})
	.controller('events', function ($scope) {
	})
	.controller('trends', function ($scope) {
	})
	.controller('chat', function ($scope, chatService, socketFactory) {
		$scope.room_current = user.room;
		$scope.rooms = ['default', 'bug reports', 'suggestions', 'Roleplay Closet'];
		$scope.message={};
		$scope.messages = [];
		if (user.is_admin || user.is_mod) {
			$scope.rooms.push('Mod Only');
			$scope.rooms.push('swamp');
		}
        if (user.badges && user.badges.indexOf(1) !== -1) $scope.rooms.push('donor lounge');
        if (user.shadow_ban) {
        	$scope.rooms = ['swamp'];
        }
		$scope.message_count = 15;
		$scope.is_expanded = false;
		$scope.message_send = function (new_message) {
			$scope.message={};
			if (new_message.text == '/afk') {
				Icecream.deep_sleep();
				return false;
			}
	        var msg = {
	        	_id: Math.random() + '_newmessage',
	            badge: (!user.badge_off && user.badges)? user.badges[0] : 0,
	            text: new_message.text,
	            user: user.name,
	            created_at: new Date().toISOString(),
	            room: user.room
	        };
	        if ($scope.messages.length > 75) $scope.messages.shift();
		    $scope.messages.push(msg);
	        socketFactory.emit('chat message', msg);
		};
		$scope.message_expand = function () {
			$scope.message_count = ($scope.message_count == 15)? 75 : 15;
			if ($scope.messages.length < $scope.message_count) {
				$scope.messages_load();
			}
			$scope.is_expanded = !$scope.is_expanded;
		};
		$scope.messages_load = function () {
			chatService.get_messages($scope.message_count).then(function(new_messages) {
		    	$scope.messages = new_messages.reverse();
		 	});
		};
		$scope.change_room = function (new_room) {
			console.log('room', new_room);
			user.room = new_room;
			$scope.room_current = new_room;
			cached_rooms[new_room] = 0;
		    socketFactory.emit('sleep', { sleep: false, room: new_room });
			$scope.messages_load();
		};

		socketFactory.on('chat message', function (msg) {    
		    if (msg.add_badge && msg.add_badge_id == user._id) {
	            user.badges.push(msg.add_badge);
	            main();
	        } 
	        if (msg.dunce && msg.dunce == user.name) {
	            main('dunce', function () {
	                Icecream.first_time_dunce();
	            });
	        }
	        if (msg.party && (msg.party == '?' || msg.party == user.name)) {
	            if (msg.party == '?') {
	                user.party_until = null;
	                return;
	            }
	            main('party', function () {
	                Icecream.first_time_party();
	            });
	        }
	        if (msg.sync && msg.sync == user._id) {
	            window.location.reload(true);
	        }
	        if (msg.room) {
	            if (msg.room && msg.room != user.room) {
	            	console.log('message for room: ' + msg.room + ' from ' + msg.user);
	                if (!cached_rooms[msg.room]) cached_rooms[msg.room] = 0;
	                cached_rooms[msg.room]++;
	                return false;
	            }
	            if (msg.user == user.name) {
	            	return false;
	            }
	        }

	        if (msg.text.toLowerCase().indexOf('@' + user.name) > -1) {
            	cache_unread_mention = true;
        	}

	        if (!window_focus) {
	        	cached_new_messages++;
	        }

	        if ($scope.messages.length > 75) $scope.messages.shift();
		    $scope.messages.push(msg);
		});

		socketFactory.on('join', function(msg){
	        var friend = Icecream.get_friend(msg._id);
	        if (friend) {
	            var cur_time = new Date();
	            var last_seen = new Date(friend.updated_at);
	            console.log('online -' + friend.name + ' (' + (cur_time - last_seen)  + ')');
	            if (friend.is_away && user.is_friend_notify && cur_time - last_seen > 60000) {
	                $scope.messages.push({ 
	                	_id: Math.random() + 'online',
	                	user: ':', badge: '1',
	                	text: '@' + friend.name + ' has come online',
	                	is_system: true,
	                	created_at: new Date().toISOString(),
	                });
	            }
	            friend.is_away = false;
	            friend_list_add(friend.name, 2);
	            $('.friends_counter span#count')[0].textContent = $('.friends_list_online > user, .friends_list_away > user').length + '/' + $('.friends_counter span#count').attr('x-length');
	        }
	    });
	    socketFactory.on('sleep', function(msg){
	        var friend = Icecream.get_friend(msg._id);
	        if (friend) {
	            var cur_time = new Date();
	            var last_seen = new Date(friend.updated_at);
	            if (user.is_friend_notify && friend.is_away && !msg.sleep  && cur_time - last_seen > 600000) {
	                $scope.messages.push({ 
	                	_id: Math.random() + 'afk',
	                	user: ':',
	                	badge: '1',
	                	text: '@' + friend.name + ' ' + messages_afk[Math.floor( Math.random() * messages_afk.length )],
	                	is_system: true,
	                	created_at: new Date().toISOString(),
	                });
	            }
	            friend.is_away = msg.sleep;
	            friend.updated_at = cur_time;
	            friend_list_add(friend.name, friend.is_away? 1 : 2);
	        }
	    });
		$scope.messages_load();
	})
	.controller('money', function ($scope, $interval) {
		$scope.gold = user.gold;
        $interval(function(){
        	$scope.gold = user.gold;
	        if (cache_unread_message) {
	            $('title')[0].textContent = 'Unread Message - Ice Cream Stand';
	        } else if (cache_unread_mention) {
	            $('title')[0].textContent = 'You were mentioned - Ice Cream Stand';
	        } else if (cached_new_messages > 0) {
	            $('title')[0].textContent = cached_new_messages + ' Messages - Ice Cream Stand';
	        } else if (gold != user.gold) {
	            $('title')[0].textContent = '$' + numberWithCommas( Math.floor($scope.gold) ) + ' Ice Cream Stand';
	        }
        }, 500);
	})
	.controller('upgrades', function ($scope, upgradesService) {
		$scope.addons_locked;
		$scope.flavours_locked;
		$scope.cones = [];
		for (var i = 0; i < cones.length; i++) {
			if (user.cones.indexOf( cones[i].name ) === -1) {
				$scope.cones.push( cones[i] );
			}
		}
		this.purchase = function (type, object, amount) {
			console.log('purchasing an upgrade...' + object._id + ' (' + type + ')');
			if (user.gold < object.cost) {
				toast('Need more money');
				return false;
			}
			user.gold -= object.cost;
			if (type == 'flavour') {
				for (var i = 0; i < $scope.flavours_locked.length; i++) {
					if ($scope.flavours_locked[i]._id == object._id) {
						console.log('removing flavour at ' + i);
						$scope.flavours_locked.splice(i, 1);
					}
				}
				var unlocked = upgradesService.get_unlocked_flavours();
				unlocked.push(object);
				upgradesService.set_unlocked_flavours(unlocked);
			}
			if (type == 'addon') {
				for (var i = 0; i < $scope.addons_locked.length; i++) {
					if ($scope.addons_locked[i]._id == object._id) $scope.addons_locked.splice(i, 1);
				}
				var unlocked = upgradesService.get_unlocked_addons();
				unlocked.push(object);
				upgradesService.set_unlocked_addons(unlocked);
			}			
			upgradesService.unlock(type, object._id, amount).then(function(result) {
				if (result.error) return toast(result.error, 'Error');
				if (result.user) {
					user = result.user;
					user = result.user; //legacy
				}
				main(result.success, function () {
                        Icecream.update_quest_bar();
                        if (result.success == 'cone') populate_cones();
                });
			});
		};
		this.load_addons = function () {
		    upgradesService.get_addons(user.upgrade_addon).then(function(addons) {
		    	var locked = [];
		    	var unlocked = [];
		    	for (var i = 0; i < addons.length; i++) {
		    		var addon = addons[i];
		    		var is_new = new_art_addons.indexOf(addon.name) > -1;
		    		var name = addon.name.replace(/\s+/g, '');
		    		addon.image = (is_new)? image_prepend + '/addons/thumb/' + name + '.png.gz' : image_prepend + '/toppings/' + name + '_thumb.png'; 
		    		if (user.toppings.indexOf(addon._id) === -1) {
		    			locked.push(addon);
		    		} else {
		    			unlocked.push(addon);
		    		}
		    	}
		        $scope.addons_locked = locked;
		        $scope.addons_unlocked = unlocked;

		        upgradesService.set_unlocked_addons(unlocked);
		    });
		};
		this.load_flavours = function () {
			console.log('upgrade controller loading flavours');
		    upgradesService.get_flavours().then(function(flavours) {
		    	console.log('retrieved flavour list');
		    	flavors = flavours;
		    	var locked = [];
		    	var unlocked = [];
		    	for (var i = 0; i < flavours.length; i++) {
		    		var flavour = flavours[i];
		    		var name = flavour.name.replace(/\s+/g, '');
		    		flavour.image =image_prepend + '/flavours/thumb/' + name + '.png.gz'; 
		    		if (user.flavors.indexOf(flavour._id) === -1) {
		    			locked.push(flavour);
		    		} else {
		    			unlocked.push(flavour);
		    		}
		    	}
		        $scope.flavours_locked = locked;
		        $scope.flavours_unlocked = unlocked;

		        upgradesService.set_unlocked_flavours(unlocked);
		    });
		};
		this.load_addons();
		this.load_flavours();
	});

	ics.factory('upgradesService', function($http) {
	    return {
	    	flavours_unlocked: [],
	    	addons_unlocked: [],
	        get_addons: function(level) {
	             //return the promise directly.
	             return $http.get('/addons.json?u=' + level)
	                       .then(function(result) {
	                            //resolve the promise as the data
	                            return result.data;
	                        });
	        },
	        get_flavours: function() {
	             //return the promise directly.
	             return $http.get('/flavors.json')
	                       .then(function(result) {
	                            //resolve the promise as the data
	                            return result.data;
	                        });
	        },
	        unlock: function(type, id, amount) {
	        	return $http.post('/unlock', { type: type, id: id, amount: amount})
	                .then(function(result) {
	                    return result.data;
	                });
	        },
	        set_unlocked_flavours: function(flavours) {
	        	this.flavours_unlocked = flavours;
	        },
	        get_unlocked_flavours: function() {
	        	return  this.flavours_unlocked;
	        },
	        set_unlocked_addons: function(addons) {
	        	this.addons_unlocked = addons;
	        },
	        get_unlocked_addons: function() {
	        	return  this.addons_unlocked;
	        },
	        order_by_id: function (raw, sorted) {
	        	if (!sorted) return console.log('no sorted');
	        	var len = raw.length;
	        	var new_array = [];
	        	for (var i = 0; i < len; i++) {
	        		for (var j = 0; j < len; j++) {
	        			if (raw[j]._id === sorted[i]) {
	        				new_array.push( raw[j] );
	        				break;
	        			}
	        		}
	        	}
	        	return new_array;
	        }
	   }
	})
	.factory('chatService', function($http) {
	   return {
	        get_messages: function(message_count) {
	             //return the promise directly.
	             return $http.get('/chat.json?c=' + message_count)
	                       .then(function(result) {
	                            //resolve the promise as the data
	                            return result.data;
	                        });
	        }
	   }
	})
	.factory('flavourService', function($http) {
	   return {
	        get_combos: function() {
	            //return the promise directly.
	            return $http.get('/combos.json')
	                .then(function(result) {
	                    //resolve the promise as the data
	                    return result.data;
	            });
	        },
	        format_combos: function(combos) {
	        	var new_combos = combos;
	        	for (var i = 0; i < new_combos.length; i++) {
	        		var flavor = Icecream.get_flavor(new_combos[i].flavor_id);
                    var addon = Icecream.get_addon(new_combos[i].topping_id);
                    new_combos[i].flavour_name = flavor.name;
                    new_combos[i].addon_name = addon.name;
                    if (new_combos[i].franken_id) {
                    	new_combos[i].franken_name = Icecream.get_flavor(new_combos[i].franken_id);
                    }
	        	}
	        	return new_combos;
	        }
	   }
	})
	.factory('socketFactory', function ($rootScope) {
	  return {
	    on: function (eventName, callback) {
	      socket.on(eventName, function () {  
	        var args = arguments;
	        $rootScope.$apply(function () {
	          callback.apply(socket, args);
	        });
	      });
	    },
	    emit: function (eventName, data, callback) {
	      socket.emit(eventName, data, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          if (callback) {
	            callback.apply(socket, args);
	          }
	        });
	      })
	    }
	  };
	});

	ics.filter('img_sanitize', function () { // My custom filter
	    return function (input) {
	        return input.replace(/\W+/g, '');
	    }
	})
	.filter('startFrom', function() {
	    return function(input, start) {
	        start = +start; //parse to int
	        return input.slice(start);
	    }
	})
	.filter('chat_sanitize', function($sce) {
	    return function(input) {
	        return $sce.trustAsHtml( input.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
            	return '&#'+i.charCodeAt(0)+';';
            })
            .replace( /(https?:\/\/[^\s]*)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/(^| )@([^\W]*)/g, ' <div class="user_card" x-user="$2">@$2</div>')
            .replace(/:party:/g, ' <img src="' + image_prepend + '/party.png" class="party_icon" />')
            .replace(/:easter:/g, ' <img src="' + image_prepend + '/easter/chocbunny.png" class="party_icon" />') );

      //       $(input).find('a').each(function () {
		    //     var href = $(this).attr('href');
		    //     var href_end = href.substring(href.length - 4);
		    //     if (href_end == '.png' || href_end == '.jpg' || href_end == '.jpeg' || href_end == '.gif') {
		    //         $(this).after('<div class="img_inline" x-href="' + $(this).attr('href') + '">view</div>');
		    //     }
		    // });
	    }
	});

