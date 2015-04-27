function epic_prompt() {
    $.ajax({
        url: '/epic',
        dataType: 'json',
        success: function (j) {
            cached_epic = j._id;
            alert('<p class="epic_text">' + j.text + '<img src="' + image_prepend + '/event/' + j.name.replace(/\W+/g, '').toLowerCase() + '.png" class="event_img" /></p><div class="epic_button" x-id="' + j._id + '">Help</div><div class="epic_reject">No thanks</div>', 'Winter Event!');
        }
    });
    $('body').on('click', '.epic_reject', function (e) {
        $('.message_close').click();
    });
    $('body').on('click', '.epic_button', function (e) {
        $.ajax({
            url: 'epic/join',
            data: { epic: cached_epic },
            type: 'post',
            dataType: 'json',
            success: function (j) {
                if (j.err) alert( j.err );
                location.reload();
            }
        });
    });
}
function epic_load() { //set up the frame of the epic
    $('.trending_and_events.main_container').after('<div class="epic main_container"><h4>Attack on the Castle</h4>' +
        '<p class="epic_desc"></p>' +
        '<strong>Remaining Forts</strong><table x-col="2" class="aoc_forts"></table><div class="aoc_log"></div>' +
        '<div class="col_2"><strong>Treasure</strong><br><p class="epic_goal">' +
        '<ul>' +
        '<li>Destroy 1 fort: <img src="' + image_prepend + '/badges/15.png" /> Badge</li>' +
        '<li>Destroy 2 forts: <div class="tooltip inline_item" x-type="item" x-name="shield_steel/0/0/3">steel shield</div></li>' +
        '<li>Destroy 3 forts: <div class="tooltip inline_item" x-type="item" x-name="armor_steel/-1/1/3">suit of steel armor</div></li>' +
        '<li>Destroy 4 forts: <div class="tooltip inline_item" x-type="item" x-name="sword_steel/-1/4/-1">Steel Sword</div></li>' +
        '<li>Help destroy the castle: "The Usurper" title</li>' +
        '</ul></p></div><div class="col_2 aoc_upgrades"></div><p class="epic_goal"><strong>Invite a friend</strong><br>' +
        'Attack a fort or castle within 2 minutes of another player will make your attack 50% more effective. <span class="link_underline" x-link="invite">Invite a friend here</span>. Players can only join the rebellion if invited, however they will also be able to report you for dissent (making you lose half your strength).' +
        '<div class="epic_aoc_invite"><input type="text" placeholder="Player"><span>Recruit a player to the attack</span></div></p><div class="epic_progress_container">' +
        '</div></div>');
    $('body').on('click', '.aoc_attack', function() {
        if (user.epic_collected == 0) return alert('You have no power to attack with.', 'Error');
        var d = new Date();
        var delta = (d - new Date(user.epic_last_attack)) / 60000;
        if (user.epic_last_attack && delta < 10) {
            return alert('You can not attack again so soon, please wait ' + (10 - delta).toFixed(1) + ' minutes.', 'Error');
        }
        var is_chained = false;
        if (epic_last_attack) {
            var d = new Date();
            var delta = (d - epic_last_attack) / 60000;
            if (delta < 2) is_chained = true;
        }
        var max_attack = parseInt( $('.aoc_max_attack').text() );
        user.epic_last_attack = new Date();
        user.epic_collected -= max_attack;
        if (user.epic_collected < 0) user.epic_collected = 0;
        $('.user_epic_collected')[0].textContent = user.epic_collected;
        socket.emit('epic/aoc/attack', { is_chained: is_chained });
        epic_attack_buttons();
    });
    $('body').on('click', '.epic_aoc_invite span', function() {
        var user = $('.epic_aoc_invite input').val();
        if (!user) return alert('No user selected', 'Error');

        var d = new Date();
        var delta = (d - new Date(user.epic_last_recruit)) / 60000;
        if (user.epic_last_recruit && delta < 10) {
            return alert('You can not recruit again so soon, please wait ' + (10 - delta).toFixed(1) + ' minutes.', 'Error');
        }
        
        user.epic_last_recruit = new Date();
        socket.emit('epic/aoc/invite', { user: user });
        $('.epic_aoc_invite input').val('');
        
        user.epic_last_recruit = new Date();
    });
    epic_update();
}
function epic_update() { //load in the details
    if (user.is_mod || user.is_admin) {
        $('.epic_desc').html('<strong>Overview</strong><br>You are on the council in Ice Cream Standopia. <b>The citizens have gone mad and are revolting!</b> Or so the ice that has grown around the forts and castle tells you. Buy knights to protect your forts and castles!');
    } else {
       $('.epic_desc').text('Buy weapons to increase the strength of your attacks. Attack up to once every 10 minutes, with up to 200 power. Attack within 2 minutes of another player to get a 50% bonus to your attack.'); 
    }
    $('.aoc_upgrades').html('<strong>Upgrades</strong><br>' +
        '<small>Your power: <span class="user_epic_collected">' + user.epic_collected + '</span>. Maximum attack power: <span class="aoc_max_attack"></span></small>' +
        '<table class="weapon_upgrades" x-col="2">' +
        '<tr><td>Ice Cream balls</td><td><div class="button button_green aoc_upgrade" x-power="1">+1 power $100,000</div></td></tr>' +
        '<tr><td>Ice Cream arrows</td><td><div class="button button_green aoc_upgrade" x-power="5">+5 power $450,000</div></td></tr>' +
        '<tr><td>Ice Cream boulder catapult</td><td><div class="button button_green aoc_upgrade" x-power="10">+10 power $875,000</div></td></tr>' +
        '</table>');

    $('body').on('click', '.aoc_upgrade', function() {
        var cost = { 1: 100000, 5: 450000, 10: 875000 };
        var power = $(this).attr('x-power');
        if (user.gold < cost[power]) return alert('Not enough money to purchase this upgrade', 'error');
        user.gold -= cost[power];
        gold -= cost[power];
        socket.emit('epic/aoc/upgrade', { power: power });
    });
    $('body').on('click', '.aoc_upgrade_knight', function() {
        var d = new Date();
        var delta =  new Date(user.epic_last_attack) - d; //last_attack is the future date
        if (delta > 0) {
            return alert('You can not Repair again so soon, please wait ' + (delta / 60000).toFixed(1) + ' minutes.', 'Error');
        }
        var fort_id = $(this).closest('.aoc_dynamic').attr('x-id');
        var cost = 100000;
        if (user.gold < cost) return alert('Not enough money to purchase this upgrade', 'error');
        user.gold -= cost;
        gold -= cost;

        var cooldown  = 0.5 + (1 / ((0.0002 * cache_civvie_attack) + 1)); //minutes to wait
        user.epic_last_attack = new Date( new Date().getTime() + (cooldown * 60000) ); //that number of minutes in the future
        console.log('upgrading fort ' + fort_id + ', cooldown: ' + cooldown);
        console.log(user.epic_last_attack);
        socket.emit('epic/aoc/knight', { fort: fort_id, health: $(this).attr('x-health') });
        epic_attack_buttons();
    });

    //dynamic content below
    $.ajax({
        url: '/epics',
        data: { id: user.epic_id },
        dataType: 'json',
        success: function (epics) {
            var civvies = 0;
            //the forts
            for (var i = 0; i < epics.length; i++) {
                var fort = epics[i];
                if (fort.name != 'Civilians'){
                    if (fort.total > 0) $('.aoc_forts').prepend('<tr x-id="' + fort._id + '" class="aoc_dynamic" x-health="' + (fort.total > 0) + '"><td><img src="' + image_prepend + '/badges/16.png" />' + fort.name + '</td><td class="fort_options">Health <span>' + fort.total + '</span></td></tr');
                } else {
                    civvies = fort.players;
                    cache_civvie_attack = fort.total;
                    $('.aoc_max_attack')[0].textContent = 200 + (fort.total / 100);
                }
            }
            if (user.is_mod || user.is_admin) {
                var knight_health = 2 + (civvies * 1.5);
                $('.fort_options').each(function () {
                    $(this).append('<div class="button button_green aoc_upgrade_knight" x-health="' + knight_health + '">Hire Knight - $10,000,000 +' + knight_health + 'hp</div>');
                });
            } else {
                var is_first_attack = true;
                $('.fort_options').each(function () {
                        if (is_first_attack) {
                            $(this).append('<div class="button button_red aoc_attack">...</div>');
                            is_first_attack = false;
                        } else {
                            $(this).append('<div class="button button_grey">Attack</div>');
                        }
                });
            }
            epic_interval();
            setInterval(function () {
                epic_interval();
            }, 10000);
        }
    });
}
function epic_interval() { //update each forts power
    if (is_deep_sleep) return;
    console.log('updating epic');
    $.ajax({
        url: '/epic/count',
        dataType: 'json',
        success: function (epics) {
            for (var i = 0; i < epics.length; i++) {
                var epic = epics[i];
                if (epic._id != '54c3f61c195ce39c30982562'){
                    var elem = $('.aoc_dynamic[x-id="' + epic._id + '"] .fort_options span');
                    if (elem.length > 0 && elem[0]) elem[0].textContent = numberWithCommas(epic.total);
                } else {
                    $('.aoc_max_attack')[0].textContent = 200 + (epic.total / 100);
                }
            }
        }
    });
    epic_attack_buttons();
}
function epic_attack_buttons() {
    var d = new Date();
    var delta = (epic_last_attack)? (d - epic_last_attack) / 60000 : 0;
    var delta_locked = (user.epic_last_attack)? (d - new Date(user.epic_last_attack)) / 60000 : 0;
    console.log('epic/aoc: locked for ' + delta_locked);
    if (user.epic_last_attack && delta_locked < 10) {
        if ($('.aoc_attack')[0]) $('.aoc_attack')[0].textContent = 'Unlocks in ' + (10 - delta_locked).toFixed(1) + ' minutes';
    } else if (epic_last_attack && delta < 5) {
        if ($('.aoc_attack')[0]) $('.aoc_attack')[0].textContent = 'Attack (x1.5)';
    } else {
        if ($('.aoc_attack')[0]) $('.aoc_attack')[0].textContent = 'Attack';
    }
    if (user.is_admin || user.is_mod) {

        var delta =  new Date(user.epic_last_attack) - d; //last_attack is the future date
        if (delta > 0) {
            $('.aoc_upgrade_knight')[0].textContent = 'Please wait ' + (delta / 60000).toFixed(1) + ' minutes.';
        } else {
            $('.aoc_upgrade_knight').each(function () {
                var knight_health = $(this).attr('x-health');
                $(this)[0].textContent = 'Hire Knight - $10,000,000 +' + knight_health + 'hp'; 
            });  
        }
    }
}
function tooltip_winter() {
    alert('<p><h2>Winter is Upon Ice Creamtopia!</h1>' +
        'Help settle the score between two rival factions. Unlock limited time items, skins, and a badge as you pilot your team to victory.</p>' +
        '<p><img src="http://static.icecreamstand.ca/event/snowflakes.png" /><img src="http://static.icecreamstand.ca/event/candycanes.png" /><img src="' + image_prepend + '/event/collectable_snowflakes_all.png" /><img src="' + image_prepend + '/event/collectable_candycanes_all.png" /></p>' +
        '<p>The winter event lasts from December 13th to January 1st, with the winning team decided at midnight on January 1st. Candy canes and snowflakes can be found from breaking item chests or normal drops (with a 25% chance of spawning instead of hay).</p>' +
        '<p><a href="http://blog.samgb.com/ice-cream-stand-patch-1-44/" target="_blank">View the full patchnotes here</a></p>', 'Winter Patch and Event');
    $('.message').addClass('winter_alert');
}