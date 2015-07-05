ics
.factory('upgradesService', function($http) {
	return {
	    	flavours_unlocked: [],
	    	addons_unlocked: [],
	        get_addons: function(level) {
	             //return the promise directly.
	             return $http.get('/addons.json?u=' + level)
	                       .then(function(result) {
	                            //resolve the promise as the data
	                            return result.data;
	                        });
	        },
	        get_flavours: function() {
	             //return the promise directly.
	             return $http.get('/flavors.json')
	                       .then(function(result) {
	                            //resolve the promise as the data
	                            return result.data;
	                        });
	        },
	        unlock: function(type, id, amount) {
	        	return $http.post('/unlock', { type: type, id: id, amount: amount})
	                .then(function(result) {
	                    return result.data;
	                });
	        },
	        set_unlocked_flavours: function(flavours) {
	        	this.flavours_unlocked = flavours;
	        },
	        get_unlocked_flavours: function() {
	        	return  this.flavours_unlocked;
	        },
	        set_unlocked_addons: function(addons) {
	        	this.addons_unlocked = addons;
	        },
	        get_unlocked_addons: function() {
	        	return  this.addons_unlocked;
	        },
	        order_by_id: function (raw, sorted) {
	        	if (!sorted) return console.log('no sorted');
	        	var len = raw.length;
	        	var new_array = [];
	        	for (var i = 0; i < len; i++) {
	        		for (var j = 0; j < len; j++) {
	        			if (raw[j]._id === sorted[i]) {
	        				new_array.push( raw[j] );
	        				break;
	        			}
	        		}
	        	}
	        	return new_array;
	        }
	}
});