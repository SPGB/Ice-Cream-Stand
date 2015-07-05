$(function () {

	//modal
	$('body').on('click', '.silo', function () {
	    var cost = get_cost(user.upgrade_silo_hay + 1, 'silo');
	    var cost_hay = Math.floor(1000 * user.prestige_bonus);
	    alert('<div class="row">' + 
	    	'<div class="row_3"><img src="http://static.icecreamstand.ca/silo_back.png" height="100" /></div>' +
	    	'<div class="row_9"><b>Upgrade Silo capacity</b> - Lv' + user.upgrade_silo_hay + get_easter_bunny(2) + 
	    	'<p>This increases Silo storage capacity by 25</p><div class="button button_green unlockable_ajax" x-upgrade="silo_upgrade" x-cost="' + cost + 
	    	'" >Upgrade $' + numberWithCommas(cost) + '</div></div></div>' +
	    	'<div class="row">' +
	    	'<div class="row_3"><img src="http://static.icecreamstand.ca/feed.png" height="100" /></div>' +
	    	'<div class="row_9"><b>Buy Feed</b>' +
	    	'<p>This puts 25 bushels of hay in your Silo</p>' +
	    	'<div class="button button_green unlockable_ajax" x-upgrade="silo_hay" x-cost="' + cost_hay + 
	    	'" >Unlock $' + numberWithCommas(cost_hay) + '</div></div>' +
	    	'</div>', 'Silo');
	});

});