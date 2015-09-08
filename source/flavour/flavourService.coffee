angular.module('ics')
.factory 'flavourService', ($http, upgradesService, $q) ->
  vm = {
    flavours_locked: []
    flavours_unlocked: []
    get_combos: ->
      $http.get('/combos.json')
      .then (result) ->
        result.data

    format_combos: (combos) ->
      new_combos = combos
      for i in new_combos.length
        flavor = Icecream.get_flavor new_combos[i].flavor_id
        addon = Icecream.get_addon new_combos[i].topping_id
        new_combos[i].flavour_name = flavor.name
        new_combos[i].addon_name = addon.name
        if (new_combos[i].franken_id)
          new_combos[i].franken_name = Icecream.get_flavor new_combos[i].franken_id
      new_combos

    load_flavours: ->
      df = $q.defer()
      vm.flavours_locked = []
      vm.flavours_unlocked = []

      vm.get_flavours()
      .then (flavours) ->
        Icecream.set_flavors flavours
        for i, flavour of flavours
          name = flavour.name.replace /\s+/g, ''
          flavour.image = image_prepend + '/flavours/thumb/' + name + '.png.gz'
          flavour_index = user.flavors.indexOf String(flavour._id)
          if flavour_index is -1
            vm.flavours_locked.push flavour
          else
            vm.flavours_unlocked.push flavour

        df.resolve vm.flavours_unlocked
      df.promise

    get_flavours: ->
      $http.get '/flavors.json'
        .then (result) ->
          result.data

    get_unlocked_flavours: ->
      vm.flavours_unlocked
    set_unlocked_flavours: (f) ->
      vm.flavours_unlocked = f

    get_locked_flavours: ->
      console.log "get_locked_flavours", vm.addons_locked
      vm.flavours_locked
  }
  vm