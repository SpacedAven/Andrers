/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
    Implements an action request which will augment the currently-running user
    with a profile read from an identity provider.

    Expects one "additionalParameters" provided as part of the request:
        provider: the name of the identity provider which is being interacted with

    Expects one http header provided as part of the request:
        X-OpenIDM-DataStoreToken: the token used to identify the datastore maintaining the oauth client details

    Returns the modified user account
*/
(function () {
    var user = openidm.read(
        context.security.authorization.component + "/" + context.security.authorization.id
    );

    if (!user.idpData) {
        user.idpData = {};
    }

    user.idpData[request.additionalParameters.provider] =
        openidm.action("identityProviders", "getProfile", {});

    return openidm.update(
        context.security.authorization.component + "/" + context.security.authorization.id,
        user._rev,
        user
    );

}());
