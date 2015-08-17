angular.module('ics')
.controller 'money', ($scope, $interval) ->
  vm = this
  vm.cache = ''
  $scope.gold = user.gold
  $interval ->
    $scope.gold = user.gold;
    vm.new_title = null
    if cache_unread_message
      vm.new_title = 'Unread Message - Ice Cream Stand'
    else if cache_unread_mention
      vm.new_title = 'You were mentioned - Ice Cream Stand'
    else if cached_new_messages > 0
      vm.new_title = cached_new_messages + ' Messages - Ice Cream Stand'
    else if gold != user.gold
      vm.new_title = '$' + numberWithCommas( Math.floor($scope.gold) ) + ' Ice Cream Stand'

    if vm.new_title and vm.new_title != vm.cache
      $('title')[0].textContent = vm.new_title
  , 500