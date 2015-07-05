ics
	.controller('flavourController', function ($scope, upgradesService, flavourService, $interval, expertiseService) {
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
    		console.log('flavourController', 'loading combos');
    		flavourService.get_combos().then(function (raw) {
    			$scope.combos = flavourService.format_combos(raw);
    			console.log('flavourController', combos);
    		});
    	};

    	$scope.display_experience = function (index) {
    		return expertiseService.get_level( user.flavors_sold[index] );
    	};

        $scope.$on('flavours', function(event, args) {
        	var temp_flavours = upgradesService.get_unlocked_flavours();
			if (cache_flavour_len != temp_flavours.length) {
        		$scope.flavours_unlocked = upgradesService.order_by_id(temp_flavours, user.flavors);
        		cache_flavour_len = $scope.flavours_unlocked.length;
        	}
        });

        $scope.$on('addons', function(event, args) {
        	var temp_addons = upgradesService.get_unlocked_addons();
        	if (cache_addon_len != temp_addons.length) {
        		$scope.addons_unlocked = upgradesService.order_by_id(temp_addons, user.toppings);
        		cache_addon_len = $scope.addons_unlocked.length;
        	}
        });

        $scope.$on('cones', function(event, args) {
        	if (user.cones) $scope.cones_unlocked = user.cones;
        });
	});