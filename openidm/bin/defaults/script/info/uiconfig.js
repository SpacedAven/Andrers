/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

(function () {
    // Get the current session's user information
    if (request.method === "read") {
        config = openidm.read("config/ui/configuration");
        config.configuration.lang = language || config.configuration.lang;
        return config;
    } else {
        throw "Unsupported operation on info uiconfig service: " + request.method;
    }
}());
