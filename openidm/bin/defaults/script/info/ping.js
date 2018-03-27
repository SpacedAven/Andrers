/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

exports.checkState = function (request, healthinfo) {
    if (request.method !== "read") {
         throw "Unsupported operation on ping info service: " + request.method;
    }

    if (healthinfo.state !== "ACTIVE_READY") {
        throw {
            "code" : 503,
            "message" : "OpenIDM server is not ready.",
            "detail" : healthinfo
        };
    }
    return healthinfo;
}
