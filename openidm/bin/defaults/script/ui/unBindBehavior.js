/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

if (object.idpData !== null &&
    object.idpData !== undefined &&
    object.idpData[request.additionalParameters.provider] !== null &&
    object.idpData[request.additionalParameters.provider].enabled === true) {

    var _ = require('lib/lodash'),
        user = openidm.read(resourcePath),
        enabledCount = 0,
        disableProvider = function() {
            // disable social provider via use of "enabled": false -
            object.idpData[request.additionalParameters.provider].enabled = false;

            // uncomment below line to delete social provider data -
            // delete object.idpData[request.additionalParameters.provider];

            // update the object in every case:
            openidm.update(resourcePath, object._rev, object);
        };

    if (!user.password) {
        // make sure user isn't turning off last IDP with no password set
        enabledCount = _.filter(_.values(object.idpData), function(idp) {
            return idp.enabled;
        }).length;

        if (enabledCount > 1) {
            disableProvider();
        } else {
            throw {
                "code" : 400,
                "message" : "config.messages.socialProviders.cannotUnbind"
            };
        }
    } else {
        disableProvider();
    }
}
