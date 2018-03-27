"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, Constants, AbstractDelegate, eventManager) {

    var obj = new AbstractDelegate(Constants.host + "/" + Constants.context + "/system");

    obj.connectorDelegateCache = {};

    obj.availableConnectors = function () {
        return obj.serviceCall({
            url: "?_action=availableConnectors",
            type: "POST"
        });
    };

    obj.detailsConnector = function (connectorParams) {
        return obj.serviceCall({
            url: "?_action=createCoreConfig",
            type: "POST",
            data: JSON.stringify(connectorParams)
        });
    };

    obj.testConnector = function (connectorParams) {
        var errorHandlers = {
            "error": {
                status: "500"
            }
        };

        return obj.serviceCall({
            url: "?_action=createFullConfig",
            type: "POST",
            data: JSON.stringify(connectorParams),
            errorsHandlers: errorHandlers
        });
    };

    obj.currentConnectors = function () {
        var deferred = $.Deferred(),
            promise = deferred.promise();

        if (obj.connectorDelegateCache.currentConnectors) {
            deferred.resolve(_.clone(obj.connectorDelegateCache.currentConnectors));
        } else {
            obj.serviceCall({
                url: "?_action=test",
                type: "POST"
            }).then(function (result) {
                obj.connectorDelegateCache.currentConnectors = result;

                deferred.resolve(result);
            });
        }

        return promise;
    };

    obj.queryConnector = function (name) {
        return obj.serviceCall({
            url: "/" + name + "?_queryId=query-all-ids",
            type: "GET"
        });
    };

    obj.deleteCurrentConnectorsCache = function () {
        delete obj.connectorDelegateCache.currentConnectors;
    };

    obj.connectorDefault = function (name, type) {
        return $.ajax({
            dataType: "json",
            type: "GET",
            url: "templates/admin/connector/configs/" + type + "/" + name + ".json"
        });
    };

    obj.templateCheck = function (name) {
        return $.ajax({
            type: "GET",
            url: "templates/admin/connector/" + name + ".html"
        });
    };

    obj.getConnectorsOfType = function (bundleName) {
        return obj.currentConnectors().then(function (currentConnectors) {
            return _.reject(currentConnectors, function (connector) {
                return bundleName !== connector.connectorRef.bundleName;
            });
        });
    };

    return obj;
});
