angular.module('ics')
.factory 'chatService', ($http) ->
	return {
		get_messages: (message_count) ->
			$http.get '/chat.json?c=' + message_count
			.then (result) ->
				result.data
	}