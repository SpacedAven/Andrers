/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*global require, openidm, exports */

(function () {
    exports.setDefaultFields = function (object) {

        if (!object.accountStatus) {
            object.accountStatus = 'active';
        }

        if (!object.authzRoles) {
            object.authzRoles = [
                {
                    "_ref": "repo/internal/role/openidm-authorized"
                }
            ];
        }

        /* uncomment to randomly generate passwords for new users
         if (!object.password) {

         // generate random password that aligns with policy requirements
         object.password = require("crypto").generateRandomString([
         { "rule": "UPPERCASE", "minimum": 1 },
         { "rule": "LOWERCASE", "minimum": 1 },
         { "rule": "INTEGERS", "minimum": 1 },
         { "rule": "SPECIAL", "minimum": 1 }
         ], 16);

         }
         */
    };

    /**
     * Creates a relationship between an managed/user/{id} and managed/idpData.
     *
     * @param object managed user
     */
    exports.createIdpRelationships = function (object) {
        // if managed object contains identity provider data
        if (object.idpData) {
            object.idps = Object.keys(object.idpData).filter(function (provider) {
                // filter on which identity providers have been enabled
                return object.idpData[provider].enabled !== false;
            }).map(function (provider) {
                // creates an entry in managed/idpData, returns entry ref to be associated with a managed user
                // so that the relationship can be created
                openidm.create("managed/" + provider, object.idpData[provider].subject, object.idpData[provider].rawProfile);
                return {
                    _ref: "managed/" + provider + "/" + object.idpData[provider].subject
                };
            });
        }
    };

    /**
     * Sends an email to the passed object's provided `mail` address via idm system email (if configured).
     *
     * @param object -- managed user
     */
    exports.emailUser = function (object) {
    	// if there is a configuration found, assume that it has been properly configured
    	var emailConfig = openidm.read("config/external.email"), Handlebars = require('lib/handlebars'),
            emailTemplate = openidm.read("config/emailTemplate/welcome");

    	if (emailConfig && emailConfig.host && emailTemplate && emailTemplate.enabled) {
    	    var email,
    	        template,
                locale = emailTemplate.defaultLocale;

    	    email =  {
    	        "from": emailTemplate.from || emailConfig.from,
    	        "to": object.mail,
    	        "subject": emailTemplate.subject[locale],
    	        "type": "text/html"
    	    };

    	    template = Handlebars.compile(emailTemplate.message[locale]);

    	    email.body = template({
    	        "object": object
    	     });

            return openidm.action("external/email", "send", email);
    	}
    };
}());
