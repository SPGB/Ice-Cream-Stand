angular.module('ics')
.directive 'shop', () ->
  {
    restrict: 'E'
    replace: true
    templateUrl: 'https://s3.amazonaws.com/icecreamstand.com/shop/shopTemplate.html.gz'
    controller: ($scope, $http, upgradesService, flavourService, addonService, $rootScope) ->
      interval = 1
      $scope.isVisible = false
      $scope.activeTab = 'flavour'
      $scope.pageSize = 8
      $scope.currentPage = 0
      $scope.isPaged = false
      $scope.shopTabs = [
        {
          title: 'flavour'
        }
        {
          title: 'add-on'
        }
        {
          title: 'cone'
        }
        {
          title: 'worker'
        }
        {
          title: 'upgrade'
        }
        {
          title: 'items'
          paged: true
        }
        {
          title: 'skins'
          paged: true
        }
        {
          title: 'badges'
          paged: true
        }
      ]
      $scope.workerTiers = [
        {
          title: 'cart'
        }
        {
          title: 'employee'
          requirement: {
            cart: 10
          }
        }
        {
          title: 'truck'
          requirement: {
            employee: 10
          }
        }
        {
          title: 'robot'
          requirement: {
            truck: 25
          }
        }
        {
          title: 'rocket'
          requirement: {
            robot: 75
          }
        }
        {
          title: 'alien'
          requirement: {
            rocket: 200
          }
        }
        {
          title: 'cow-centaur'
          requirement: {
            alien: 500
          }
        }
      ]
      $scope.upgrades = [
        {
          title: 'machinery'
          image: 'http://static.icecreamstand.ca/machine_thumb.png'
          isMultiUnlocks: true
        }
        {
          title: 'autopilot'
          image: 'http://static.icecreamstand.ca/autopilot.png'
          isMultiUnlocks: true
        }
        {
          title: 'coldhands'
          image: 'http://static.icecreamstand.ca/coldhands.png'
          isMultiUnlocks: true
        }
        {
          title: 'prestige'
          image: 'http://static.icecreamstand.ca/prestige_thumb.png'
        }
      ]
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
        if user.tutorial is 0
          $scope.activeTab = 'worker'
          user.tutorial++
          Icecream.get_tutorial()
          $.ajax {
              url: 'tutorial'
              data: 'tutorial=' + user.tutorial
              dataType: 'JSON'
              type: 'POST'
          }

      $scope.toggleShop = (state) ->
        $scope.isVisible = state
        if state then $scope.load()

      $scope.setTab = (tab, paged) ->
        $scope.activeTab = tab
        $scope.currentPage = 0
        $scope.isPaged = paged

      $scope.load = ->
        flavourService.load_flavours()
        .then ->
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
            cones_index = user.cones.indexOf cone.name
            if cones_index is -1
              $scope.cones.push cone
            console.log cone, cones_index
        update_worker_tiers()

      $scope.shop_paginate = (add) ->
        $scope.currentPage += add
        if $scope.currentPage < 0 then $scope.currentPage = 0

      $scope.get_upgrade = (type) ->
        user[type]
        
      $scope.worker_requirements = (requirement) ->
        for type, val of requirement
          if user[type + 's'] < val then return false
        true

      $scope.get_cost = (type) ->
        sum = 0
        level = interval
        for i in [0...interval] by 1
          sum += get_cost user[type] + i || 0, type
          if sum > user.gold or i >= 1000
            level = i
            break
        [sum, level]

      $scope.get_level = (type) ->
        user[type + "s"] || 0

      $scope.worker_interval = (new_interval) ->
        interval = new_interval
        console.log "new interval", interval

      $scope.purchase = (type, object, amount) ->
        console.log('purchasing an upgrade...' + object._id + ' (' + type + ')');
        if user.gold < object.cost
          toast('Need more money')
          return false

        user.gold -= object.cost
        if type is 'flavour'
          for i, f_locked of $scope.flavours_locked
            if f_locked._id is object._id
              console.log('removing flavour at ' + i);
              $scope.flavours_locked.splice(i, 1);

          unlocked = flavourService.get_unlocked_flavours()
          unlocked.push(object)
          user.flavors.push object._id
          flavourService.set_unlocked_flavours(unlocked)

          $rootScope.$broadcast('flavours', unlocked)

        if type is 'addon'
          for i, a_locked of $scope.addons_locked
            if a_locked._id is object._id
              $scope.addons_locked.splice i, 1

          unlocked = addonService.get_unlocked_addons()
          unlocked.push object
          user.toppings.push object._id
          addonService.set_unlocked_addons(unlocked);
          $rootScope.$broadcast('addons', unlocked);

        if type is 'cone'
          if user.prestige_bonus < object.prestige
            toast('Need prestige')
            return false

          user.cones.push object._id || object.name
          $scope.cones = [];
          for key, cone of cones
            if user.cones.indexOf( cone.name ) is -1
              $scope.cones.push cone

          $rootScope.$broadcast('cones', cones)

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