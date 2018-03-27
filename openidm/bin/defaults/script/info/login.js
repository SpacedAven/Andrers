/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

(function () {
    // Get the current session's user information
    if (request.method === "read") {
        return {
            _id: "login",
            authorization: context.security.authorization,
            authenticationId: context.security.authenticationId
        };
    } else {
        throw "Unsupported operation on info login service: " + request.method;
    }
    return val;
}());
