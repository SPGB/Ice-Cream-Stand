function bind_tooltips() {
	$('body').on('mouseout', '.option, .unlockable, .tooltip, .hovercard', function () {
        $('.hovercard').remove();
        if ($(this).hasClass('.tooltip_click')) $(this).removeClass('.tooltip');
    });

	$('body').on('mouseover', '.tooltip', function () {
        if ( $('.hovercard').length > 0 || !user.is_tooltip) return;
        $('body').append('<div class="hovercard"><div></div></div>');
        var left = $(this).offset().left;
        if (left > $(document).width() - 250) left = $(document).width() - 250;

        $('.hovercard').css('left', left);
        var doc = document.documentElement;
        var scroll_top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        var top = $(this).offset().top - 20;
        var reverse;
        if (top < 150 + scroll_top) { 
            top += 225;
            reverse = true;
        }
        $('.hovercard').css('top', top - scroll_top);
        var xtype = $(this).attr('x-type');
        var id = $(this).attr('x-id');
        var elem = this;
        if (!xtype) {
           xtype = $(this).parent().attr('x-type');
           id = $(this).parent().attr('x-id');
           elem = $(this).parent();
        }
        if (xtype == 'sales_cart') {
            var sales_time = (5 - (user.upgrade_machinery*0.25));
            var sales_modifier = (user.carts/sales_time)*60;
            var ipm_from_worker = sales_modifier * cached_worker_value;
            $('.hovercard').html('<div class="hover_title">' + __('Cart') + '<span class="level">' + user.carts + '</span></div><p>' + 
                __('Automatically sells 1 ice cream every') + ' ' + (5 - (user.upgrade_machinery*0.25)) + ' ' + __('seconds') + '. You earn $' + numberWithCommas(Math.floor(ipm_from_worker)) + ' from carts every minute.</p><p class="flavor_text">' + __('Workers sell your top row. Can be leveled up to 1000.') + '</p>');
        } else if (xtype == 'sales_employee') {
            var sales_time = (5 - (user.upgrade_machinery*0.25));
            var sales_modifier = ((2*user.employees)/sales_time)*60;
            var ipm_from_worker = sales_modifier * cached_worker_value;
            $('.hovercard').html('<div class="hover_title">' + __('Employees') + '<span class="level">' + user.employees + '</span></div><p>' + 
                __('Automatically sells 2 ice cream every') + ' ' + (5 - (user.upgrade_machinery*0.25)) + ' ' + __('seconds') + '. You earn $' + numberWithCommas( Math.floor(ipm_from_worker)) + ' from employees every minute.</p><p class="flavor_text">' + __('Workers sell your top row. Can be leveled up to 1000.') + ' ' + __('Unlocks after you have 10 Carts.') + '</p>');
        } else if (xtype == 'sales_truck') {
            var sales_time = (5 - (user.upgrade_machinery*0.25));
            var sales_modifier = (  (3*user.trucks)  /sales_time)*60;
            var ipm_from_worker = sales_modifier * cached_worker_value;
            $('.hovercard').html('<div class="hover_title">' + __('Truck') + '<span class="level">' + user.trucks + '</span></div><p>' +
                __('Automatically sells 3 ice cream every') + ' ' + (5 - (user.upgrade_machinery*0.25)) + ' seconds. You earn $' + numberWithCommas( Math.floor(ipm_from_worker)) + ' from trucks every minute.</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 10 Employees.</p>');
        } else if (xtype == 'sales_robot') {
            var sales_time = (5 - (user.upgrade_machinery*0.25));
            var sales_modifier = (  (5*user.robots)  /sales_time)*60;
            var ipm_from_worker = sales_modifier * cached_worker_value;
            $('.hovercard').html('<div class="hover_title">' + __('Robot') + '<span class="level">' + user.robots + '</span></div><p>' +
                __('Automatically sells 5 ice cream every') + ' ' + (5 - (user.upgrade_machinery*0.25)) + ' seconds. You earn $' + numberWithCommas( Math.floor(ipm_from_worker)) + ' from robots every minute.</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 25 Trucks.</p>');
        } else if (xtype == 'sales_rocket') {
            var sales_time = (5 - (user.upgrade_machinery*0.25));
            var sales_modifier = (  (10*user.rockets)  /sales_time)*60;
            var ipm_from_worker = sales_modifier * cached_worker_value;
            $('.hovercard').html('<div class="hover_title">' + __('Rocket') + '<span class="level">' + user.rockets + '</span></div><p>' +
                __('Automatically sells 10 ice cream every') + ' ' + (5 - (user.upgrade_machinery*0.25)) + ' seconds. You earn $' + numberWithCommas( Math.floor(ipm_from_worker)) + ' from rockets every minute.</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 75 Robots.</p>');
        } else if (xtype == 'sales_alien') {
            var sales_time = (5 - (user.upgrade_machinery*0.25));
            var sales_modifier = (  (15*user.aliens)  /sales_time)*60;
            var ipm_from_worker = sales_modifier * cached_worker_value;
            $('.hovercard').html('<div class="hover_title">' + __('Alien') + '<span class="level">' + user.aliens + '</span></div><p>' +
                 __('Automatically sells 15 ice cream every') + ' ' + (5 - (user.upgrade_machinery*0.25)) + ' seconds. You earn $' + numberWithCommas( Math.floor(ipm_from_worker)) + ' from aliens every minute.</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 200 Rockets.</p>');
        } else if (xtype == 'machine') {
            $('.hovercard').html('<div class="hover_title">' + __('Machinery') + '<span class="level">' + user.upgrade_machinery + '</span></div><p>Increases the speed that your workers make ice cream. Currently it takes them ' + (5 - (user.upgrade_machinery*0.25)) + ' seconds, level up to decrease it by .25s</p>');
        } else if (xtype == 'research') {
            $('.hovercard').html('<div class="hover_title">' + __('Flavor research') + '<span class="level">' + user.upgrade_flavor + '</span></div><p>Each level unlocks 3 new flavors of ice cream</p>');
        } else if (xtype == 'research_addon') {
            $('.hovercard').html('<div class="hover_title">' + __('Add-on research') + '<span class="level">' + user.upgrade_addon + '</span></div><p>Each level unlocks 3 new add-ons for your ice cream</p>');
        } else if (xtype == 'trending') {
            $('.hovercard').html('<div class="hover_title">Trending</div>This flavour is in demand! Sell it quickly while it\'s hot. As it gets sold more it becomes less popular.<p class="flavor_text">Every 1,000 sales reduces the bonus by $0.05. After 75,000 sales the trend cycles out.</p>'); 
        } else if (xtype == 'adopt_cow') {
            $('.hovercard').html('<div class="hover_title">' + __('Adopt a Cow') + '</div>Adopt a helper to increase your Ice Cream sales. Cows can equip items, and have ability scores (Strength, Constitution, Intelligence).<p class="flavor_text">Cows persist through prestige. Adoption has a $100 fee.</p>'); 
        } else if (xtype == 'friend') {
            $('.hovercard').html('<div class="hover_title">' + __('Friend') + '</div><p>Make the Ice Cream Stand more exciting and play with friends. Every day your friends get a bonus .01% of any money you earn. This doesn\'t take away from what you earn. It\'s a fascimile of social interaction that gives you some of the benefits.</p>');
        } else if (xtype == 'search') {
            $('.hovercard').html('<div class="hover_title">' + __('Search') + '</div><p>Search for a player...</p>');
        } else if (xtype == 'skin') {
            $('.hovercard').html('<div class="hover_title">' + $(this).attr('x-name') + '</div><p>This is a skin for your cow.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'background') {
            $('.hovercard').html('<div class="hover_title">' + $(this).attr('x-value') + '</div><p>This is a custom skin for Ice Cream Stand.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'buff') {
            var text = $(this).attr('x-hover-text');
             $('.hovercard').html('<div class="hover_title">' + $(this).attr('x-id') + '</div><p>' + text + '</p>');
        } else if (xtype == 'silo') {
             $('.hovercard').html('<div class="hover_title">Silo</div><p>You can store up to 175 bushels of hay here. Instead of your cow losing happiness, it will instead consume hay from the silo. You are using ' + (user.silo_hay).toFixed(1) + '/' + (175 + (25 * user.upgrade_silo_hay) ) + '.</p>');
        } else if (xtype == 'item') {
            var intelligence = 0, strength = 0, constitution = 0, special = '';
            var item = $(this).attr('x-name');
            var item_split = item.split('/');
            var name = item_split[0].replace(/_/g, ': ');
            if (item_split[1] && !isNaN(item_split[1])) {
                intelligence = item_split[1];
            }
            if (item_split[2] && !isNaN(item_split[2])) {
                strength = item_split[2];
            }
            if (item_split[3] && !isNaN(item_split[3])) {
                constitution = item_split[3];
            }
            var rarity = (item_split[4])? '<p class="rarity" x-rarity="' + item_split[4] + '">' + item_split[4] + '</p>' : '';
            if (name == 'hat: jester' || name == 'accessory: marotte') {
                special = '<p class="flavor_text">Improves your chances of finding rare items by 5%</p>';
            }
            if (name == 'hat: birthday') {
                special = '<p class="flavor_text">Only available on birthdays. Allows the wearer to /party.</p>';
            }
            if (item_split[5]) {
                special = '<p class="flavor_text">Created by ' + item_split[5] + '</p>';
            }
            if (item_split[6]) {
                special = special + '<p class="flavor_text">This item is part of the <b>' + item_split[6] + '</b> set.<br><small>Equipping all 3 items of this set gives +2 to each stat.</small></p>';
            }
            var stats = '<p><b>Strength</b>: ' + strength + '<br><b>Constitution</b>: ' + constitution + '<br><b>Intelligence</b>: ' + intelligence + '</p>';
            if (item == 'hay') {
                item_split[0] = 'hay_0';
                stats = 'This item <b>increases Happiness</b> by 10. Drag this onto your cow to gain experience, or onto your silo to be automatically used when your cow is hungry.';
            }
            if (item == 'rock') stats = 'This item <b>decreases Happiness</b> by 40. Drag this onto your cow.';
            $('.hovercard').addClass('auto_height').html('<div class="hover_title" style="padding-left: 40px;">' + name + '</div><img src="' + image_prepend + '/items/' + item_split[0].replace(/ /g, '') + '.png" class="tooltip_item" />' + stats + 
                rarity + special);
            $('.hovercard').css('z-index',12).css('margin-top', -1 *  $('.hovercard').height() );
        } else if (xtype == 'event') {
            $('.hovercard').html('<div class="hover_title">' + __('Mystery Event') + '</div><p>One of your add-ons is currently selling for a bonus! Use the clue to find which add-on it is.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'strength') {
            $('.hovercard').html('<div class="hover_title">Strength</div><p>Strength increases the % bonus increase of your cow. Every 1 point of strength gives an additional 1% bonus to income.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'constitution') {
            $('.hovercard').html('<div class="hover_title">Constitution</div><p>Constitution decreases the rate at which your happiness declines. Each point in constitution decreases the decline rate by 5%.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'intelligence') {
            $('.hovercard').html('<div class="hover_title">Intelligence</div><p>Intelligence increases the total amount of happiness your cow can have. Every 2 points of intelligence increase your total happiness by 1.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'autopilot') {
            $('.hovercard').html('<div class="hover_title">' + __('Autopilot') + '<span class="level">' + user.upgrade_autopilot + '</span></div><p>automatically sells your active flavor for you. Selling once every 10 seconds per level of autopilot.</p><p>It can be leveled up to 250.</p>');
        } else if (xtype === 'coldhands') {
            $('.hovercard').html('<div class="hover_title">' + __('Cold Hands') + '<span class="level">' + user.upgrade_coldhands + '</span></div><p>Clicking a Scoopling sells an additional 0.25 Ice cream.</p><p>It can be leveled up to 1000.</p>');
        } else if (xtype === 'shop') {
            $('.hovercard').html('<div class="hover_title">' + __('The Bovine Boutique') + '</div><p>Buy powerful items for your cow.</p>');
        } else if (xtype === 'cone') {
            if (!id) id = $(this).find('.option').attr('x-id');
            if (id === 'baby') {
                $('.hovercard').html('<div class="hover_title">Baby Cone <span class="level flavor_current money_icon is_white">0.10</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id === 'waffle') {
                $('.hovercard').html('<div class="hover_title">Waffle Cone <span class="level flavor_current money_icon is_white">0.25</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id === 'chocolate') {
                $('.hovercard').html('<div class="hover_title">Chocolate Dipped Cone <span class="level flavor_current money_icon is_white">0.50</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'whitechocolate') {
                $('.hovercard').html('<div class="hover_title">White Chocolate Cone <span class="level flavor_current money_icon is_white">0.75</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'sugar') {
                $('.hovercard').html('<div class="hover_title">Sugar Cone <span class="level flavor_current money_icon is_white">1.00</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'sprinkle') {
                $('.hovercard').html('<div class="hover_title">Sprinkle Cone <span class="level flavor_current money_icon is_white">1.25</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'mintycat') {
                $('.hovercard').html('<div class="hover_title">Minty Cat Cone <span class="level flavor_current money_icon is_white">1.50</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'doublechocolate') {
                $('.hovercard').html('<div class="hover_title">Double Chocolate Cone <span class="level flavor_current money_icon is_white">1.75</span></div><p>This cone gives a bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else {
                 $('.hovercard').html('<div class="hover_title">Starter Cone <span class="level flavor_current money_icon is_white">0.00</span></div><p>This cone does not give a bonus when sold.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            }
         } else if (xtype === 'highscore') {
            id = $(this).attr('id');
            if (id === 'this_day') {
                $('.hovercard').html('<div class="hover_title">Daily Highscores</div><p>These are the totals for money earned today. This list resets at 12PM EST.</p>');
            } else if (id === 'this_week') {
                $('.hovercard').html('<div class="hover_title">Weekly Highscores</div><p>These are the totals for money earned this week. This list resets weekly.</p>');
            } else if (id === 'all_time') {
                $('.hovercard').html('<div class="hover_title">All Time Highscores</div><p>This is a leaderboard for total money earned. This list does not reset.</p>');
            } else if (id === 'up_and_coming') {
                $('.hovercard').html('<div class="hover_title">Up and Coming Highscores</div><p>This is a leaderboard for total money earned for accounts newer than 30 days.</p>');
            } else if (id === 'prestige') {
                $('.hovercard').html('<div class="hover_title">Prestige Highscores</div><p>This is a leaderboard for the total prestige amount.</p>');
            } else if (id === 'cowlv') {
                $('.hovercard').html('<div class="hover_title">Cow Highscores</div><p>This is a leaderboard for the cow levels of active cows.</p>');
            } else if (id === 'accumulation_time') {
                $('.hovercard').html('<div class="hover_title">Ice Cube Time Highscores</div><p>This is a leaderboard for the highest time accumulating ice cubes.</p>');
            } else {
                $('.hovercard').html('<div class="hover_title">Ice Cube Highscores</div><p>This is a leaderboard for the amount of money earned in one consecutive batch.</p>');
            }
            $('.hovercard').css('height', 80);
        } else if (xtype === 'inventory') {
            var name = $(this).attr('x-name');
            $('.hovercard').html('<div class="hover_title">' + name + '</div><img src="' + image_prepend + '/items/' + name.replace(/\s+/g, '') + '.png" class="inventory_hover_img" /><p>This is an item in your inventory.</p>');
        } else if (xtype === 'ipm') { 
            var sales_time = (5 - (user.upgrade_machinery*0.25));
            var sales_modifier = (sales_per/sales_time)*60;
            var income_per_minute_worker = sales_modifier * cached_worker_value;
            var income_per_minute_cow = sales_modifier * cached_cowbonus_value;
            var income_per_minute_ap = user.upgrade_autopilot * 6 * cached_sell_value;

            $('.hovercard').html('<div class="hover_title">Income Breakdown</div><table class="ipm_breakdown">' +
                '<tr><td>Average worker value</td><td>$' + (cached_worker_value).toFixed(2) + '</td></tr>' +
                '<tr><td>Number of Sales</td><td>x' + sales_per + '<br>' +
                '<tr><td>Income from workers</td><td>$' + numberWithCommas((income_per_minute_worker).toFixed(2))+ '</td></tr>' +
                '<tr><td>Income from autopilot</td><td>$' + numberWithCommas((income_per_minute_ap).toFixed(2)) + '</td></tr>' +
                '<tr style="display:none;"><td><b>Total before bonuses</b></td><td>$' + numberWithCommas ((income_per_minute_ap + income_per_minute_worker).toFixed(2)) + '</td></tr>' +
                '<tr><td>Income Bonus - Cow</td><td>$' + numberWithCommas( (income_per_minute_cow).toFixed(2) ) + '</td></tr>' +
                '</table>');
        } else if (xtype === 'vote') {
            var xname =  $(this).attr('x-name');
            var title = (xname)? 'Vote for ' + xname : 'Voting';
            $('.hovercard').html('<div class="hover_title">' + title + '</div><p>The public wants a flavour of ice cream enough to pay a premium.</p>' + 
            '<p class="flavor_text">The flavour with the most votes will be the next to trend. The bonus goes up by $.05 for each vote. Vote once every 10 minutes.</p>');
        } else if (xtype == 'expertise') {
            $('.hovercard').css('left', '23%'); 
            $('.hovercard').html('<div class="hover_title">Expertise level</div><p>Sell more of a flavour to get better at making it. <b>Each level of expertise gives a bonus +10%</b> to the flavor\'s value for you and your workers.</p><p>The maximum expertise level is 15.</p>');
        }   else if (xtype == 'frankenflavour') {
            $('.hovercard').html('<div class="hover_title">Frankenflavour</div><p>Combine two flavours into one stronger flavour. Frankenflavour transformations last 20 minutes.</p><p class="flavor_text">To unlock each of the additional tiers requires the item "lab parts". Frankenflavours do not last through prestige. </p>');
        }  else if (xtype == 'prestige') {
            $('.hovercard').css('height', 180).css('font-size', '12px');
           var current_prestige = get_prestige_bonus(user);
            if (user.prestige_level < 8) {
                $('.hovercard').html('<div class="hover_title">Prestige<span class="level">' + user.prestige_bonus + '%</span></div><p><b>Restart the game with a bonus</b> based on cash balance, flavors unlocked, and add-ons unlocked</p>' +
                '<p>This restarts the game and increases sales values by ' + parseFloat(parseFloat(user.prestige_bonus)+parseFloat(current_prestige)).toFixed(5) + '%.' +
                'You can upgrade Prestige up to 8 times, after that the lowest prestige bonus can be redone. Each time you upgrade you will get a bonus from 1-50% based on your progress. <b>This bonus adds with your past prestige bonuses.</b></p>');
            } else {
                var smallest_amount = user.prestige_array[0];
                for (var i = 1; i < user.prestige_array.length; i++) {
                    if (user.prestige_array[i] < smallest_amount) smallest_amount = user.prestige_array[i];
                }
                var newp =  parseFloat(parseFloat(user.prestige_bonus)-parseFloat(smallest_amount)+parseFloat(current_prestige)).toFixed(5);
                $('.hovercard').html('<div class="hover_title">Prestige<span class="level">' + user.prestige_bonus + '%</span></div><p><b>Restart the game with a bonus</b>, ' +
                    'overwriting your current lowest prestige score (' + parseFloat(smallest_amount).toFixed(5) + '%)</p><p>New Prestige Bonus: ' + newp + '%</p>');
            }
            if (user.last_prestige_at) $('.hovercard').append('<div class="last_prestige">Last prestiged: ' + user.last_prestige_at.substring(0,10) + '</div>');
        } else if (xtype == 'heroic') {
            $('.hovercard').html('<div class="hover_title">erer<span class="level">' + user.upgrade_heroic + '</span></div><p>Unlock 3 high level flavors and add-ons. This can be upgraded 3 times.</p>');
        } else if (xtype == 'legendary') {
            $('.hovercard').html('<div class="hover_title">Legendary Tier<span class="level">' + user.upgrade_legendary + '</span></div><p>Unlock 3 high level flavors and add-ons. This can be upgraded 3 times. You must have 1 level of Prestige to unlock this.</p>');
        } else if (xtype == 'combo') {
            var combo_value = parseFloat($(elem).attr('x-value'));
            var flavor_value = 0;
            var addon_value = 0;
            var f_len = flavors.length;
            var t_len = toppings.length;
            for (var i = 0; i < f_len; i++) {
                if (flavors[i]._id == $(elem).attr('x-flavor')) {
                    flavor_value = flavors[i].value;
                    break;
                }
            }
            for (var i = 0; i < t_len; i++) {
                if (toppings[i]._id == $(elem).attr('x-addon')) {
                    addon_value = toppings[i].value;
                    break;
                }
            }
            $('.hovercard').html('<div class="hover_title">' + $(elem).attr('x-name') + '<span class="level flavor_current">' + (combo_value + flavor_value + addon_value).toFixed(2) + '</span></div><p>Click this ice cream to switch to it for a bonus <b>$' + parseFloat($(this).attr('x-value')).toFixed(2) + '</b></p><p class="flavor_text">Combos are made by matching a certain base and addon into an even better flavor. Increases the value of the flavor.</p>');
        } else if (xtype == 'value') {  
            var top = parseInt( $(elem).offset().top ) - 40;
            $('.hovercard').css('top', top - $(window).scrollTop()).css('margin-left', (((canvas_cache_width / 4) - 300) / 2) + 'px');
            var flavor = Icecream.get_flavor( user.last_flavor );
            var addon = Icecream.get_addon( user.last_addon );
            var base_type = 'Flavour';
            var base;
            var time_left = '';
            if (user.last_frankenflavour) {
                base_type = 'Frankenflavour';
                var frankenflavour = Icecream.get_flavor( user.last_frankenflavour );
                base = (flavor.value + frankenflavour.value) * 0.75; 
                var time_delta = new Date() - new Date(user.last_frankenflavour_at);
                time_left = '<span class="time_left">' + (20 - (time_delta / 1000 / 60)).toFixed(1) + ' Mins</span>';
            } else {
                base = flavor.value;
            }
            var base_mods = 0;
            $('.hovercard').html('<div class="hover_title">' + $('.current_flavor').text() + ' ' + time_left + '</div><p style="text-align: right;">' + base_type +' value: $' + parseFloat(base).toFixed(2) +
            ' (+' + parseFloat( addon.value ).toFixed(2) + ' add-on)<br /></p>');
            if (cached_cone_value > 0) {
                $('.hovercard p').append('Cone bonus: $' + parseFloat(cached_cone_value).toFixed(2) + '<br />');
                base_mods += parseFloat(cached_cone_value);
            }
            for (var i = 0; i < combos.length; i++) {
                var combo = combos[i];
                if (combo.flavor_id === user.last_flavor && combo.topping_id === user.last_addon) {
                    $('.hovercard p').append('Combo bonus: $' + combo.value.toFixed(2) + '<br />');
                    base_mods += combo.value;
                }
            }
            if (user.last_flavor == trending_flavor && trending_flavor != '') {
                $('.hovercard p').append('Trending bonus: $' + parseFloat(trending_bonus).toFixed(2) + '<br />');
                base_mods += parseFloat(trending_bonus);
            }
            if (user.last_addon == trending_addon && trending_addon != '') {
                $('.hovercard p').append('Event bonus: $' + user.trend_bonus+ '<br />');
                base_mods += user.trend_bonus;
            }
            var val_expertise = 0;
            if (cached_expertise > 0) {
                val_expertise = (base+base_mods) * ((0.1 * cached_expertise));
                $('.hovercard p').append(cached_expertise + '0% (x $' + (base+base_mods).toFixed(2) + ') Expertise: $' + parseFloat(val_expertise).toFixed(2) + '<br />');
            }
            if (user.prestige_bonus > 0) {
                var val_prestige = (base+base_mods) * ((user.prestige_bonus / 100));
                $('.hovercard p').append(user.prestige_bonus + '% (x $' + (base+base_mods).toFixed(2) + ') Prestige: $' + parseFloat(val_prestige).toFixed(2) + '<br />');
            }
            $('.hovercard').css('left', ($(elem).offset().left - 25) + 'px');
        } else if (xtype == 'base') {
            var xid = $(elem).attr('x-id');
            console.log('hovering over ' + xid);
            var flavour = Icecream.get_flavor(xid);
            console.log(flavour);

            if (flavour._id) {
                var f_name = flavour.name.replace(/\s+/g, '');
                var is_new_art = true;
                var expertise = parseInt($(elem).parent().find('.expertise_level').text());
                if (isNaN(expertise)) expertise = 0;
                var expertise_bonus = flavour.value * (.1 * expertise);
                var prestige_bonus = flavour.value * (user.prestige_bonus / 100);
                var value = flavour.value + expertise_bonus + prestige_bonus;
                var flavors_sold_index = user.flavors.indexOf(flavour._id);
                var num_sold = (parseInt(user.flavors_sold[flavors_sold_index]) > 0)? user.flavors_sold[flavors_sold_index] : '0';
                $('.hovercard').html('<div class="hover_title">' + __(flavour.name) + '<span class="level flavor_current money_icon is_white">' + parseFloat(value).toFixed(2) + '</span></div>' +
                '<p>' + flavour.description + '</p>' + 
                '<p>Value <span class="money_icon">' + parseFloat(flavour.value).toFixed(2) + '</span> (Max <span class="money_icon">' + parseFloat(flavour.base_value).toFixed(2) + '</span>). ' + __('sold') + ': ' + numberWithCommas(num_sold) + '</p><p class="flavor_text">' + __('Flavour value fluctuates over time based on supply.') + '</p>');
                    $('.hovercard').attr('x-new-art', true);
                    $('.hovercard').append('<div class="icecream_hovercard_art" style="background-image: url(' + image_prepend + '/flavours/thumb/' + f_name + '.png.gz), url(http://static.icecreamstand.ca/cones/thumb/' + ((cached_cone)? cached_cone : 'default') + '.png.gz);"></div>');
   
            } else {
                $('.hovercard').html('<div class="hover_title">' + __($(elem).attr('id')) + '<span class="level flavor_current">?</span></div><p>This flavour has not yet been unlocked</p>' + 
                '<p>Maximum base value ? You\'ve sold: 0</p><p class="flavor_text">Flavour value fluctuates over time based on supply.</p>');
                $('.hovercard').attr('x-new-art', true);
                $('.hovercard').append('<div class="icecream_hovercard_art" style="background-image: url(' + image_prepend + '/flavours/thumb/' + $(elem).attr('id') + '.png.gz), url(http://static.icecreamstand.ca/cones/thumb/' + ((cached_cone)? cached_cone : 'default') + '.png.gz);"></div>');
            }
        } else if (xtype == 'addon') {
            var t = Icecream.get_addon($(elem).attr('x-id'));
            var is_new_art = new_art_addons.indexOf(t.name) > -1;
            $('.hovercard').html('<div class="hover_title">' + __(t.name) + '<span class="level flavor_current money_icon is_white">' + ((t.value)? t.value.toFixed(2) : '?') + '</span></div><p>' + __('Add-ons can be used with a flavour to increase the value of ice cream.') + '</p><p class="flavor_text">' + __('Add-ons increase the value of every ice cream you or your workers sell and do not decrease in value over time.') + '</p>');
            if (is_new_art) {
                var flavour = Icecream.get_flavor(user.last_flavor);
                $('.hovercard').attr('x-new-art', true);
                $('.hovercard').append('<div class="icecream_hovercard_art" style="background-image: url(' + image_prepend + '/flavours/thumb/' + flavour.name.replace(/\s+/g, '') + '.png.gz), url(http://static.icecreamstand.ca/cones/thumb/' + ((cached_cone)? cached_cone : 'default') + '.png.gz);">' +
                    '<img src="' + image_prepend + '/addons/thumb/' + t.name.replace(/\s+/g, '') + '.png.gz" class="hovercard_addon" /></div>');
            }
        }
        if (reverse) {
            $('.hovercard').append('<div class="triangle-up"></div>');
        } else {
            $('.hovercard').append('<div class="triangle-down"></div>');
        }
        
    });
}