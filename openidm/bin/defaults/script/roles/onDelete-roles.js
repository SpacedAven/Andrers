/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * Prevents roles from being deleted that are currently assigned to users
 */

/*global object */

// Query members of a role
var resourcePath = "managed/role/" +  org.forgerock.http.util.Uris.urlEncodePathElement(object._id) + "/members";
var users = openidm.query(resourcePath, {"_queryFilter": "true"}, ["*"]).result;

if (users.length > 0) {
    throw {
        "code" : 409,
        "message" : "Cannot delete a role that is currently granted"
    };
}
