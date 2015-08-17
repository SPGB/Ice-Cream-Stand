angular.module('ics')
.directive 'shop', () ->
	{
		restrict: 'E'
		replace: true
		templateUrl: 'https://s3.amazonaws.com/icecreamstand.com/shop/shopTemplate.html.gz'
		controller: ($scope, $http, upgradesService, flavourService, addonService, $rootScope) ->
			$scope.isVisible = false
			$scope.activeTab = 'flavour'
			$scope.pageSize = 9
			$scope.currentPage = 0
			$scope.shopTabs = ['flavour', 'add-on', 'cone', 'worker', 'upgrade', 'items', 'skins', 'badges']
			$scope.workerTiers = ['cart', 'employee', 'truck', 'robot', 'rocket', 'alien', 'cow-centaur']
			$scope.upgrades = ['machinery', 'autopilot', 'cold hands', 'prestige']
			$scope.items = [
				{
					title: 'gamble'
					cost: 250000
				}
			]
			$scope.skins = []
			$scope.badges = []
			$scope.cones = []
			$scope.flavours_locked = []
			$scope.addons_locked = []
			$('body').on 'click', '.shop', ->
				$scope.toggleShop !$scope.isVisible

			$scope.toggleShop = (state) ->
				$scope.isVisible = state
				if state then $scope.load()

			$scope.setTab = (tab) ->
				$scope.activeTab = tab
				$scope.currentPage = 0

			$scope.load = ->
				$scope.flavours_locked = flavourService.get_locked_flavours()
				addonService.load_addons()
				.then () ->
					$scope.addons_locked = addonService.get_locked_addons()
				$http.get 'https://s3.amazonaws.com/icecreamstand.com/shop.json.gz'
				.then (res) ->
					$scope.skins = []
					$scope.badges = []
					$scope.cones = []
					$scope.items = [
						{
							title: 'gamble'
							cost: 250000
						}
					]
					items = res.data
					for i, item of items
						item.title = i.toLowerCase()
						if item.type is 'skin'
							$scope.skins.push item
						else if item.type is 'badge'
							$scope.badges.push item
						else if item.cost and item.cost > 0
							$scope.items.push item

					for cone in cones
						if user.cones.indexOf cone.name is -1
							$scope.cones.push cone

			$scope.shop_paginate = (add) ->
				$scope.currentPage += add
				if $scope.currentPage < 0 then $scope.currentPage = 0

			$scope.get_cost = (type) ->
				get_cost user[type + "s"] || 0, type

			$scope.purchase = (type, object, amount) ->
				console.log('purchasing an upgrade...' + object._id + ' (' + type + ')');
				if user.gold < object.cost
					toast('Need more money')
					return false

				user.gold -= object.cost
				if type is 'flavour'
					for i, f_locked of $scope.flavours_locked.length
						if f_locked._id is object._id
							console.log('removing flavour at ' + i);
							$scope.flavours_locked.splice(i, 1);

					unlocked = upgradesService.get_unlocked_flavours()
					unlocked.push(object)
					upgradesService.set_unlocked_flavours(unlocked)
					$rootScope.$broadcast('flavours')

				if type is 'addon'
					for i, a_locked of $scope.addons_locked.length
						if a_locked._id is object._id
							$scope.addons_locked.splice i, 1

					unlocked = upgradesService.get_unlocked_addons()
					unlocked.push object
					upgradesService.set_unlocked_addons(unlocked);
					$rootScope.$broadcast('addons');

				if type is 'cone'
					if user.prestige_bonus < object.prestige
						toast('Need prestige')
						return false

					user.cones.push object._id || object.name
					$scope.cones = [];
					for cone in cones
						if user.cones.indexOf( cone ) is -1
							$scope.cones.push cone

					$rootScope.$broadcast('cones')

				upgradesService.unlock(type, object._id || object.name, amount).then (result) ->
					if result.error
						return toast(result.error, 'Error');
					if result.user
						user = result.user
						user = result.user
					main result.success, ->
					Icecream.update_quest_bar();
					if result.success is 'cone' then populate_cones();

	}