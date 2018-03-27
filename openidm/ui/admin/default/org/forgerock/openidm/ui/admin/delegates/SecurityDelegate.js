"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate"], function ($, Constants, AbstractDelegate) {

    var obj = new AbstractDelegate(Constants.host + "/" + Constants.context + "/security");

    obj.getPublicKeyCert = function (storeType, alias) {
        var promise = $.Deferred();

        this.serviceCall({
            url: "/" + storeType + "/cert/" + alias,
            type: "GET",
            "errorsHandlers": {
                "Not found": {
                    status: 404
                }
            }
        }).then(function (certDetails) {
            promise.resolve(certDetails.cert);
        }, function () {
            // not found, so return empty
            promise.resolve("");
        });

        return promise;
    };

    obj.uploadCert = function (storeType, alias, cert) {
        return this.serviceCall({
            url: "/" + storeType + "/cert/" + alias,
            type: "PUT",
            data: JSON.stringify({ "cert": cert, "alias": alias })
        });
    };

    obj.deleteCert = function (storeType, alias) {
        return this.serviceCall({
            url: "/" + storeType + "/cert/" + alias,
            type: "DELETE",
            "errorsHandlers": {
                "Not found": {
                    status: 404
                }
            }
        });
    };

    return obj;
});
