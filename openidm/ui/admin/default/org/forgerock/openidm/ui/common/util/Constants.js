"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/util/Constants"], function (commonConstants) {
    commonConstants.context = "openidm";

    commonConstants.HEADER_PARAM_PASSWORD = "X-OpenIDM-Password";
    commonConstants.HEADER_PARAM_USERNAME = "X-OpenIDM-Username";

    commonConstants.HEADER_PARAM_IDMJWT = "X-OpenIDM-Jwt";

    commonConstants.HEADER_PARAM_NO_SESSION = "X-OpenIDM-NoSession";
    commonConstants.HEADER_PARAM_AUTH_TOKEN = "authToken";
    commonConstants.HEADER_PARAM_AUTH_PROVIDER = "provider";
    commonConstants.HEADER_PARAM_REAUTH = "X-OpenIDM-Reauth-Password";

    commonConstants.DOC_URL = "https://backstage.forgerock.com/docs/idm/5.5/";
    commonConstants.AM_DOC_URL = "https://backstage.forgerock.com/docs/am/5.5/";

    commonConstants.EVENT_POLICY_FAILURE = "EVENT_POLICY_FAILURE";
    commonConstants.EVENT_NOTIFICATION_DELETE_FAILED = "EVENT_NOTIFICATION_DELETE_FAILED";
    commonConstants.EVENT_GET_NOTIFICATION_FOR_USER_ERROR = "EVENT_GET_NOTIFICATION_FOR_USER_ERROR";
    commonConstants.EVENT_OAUTH_REGISTER = "EVENT_OAUTH_REGISTER";

    //Events
    commonConstants.EVENT_QUALIFIER_CHANGED = "mapping.properties.EVENT_QUALIFIER_CHANGED";

    commonConstants.EVENT_UPDATE_NAVIGATION = "common.navigation.EVENT_UPDATE_NAVIGATION";
    commonConstants.EVENT_SELF_SERVICE_CONTEXT = "common.navigation.EVENT_SELF_SERVICE_CONTEXT";

    return commonConstants;
});
