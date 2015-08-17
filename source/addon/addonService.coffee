angular.module('ics')
.factory 'addonService', ($http, $q) ->
  vm = {
    addons_locked: []
    addons_unlocked: []

    load_addons: ->
      df = $q.defer()
      vm.addons_locked = []
      vm.addons_unlocked = []

      vm.get_addons user.upgrade_addon
      .then (addons) ->
        Icecream.set_toppings addons
        for i, addon of addons
          name = addon.name.replace /\s+/g, ''
          addon.image = image_prepend + '/addons/thumb/' + name + '.png.gz'
          topping_index = user.toppings.indexOf String(addon._id)
          console.log addon.name, topping_index
          if topping_index is -1
            vm.addons_locked.push addon
          else
            vm.addons_unlocked.push addon

        console.log vm.addons_locked.length, vm.addons_unlocked.length, addons.length
        df.resolve vm.addons_unlocked
      df.promise

    get_addons: (level) ->
      $http.get '/addons.json?u=' + level
      .then (result) ->
        result.data
    get_unlocked_addons: () ->
      vm.addons_unlocked
    get_locked_addons: () ->
      console.log "get_locked_addons", vm.addons_locked
      vm.addons_locked

    set_unlocked_addons: (unlocked) ->
      vm.addons_unlocked = unlocked
  }
  vm