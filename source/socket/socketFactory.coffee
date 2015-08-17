angular.module('ics')
.factory 'socketFactory', ($rootScope) ->
  {
    on: (eventName, callback) ->
      socket?.on eventName, (args) ->
        $rootScope.$apply ->
          console.log "socketFactory", args
          callback args

    emit: (eventName, data, callback) ->
      socket?.emit eventName, data, (args) ->
        $rootScope.$apply ->
          if callback then callback args
  }