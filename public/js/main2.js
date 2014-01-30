/*
* ICE CREAM STAND
* @CHANNEL ALPHA
*/

var user_me = { name : 'newbie', gold : 0};
var flavors = {};
var toppings = {};
var gold = 0;
var color_pool = ['158248', '3bade1', 'f2602f', 'c4336e', 'd44c72', '3092b7', 'c368a3', '239649', 'ded151', 'de558d', 'fff']; //for click fx
var trending_flavor; //id
var trending_addon; //id
var first_time = true;
var combo = {};
var cached_sell_value = 0;
var cached_worker_value = 0;
var cached_addon_value = 0;
var cached_flavor_length = 0;
var cached_flavor_value = 0;
var cached_worker_sell_value = [0,0,0,0,0];
var cached_worker_base_value = [0,0,0,0,0];
var cache_sell_num = 0
var sales_per = 0; //number of sales every 5 secs
var dragSrcEl = null;
var last_worker_fx = 0; //0 through 4
var map_control_active = '';
var connect_fails = 0;
var quests = {};
var trend_event_active = false;
var disable_animations = false;
var disable_chat = false;
var debug_mode = false;
var window_focus = true;
var background_animation_num = 0;

var expertise_reqs = [5,150,250,400,600,900,1600,2400,4000,10000,10000];
var cached_expertise = 0;
var canvas_drop_cache = [];
var cached_page = 0;
var canvas_drop_context;
var canvas_cache_cone;
var canvas_cache_icecream;
var canvas_cache_workers = [0,0,0,0,0];
var canvas_cache_addon;
var cached_online_count = 0;
var cached_last_message = '';

var interval_employees;
var interval_gold;
var interval_sell;
var cached_new_messages = 0;
$(document).ready(function () {
	setTimeout("cloud()", 20000);
	main();
	$('body').on('click', '.flavor .flavor_tab', function () {
		$('#main_base, #main_addon, #main_combo').hide();
		$('#' + $(this).attr('x-id')).show();
		$('.flavor .flavor_tab.active').removeClass('active');
		$(this).addClass('active');
		$('.filter_box').remove();
		if ($(this).parent().find('.expand').hasClass('active')) paginate(0);
		if ($(this).attr('x-id') == 'main_combo') {
			$.ajax({
				url : '/me',
				type: 'GET',
				dataType: 'JSON',
				success: function (j) {
					user_me = j;
					$.ajax({
						url : '/combos',
						type: 'GET',
						dataType: 'JSON',
						success: function (j) {
							$('.flavor div#main_combo').html('<h5>Combos are different base flavor and add-on combinations that give bonus money when sold.</h5>');
							for (i in j) {
								var combo = j[i];
								for (k in user_me.combos) {
									if (combo._id == user_me.combos[k]) {
										var flavor;
										var addon;
										for (n in flavors) {
											flavor = flavors[n];
											if (flavor._id == combo.flavor_id) break;
										}
										for (n in toppings) {
											addon = toppings[n];
											if (addon._id == combo.topping_id) break;
										}
										$('.flavor div#main_combo').prepend('<div class="option_wrapper"><div class="combo_option tooltip" x-type="combo" x-addon="' + addon._id + '" x-flavor="' + flavor._id + '" x-value="' + combo.value + '" x-name="' + combo.name + '" style="background-image:url(\'img/toppings/' + addon.name.replace(/\s+/g, '') + '.png\'), url(\'img/' + flavor.name.replace(/\s+/g, '') + 
										'_thumb.png\'), url(\'img/background_icons.png\')">' + combo.name + '</div></div>');
									}
								}
							}
						}
					}); //end combos call
				}
			});
			
		}
	});
	$('body').on('click', '.highscores .flavor_tab', function () {
		if ($(this).attr('id') == 'hide') {
			$('.highscores').hide();
			return;
		}
		$(this).parent().find('.active').removeClass('active');
		$(this).addClass('active');
		$('.refresh_highscores').click();
	});
	$('body').on('click', '.tab', function () {
		$('.tab.active').removeClass('active');
		$(this).addClass('active');
		$('.flavors_inner, .employees_inner, .upgrades_inner, .toppings_inner').hide();
		$('.' + $(this).attr('id') + '_inner').show();
	});
	$('body').on('click', '.controls_forward', function () {
		if ($('.tab#flavors').hasClass('active')) $(".flavors_inner .unlockable:visible").slice(0,5).hide();
		if ($('.tab#toppings').hasClass('active')) $(".toppings_inner .unlockable:visible").slice(0,5).hide();
		return false;
	});
	$('body').on('click', '.controls_show', function () {
		if ($('.tab#flavors').hasClass('active')) {
			$(".flavors_inner .unlockable:hidden").show();
			$('.flavors_inner').css('overflow-y', 'scroll');
		}
		if ($('.tab#toppings').hasClass('active')) {
			$(".toppings_inner .unlockable:hidden").show();
			$('.toppings_inner').css('overflow-y', 'scroll');
		}
		return false;
	});
	$('body').on('click', '.controls_back', function () {
		if ($('.tab#flavors').hasClass('active')) $(".flavors_inner .unlockable:hidden").slice(-5).show();
		if ($('.tab#toppings').hasClass('active')) $(".toppings_inner .unlockable:hidden").slice(-5).show();
		return false;
	});
	$('body').on('click', '.flavor .expand', function () {
		if ($(this).text() == '+') {
			$('#main_base, #main_addon, #main_combo').addClass('expanded').css('overflow', 'visible');
			paginate(0);
			$(this).text('-').addClass('active');
		} else {
			$('#main_base, #main_addon, #main_combo').removeClass('expanded').css('overflow', 'hidden');
			$(this).text('+').removeClass('active');
			$('.filter_box').remove();
		}
	});
	$('body').on('click', '.quests .expand', function () {
		if ($(this).text() == '+') {
			$('.quest').show();
			$(this).text('-').addClass('active');
		} else {
			$('.quest').hide();
			$('.quest:first').show();
			$(this).text('+').removeClass('active');
		}
	});
	$('body').on('click', '.achievements .expand', function () {
		if ($(this).text() == '+') {
			$('.locked').show();
			$(this).text('-').addClass('active');
		} else {
			$('.locked').hide();
			$(this).text('+').removeClass('active');
		}
	});
	$('body').on('click', '.chat.main_container .expand', function () {
		if ($(this).text() == '+') {
			$('.chat.main_container').attr('x-expand', true);
			$('#chat_window').css('overflow-y', 'scroll');
			$(this).text('-').addClass('active');
		} else {
			$('.chat.main_container').attr('x-expand', false);
			$('#chat_window').css('overflow-y', 'hidden');
			$(this).text('+').removeClass('active');
		}
		cached_last_message = '';
		setTimeout("sync_chat()", 50);
	});
	$('body').on('change', '.toggle_container input', function () {
		console.log('changing..');
		if ($(this).parent().hasClass('toggle_animations')) {
			if (disable_animations != $(this).is(':checked')) {
				$.ajax({
					url: 'toggle_animations',
					type: 'POST'
				});
				disable_animations = $(this).is(':checked');
				update_worker_fx(0);
			}
		} else if ($(this).parent().hasClass('toggle_chat')) {
			if (disable_chat != $(this).is(':checked')) { //because disable_chat is when chat is unchecked
				$.ajax({
					url: 'toggle_chat',
					type: 'POST'
				});
				disable_chat = $(this).is(':checked');
				if (disable_chat) { $('.chat.main_container').hide(); } else { $('.chat.main_container').show(); } 
			}
		} else {
			debug_mode = $('.toggle_debug input').is(':checked');
		}
	});  
	$('body').on('mouseout', '.option, .unlockable, .current_value, .tooltip, .hovercard', function () {
		$('.hovercard').remove();
	});
	$('body').on('click', '.inline-message', function () {
		$(this).hide();
	});
	$('body').on('mouseover', '.option, .unlockable, .current_value, .tooltip', function () {
		$('.hovercard').remove();
		$('body').append('<div class="hovercard"><div>' + $(this).attr('id') + '</div></div>');
		$('.hovercard').css('left', $(this).offset().left);
		var top = $(this).offset().top - 20;
		var reverse;
		console.log('hovercard top' + top);
		if (top < 200) {
			top += 275;
			reverse = true;
		}
		$('.hovercard').css('top', top);
		var xtype = $(this).attr('x-type');
		if (xtype && xtype == 'sales_cart') {
			$('.hovercard').html('<div>Cart<span class="level">' + user_me.carts + '</span></div><p>Carts automatically 1 sell ice cream.<br />Sells ' + (user_me.carts*1) + ' ice cream every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. If an ice cream goes out of stock, they will automatically switch to the ice cream directly below.</p>');
		} else if (xtype && xtype == 'sales_employee') {
			$('.hovercard').html('<div>Employees<span class="level">' + user_me.employees + '</span></div><p>Employees automatically sell 2 ice creams.<br />Sells ' + (user_me.employees*2) + ' ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. If an ice cream goes out of stock, they will automatically switch to the ice cream directly below.</p>');
		} else if (xtype && xtype == 'sales_truck') {
			$('.hovercard').html('<div>Truck<span class="level">' + user_me.trucks + '</span></div><p>Trucks automatically sell 3 ice creams.<br />Sells ' + (user_me.trucks*3) + ' ice cream every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. If an ice cream goes out of stock, they will automatically switch to the ice cream directly below.</p>');
		} else if (xtype && xtype == 'sales_robot') {
			$('.hovercard').html('<div>Robot<span class="level">' + user_me.robots + '</span></div><p>Robots automatically sell 5 ice creams.<br />Sells ' + (user_me.robots*5) + ' ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. If an ice cream goes out of stock, they will automatically switch to the ice cream directly below.</p>');
		} else if (xtype && xtype == 'sales_rocket') {
			$('.hovercard').html('<div>Rocket<span class="level">' + user_me.rockets + '</span></div><p>Rockets automatically sell 10 ice creams.<br />Sells ' + (user_me.rockets*10) + ' ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. If an ice cream goes out of stock, they will automatically switch to the ice cream directly below.</p>');
		} else if (xtype && xtype == 'machine') {
			$('.hovercard').html('<div>Ice Cream Machines<span class="level">' + user_me.upgrade_machinery + '</span></div><p>Increases the speed that you make ice cream. Currently it takes them ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds, level up to decrease it by .25s</p>');
		} else if (xtype && xtype == 'research') {
			$('.hovercard').html('<div>Flavor research<span class="level">' + user_me.upgrade_flavor + '</span></div><p>Each level unlocks 3 new flavors of ice cream</p>');
		} else if (xtype && xtype == 'research_addon') {
			$('.hovercard').html('<div>Add-on research<span class="level">' + user_me.upgrade_addon + '</span></div><p>Each level unlocks 3 new add-ons for your ice cream</p>');
		} else if (xtype && xtype == 'trending') {
			var upcoming = '';
			$(this).find('img').each(function () {
				upcoming = upcoming + $(this).attr('title') + ', ';
			});
			$('.hovercard').html('<div>Trending</div><p>Upcoming trends: ' + upcoming + '</p><p class="flavor_text">Sell this flavor for a bonus before it falls out of favor. Trends change every 5 minutes, upcoming trends are listed under the UPCOMING title.</p>'); 
		} else if (xtype && xtype == 'event') {
			$('.hovercard').html('<div>Event</div><p>A mystery add-on is hot right now! Selling it brings in  bonus money.</p>');
		} else if (xtype && xtype == 'friend') {
			$('.hovercard').html('<div>Friend</div><p>Make the Icecream Stand funner and play with friends. Every day your friends get 2% of any money you earn.</p>');
		} else if (xtype && xtype == 'expertise') {
			$('.hovercard').css('left', '10%');
			$('.hovercard').html('<div>Expertise level</div><p>Sell this flavor to raise your expertise level. Higher value flavors are more difficult to master. Each level gives a bonus +10% to the flavor\'s value for you and your workers.</p>');
		}  else if (xtype && xtype == 'prestige') {
			$('.hovercard').css('top', $(this).offset().top - 50).css('height', 180).css('font-size', '12px');
			if (user_me.prestige_level < 8) {
				$('.hovercard').html('<div>Prestige<span class="level">current: +' + user_me.prestige_bonus + '%</span></div><p><b>Restart the game with a bonus</b> based on your progress (current money, flavors, add-ons).</p>' +
				'<p>Everything except your stats (ice cream sold, total gold) will reset. Each level of Prestige increases the limit for workers by 100. ' +
				'You can upgrade Prestige only 8 times, after the lowest prestige bonus can be undone. Each time you upgrade you will get a bonus from 1-100% based on your progress. <b>This bonus adds with your past prestige bonuses.</b></p>');
			} else {
				var smallest_amount = user_me.prestige_array[0];
				for (var i = 1; i < user_me.prestige_array.length; i++) {
					if (user_me.prestige_array[i] < smallest_amount) smallest_amount = user_me.prestige_array[i];
				}
				$('.hovercard').html('<div>Prestige<span class="level">current: +' + user_me.prestige_bonus + '%</span></div><p><b>Restart the game with a bonus</b>, overwriting your current lowest prestige score (' + smallest_amount + '%)</p>');
			}
		} else if (xtype && xtype == 'heroic') {
			$('.hovercard').html('<div>Heroic Tier<span class="level">' + user_me.upgrade_heroic + '</span></div><p>Unlock 3 high level flavors and add-ons. This can be upgraded 3 times.</p>');
		} else if (xtype && xtype == 'legendary') {
			$('.hovercard').html('<div>Legendary Tier<span class="level">' + user_me.upgrade_legendary + '</span></div><p>Unlock 3 high level flavors and add-ons. This can be upgraded 2 times.</p>');
		} else if (xtype && xtype == 'combo') {
			var combo_value = parseFloat($(this).attr('x-value'));
			var flavor_value = 0;
			var addon_value = 0;
			for (i in flavors) {
				if (flavors[i]._id == $(this).attr('x-flavor')) {
					flavor_value = flavors[i].value;
					break;
				}
			}
			for (i in toppings) {
				if (toppings[i]._id == $(this).attr('x-addon')) {
					addon_value = toppings[i].value;
					break;
				}
			}
			$('.hovercard').html('<div>' + $(this).attr('x-name') + '<span class="level flavor_current">' + (combo_value + flavor_value + addon_value).toFixed(2) + '</span></div><p>Click this ice cream to switch to it for a bonus $' + $(this).attr('x-value') + '</p><p class="flavor_text">Combos are made by matching a certain base and addon into an even better flavor. Increases the value of the flavor.</p>');
		} else if (xtype && xtype == 'value') {  
			$('.hovercard').css('top',($(this).offset().top - 40) + 'px');
			var flavor = flavors[i];
			for (i in flavors) {
				flavor = flavors[i];
				if (flavor._id == $('#main_base .selected').attr('x-id')) break;
			}
			$('.hovercard').html('<div>' + $('.current_flavor').html() + '</div><p style="text-align: right;">Flavor value: $' + parseFloat(flavor.value).toFixed(2) + '<br />' +
			'Add-on value: $' + parseFloat($('#main_addon .selected').attr('x-value')).toFixed(2) + '<br /></p>');
			if (combo.value) $('.hovercard p').append('Combo bonus: $' + combo.value.toFixed(2) + '<br />');
			if (user_me.last_flavor == trending_flavor && trending_flavor != '') $('.hovercard p').append('Trending bonus: $' + user_me.trend_bonus.toFixed(2) + '<br />');
			if (user_me.last_addon == trending_addon && trending_addon != '') $('.hovercard p').append('Event bonus: $' + ((user_me.upgrade_heroic > 0)? '1.00' : '0.75') + '<br />');
			if (cached_expertise > 0) $('.hovercard p').append(cached_expertise + '0% Expertise bonus: $' + parseFloat(flavor.value * ((0.1 * cached_expertise))).toFixed(2) + '<br />');
			if (user_me.prestige_bonus > 0) $('.hovercard p').append(user_me.prestige_bonus + '% Prestige bonus: $' + parseFloat(flavor.value * (user_me.prestige_bonus / 100)).toFixed(2) + '<br />');
			$('.hovercard').css('left', ($(this).offset().left - 25) + 'px');
		} else if (xtype && xtype == 'base') {
			for (i in flavors) {
				var flavor = flavors[i];
				if (flavor._id == $(this).attr('x-id')) {
					var expertise = parseInt($(this).parent().find('.expertise_level').text());
					if (isNaN(expertise)) expertise = 0;
					var value = flavor.value * (1 + (.1 * expertise)) * (1 + (user_me.prestige_bonus / 100));
					var max_value = flavor.base_value * (1 + (.1 * expertise)) * (1 + (user_me.prestige_bonus / 100))
					if (trending_flavor == flavor._id) value += user_me.trend_bonus;
					var flavors_sold_index = user_me.flavors.indexOf(flavor._id);
					var num_sold = (parseInt(user_me.flavors_sold[flavors_sold_index]) > 0)? user_me.flavors_sold[flavors_sold_index] : '0';
					$('.hovercard').html('<div>' + flavor.name + '<span class="level flavor_current">' + value.toFixed(2) + '</span></div><p>' + flavor.description + '</p>' + 
					'<p>Maximum value $' + parseFloat(max_value).toFixed(2) + '. You\'ve sold: ' + num_sold + '</p><p class="flavor_text">Flavor value fluctuates over time based on global number of sales.</p>');
					break;
				}
			}
		} else if (xtype && xtype == 'addon') {
			for (i in toppings) {
				var t = toppings[i];
				if (t.name == $(this).attr('id')) {
					$('.hovercard').html('<div>' + t.name + '<span class="level flavor_current">' + t.value.toFixed(2) + '</span></div><p>Add-ons can be used with a base flavor to increase the value of ice cream.</p><p class="flavor_text">Addons increase the value of every ice cream you or your workers sell and do not decrease in value over time like flavors.</p>');
					break;
				}
			}
		}
		if (reverse) {
			$('.hovercard').append('<div class="triangle-up"></div>');
		} else {
			$('.hovercard').append('<div class="triangle-down"></div>');
		}
		
	});
	$('body').on('click', '.prestige_cancel', function () {
		$(this).parent().find('.button').show();
		$(this).parent().find('button').remove();
		$(this).parent().find('.prestige_cancel').remove();
	});
	$('body').on('click', '.prestige_button', function () {
		$(this).after('<button>UNLOCK</button><div class="button prestige_cancel">CANCEL</div>');
		$(this).hide();
	});
	$('body').on('click', '.currently_trending', function () {
		$('.option#' + $(this).attr('id')).click();
	});
	$('body').on('click', '.flavor .combo_option', function () {
		$('#main_base .option[x-id="' + $(this).attr('x-flavor') + '"]').click();
		$('#main_addon .option[x-id="' + $(this).attr('x-addon') + '"]').click();
	});
	$('body').on('click', '.flavor .option[x-type="addon"]', function () {
		$('.flavor .option[x-type="addon"].selected').removeClass('selected');
		$(this).addClass('selected');
		$('.icecream #topping').attr('src', 'img/toppings/' + $(this).attr('id').replace(/\s+/g, '') + '.png').show();
		$('.icecream #topping').attr('x-addon', $(this).attr('id'));
		user_me.last_addon = $(this).attr('x-id');
		$.ajax({
			url: 'last_flavor',
			data: 'f=' + user_me.last_flavor + '&a=' + user_me.last_addon,
			dataType: 'JSON',
			type: 'POST',
			success: function (j) {
				combo = j;
				update_sell_value();
				if (j.name) {
					$('.current_flavor').text(j.name);
					$('.banner#combo').remove();
					$('.sell_value').append('<img src="img/banner_combo.png" class="banner" id="combo" />'); 
					$()
				} else {
					$('.current_flavor').html($('.flavor .option.selected').attr('id') + '<br/>with ' + $('#main_addon .selected').attr('id'));
					$('.banner#combo').remove();
				}
			}
		});
		var total_value = parseFloat($('#main_base .option.selected').attr('x-value')) + parseFloat($('#main_addon .option.selected').attr('x-value'));
	});
	$('body').on('click', '.flavor .option[x-type="base"]', function () {
		$('.flavor .option[x-type="base"].selected').removeClass('selected');
		$(this).addClass('selected');
		if (user_me.last_flavor == $(this).attr('x-id')) {
			$('.icecream, .sell_value').css('display','block');
			var file_ext = ($(this).attr('x-svg') == 'true')? 'svg' : 'png';
			$('.icecream').css('background-image', 'url("../img/' + $('.flavor .option.selected').attr('id').replace(/\s+/g, '') + '.' + file_ext + '"), url("../img/cone.svg")');
			if (combo.name) {
				$('.current_flavor').text(combo.name);
				$('.banner#combo').remove();
				$('.sell_value').append('<img src="img/banner_combo.png" class="banner" id="combo" />'); 
			} else {
				$('.current_flavor').text($('.flavor .option.selected').attr('id'));
				if ($('#main_addon .selected').length > 0) $('.current_flavor').append('<br/>with ' + $('#main_addon .selected').attr('id'));
				$('.banner#combo').remove();
			}
			update_sell_value();
			init_canvas();
			update_expertise();
		} else {
			user_me.last_flavor = $(this).attr('x-id');
			$.ajax({
				url: 'last_flavor',
				data: 'f=' + user_me.last_flavor + '&a=' + user_me.last_addon,
				dataType: 'JSON',
				type: 'POST',
				success: function (j) {
					combo = j;
					update_sell_value();
					if (j.name) {
						$('.current_flavor').text(j.name); 
						$('.banner#combo').remove();
						$('.sell_value').append('<img src="img/banner_combo.png" class="banner" id="combo" />'); 
					} else {
						$('.banner#combo').remove();
						$('.current_flavor').text($('.flavor .option.selected').attr('id'));
						if ($('#main_addon .selected').length > 0) $('.current_flavor').append('<br/>with ' + $('#main_addon .selected').attr('id'));
					}
					init_canvas();
					update_expertise();
				}
			});
			$('.icecream').parent().stop().animate({ 'margin-left' : '-' + ($('.icecream').offset().left + 1000)}, 1000, function () {
				$('.icecream, .sell_value').css('display','block'); 
				var file_ext = ($('.flavor .option.selected').attr('x-svg') == 'true')? 'svg' : 'png';
				$('.icecream').css('background-image', 'url("../img/' + $('.flavor .option.selected').attr('id').replace(/\s+/g, '') + '.' + file_ext + '"), url("../img/cone.svg")');
				$('.icecream').parent().animate({ 'margin-left' : 0}, 1000);
			});
		}
	});
	$('body').on('click', '#upgrades .unlockable button', function () {
		$('.upgrade_pending').removeClass('upgrade_pending');
		if ($(this).hasClass('upgrade_success')) {
			//return false;
		}
		$(this).addClass('upgrade_pending');
		if ($(this).hasClass('sell')) $(this).addClass('upgrade_sell'); 
		$.ajax({
			url : '/unlock',
			data: {
				id: $(this).closest('.unlockable').attr('x-id'),
				type: $(this).closest('.unlockable').attr('x-type'),
				sell: $(this).hasClass('sell'),
				amount: $(this).attr('x-amount')
			},
			dataType: 'JSON',
			type: 'POST',
			success: function (j) {	
				if (!j.error) {
					if (j.reload) return location.reload(true);
					$('.upgrade_pending').addClass('upgrade_success').removeClass('upgrade_pending');
					$('.upgrade_success').append('<div class="unlock_update">UNLOCKED</div>');
					if ($('.upgrade_success').hasClass('upgrade_sell')) {
						$('.upgrade_success').removeClass('upgrade_sell'); $('.unlock_update').text('SOLD');
					}					
					$('.unlock_update').animate({'margin-top': '-100px'}, 1000, function () { $('.upgrade_success').trigger('mouseover').removeClass('upgrade_success'); $(this).remove(); });
					if ($('.upgrade_success').closest('.unlockable').attr('x-type') == 'base') { 
						$('#main_base .option_wrapper').remove();
					}
					$('.hovercard').remove();
					setTimeout("main()", 20);
					setTimeout("update_upcoming_trends()", 500);
				} else {
					$('.upgrade_pending').addClass('upgrade_error').removeClass('upgrade_pending');
					$('.upgrade_error').append('<div class="unlock_update">' + j.error + '</div>');
					$('.unlock_update').animate({'margin-top': '-50px'}, 1000, function () { $(this).remove(); $('.upgrade_error').removeClass('upgrade_error'); });
				}
			}, 
			error: function (xhr, status, error) {
				$('.upgrade_pending').addClass('upgrade_error').removeClass('upgrade_pending');
				setTimeout("$('.upgrade_error').removeClass('upgrade_error')", 1000);
				console.log(xhr);
			}
		});
	});
	window.onblur = function() {
        window_focus = false;
    };
	window.onfocus = function() {
        window_focus = true;
		if (cached_new_messages > 0) {
			$('title').text('Ice Cream Stand');
			cached_new_messages = 0;
		}
    };
	$('body').on('click', '.message .button', function () {
		$('.message, .darkness').remove();
	});
	$('body').on('click', '.add_new[href="new_employee"]', function () {
		$(this).after('<form action="employees" method="POST"><input name="name" placeholder="name"><input name="bio" placeholder="biography"><input name="speed" placeholder="starting leadership, 1-5"><input name="speed" placeholder="starting marketing, 1-5">' +
		'<input name="speed" placeholder="starting analysis, 1-5"><input name="cost" placeholder="cost, 2000-5000"><input type="submit" class="button" value="CREATE"></form>');
		$(this).remove();	
		return false;
	});
	$('body').on('click', '.add_new[href="new_flavor"]', function () {
		$(this).after('<form action="flavors" method="POST"><input name="name" placeholder="flavor name"><input name="description" placeholder="flavor description"><input name="cost" placeholder="cost $200-500"><input name="base_value" placeholder="sell for  +2-3"><input type="submit" class="button" value="CREATE"></form>');
		$(this).remove();	
		return false;
	});
	$('body').on('click', '.add_new[href="new_topping"]', function () {
		$(this).after('<form action="toppings" method="POST"><input name="name" placeholder="topping name"><input name="topping description" placeholder="description"><input name="cost" placeholder="cost $0-300"><input name="base_value" placeholder="sell for +.5-1.5"><input type="submit" class="button" value="CREATE"></form>');
		$(this).remove();	
		return false;
	});  
	$('body').on('mousedown', '.icecream', function () {
		cache_sell_num++;
		user_me.gold += parseFloat(cached_sell_value);
		setTimeout(function () {
			$('.icecream').after('<div class="icecream_float" style="margin-top: 150px;color: #' + color_pool[Math.floor(Math.random()*10)] + '">' + cached_sell_value + '</div>');
			$('.icecream_float:first').animate({ 'margin-top': '0', 'margin-left' : (Math.floor(Math.random()*200)-100) + 'px'}, 1000, function () { $(this).remove() });
			update_expertise();
		}, 50);
		var doc_height = $(document).height();
		canvas_drop_cache.push([canvas_cache_icecream, parseInt((Math.random() * $('#canvas_main').width()) / 50) * 50, -90, doc_height]);
		
		user_me.icecream_sold++;
		var flavor_index = user_me.flavors.indexOf(user_me.last_flavor);
		user_me.flavors_sold[flavor_index]++;
		return false;
	});
	$('body').on('click', '.view_settings', function () {
		alert('<form action="user_update" method="POST" class="alert-form"><div class="clearfix">Your username: <input type="text" placeholder="USERNAME" name="username" value="' + user_me.name + '"></div>' +
		'<div class="clearfix">Your password: <input type="password" placeholder="OPTIONAL PASSWORD" name="password"></div>' +
		'<div class="clearfix">Release channel: <span style="float:right;"><input type="radio" name="release_channel" value="0" />main <input type="radio" name="release_channel" value="1" />beta <input type="radio" name="release_channel" value="2" />alpha</span></div>' +
		'<div class="clearfix" style="padding:20px 0;"><input type="submit" value="UPDATE"></div></form>' +
		'<div class="toggle_animations toggle_container"><input type="checkbox"> animations off</div>' +
		'<div class="toggle_debug toggle_container"><input type="checkbox"> debug mode</div>' +
		'<div class="toggle_chat toggle_container"><input type="checkbox"> chat</div>', 'Update Your Settings');
		$('.alert-form input[type="radio"][value="' + user_me.release_channel + '"]').attr('checked', true);
		if (user_me.animations_off) $('.toggle_animations input').attr('checked', true);
		if (!user_me.chat_off) $('.toggle_chat input').attr('checked', true);
		if (debug_mode) $('.toggle_debug input').attr('checked', true);
		return false; 
	});
	$('body').on('click', '.view_stats', function () {
		alert('Total gold: $' + user_me.total_gold.toFixed(2) + 
		'<br />Ice cream sold: ' + user_me.icecream_sold +
		'<br />Sales every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds: ' + sales_per, 'Stats');
		$.ajax({
			url: '/online',
			dataType: 'JSON',
			success: function (j) {
				$('.message span#description').append('<br />Current players online: ' + j.currently_online + '<br />Total number of accounts: ' + j.number_of_accounts);
			}
		});
		return false;
	});
	$('body').on('click', '.nav_triangle', function () { 
		if (!$('.main_nav').is(':visible')) {
			$('.main_nav').slideDown(500);
			$(this).removeClass('inactive');
		} else {
			$('.main_nav').slideUp(500);
			$(this).addClass('inactive');
		}
	});
	$('body').on('click', '.main_nav .flavor_tab', function () { 
			if ($(this).hasClass('active')) {
				$('.' + $(this).attr('x-id')).hide();
				$(this).removeClass('active');
			} else {
				$('.' + $(this).attr('x-id')).show();
				if ($(this).attr('x-id') == 'chat') sync_chat();
				$(this).addClass('active');
			}
	});
	$('body').on('dragstart', '#main_base .option', function (e) {
		$(this).addClass('drag');
		dragSrcEl = this;
		e.originalEvent.dataTransfer.effectAllowed = 'move';
		e.originalEvent.dataTransfer.setData('text/html', this.outerHTML);
		$('.hovercard').remove();
	});
	$('body').on('dragend', '#main_base .option', function () {
		$(this).removeClass('drag');
		$('.option.over').removeClass('over');
	});
	$('body').on('dragenter', '#main_base .option', function () {
		$(this).addClass('over');
	});
	$('body').on('dragleave', '#main_base .option', function () {
		$(this).removeClass('over');
	});
	$('body').on('dragover', '#main_base .option', function (e) {
		if (e.preventDefault) {
			e.preventDefault(); // Necessary. Allows us to drop.
		}
		e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
		return false;
	});
	$('body').on('drop', '#main_base .option', function (e) {
		// Don't do anything if dropping the same column we're dragging.
		if (dragSrcEl != this) {
			// Set the source column's HTML to the HTML of the column we dropped on.
			dragSrcEl.outerHTML = this.outerHTML;
			this.outerHTML = e.originalEvent.dataTransfer.getData('text/html');
			var switch_1 = $('.option.over').attr('x-id');
			var switch_2 = $('.option.drag').attr('x-id');
			
			var switch_1_i = user_me.flavors.indexOf(switch_1);
			var switch_2_i = user_me.flavors.indexOf(switch_2);
			user_me.flavors[switch_1_i] = switch_2;
			user_me.flavors[switch_2_i] = switch_1;
			var temp = user_me.flavors_sold[switch_1_i];
			user_me.flavors_sold[switch_1_i] = user_me.flavors_sold[switch_2_i];
			user_me.flavors_sold[switch_2_i] = temp;
			
			$.ajax({
				url: '/switch',
				data: '1=' + switch_1 + '&2=' + switch_2,
				dataType: 'JSON',
				type: 'POST'
			});
			setTimeout("update_worker_fx(0);", 10);
			if ($('.option.over').parent().hasClass('outofstock')) {
				$('.option.over').parent().removeClass('outofstock');
				$('.option.drag').parent().addClass('outofstock');
			} else if ($('.option.drag').parent().hasClass('outofstock')) {
				$('.option.drag').parent().removeClass('outofstock');
				$('.option.over').parent().addClass('outofstock');
			}
			$('.option.over').removeClass('over');
			$('.option.drag').removeClass('drag');
			setTimeout("update_sell_value()", 50);
			update_all_expertise();
		}
		return false;
	});
	$('body').on('submit', '#new_message', function () {
		$.ajax({
			url: 'chat',
			data: {
				text: $(this).find('input[type="text"]').val()
			}, 
			dataType: 'JSON',
			type: 'POST',
			success: function (msg) {
				if (msg.text) {
					var div = $('<div />', { text: msg.text, 'class': 'chat', 'x-id': msg._id});
					$(div).append('<time  class="timeago">now</time>');
					$(div).prepend($('<span />', { text: msg.user, 'class': 'user_card', 'x-user': msg.user }));
					$('#chat_window').append(div);
					$('#chat_window .chat:first').remove();
					$('#new_message input[type="text"]').val('').focus();
				} else {
					setTimeout("sync_chat()", 500);
				}
			}
		});
		return false;
	});
	$('body').on('click', '.next_tutorial', function () {
		user_me.tutorial++;
		get_tutorial();
		$.ajax({
			url: 'tutorial',
			data: 'tutorial=' + user_me.tutorial,
			dataType: 'JSON',
			type: 'POST',
			success: function (j) {
			}
		});
	});
	$('body').on('click', '.complete_quest', function () {
		$(this).addClass('upgrade_pending');
		$.ajax({
			url: 'complete_quest',
			data: 'id=' + $(this).closest('.quest').attr('x-id'),
			dataType: 'JSON',
			type: 'POST',
			success: function (j) { 
				if (j.error) {
					$('.upgrade_pending').addClass('upgrade_error').removeClass('upgrade_pending');
					$('.upgrade_error').append('<div class="unlock_update" style="color:#111; width: 500px; text-align: center; margin-left: 0;">' + j.error + '</div>');
					$('.unlock_update').animate({'margin-top': '-100px'}, 2000, function () { $('.upgrade_error').removeClass('upgrade_error'); $(this).remove(); });
				} else {
					if ($('.upgrade_pending').closest('.quest').attr('x-id') == '526745240fc3180000000002') {
						alert('Congratulations! Successfully completed the final quest, earning + $1.00 when a flavor trends.<br /><br /><b>All quests are now complete</b>', 'QUEST COMPLETE!'); 
					} else {
						alert('Congratulations! Successfully completed the quest, earning + $0.25 when a flavor trends.<br /><br /><b>The next quest will unlock soon.</b>', 'QUEST COMPLETE!'); 
					}
					$('#trend_bonus').text((parseFloat(user_me.trend_bonus) + 0.25).toFixed(2));
					main();
					$('.upgrade_pending').addClass('upgrade_success').removeClass('upgrade_pending');
					$('.upgrade_success').append('<div class="unlock_update">QUEST COMPLETE</div>');
					$('.unlock_update').animate({'margin-top': '-100px'}, 2000, function () { $('.upgrade_success').removeClass('upgrade_success'); $(this).remove(); });
				}
			}, 
			error: function (xhr) {
				$('.upgrade_pending').addClass('upgrade_error').removeClass('upgrade_pending');
				setTimeout("$('.upgrade_error').removeClass('upgrade_error')", 1000);
			}
		});
	});
	$('body').on('click', '#donate', function () {
		alert('<p>100% of the donations go to making the game better! Leave me feedback with your email and account name and I\'ll let you know what your money was used for and give you a donation badge.</p>' +
			'<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="paypal"><input type="hidden" name="cmd" value="_s-xclick">' +
			'<input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----MIIHRwYJKoZIhvcNAQcEoIIHODCCBzQCAQExggEwMIIBLAIBADCBlDCBjjELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEGA1UECxQKbGl2ZV9jZXJ0czERMA8GA1UEAxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb20CAQAwDQYJKoZIhvcNAQEBBQAEgYBqycKUAa1+ovSjflPGnchSTh/pUdN30LPDkbv+SOeF0PfwkU/dXkTUkU7aECEz7sXVfxMBDlf8A05mRulp3+6/oWqpDoFFJaIjROsU0lKTTc7w6TmfLWQpGd0pS7UGjWz1tNpu5vuH2pm0zbe7MgjFqtg1Grx4U91D+ENkIv+biTELMAkGBSsOAwIaBQAwgcQGCSqGSIb3DQEHATAUBggqhkiG9w0DBwQIYnVWkYxueF6AgaCATpvtUHl6kdq/zQWvqPN8l0AGUkDebydfcHDowTqyg2tUVfaPdC/OijI+oNYNCiuWyHQQROjzxMmAhQq/MfmRw9iG0KMKaBzKfwuoURPXgwiSCxKp2muEQGH7gmyAsjxR8YsEKIt7Yk8tO/lWQVeSmjHU2DTwdtLi3ZTZa/jedmodzJSR492vI+LVVmhBpnRjy0dgFhTy5NaRNqgGOVMroIIDhzCCA4MwggLsoAMCAQICAQAwDQYJKoZIhvcNAQEFBQAwgY4xCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEWMBQGA1UEBxMNTW91bnRhaW4gVmlldzEUMBIGA1UEChMLUGF5UGFsIEluYy4xEzARBgNVBAsUCmxpdmVfY2VydHMxETAPBgNVBAMUCGxpdmVfYXBpMRwwGgYJKoZIhvcNAQkBFg1yZUBwYXlwYWwuY29tMB4XDTA0MDIxMzEwMTMxNVoXDTM1MDIxMzEwMTMxNVowgY4xCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEWMBQGA1UEBxMNTW91bnRhaW4gVmlldzEUMBIGA1UEChMLUGF5UGFsIEluYy4xEzARBgNVBAsUCmxpdmVfY2VydHMxETAPBgNVBAMUCGxpdmVfYXBpMRwwGgYJKoZIhvcNAQkBFg1yZUBwYXlwYWwuY29tMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBR07d/ETMS1ycjtkpkvjXZe9k+6CieLuLsPumsJ7QC1odNz3sJiCbs2wC0nLE0uLGaEtXynIgRqIddYCHx88pb5HTXv4SZeuv0Rqq4+axW9PLAAATU8w04qqjaSXgbGLP3NmohqM6bV9kZZwZLR/klDaQGo1u9uDb9lr4Yn+rBQIDAQABo4HuMIHrMB0GA1UdDgQWBBSWn3y7xm8XvVk/UtcKG+wQ1mSUazCBuwYDVR0jBIGzMIGwgBSWn3y7xm8XvVk/UtcKG+wQ1mSUa6GBlKSBkTCBjjELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEGA1UECxQKbGl2ZV9jZXJ0czERMA8GA1UEAxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb22CAQAwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOBgQCBXzpWmoBa5e9fo6ujionW1hUhPkOBakTr3YCDjbYfvJEiv/2P+IobhOGJr85+XHhN0v4gUkEDI8r2/rNk1m0GA8HKddvTjyGw/XqXa+LSTlDYkqI8OwR8GEYj4efEtcRpRYBxV8KxAW93YDWzFGvruKnnLbDAF6VR5w/cCMn5hzGCAZowggGWAgEBMIGUMIGOMQswCQYDVQQGEwJVUzELMAkGA1UECBMCQ0ExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxFDASBgNVBAoTC1BheVBhbCBJbmMuMRMwEQYDVQQLFApsaXZlX2NlcnRzMREwDwYDVQQDFAhsaXZlX2FwaTEcMBoGCSqGSIb3DQEJARYNcmVAcGF5cGFsLmNvbQIBADAJBgUrDgMCGgUAoF0wGAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAcBgkqhkiG9w0BCQUxDxcNMTMxMDIxMTM0ODM4WjAjBgkqhkiG9w0BCQQxFgQU3lMSqWHF0gYuWLV9NpKHr3rU28IwDQYJKoZIhvcNAQEBBQAEgYCDIB2jz5mw85Z0Mb9XnJSS+0zUsEOAuazKSXGGUQVetRw57WMU2cq3UvDT7znpG2zxCk2ctiqwdP53aL5loRROKSrNu/hY3pFiSfkylZOTCftc6AZLMmtaVbgXSAb7C84ePYHwlbXX80tZoEVf0vI8UCF7jLEWo+C4oBVkTo5XeA==-----END PKCS7-----">' +
			'<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"><img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1"></form>', 'Donate');
	});
	$('body').on('click', '#invite', function () {
		alert('<p>Give your friend this URL to sign up with: <a href="http://icecreamstand.ca/sign_up?refer=' + btoa(user_me.name) + '" target="_blank">http://icecreamstand.ca/sign_up?refer=' + btoa(user_me.name) + '</a>' +
		'</p><p>once they complete the first quest it will count towards your number of referrals.</p>', 'Refer a friend');
	});
	$('body').on('mouseout', '.user_card', function () {
		$('.user_info_card').hide();
	});
	$('body').on('mouseover', '.user_card', function () {
		if ($('.user_info_card[x-user="' + $(this).attr('x-user') + '"]').length > 0) {
			$('.user_info_card[x-user="' + $(this).attr('x-user') + '"]').css('top', $(this).offset().top + 20).css('left', $(this).offset().left).show();
			return;
		}
		var div = $('<div />', { text: 'loading...', 'class': 'user_info_card', 'x-user' :  $(this).attr('x-user')});
		$(div).css('top', $(this).offset().top + 20).css('left', $(this).offset().left);
		$.ajax({
			url: 'user/' + $(this).attr('x-user'),
			success: function (j) {
				var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
				$('.user_info_card[x-user="' + j.name + '"]').html('<table><b><tr><td class="user_card_name">' + j.name + '</td></tr>' +
				'<tr><td><div class="prestige_levels"></div></td><td>' +
				'<div class="prestige_levels"><img src="img/favourite_icon.png" alt="prestige" /> ' + j.favourite[0].name + '</div></td></tr>' +
				'<tr><td>Flavors: ' + j.flavors + '</td><td>Addons: ' + j.toppings + '</td></tr>' +
				'<tr><td>Quests: ' + j.quests + '</td><td>Sold: ' + numberWithCommas(j.sold) + '</td></tr>' +
				'<tr><td>Carts: ' + j.carts + '</td><td>Employees: ' + j.employees + '</td></tr>' +
				'<tr><td>Trucks: ' + j.trucks + '</td><td>Robots: ' + j.robots + '</td></tr>' +
				'<tr><td>Rockets: ' + j.rockets + '</td><td></td></tr></table>' + 
				'<time>Seen ' + j.updated_at + ' ago</time>');
				if (j.prestige_level > 0) {
					$('.user_info_card[x-user="' + j.name + '"]').find('.prestige_levels:first').append('<img src="img/prestige_icon.png" alt="prestige" /> x' + j.prestige_level + ' ' + j.prestige_bonus + '%');
				} else {
					$('.user_info_card[x-user="' + j.name + '"]').find('.prestige_levels:first').append('-');
				}
			}
		});
		$('body').append(div);
	});
	$('body').on('click', '.friends_add', function () {
		if ($(this).text() == 'Add!') {
			if ($('.friends_add_text').val() != '') {
				$.ajax({
					url: 'friend/new',
					data: {friend: $('.friends_add_text').val()},
					type: 'POST',
					dataType: 'JSON',
					success: function (j) {
						if (j.err) alert(j.err);
						user_me.friends = j.friends;
						cached_online_count = '';
						setTimeout("sync_chat()", 500);
					}
				});
			}
			$(this).text('Add friend');
			$('.friends_add_text').hide();
		} else {
			$('.friends_add_text').val('').show().focus();
			$(this).text('Add!');
		}
	});
	$('body').on('click', '.view_highscores, .refresh_highscores', function () {
		$('.highscores').show();
		var h_type = 'all';
		if ($('#this_week').hasClass('active')) h_type = 'week';
		if ($('#this_day').hasClass('active')) h_type = 'today';
		if ($('#referral').hasClass('active')) h_type = 'refer';
		$.ajax({
			url : '/highscores',
			type : 'GET',
			data : {type: h_type, limit: 100},
			dataType: 'JSON',
			success: function (j) {
				$('.highscores ol').html('');
				var u_count = 0;
				var now = new Date();
				var fiveminago = new Date(now.getTime() - 30*60*1000);
				var limit = 10;
				if ($('.active#top_100').length > 0) limit = 100;
				for (i in j) {
					if (i >= limit) break;
					var user = j[i];
					var online = (new Date(user.updated_at).getTime() > fiveminago)? 'online' : 'offline';
					var gold = 0;
					if (user.total_gold) gold = user.total_gold;
					if (user.today_gold) gold = user.today_gold;
					if (user.week_gold) gold = user.week_gold;
					if (user.referals) {
						$('.highscores ol').append('<li class="' + online + ' user_card" x-user="' + user.name + '"><span class="highscore_user">' + user.name + '</span> ' + ' &nbsp; ' + user.referals + '</span></li>');
					} else {
						$('.highscores ol').append('<li class="' + online + ' user_card" x-user="' + user.name + '"><span class="highscore_user">' + user.name + '</span> ' + ' &nbsp; <span class="flavor_current">' + numberWithCommas(precise_round(gold,0)) + '</span></li>');
					}
				}
			},
			error: function (j) {
				$('.highscores ol').html('<div>Error loading highscores, please try again</div>');
			}
		});
		return false;
	});
});
function precise_round(num,decimals){
	return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function update_sell_value() {
	var total_value = 0;
	var f_len = flavors.length;
	var average_sale = 0;
	var t_len = toppings.length;
	
	for (var i = 0; i < t_len; i++) {
		var t = toppings[i];
		if (t._id == user_me.last_addon) { 
			total_value += t.value;
			cached_addon_value = t.value;
			break; 
		}
	}

	for (var i = 0; i < f_len; i++) {
		var flavor = flavors[i];
		if (flavor._id == user_me.last_flavor) { 
			cached_flavor_value = flavor.base_value;
			//update_expertise();
			var f_value = flavor.value * (1 + (.1 * cached_expertise)) * (1 + (user_me.prestige_bonus / 100));
			total_value += f_value;
		}
		for (var j = 0; j < 5; j++) {
			if (typeof user_me.flavors[j] == 'string' && user_me.flavors[j] == flavor._id) {
				var expertise_value = 1 + ( .1 * parseInt($('#main_base .option_wrapper').eq(j).find('.expertise_level').text()) );
				var f_value = cached_addon_value + (flavor.value * expertise_value * (1 + (user_me.prestige_bonus / 100)));
				cached_worker_sell_value[j] = f_value;
				cached_worker_base_value[j] = flavor.value;
				average_sale += f_value;
				break;
			}
		}
	}
	
	if (user_me.last_flavor == trending_flavor && trending_flavor != '') {
		$('.sell_value').append('<img src="img/banner_trending.png" class="banner" id="trending" />'); 
		total_value += user_me.trend_bonus;
	} else {
		$('.banner#trending').remove();
	}
	if (user_me.last_addon == trending_addon && trending_addon != '') {
		$('.sell_value').append('<img src="img/banner_event.png" class="banner" id="event" />'); 
		total_value += (user_me.upgrade_heroic > 0)? 1.00 : 0.75;
	} else {
		$('.banner#event').remove();
	}
	if (combo.value) {
		total_value += parseFloat(combo.value); 
	}
	cached_sell_value = parseFloat(total_value).toFixed(2);
	$('.current_value').text( cached_sell_value );
	var sales_time = (5 - (user_me.upgrade_machinery*0.25));
	
	var ice_creams_sold = (user_me.flavors.length >= 5)? 5 : user_me.flavors.length;
	average_sale = average_sale / ice_creams_sold;
	cached_worker_value = average_sale;
	if (!isNaN(average_sale)) {
		$('.gold_sales span').text( numberWithCommas(((sales_per/sales_time)*average_sale*60).toFixed(2)) );
	}
} 
function main() {
	console.log('running main()');
	$.ajax({
		url : '/me',
		type: 'GET',
		dataType: 'JSON',
		success: function (j) {
			user_me = j;
			gold = user_me.gold;
			disable_animations = user_me.animations_off;
			disable_chat = user_me.chat_off;
			if (j.total_gold > 1000 && j.name.substring(0,6) == 'guest_') {
				$('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">Set a name and password!<br />' +
				'<small>Secure your account, hover over your name at the bottom left and click settings</small></h4>'); 
			}
			$('.login #name').text(j.name).css('display', 'inline-block');
			sales_per = user_me.carts + (user_me.employees*2) + (user_me.trucks*3) + (user_me.robots*5) + (user_me.rockets*10);
			$('#unlock_machine .cost').text(numberWithCommas(15000 + (user_me.upgrade_machinery * 150000)));
			$('#unlock_research .cost').text(numberWithCommas(50 + (user_me.upgrade_flavor * user_me.upgrade_flavor * 100)));
			$('#unlock_addon .cost').text(numberWithCommas(75 + (user_me.upgrade_addon * user_me.upgrade_addon * 100)));
			$('#unlock_heroic .cost').text(numberWithCommas(1000000 + (3000000 * user_me.upgrade_heroic))); 
			$('#unlock_legendary .cost').text(numberWithCommas(50000000 + (100000000 * user_me.upgrade_legendary))); 
			$('#unlock_cart .unlock_text span').text(numberWithCommas(25 + (Math.pow(user_me.carts, 2) / 4)));
			$('#unlock_cart .sale_level').text(user_me.carts);
			$('#unlock_employee .unlock_text span').text(numberWithCommas(150 + (user_me.employees * 100)));
			$('#unlock_employee .sale_level').text(user_me.employees);
			$('#unlock_truck .unlock_text span').text(numberWithCommas(1000 + (user_me.trucks * user_me.trucks * 50)));
			$('#unlock_truck .sale_level').text(user_me.trucks);
			$('#unlock_robot .unlock_text span').text(numberWithCommas(5000 + (user_me.robots * user_me.robots * 100)));
			$('#unlock_robot .sale_level').text(user_me.robots);
			$('#unlock_rocket .unlock_text span').text(numberWithCommas(50000 + (user_me.rockets * user_me.rockets * 500)));
			$('#unlock_rocket .sale_level').text(user_me.rockets);
			$('#unlock_prestige .sale_level').text(user_me.prestige_level);
			if (user_me.upgrade_flavor > 0) $('.option[x-type="research"]').show();
			if (user_me.upgrade_machinery > 0) $('.option[x-type="machine"]').show();
			if (user_me.upgrade_addon > 0) $('.option[x-type="research_addon"]').show();
			if (user_me.upgrade_heroic > 0) $('.option[x-type="heroic"]').show();
			if (user_me.upgrade_legendary > 0) $('.option[x-type="legendary"]').show();
			if (user_me.quests.length < 5 && user_me.prestige_level < 1) $('.option[x-type="prestige"], #unlock_prestige').hide();
			if (user_me.carts > 0) $('.option[x-type="sales_cart"]').show();
			if (user_me.employees > 0) $('.option[x-type="sales_employee"]').show();
			if (user_me.trucks > 0) $('.option[x-type="sales_truck"]').show();
			if (user_me.robots > 0) $('.option[x-type="sales_robot"]').show();
			if (user_me.rockets > 0) $('.option[x-type="sales_rocket"]').show();
			if (user_me.upgrade_flavor >= 23) {
				$('#unlock_heroic').show();
			}
			if (user_me.upgrade_heroic == 3) {
				$('#unlock_legendary').show();
				$('#unlock_heroic').hide();
			}
			if (user_me.upgrade_legendary == 2) $('#unlock_legendary .cost,#unlock_legendary button').hide();
			if (user_me.upgrade_flavor >= 23) $('.upgrades_inner #unlock_research').hide();
			if (user_me.upgrade_addon >= 23) $('.upgrades_inner #unlock_addon').hide();
			if (user_me.flavors.length <= 1) $('.base_active').html('Click a base flavor to use it<br />Buy flavors on the right');
			if (user_me.flavors.length > 1) $('.base_active').html('Drag flavors to rearrange<br />Workers automatically sell your top row');
			if (user_me.flavors.length > 2) $('.base_active').text('');
			
			if (user_me.carts > 50) achievement_register('52b535fd174e8f0000000001');
			if (user_me.carts >= 250) achievement_register('52b53613174e8f0000000002');
			if (user_me.carts == 1000) achievement_register('52b5361e174e8f0000000003');
			cached_flavor_length = user_me.flavors.length;
			get_prestige_bonus(user_me);
			$.ajax({
				url : '/flavors',
				type: 'GET',
				dataType: 'JSON',
				success: function (j) {
					$('#upgrades .flavors_inner').text('');
					flavors = j.reverse(); //.sort(function(a, b){ if(a.name < b.name) return -1; if(a.name > b.name) return 1; return 0; });
					for (i in user_me.flavors) {
						var flavor;
						for (j in flavors) {
							if (flavors[j]._id == user_me.flavors[i]) { flavor = flavors[j]; break; }
						}
						if (typeof flavor == 'object' && $('.option[x-id="' + flavor._id + '"]').length == 0) {
							$('.flavor div#main_base').append('<div class="option_wrapper' + ((flavor.value == 0.10)? ' outofstock' : '') + '"><img src="img/' + flavor.name.replace(/\s+/g, '') + '_thumb.png" draggable="true" id="' + flavor.name.replace(/\s+/g, '') + '" ' + ((flavor.svg)?'x-svg="true"':'') + ' x-id="' + flavor._id + '" class="option" x-base-value="' + flavor.base_value + '" x-value="' + flavor.value + '" x-type="base" /></div>');
						}
					}
					for (i in flavors) {
						var flavor = flavors[i];  
						if (typeof flavor == 'object' && $('.option[x-id="' + flavor._id + '"]').length == 0) {
							$('#upgrades .flavors_inner').prepend('<div class="unlockable" id="' + flavor.name + '" x-id="' + flavor._id + '" x-type="base"><img src="img/' + flavor.name.replace(/\s+/g, '') + '_thumb.png"><div class="unlock_text">' + flavor.name.replace(/\s+/g, '') + ' <span>' + numberWithCommas(flavor.cost) + '</span></div><button>UNLOCK</button></div>');
						}
					}
					setTimeout("update_all_expertise()", 100);
					setTimeout("update_sell_value()", 50);
					if ($('.flavor.main_container .expand').hasClass('active')) paginate(cached_page);
					if ($('#upgrades .flavors_inner').text().length == 0) {
						if (user_me.upgrade_flavor  < 23) {
							$('#upgrades .flavors_inner').html($('#unlock_research')[0].outerHTML);
						} else if (user_me.upgrade_heroic < 3) {
							$('#upgrades .flavors_inner').html($('#unlock_heroic')[0].outerHTML);
						} else if (user_me.upgrade_legendary < 2) {
							$('#upgrades .flavors_inner').html($('#unlock_legendary')[0].outerHTML);
						} else {
							$('#upgrades .flavors_inner').html('<h3>Every flavor is unlocked!</h3>');
						}
					}
					
								
					$.ajax({
						url : '/toppings',
						type: 'GET',
						dataType: 'JSON',
						success: function (j) {
							toppings = j; //.sort(function(a, b){ if(a.name < b.name) return -1; if(a.name > b.name) return 1; return 0; });
							$('#upgrades .toppings_inner').text('');
							for (i in toppings) {
								var topping = j[i];
								if ($.inArray(topping._id, user_me.toppings) == -1) { //locked
									$('#upgrades .toppings_inner').append('<div class="unlockable" id="' + topping.name + '" x-id="' + topping._id + '" x-type="addon"><img src="img/toppings/' + topping.name.replace(/\s+/g, '') + '_thumb.png"><div class="unlock_text">' + topping.name + ' <span>' + numberWithCommas(topping.cost) + '</span></div><button>UNLOCK</button></div>');
								} else { //unlocked
									if ($('.option[x-id="' + topping._id + '"]').length == 0) $('.flavor div#main_addon').prepend('<div class="option_wrapper"><img src="img/toppings/' + topping.name.replace(/\s+/g, '') + '_thumb.png" id="' + topping.name + '" x-id="' + topping._id + '" class="option" x-value="' + topping.value + '" x-type="addon" /></div>');
								}
							}
							if (first_time) {
								interval_gold = setInterval("update_gold()", 50);
								interval_sell = setInterval("process_clicks()", 1000);
								update_trending();
								setTimeout("update_event();",50);
								trend_event_active = true;
								setTimeout("update_flavors();", 10000);
								setTimeout("get_quest();", 1000);
								first_time = false;
								get_tutorial();
								setTimeout("get_achievements()", 100);
								var canvas = document.getElementById("canvas_main");
								canvas_drop_context = canvas.getContext("2d");
								setInterval("canvas_icecream_drop()", 50);
								if (!user_me.chat_off) $('.flavor_tab[x-id="chat"]').click();
								setInterval("sync_chat()", 30000);
							}
							clearInterval(interval_employees);
							interval_employees = setInterval("employees_working();", 5000 - (user_me.upgrade_machinery * 250));
							setTimeout("update_worker_fx(0);", 100);
							setTimeout("get_quests();", 1000);
							$('.flavor .option[x-id="' + user_me.last_flavor + '"]').eq(0).click();  
							$('.flavor .option[x-id="' + user_me.last_addon + '"]').eq(0).click();
							if (user_me.last_addon == 'undefined') {
								$('#main_addon .option').eq(0).click();
							}
							if ($('#upgrades .toppings_inner').text().length == 0) {
								if (user_me.upgrade_addon  < 23) {
									$('#upgrades .toppings_inner').html($('#unlock_addon')[0].outerHTML);
								} else if (user_me.upgrade_heroic < 3) {
									$('#upgrades .toppings_inner').html($('#unlock_heroic')[0].outerHTML);
								} else if (user_me.upgrade_legendary < 2) {
									$('#upgrades .toppings_inner').html($('#unlock_legendary')[0].outerHTML);
								} else {
									$('#upgrades .toppings_inner').html('<h3>Every add-on is unlocked!</h3>');
								}
							}
						}
					});
				}
			}); //end flavor call
		},
		error: function (j) {
			console.log('error on main(), retrying');
			setTimeout("main();", 1000); 
		}
	});
}
function get_prestige_bonus(user) {
	var x = user.gold;
	var gold_bonus = 25 * (x / (x + 1000000));
	var x2 = user.flavors.length + user.toppings.length;
	var unlock_bonus = (x2 / 171) * 25; 
	$('#prestige_amount').text(parseFloat(gold_bonus + unlock_bonus).toFixed(2));
}
function process_clicks() {
	if (cache_sell_num == 0) return;
	sell_icecream(cache_sell_num, false);
	cache_sell_num = 0;
	if (user_me.icecream_sold >= 2000000) achievement_register('5280ef1cb61b420000000009');
	if (user_me.icecream_sold >= 1000000) achievement_register('5280ef12b61b420000000008');
	if (user_me.icecream_sold >= 500000) achievement_register('5280ef02b61b420000000006');
	if (user_me.icecream_sold >= 100000) achievement_register('5280eee1b61b420000000004');
	if (user_me.icecream_sold >= 10000) achievement_register('5280eeeab61b420000000005');
	if (user_me.icecream_sold >= 1000) achievement_register('5280ee78b61b420000000003');
	if (user_me.icecream_sold >= 100) achievement_register('5280ee5fb61b420000000001');
}
function sell_icecream(amount, workers) {
	if (workers) {
		//replace sold out ice cream
		var outofstock = -1;
		var doc_height = $(document).height();
		var canvas_width = $('#canvas_main').width();
		for (var i = 0; i < 5; i++) {
			if (cached_worker_base_value[i] <= 0.1) { outofstock = i; break; }
			if (window_focus && canvas_drop_cache.length < 30) canvas_drop_cache.push([canvas_cache_workers[i], parseInt((Math.random() * canvas_width) / 50) * 50, -90 + (-100 * i), doc_height]);
		}
		if (outofstock > -1 && user_me.flavors.length > 5) {
			console.log('out of stock... (' + outofstock + ')');
			var f = $('#main_base .option_wrapper').eq(outofstock);
			var f_outer = $(f)[0].outerHTML;
			var f_value = parseFloat($(f).find('.option').attr('x-base-value'));
			var new_place = 5;
			var f2 = '';
			for (var i = 5; i < user_me.flavors.length; i++) {
				//var i_value = parseFloat($('#main_base .option_wrapper').eq(i).find('.option').attr('x-base-value'));
				if (!$('#main_base .option_wrapper').eq(i).hasClass('outofstock')) {
					new_place = i;
					f2 = $('#main_base .option_wrapper').eq(i).find('.option').attr('x-id')
					break;
				}
			}
			console.log('.. new place: ' + new_place);
			$.ajax({
				url: '/switch',
				data: {
					1:$(f).find('.option').attr('x-id'),
					2:f2
				},
				dataType: 'JSON',
				type: 'POST',
			});
			
			//switch in flavors list
			var start = user_me.flavors[outofstock];
			var start_sold = user_me.flavors_sold[outofstock];
			user_me.flavors[outofstock] = user_me.flavors[new_place]; 
			user_me.flavors[new_place] = start;
			user_me.flavors_sold[outofstock] = user_me.flavors_sold[new_place]; 
			user_me.flavors_sold[new_place] = start_sold;
			
			if (!$('#main_base .option_wrapper')[new_place]) return;
			$(f)[0].outerHTML = $('#main_base .option_wrapper')[new_place].outerHTML;
			$('#main_base .option_wrapper')[new_place].outerHTML = f_outer;
			update_all_expertise();
			setTimeout("update_sell_value()", 50);
			update_worker_fx(0);
		}
		user_me.gold += parseFloat(sales_per * cached_worker_value);
	}	
	$.ajax({
		url : '/me',
		data: {
			g: precise_round(user_me.gold,2),
			d: cached_worker_value,
			a: amount,
			addon: cached_addon_value,
			tf: (trending_flavor == user_me.last_flavor),
			ta: (trending_addon == user_me.last_addon),
			c: (combo.value)?combo.value : 'false' ,
			e: cached_expertise,
			w: workers
		},
		dataType: 'JSON',
		type: 'POST',
		success: function (j) { 
			if (connect_fails > 4) $('.inline-message#updated').remove();
			if (!disable_animations && $('.inline-message#animations').length > 0) setTimeout("$('.inline-message#animations').remove();", 2000);
			connect_fails = 0;
			if (j.error) {
				if (debug_mode) {
					$('.inline-message').remove();
					$('body').append('<h4 class="inline-message" id="animations">Debug error<br /><small>' + j.error + '</small></h4>'); 
				}
				return;
			}
			if (j.gold) {
				if (j.event) { alert(j.event); }
				user_me.gold = j.gold;
				update_gold();
				var f_len = flavors.length;
				for (var i = 0; i < f_len; i++) {
					var flavor = flavors[i];
					if (flavor._id == j._id) {
						if (flavor.value != j.value) {
							flavor.value = j.value;
							update_sell_value();
							return;
						}
					}
				}	
			} else {
				var f_len = flavors.length;
				for (var i = 0; i < f_len; i++) {
					var flavor = flavors[i];
					if (flavor._id == j._id) {
						if (flavor.value != j.value) {
							flavor.value = j.value;
							update_sell_value();
							return;
						}
					}
				}
			}
			if (disable_animations && $('.inline-message#animations').length == 0) $('body').append('<h4 class="inline-message" id="animations">Animations are disabled<br /><small>workers are still working</small></h4>'); 
		},
		error: function (j) {
			connect_fails++;
			if (connect_fails > 5) {
				if ($('#updated').length == 0) $('body').append('<h4 class="inline-message" id="updated">Connectivity issue<br /><small>please reload</small></h4>'); 
				if (j.reload) location.reload(); 
			}
		}
	});
}
function update_worker_fx(last_worker_fx) {
	if (last_worker_fx == 0) {
		canvas_cache_addon = document.getElementById("topping");
	}
	var icecream_to_fx = $('#main_base .option').eq(last_worker_fx);
	if ($(icecream_to_fx).length == 0 || last_worker_fx >= 5 || sales_per == 0) return;
	if (!disable_animations) {
		if (typeof cached_worker_sell_value[last_worker_fx] != 'number' || isNaN(cached_worker_sell_value[last_worker_fx])) return setTimeout("update_worker_fx(" + (last_worker_fx) + ")", 1000);
		$(icecream_to_fx).parent().find('.icecream_float').remove();
		$(icecream_to_fx).parent().prepend('<div class="icecream_float">' + precise_round(cached_worker_sell_value[last_worker_fx],2).toFixed(2) + '</div>');
		$('.icecream_particle[x-id="' + $(icecream_to_fx).attr('id') + '"]').remove();
		canvas_cache_workers[last_worker_fx] = new Image();
		if (icecream_to_fx.attr('x-svg') == 'true') {
			canvas_cache_workers[last_worker_fx].src = "img/" + icecream_to_fx.attr('id') + '.svg';
		} else {
			canvas_cache_workers[last_worker_fx].src = "img/" + icecream_to_fx.attr('id') + '.png';
		}
	}
	setTimeout("update_worker_fx(" + (last_worker_fx+1) + ")", 500 + (last_worker_fx * 100));
}
function employees_working() {
	if (sales_per > 0) {
		sell_icecream(sales_per, true);
	}
}
function update_gold() {
	gold += (user_me.gold - gold > 1000)? (.75 * (sales_per + 1)) : .21;
	if (gold  < user_me.gold && gold > 11) {
		var new_gold = numberWithCommas(parseFloat(gold).toFixed(2));
		$('.gold').text( new_gold );
		if (!isNaN(new_gold)) $('title').text('$' + new_gold + ' - Ice Cream Stand');
	} else {
		var new_gold = numberWithCommas(parseFloat(user_me.gold).toFixed(2));
		$('.gold').text(new_gold); //hide show potentially fixes a display bug?
		if (!isNaN(new_gold)) $('title').text('$' + new_gold + ' - Ice Cream Stand');
		gold = user_me.gold;
	}
}
function alert(msg, title) {
	$('.hovercard').remove();
	if (typeof title == 'undefined') title = 'New Message';
	$('.message, .darkness').remove();
	$('body').append('<div class="message"><span id="title">' + title + '</span><span id="description">' + msg + '</span><div class="button">ok</div></div><div class="darkness"></div>');
}
function achievement(title, msg) {
	$('.achievement_bubble').remove();
	if (typeof title == 'undefined') title = 'unlocked';
	$('body').append('<div class="achievement_bubble"><img src="img/achievement_thumb.png" /><span id="title">ACHIEVEMENT: ' + title + '</span><span id="description">' + msg + '</span></div>');
	setTimeout("$('.achievement_bubble').fadeOut(1000);", 10000);
}
function cloud() {
	if (disable_animations) {
		setTimeout("cloud()", 60000);
		return;
	}
    var random_direction=Math.floor(Math.random()*10);
    var randomnumber=Math.floor(Math.random()*100);
	$('.cloud_wrapper').append('<div class="cloud" id="c1" style="top: ' + (randomnumber+10) + 'px;">');
	if (random_direction < 5) {
		$('#c1').animate({left: ($(window).width()+600) + 'px'}, 20000, function () {
			$('#c1').remove();
			setTimeout("cloud()", 50000);
		});
	} else {
		$('#c1').css('left', ($(window).width()+600) + 'px');
		$('#c1').animate({left: '-600px'}, 20000, function () {
			$('#c1').remove();
			setTimeout("cloud()", 50000);
		});

	}
}
function update_flavors() {
	$.ajax({
		url : '/flavors',
		type: 'GET',
		dataType: 'JSON',
		success: function (j) {
			flavors = j.reverse(); //.sort(function(a, b){ if(a.name < b.name) return -1; if(a.name > b.name) return 1; return 0; });
			for (i in j) {
				var flavor = j[i];
				if (flavor.value == 0.10) {
					$('#main_base .option[x-id="' + flavor._id + '"]:not(.outofstock)').parent('.option_wrapper:not(.outofstock)').addClass('outofstock');
				} else {
					$('#main_base .option.outofstock[x-id="' + flavor._id + '"]').parent('.option_wrapper.outofstock').removeClass('outofstock');
				}
			}
		}
	});
	setTimeout("update_flavors();", 30000);
}
function update_trending() {
	$.ajax({
		url: '/trending',
		dataType: 'JSON',
		type: 'GET',
		success: function (j) {
			var x = new Date().getSeconds();
			trending_flavor = j[0]._id;
			var trend_amount = user_me.trend_bonus.toFixed(2);
			if ($('.trend_title[x-id="' + trending_flavor + '"]').length == 0) {
				$('h2[x-step="1"]').html('<span class="trend_title tooltip" x-type="trending" x-id="' + trending_flavor + '">Upcoming</span><span class="currently_trending tooltip" x-type="base" x-id="' + j[0]._id + '" id="' + j[0].name.replace(/\s+/g, '') + '"><span id="trend_name">TRENDING<br /><img src="img/' + j[0].name.replace(/\s+/g, '') + '_thumb.png" class="trending_img active" title="' + j[0].name + '" /><small>' + j[0].name + '</small></span></span><span id="trend_time"><span id="trend_bonus">' + trend_amount + '</span><br /><div class="clock"><img src="img/clock_hand.svg" class="clock_hand" /></div><span class="trend_time"></span></span>');
				$('.trend_title[x-type="trending"]').append('<br /><img src="img/' + j[1].name.replace(/\s+/g, '') + '_thumb.png" class="trending_img" title="' + j[1].name + '" />' +
				'<img src="img/' + j[2].name.replace(/\s+/g, '') + '_thumb.png" class="trending_img" title="' + j[2].name + '" /><img src="img/' + j[3].name.replace(/\s+/g, '') + '_thumb.png" class="trending_img" title="' + j[3].name + '" />');
			} else {
				$('.trend_title[x-id="' + trending_flavor + '"] #trend_time').html('<span id="trend_bonus">' + trend_amount + '</span><br /><div class="clock"><img src="img/clock_hand.svg" class="clock_hand" /></div><span class="trend_time">' + j[0].mins + ':' + x + '</span>');
			}
			var seconds_left = (60 - x) + ( parseInt(j[0].mins) * 60 );
			for (var i = seconds_left; i > 0; i--) {
				setTimeout("update_clock('.trend_time', " + i + ");" , 1000 * (seconds_left - i));
			}
			setTimeout("update_trending()", seconds_left * 1000);
		},
		error: function (j) {
			setTimeout("update_trending()", 60000);
		}
	});
	
}
function update_upcoming_trends() {
	$.ajax({
		url: '/trending',
		dataType: 'JSON',
		type: 'GET',
		success: function (j) {
			for (var i = 1; i < 5; i++) {
					$('.trend_title[x-type="trending"] img').eq(i).attr('src', 'img/' + j[i].name.replace(/\s+/g, '') + '_thumb.png').attr('title', j[i].name);
			}
		}
	});
}
function update_clock(item, seconds_left) { 
	var mins = Math.floor(seconds_left / 60);
	var secs = seconds_left % 60;
	$(item).text(mins + ':' + ((secs < 10)? '0' + secs : secs));
	if (seconds_left == 0) {
		if (item == '.event_time') {
			$(item).closest('.event').hide();
			trending_addon = '';
		}
		update_sell_value();
	}
}
function update_event() {
	$.ajax({
		url: '/event',
		dataType: 'JSON',
		type: 'GET',
		success: function (j) {
			var x = new Date().getSeconds();
			var addon_amount = (user_me.upgrade_heroic > 0)? '1.00' : '0.75';
			if (j._id) {
				trending_addon = j._id;
				var desc = (j.event)? j.event : j.event = j.name + ' is HOT!';
				if ($('.event_title[x-id="' + trending_addon + '"]').length == 0) {
					$('.event').html('<span class="trend_title event_title tooltip" x-type="event" x-id="' + trending_addon + '">Add-on<br />event</span><span id="event_name" class="tooltip" x-type="event">' + desc + '</span><span id="trend_time"><span id="trend_bonus">' + addon_amount + '</span><br /><div class="clock"><img src="img/clock_hand.svg" class="clock_hand" /></div><span class="event_time">' + x + '</span></span>').show();
				} else {
					$('.event_title[x-id="' + trending_addon + '"] #trend_time').html('<span id="trend_bonus">' + addon_amount + '</span><br /><div class="clock"><img src="img/clock_hand.svg" class="clock_hand" /></div>' + j.mins + ':<span class="trend_time">' + x + '</span>');
				}
				var seconds_left = (60 - x) + ( parseInt(j.mins) * 60 );
				for (var i = seconds_left; i > 0; i--) {
					setTimeout("update_clock('.event_time', " + i + ");" , 1000 * (seconds_left - i));
				}
				setTimeout("update_event()", seconds_left * 1000);
			} else {
				$('.event').hide();
				trending_addon = ''; 
				update_sell_value();
				setTimeout("update_event()", 60000);
			}
		},
		error: function (j) { 
			setTimeout("update_trending()", 60000);
		}
	});
}
function get_quest() {
	$.ajax({
		url : 'new_quest',
		dataType: 'JSON',
		success: function (j) {
			if (j && j.name) {
				alert(j.description + '<br /><br /><b>Reward:</b> + $0.25 Trending bonus', 'New Quest! ' + j.name);
				main(); 
				setTimeout("get_quests();",1000);
			}
		}
	});
	setTimeout("get_quest()", 30000);
}
function get_quests() {
	$.ajax({
		url : 'quests',
		dataType: 'JSON',
		success: function (j) {
			quests = j;
			if (user_me.quests.length == 0) return;
			var last_quest = user_me.quests[user_me.quests.length - 1].split('&');
			if (user_me.quests.length > 0 && last_quest[1] != '0') {
				$('.flavor_tab[x-id="quests"]:not(.active)').click();
			}
			$('.quest_default').show();
			for (i in user_me.quests) {
				var quest = j[i];
				if (typeof quest == 'undefined') break;
				$('.quest_default').remove(); 
				$('.quest[x-id="' + quest._id + '"]').remove(); //just making sure
				var user_progress = user_me.quests[i].split('&');
				if (user_progress[2]) {
					var cost = user_progress[2];
					quest.description = quest.description.replace('[cost]', cost);
				}
				$('.quest_list').prepend('<div class="quest" x-id="' + quest._id + '"><div class="quest_title">' + quest.name + '</div>' +
				'<p>' + quest.description + '</p></div>');
				
				
				if (user_progress[1] != '0') {
					if (quest.level == 0) {
						$('.quest:first p').append('<div class="quest_goal"><b>Goal</b>: Buy ' + ((cost)? cost : 5 )+ ' Carts<br /><b>Reward</b>: + $0.25 trending bonus</div>');
					}
					if (quest.level == 1) {
						$('.quest:first p').append('<div class="quest_goal"><b>Goal</b>: Reseach Flavor and Research Addon (x' + ((cost)? cost : 1 ) + ' )<br /><b>Reward</b>: + $0.25 trending bonus</div>');
					}
					if (quest.level == 2) { 
						$('.quest:first p').append('<div class="quest_goal"><b>Goal</b>: Become an expert ' + ((cost)? '(' + cost + ')': '' ) + ' with her favourite flavor<br /><b>Reward</b>: + $0.25 trending bonus</div>');
					}
					if (quest.level == 3) {
						$('.quest:first p').append('<div class="quest_goal"><b>Goal</b>: Buy ' + ((cost)? cost : 2 ) + ' rockets<br /><b>Reward</b>: + $0.25 trending bonus</div>');
					}
					if (quest.level == 4) {
						$('.quest:first p').append('<div class="quest_goal"><b>Goal</b>: Sell 100 of ' + ((cost)? cost : 5 ) + ' flavors<br /><b>Reward</b>: Unlocks next prestige tier, + $1.00 trending bonus</div>');
					}
					var progress_date = new Date(user_progress[1]);
					var future_date = new Date();
					future_date.setTime(progress_date.getTime() + (((quest.level + 1) * 2)*60*60*1000)); 
					var minutes = (future_date.getTime() - progress_date.getTime())/60000;
					var units = 'MINS';
					if (minutes > 60) {
						minutes = minutes / 60;
						units = 'HOURS';
					}
					$('.quest[x-id="' + quest._id + '"]').append('<div class="button complete_quest">COMPLETE QUEST</div>');
				} else {
					$('.quest[x-id="' + quest._id + '"]').append('<center><img src="img/star.png" class="quest_star" /><b>COMPLETED</b></center>');
				}
			}
			$('.quest').hide();
			$('.quest:first').show();
		}
	});
}
function get_tutorial() {
	$('.tutorial').remove();
	if (user_me.tutorial == 0) {
		$('body').append('<div class="tutorial tutorial_0"><h2>Selling Ice cream - 1/3</h2><b>CLICK THIS!</b> Clicking the ice cream sells it and you get money, win-win.<div class="button next_tutorial">NEXT</div><div class="triangle-left"></div></div>');
	}
	if (user_me.tutorial == 1) {
		$('body').append('<div class="tutorial tutorial_1"><h2>Trends - 2/3</h2>Flavors are sometimes worth more for a short amount of time. Sell Trending flavors to make extra money!<div class="button next_tutorial">NEXT</div><div class="triangle-up"></div></div>');
	}
	if (user_me.tutorial == 2) {
		$('body').append('<div class="tutorial tutorial_2"><h2>Buy all the things! - 3/3</h2>' +
		'Buy better flavors, add-ons (which increase the value of your ice cream), workers to automatically sell ice cream for you, and upgrades.<div class="button next_tutorial">LET\'S START</div><div class="triangle-right"></div></div>');
	}
	if (user_me.total_gold > 1000 && user_me.tutorial == 3) { 
		setTimeout(function () {
		$('body').append('<div class="tutorial tutorial_3" style="top: ' + ($('.fb-like').offset().top - 50)+ 'px;"><h2>Sharing is caring</h2>' +
		'If you enjoy Ice Cream Stand - please tell your friends by clicking "like" or  "send" below! It\'s very appreciated :)' +
		'<div class="clearfix"></div><div class="button next_tutorial">no thanks</div><div class="button next_tutorial">sure</div><div class="triangle-down"></div></div>');
		}, 15000);
	} else if (user_me.tutorial == 3) { 
		setTimeout("get_tutorial()", 60000); //not enough gold, check in a minute
	}
}
function achievement_register(id) {
	var a_len = user_me.achievements.length;
	for (var i = 0; i < a_len; i++) {
		if (user_me.achievements[i] == id) return;
	}
	user_me.achievements.push(id);
	$.ajax({
		url: 'register_achievement',
		data: 'id=' + id,
		dataType: 'JSON',
		type: 'POST',
		success: function (j) {
			if (j.name && j.description) {
				if ($('.achievement_bubble').length > 0) {
					setTimeout("achievement('" + j.name + "', '" + j.description + "')",10000); 
				} else {
					achievement(j.name, j.description);
				}
			} else {
				console.log(j);
			}
			get_achievements();
		}
	});
}
function get_achievements() {
	$.ajax({
		url: 'achievements',
		dataType: 'JSON',
		type: 'GET',
		success: function (j) {
			$('.achievement_list p').text('');
			for (i in j) {
				var a = j[i];
				var unlocked = false;
				for (n in user_me.achievements) {
					if (user_me.achievements[n] == a._id) unlocked = true;
				}
				if (unlocked) {
					$('.achievement_list p.unlocked').append('<div><b>' + a.name + '</b> - ' + a.description + '</div>');
				} else {
					$('.achievement_list p.locked').append('<div style="opacity: 0.5;"><b>' + a.name + '</b> - ' + a.description + '</div>');
				}
			}
			if (user_me.achievements.length > 0) {
				$('.flavor_tab[x-id="achievements"]:not(.active)').click();
			}
		}
	});
}
function update_expertise() {
	var flavor_index = user_me.flavors.indexOf(user_me.last_flavor);
	var sold = user_me.flavors_sold[flavor_index];
	if (cached_flavor_value == 0) return;
	var expertise = 0;
	var sales_needed = 0;
	var last_sale = 0;
	for (var i = 0; i <= 10; i++) {
		var cost = expertise_reqs[i] + (cached_flavor_value * 100) + last_sale;
		if (i == 10 || sold < cost) {
			expertise = i;
			if (i < 10) {
				sales_needed = cost;
			} else {
				sales_needed = 0;
				sold = 0;
				last_sale = 0;
			}
			break;
		} else {
			last_sale = cost;
		}
	}
	if (cached_expertise != expertise) {
		if (expertise == 1) achievement_register('52857dd1def8030000000001');
		if (expertise == 5) achievement_register('5287a8051834ee0000000003');
		if (expertise == 10) achievement_register('5287a7dd1834ee0000000002');
		cached_expertise = expertise;
		$('#main_base .option[x-id="' + user_me.last_flavor + '"]').parent().find('.expertise_level').text(expertise);
		update_sell_value();
		setTimeout("update_worker_fx(0);", 10);
	}
	var remaining = 100 * ((sold-last_sale) / (sales_needed-last_sale));
	if (expertise == 10) remaining = 100;
	if ($('.expertise_bar_outer').length == 0) {
		$('.sell_value').after('<div class="expertise_bar_outer tooltip" x-type="expertise"><div class="expertise_bar_inner" style="width: ' + remaining + '%;"></div><div class="expertise_hover">' + (sold-last_sale) + '/' + parseInt(sales_needed-last_sale) + '</div><div class="expertise_number">Expertise: ' + expertise + '</div></div>');
	} else {
		$('.expertise_bar_inner').css('width', remaining + '%');
		$('.expertise_number').text('Expertise: ' + expertise);
		$('.expertise_hover').text((sold-last_sale) + '/' + parseInt(sales_needed-last_sale));
	}
}
function update_all_expertise() {
	var f_len = user_me.flavors.length;
	for (var j = 0; j < f_len; j++) {
		var f = $('#main_base .option').eq(j);
		var f_base_val = parseInt(f.attr('x-base-value') * 100);
		var last_sale = 0;
		for (var i = 0; i <= 10; i++) {
			var cost = expertise_reqs[i] + f_base_val + last_sale;
			if (user_me.flavors_sold[j] < cost || i == 10) {
				if (f.parent().find('.expertise_level').length == 0) {
					f.after('<div class="expertise_level">' + i + '</div>');
				} else {
					f.parent().find('.expertise_level').text(i);
				}
				break;
			} else {
				last_sale = cost;
			}
		}
	}
}
function paginate(index) {
	var len = $('.inner_flavor_container:visible .option_wrapper').length;
	if (len < 20) { $('.filter_box').remove(); return; }
	cached_page = index;
	var offset = 5;
	var page_len = Math.ceil((len - offset) / 15) - 1;
	if (index > page_len) index = page_len;
	if (index < 0) index = 0;
	$('.filter_box').remove();
	$('.inner_flavor_container:visible .option_wrapper').show();
	$('.inner_flavor_container:visible .option_wrapper').slice(((index + 1) * 15) + offset, len).hide();
	if (index > 0) $('.inner_flavor_container:visible .option_wrapper').slice(offset, ((index + 1) * 15) - 10).hide();
	 $('.inner_flavor_container:visible').after('<div class="filter_box"><div class="filter_prev button" onclick="paginate(' + (index-1) + ')"><img style="height: 20px;" src="img/arrow.svg"></div><div class="filter_next button" onclick="paginate(' + (index+1) + ')"><img style="height: 20px;" src="img/arrow_right.svg"></div></div>');
	if (index == 0) $('.filter_prev').css('opacity', '0.5');
	if (index == page_len) $('.filter_next').css('opacity', '0.5');
	for (var i = index - 2; i < index + 3; i++) {
		if (i >= 0 && i <= page_len) {
			$('.filter_box').append('<span class="filter_page ' + ((i == index)? 'active' : '') + '" onclick="paginate(' + i + ')">' + (i+1) + '</span>');
		} else {
			$('.filter_box').append('<span class="filter_page" onclick="paginate(0)" style="opacity: 0">0</span>');
		}
	}
}
function init_canvas() {
	console.log('init canvas');
	$('canvas').each(function () {
		$(this).attr('width', $(this).width());
		$(this).attr('height', $(this).height());
	});
	if (typeof canvas_cache_cone != 'object' || !canvas_cache_cone.complete) {
		canvas_cache_cone = new Image();
		canvas_cache_cone.src = "img/cone_thumb.png";
	}
	canvas_cache_icecream =  new Image();
	if ($('#main_base .option.selected').attr('x-svg') == 'true') {
		canvas_cache_icecream.src = "img/" + $('#main_base .option.selected').attr('id') + '.svg';
	} else {
		canvas_cache_icecream.src = "img/" + $('#main_base .option.selected').attr('id') + '.png';
	}
}
function canvas_icecream_drop() {
	if (disable_animations || !window_focus) return;
	var c_len = canvas_drop_cache.length;
	if (c_len == 0) return;
	var speed = 10;
	while (c_len > 50) { canvas_drop_context.clearRect(canvas_drop_cache[0][1], canvas_drop_cache[0][2] - 2, 50, 90); canvas_drop_cache.shift(); c_len--; }
	for (var j = 0; j < c_len; j++) {
		var c = canvas_drop_cache[j];
		canvas_drop_context.clearRect(c[1], c[2] - speed, 50, 40);
		if (canvas_cache_cone && canvas_cache_cone.complete && c[0].complete && typeof c[0].naturalWidth != "undefined" && c[0].naturalWidth > 0) {
			canvas_drop_context.drawImage(canvas_cache_cone, c[1] + 5, c[2] + 35, 40, 50);
			canvas_drop_context.drawImage(c[0], c[1], c[2], 50, 40);
			canvas_drop_context.drawImage(canvas_cache_addon, c[1], c[2], 50, 40);
		}
		c[2] += speed;
		
		if (c[2] - 90 >= c[3]) {
			canvas_drop_context.clearRect(c[1], c[2] - 2, 50, 90);
			canvas_drop_cache.shift();
			j--;
			c_len--;
		}
	}
}
function sync_chat() {
	if (!$('.chat').is(':visible')) return;
	$.ajax({
		url: 'online',
		success: function (j) {
			if (cached_online_count == j.currently_online) return;
			cached_online_count = j.currently_online;
			$('.chat_container_list').html('<span class="currently_online">' + j.currently_online + ' online</span>');
			for (var i = 0; i < j.online.length; i++) {
				var u = j.online[i];
				var div = $('<div />', { text: u, 'class': 'user_card', 'x-user' :  u});
				$('.chat_container_list').append(div);
			}
			$('.friends_counter span#count').text(j.friends.length);
			$('.friends_counter user').remove('');
			for (var i = 0; i < j.friends.length; i++) { 
				$('.friends_counter div').append($('<user />', { text: j.friends[i].name, 'class': '', 'x-user': j.friends[i].name }));
			}
			
		}
	});
	$.ajax({
		url: 'chat',
		data: {
			expanded: ($('.chat.main_container .expand').hasClass('active')? 75 : 12)
		},
		success: function (j) {	
			if (j[0].text == cached_last_message) return;
			if (cached_last_message != '' && !window_focus) cached_new_messages++;
			console.log(cached_last_message + ',' + window_focus + ',' + cached_new_messages);
			cached_last_message = j[0].text;
			if (cached_new_messages > 0) $('title').text(((cached_new_messages == 1)? '1 New Message' : cached_new_messages + ' New Messages') + ' - Ice Cream Stand');
			$('#chat_window').text('');
			var j_len = j.length - 1;
			for (var i = j_len; i >= 0; i--) {
				var msg = j[i];
				var div = $('<div />', { text: msg.text, 'class': 'chat ' + ((msg.is_admin)? 'admin':'normal'), 'x-id': msg._id});
				$(div).append('<time  class="timeago">' + msg.timeago + ' ago</time>');
				$(div).prepend($('<span />', { text: msg.user, 'class': 'user_card', 'x-user': msg.user }));
				$('#chat_window').append(div);
			}
		}
	});
}