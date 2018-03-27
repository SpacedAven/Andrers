/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*global require, openidm, exports */

(function () {
    exports.updateLastChanged = function (object) {
        // Find the schema for the object type being created or updated.
        var schema = openidm.read("schema/" + resourceName.head(2).toString());
        if (schema && schema.properties && schema.properties.lastChanged) {
            object.lastChanged = { "date" : java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC).toString() };
        }
    };
}());
