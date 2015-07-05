var config = require('../config.js');
var mailgun = require('mailgun-js')({ apiKey: config.mailgun.key, domain: config.mailgun.domain });
var MailComposer = require("mailcomposer").MailComposer;

module.exports = (function() {

	function send_email(msg, subject, to, cta, cta_url) {
		if (!to.email) {
			return res.send('send_email', 'No reciever set');
		}
		if (!to.name) to.name = to.email;
		if (!subject) subject = 'ICS!';
		if (!cta) cta = 'Play at Icecreamstand.ca';
		if (!cta_url) cta_url = 'http://icecreamstand.ca';
		var mailcomposer = new MailComposer({ escapeSMTP : true });

		mailcomposer.setMessageOption({
		    from: "Ice Cream Stand <mailer@icecreamstand.ca>",
		    to: to.email,
		    subject: subject,
		    body: msg,
		    html: '<!doctype html><html><body style="background-color: #7F7DC7;">' +
			' &nbsp; <br> <div style="background-color: #fff; color: #444; font-size: 14px; padding: 20px 10px 50px; display: block; max-width: 600px; margin: 20px auto;">' +
			'<a href="http://icecreamstand.ca"><img src="http://static.icecreamstand.ca/flogo.png" alt="Logo" style="display: block; width: 100px; height: 100px; margin: 0 auto 30px;" /></a>' + 
			'<h1>' + subject + '</h1>' + msg + '<br><br>' +
			'<center><a href="' + cta_url + '" style="background-color: #0da673; box-shadow: 0 2px 0 #097752; color: #fff; border-radius: 4px; padding: 10px; margin: 10px auto; text-align: center; text-decoration: none; font-size: 20px;">' + cta + '</a></center>' +
			'<br><br><br><small>Unsubcribe at any time from there emails by going to <a href="http://icecreamstand.ca/#!settings">http://icecreamstand.ca/#!settings</a></small>' +
			'</div> &nbsp; <br> </body></html>'
		});

		mailcomposer.buildMessage(function(err, messageSource){
	    	console.log(err || messageSource);

	    	var dataToSend = {
	        	to: to.email,
	        	message: messageSource
	    	};
	    	mailgun.messages().sendMime(dataToSend, function (sendError, body) {
		        if (sendError) {
		            console.log(sendError);
		            return;
		        } 
	    	});
		});
	}

	return send_email;
})();