ics
	.controller('upgrades', function ($scope, upgradesService, $rootScope) {
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
				$rootScope.$broadcast('flavours');
			}
			if (type == 'addon') {
				for (var i = 0; i < $scope.addons_locked.length; i++) {
					if ($scope.addons_locked[i]._id == object._id) $scope.addons_locked.splice(i, 1);
				}
				var unlocked = upgradesService.get_unlocked_addons();
				unlocked.push(object);
				upgradesService.set_unlocked_addons(unlocked);
				$rootScope.$broadcast('addons');
			}	
			if (type == 'cone') {
				if (user.prestige_bonus < object.prestige) {
					toast('Need prestige');
					return false;
				}
				user.cones.push( object._id );
				$scope.cones = [];
				for (var i = 0; i < cones.length; i++) {
					if (user.cones.indexOf( cones[i].name ) === -1) {
						$scope.cones.push( cones[i] );
					}
				}
				$rootScope.$broadcast('cones');
			}		
			upgradesService.unlock(type, object._id, amount).then(function(result) {
				if (result.error) return toast(result.error, 'Error');
				if (result.user) {
					user = result.user;
					user = result.user; //legacy
				}
				main(result.success, function () {
                        Icecream.update_quest_bar();
                        if (result.success == 'cone') { populate_cones(); }
                });
			});
			Icecream.update_purchase_bar();
		};

		this.load_addons = function () {
		    upgradesService.get_addons(user.upgrade_addon).then(function(addons) {
		    	var locked = [];
		    	var unlocked = [];
		    	toppings = addons; //I know..
		    	for (var i = 0; i < addons.length; i++) {
		    		var addon = addons[i];
		    		var name = addon.name.replace(/\s+/g, '');
		    		addon.image = image_prepend + '/addons/thumb/' + name + '.png.gz'; 
		    		if (user.toppings.indexOf(addon._id) === -1) {
		    			locked.push(addon);
		    		} else {
		    			unlocked.push(addon);
		    		}
		    	}
		        $scope.addons_locked = locked;
		        $scope.addons_unlocked = unlocked;

		        upgradesService.set_unlocked_addons(unlocked);
		        $rootScope.$broadcast('addons');
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
		        $rootScope.$broadcast('flavours');
		    });
		};

		this.load_addons();
		this.load_flavours();
	});