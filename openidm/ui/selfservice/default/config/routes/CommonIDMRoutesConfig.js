"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define([], function () {

    var obj = {
        "mandatoryPasswordChangeDialog": {
            base: "landingPage",
            dialog: "org/forgerock/openidm/ui/common/MandatoryPasswordChangeDialog",
            url: "change_password/",
            role: "ui-admin"
        },
        "authenticationUnavailable": {
            view: "org/forgerock/openidm/ui/common/login/AuthenticationUnavailable",
            url: "authenticationUnavailable/"
        },
        "openerHandler": {
            view: "org/forgerock/openidm/ui/common/login/OpenerHandler",
            url: /^openerHandler\/(.*)$/,
            pattern: "openerHandler/?"
        }
    };

    return obj;
});
