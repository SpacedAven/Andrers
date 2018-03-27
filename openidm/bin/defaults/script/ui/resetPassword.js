/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*global require, openidm, exports */

var Crypto = require("crypto"),
    Handlebars = require("lib/handlebars");

exports.sendMail = function (object) {

    // if there is a configuration found, assume that it has been properly configured
    var emailConfig = openidm.read("config/external.email"),
        emailTemplate = openidm.read("config/emailTemplate/resetPassword");

    if (emailConfig && emailConfig.host && emailTemplate && emailTemplate.enabled) {
        var email,
            password,
            template,
            locale = emailTemplate.defaultLocale;

        password = Crypto.generateRandomString(emailTemplate.passwordRules, emailTemplate.passwordLength);

        openidm.patch(resourcePath, object._rev, [{
            operation: "add",
            field: "/password",
            value: password
        }]);

        email =  {
            "from": emailConfig.from,
            "to": object.mail,
            "subject": emailTemplate.subject[locale],
            "type": "text/html"
        };

        template = Handlebars.compile(emailTemplate.message[locale]);

        email.body = template({
            "password": password,
            "object": object
        });

        try {
            openidm.action("external/email", "send", email);
        } catch (e) {
            logger.info("There was an error with the outbound email service configuration.  The password was reset but the user hasn't been notified.");
            throw {"code": 400}
        }
    } else {
        logger.info("Email service not configured; password not reset. ");
    }
};
