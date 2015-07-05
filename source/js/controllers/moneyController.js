ics
.controller('money', function ($scope, $interval) {
		$scope.gold = user.gold;
        $interval(function(){
        	$scope.gold = user.gold;
	        if (cache_unread_message) {
	            $('title')[0].textContent = 'Unread Message - Ice Cream Stand';
	        } else if (cache_unread_mention) {
	            $('title')[0].textContent = 'You were mentioned - Ice Cream Stand';
	        } else if (cached_new_messages > 0) {
	            $('title')[0].textContent = cached_new_messages + ' Messages - Ice Cream Stand';
	        } else if (gold != user.gold) {
	            $('title')[0].textContent = '$' + numberWithCommas( Math.floor($scope.gold) ) + ' Ice Cream Stand';
	        }
        }, 500);
	});