angular.module('ics')
.controller('chat', function ($scope, chatService, socketFactory) {
    $scope.room_current = user.room;
    $scope.rooms = ['default', 'bug reports', 'suggestions', 'Roleplay Closet'];
    $scope.message={};
    $scope.messages = [];
    if (user.is_admin || user.is_mod) {
      $scope.rooms.push('Mod Only');
      $scope.rooms.push('swamp');
    }
        if (user.badges && user.badges.indexOf(1) !== -1) $scope.rooms.push('donor lounge');
        if (user.shadow_ban) {
          $scope.rooms = ['swamp'];
        }
    $scope.message_count = 15;
    $scope.is_expanded = false;
    $scope.message_send = function (new_message) {
      $scope.message={};
      if (new_message.text == '/afk') {
        Icecream.deep_sleep();
        return false;
      }
          var msg = {
            _id: Math.random() + '_newmessage',
              badge: (!user.badge_off && user.badges)? user.badges[0] : 0,
              text: new_message.text,
              user: user.name,
              created_at: new Date().toISOString(),
              room: user.room
          };
          if ($scope.messages.length > 75) $scope.messages.shift();
        $scope.messages.push(msg);
        socketFactory.emit('chat message', msg);
    };
    $scope.message_expand = function () {
      $scope.message_count = ($scope.message_count == 15)? 75 : 15;
      if ($scope.messages.length < $scope.message_count) {
        $scope.messages_load();
      }
      $scope.is_expanded = !$scope.is_expanded;
    };
    $scope.messages_load = function () {
      chatService.get_messages($scope.message_count).then(function(new_messages) {
          $scope.messages = new_messages.reverse();
      });
    };
    $scope.change_room = function (new_room) {
      console.log('room', new_room);
      user.room = new_room;
      $scope.room_current = new_room;
      cached_rooms[new_room] = 0;
        socketFactory.emit('sleep', { sleep: false, room: new_room });
      $scope.messages_load();
    };

    socketFactory.on('chat message', function (msg) {
        console.log("socket got chat message", msg);
        if (msg.add_badge && msg.add_badge_id == user._id) {
              user.badges.push(msg.add_badge);
              main();
          } 
          if (msg.dunce && msg.dunce == user.name) {
              main('dunce', function () {
                  Icecream.first_time_dunce();
              });
          }
          if (msg.party && (msg.party == '?' || msg.party == user.name)) {
              if (msg.party == '?') {
                  user.party_until = null;
                  return;
              }
              main('party', function () {
                  Icecream.first_time_party();
              });
          }
          if (msg.sync && msg.sync == user._id) {
              window.location.reload(true);
          }
          if (msg.room) {
              if (msg.room && msg.room != user.room) {
                console.log('message for room: ' + msg.room + ' from ' + msg.user);
                  if (!cached_rooms[msg.room]) cached_rooms[msg.room] = 0;
                  cached_rooms[msg.room]++;
                  return false;
              }
              if (msg.user == user.name) {
                return false;
              }
          }

          if (msg.text && msg.text.toLowerCase().indexOf('@' + user.name) > -1) {
              cache_unread_mention = true;
          }

          if (!window_focus) {
            cached_new_messages++;
          }

          if ($scope.messages.length > 75) $scope.messages.shift();
        $scope.messages.push(msg);
    });

    socketFactory.on('join', function(msg){
          var friend = Icecream.get_friend(msg._id);
          if (friend) {
              var cur_time = new Date();
              var last_seen = new Date(friend.updated_at);
              console.log('online -' + friend.name + ' (' + (cur_time - last_seen)  + ')');
              if (friend.is_away && user.is_friend_notify && cur_time - last_seen > 60000) {
                  $scope.messages.push({ 
                    _id: Math.random() + 'online',
                    user: ':', badge: '1',
                    text: '@' + friend.name + ' has come online',
                    is_system: true,
                    created_at: new Date().toISOString(),
                  });
              }
              friend.is_away = false;
              friend_list_add(friend.name, 2);
              if ( $('.friends_counter span#count').length > 1) {
                $('.friends_counter span#count')[0].textContent = $('.friends_list_online > user, .friends_list_away > user').length + '/' + $('.friends_counter span#count').attr('x-length');
              }
          }
      });
      socketFactory.on('sleep', function(msg){
          var friend = Icecream.get_friend(msg._id);
          if (friend) {
              var cur_time = new Date();
              var last_seen = new Date(friend.updated_at);
              if (user.is_friend_notify && friend.is_away && !msg.sleep  && cur_time - last_seen > 600000) {
                  $scope.messages.push({ 
                    _id: Math.random() + 'afk',
                    user: ':',
                    badge: '1',
                    text: '@' + friend.name + ' ' + messages_afk[Math.floor( Math.random() * messages_afk.length )],
                    is_system: true,
                    created_at: new Date().toISOString(),
                  });
              }
              friend.is_away = msg.sleep;
              friend.updated_at = cur_time;
              friend_list_add(friend.name, friend.is_away? 1 : 2);
          }
      });
    $scope.messages_load();
  });