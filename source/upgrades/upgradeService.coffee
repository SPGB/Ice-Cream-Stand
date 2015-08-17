angular.module('ics')
.factory 'upgradesService', ($http) ->
  vm = {

    unlock: (type, id, amount) ->
      $http.post('/unlock', { type: type, id: id, amount: amount})
      .then (result) ->
        result.data

    order_by_id: (raw, sorted) ->
      if !sorted
        return console.log('no sorted')
      len = raw.length
      new_array = [];
      for i in [0...len] by 1
        for j in [0...len] by 1
          if raw[j]._id is sorted[i]
            new_array.push raw[j]
            break

      new_array
  }
  vm
