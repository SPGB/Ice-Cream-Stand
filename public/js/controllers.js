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

var ics = angular.module('ics', []);
ics.value('gold', user.gold);

	ics.controller('highscores', function ($scope) {
	})
	.controller('flavour', function ($scope) {
	})
	.controller('quests', function ($scope) {
	})
	.controller('events', function ($scope) {
	})
	.controller('trends', function ($scope) {
	})
	.controller('chat', function ($scope) {
		//$scope.messages = [{ user: 'System', text: 'Loading chat...', badge: 1}];
		//  chatService.get_messages().then(function(new_messages) {
		//  	console.log('got ' + new_messages.length + ' new messages');
		//     $scope.messages = new_messages;
		// });
	})
	.controller('money', ['$scope', 'gold', '$interval', 
    	function($scope, gold, $interval) {
        	$scope.gold = gold;
        	$interval(function(){
        		$scope.gold = user.gold;
        	}, 1000);
    	}
    ])
	.controller('upgrades', function ($scope, upgradesService) {
		$scope.addons_locked;
		$scope.flavours_locked;
		$scope.cones = cones;
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
	    });
	    upgradesService.get_flavours().then(function(flavours) {
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
	    });
	});

	ics.factory('upgradesService', function($http) {
	   return {
	        get_addons: function(level) {
	             //return the promise directly.
	             return $http.get('/addons.json?u=' + level)
	                       .then(function(result) {
	                            //resolve the promise as the data
	                            return result.data;
	                        });
	        },
	        get_flavours: function(level) {
	             //return the promise directly.
	             return $http.get('/flavors.json?')
	                       .then(function(result) {
	                            //resolve the promise as the data
	                            return result.data;
	                        });
	        }
	   }
	});
	// .factory('chatService', function($http) {
	//    return {
	//         get_messages: function(level) {
	//              //return the promise directly.
	//              return $http.get('/chat.json')
	//                        .then(function(result) {
	//                             //resolve the promise as the data
	//                             return result.data;
	//                         });
	//         }
	//    }
	// });