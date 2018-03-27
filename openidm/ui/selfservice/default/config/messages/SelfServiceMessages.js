"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define([], function () {

    var obj = {
        //tasks
        "completedTask": {
            msg: "config.messages.AdminMessages.completedTask",
            type: "info"
        },
        "claimedTask": {
            msg: "config.messages.AdminMessages.claimedTask",
            type: "info"
        },
        "unclaimedTask": {
            msg: "config.messages.AdminMessages.unclaimedTask",
            type: "info"
        },
        "startedProcess": {
            msg: "config.messages.AdminMessages.startedProcess",
            type: "info"
        },
        "saveSocialProvider": {
            msg: "config.messages.socialProviders.save",
            type: "info"
        },
        "removeSocialProvider": {
            msg: "config.messages.socialProviders.delete",
            type: "info"
        },
        "authenticationUnavailable": {
            msg: "config.messages.AuthenticationMessages.authenticationUnavailable",
            type: "error"
        },
        "reauthFailed": {
            msg: "common.form.validation.incorrectPassword",
            type: "error"
        },
        "accountAlreadyBound": {
            msg: "config.messages.socialProviders.accountAlreadyBound",
            type: "error"
        },
        "accountDeleted": {
            msg: "config.messages.accountControls.accountDeleted",
            type: "info"
        },
        saveConsentMapping: {
            msg: "config.messages.consentMessages.consentSaveSuccess",
            type: "info"
        },
        "trustedDeviceRemoved": {
            msg: "config.messages.dashboardMessages.trustedDeviceRemovedSuccess",
            type: "info"
        },
        "oauthApplicationRemoved": {
            msg: "config.messages.dashboardMessages.oauthApplicationRemovedSuccess",
            type: "info"
        }
    };

    return obj;
});
