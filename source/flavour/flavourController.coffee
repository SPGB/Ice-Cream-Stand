angular.module('ics')
  .controller 'flavourController', ($scope, upgradesService, flavourService, $interval, expertiseService, addonService) ->
    $scope.flavours_unlocked = []
    $scope.addons_unlocked = []
    $scope.cones_unlocked = []
    $scope.combos = []
    cache_flavour_len = 0
    cache_addon_len = 0
    for i in $scope.cones_unlocked.length
        if $scope.cones_unlocked[i] is 'babycone' then $scope.cones_unlocked[i] = 'baby'
        if $scope.cones_unlocked[i] is 'sugarcone' then $scope.cones_unlocked[i] = 'sugar'

    for i in user.cones
        $scope.cones_unlocked.push i
        
    $scope.currentPage = 0
    $scope.pageSize = 20
    $scope.is_expanded = false
    $scope.numberOfPages= ->
        Math.ceil $scope.flavours_unlocked.length/$scope.pageSize

    $scope.update_page = (new_page) ->
        if new_page > 6 then new_page = 6
        if new_page < 0 then new_page = 0
        $scope.currentPage = new_page

    $scope.expand = ->
        $scope.is_expanded = !$scope.is_expanded

    $scope.pages_flavour = ->
        arr_len = cache_flavour_len / $scope.pageSize
        new Array if arr_len > 1 then Math.ceil(arr_len) else 1

    $scope.pages_addons = ->
        arr_len = cache_addon_len / $scope.pageSize
        new Array if arr_len > 1 then Math.ceil(arr_len) else 1

    $scope.pages_combos = ->
        arr_len = $scope.combos.length / $scope.pageSize
        new Array if arr_len > 1 then Math.ceil(arr_len) else 1

    $scope.load_combos = ->
        console.log('flavourController', 'loading combos');
        flavourService.get_combos().then (raw) ->
            $scope.combos = flavourService.format_combos(raw)

    $scope.display_experience = (index) ->
        expertiseService.get_level( user.flavors_sold[index] ) || 0;

    flavourService.load_flavours()
    .then (unlocked) ->
        $scope.process_unlocked unlocked
        update_sell_value()


    addonService.load_addons()
        .then (unlocked) ->
            console.log "load_addons", unlocked
            $scope.process_unlocked_addons unlocked

    $scope.process_unlocked = (unlocked) ->
        console.log "process unlocked", unlocked
        if cache_flavour_len != unlocked.length
            $scope.flavours_unlocked = upgradesService.order_by_id(unlocked, user.flavors)
            cache_flavour_len = $scope.flavours_unlocked.length
            console.log "new unlocked flavours", $scope.flavours_unlocked

    $scope.process_unlocked_addons = (unlocked) ->
        if cache_addon_len != unlocked.length
            $scope.addons_unlocked = upgradesService.order_by_id(unlocked, user.toppings)
            cache_addon_len = $scope.addons_unlocked.length

    $scope.$on 'flavours', (event, unlocked) ->
        if unlocked
            $scope.process_unlocked unlocked
        else
            console.log "flavours broadcast", "no unlocked"

    $scope.$on 'addons', (event, unlocked) ->
        $scope.process_unlocked_addons unlocked

    $scope.$on 'cones', (event, args) ->
        if user.cones then $scope.cones_unlocked = user.cones
