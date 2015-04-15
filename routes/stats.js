var router = require('express').Router();

module.exports = (function() {

    router.get('/', function(req, res){
		res.send('<body><script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script><script src="https://s3.amazonaws.com/icecreamstand.com/stats.js.gz"></script></body>');
	});

    return router;
})();