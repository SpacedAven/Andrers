"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/SpinnerManager", "org/forgerock/commons/ui/common/main/Router"], function ($, _, Constants, AbstractDelegate, configuration, eventManager, spinner, router) {

    var obj = new AbstractDelegate(Constants.host + "/" + Constants.context + "/recon");

    obj.waitForAll = function (reconIds, suppressSpinner, progressCallback, delayTime) {
        var resultPromise = $.Deferred(),
            completedRecons = [],
            _checkCompleted,
            startView = router.currentRoute.view;

        if (!delayTime) {
            delayTime = 1000;
        }

        _checkCompleted = function checkCompleted() {
            /**
            * Check to make sure we are still on the same page we were when this process
            * started. If not then cancel the process so ajax requests
            * will not continue to fire in the background.
            */
            if (router.currentRoute.view === startView) {
                obj.serviceCall({
                    "type": "GET",
                    "url": "/" + reconIds[completedRecons.length],
                    "suppressSpinner": suppressSpinner,
                    "errorsHandlers": {
                        "Not found": {
                            status: 404
                        }
                    }
                }).then(function (reconStatus) {

                    if (progressCallback) {
                        progressCallback(reconStatus);
                    }

                    if (reconStatus.ended.length !== 0) {
                        completedRecons.push(reconStatus);
                        if (completedRecons.length === reconIds.length) {
                            resultPromise.resolve(completedRecons);
                        } else {
                            _.delay(_checkCompleted, delayTime);
                        }
                    } else {
                        if (!suppressSpinner) {
                            spinner.showSpinner();
                        }
                        _.delay(_checkCompleted, delayTime);
                    }
                }, function () {
                    // something went wrong with the read on /recon/_id, perhaps this recon was interrupted during a restart of the server?

                    completedRecons.push({
                        "reconId": reconIds[completedRecons.length],
                        "status": "failed"
                    });

                    if (completedRecons.length === reconIds.length) {
                        resultPromise.resolve(completedRecons);
                    } else {
                        _.delay(_checkCompleted, delayTime);
                    }
                });
            } else {
                resultPromise.reject();
            }
        };

        if (!suppressSpinner) {
            spinner.showSpinner();
        }
        _.delay(_checkCompleted, 100);

        return resultPromise;
    };

    obj.triggerRecons = function (mappings, suppressSpinner) {
        var reconIds = [],
            reconPromises = [];

        _.each(mappings, function (m) {
            reconPromises.push(obj.serviceCall({
                "suppressSpinner": suppressSpinner,
                "url": "?_action=recon&mapping=" + m,
                "type": "POST"
            }).then(function (reconId) {
                reconIds.push(reconId._id);
            }));
        });

        return $.when.apply($, reconPromises);
    };

    obj.triggerRecon = function (mapping, suppressSpinner, progressCallback, delayTime) {
        return obj.serviceCall({
            "suppressSpinner": suppressSpinner,
            "url": "?_action=recon&mapping=" + mapping,
            "type": "POST"
        }).then(function (reconId) {

            return obj.waitForAll([reconId._id], suppressSpinner, progressCallback, delayTime).then(function (reconArray) {
                return reconArray[0];
            });
        });
    };

    obj.triggerReconById = function (mapping, id, suppressSpinner) {

        return obj.serviceCall({
            "suppressSpinner": suppressSpinner,
            "url": "?_action=reconById&mapping=" + mapping + "&ids=" + id,
            "type": "POST"
        }).then(function (reconId) {
            return obj.waitForAll([reconId._id], suppressSpinner);
        });
    };

    obj.stopRecon = function (id, suppressSpinner) {
        return obj.serviceCall({
            "suppressSpinner": suppressSpinner,
            "serviceUrl": "/" + Constants.context + "/recon/" + id,
            "url": "?_action=cancel",
            "type": "POST"
        });
    };

    obj.getNewLinksFromRecon = function (reconId, endDate) {
        var newLinks = [],
            prom = $.Deferred(),
            linkPromArray = [],
            queryFilter = 'reconId eq "' + reconId + '" and !(entryType eq "summary") and timestamp gt "' + endDate + '"',
            getTargetObj = _.bind(function (link) {
            return this.serviceCall({
                "type": "GET",
                "serviceUrl": "/" + Constants.context + "/" + link.targetObjectId,
                "url": ""
            }).then(function (targetObject) {
                newLinks.push({ sourceObjectId: link.sourceObjectId, targetObject: targetObject });
                return;
            });
        }, this);

        /**
         * when there is no endDate we know the recon is running
         * in this case there is no need to run this query as no
         * new links can be added to a recon unless there is an endDate
         */
        if (!endDate) {
            prom.resolve([]);
        } else {
            this.serviceCall({
                "type": "GET",
                "serviceUrl": "/" + Constants.context + "/audit/recon",
                "url": "?_queryFilter=" + encodeURIComponent(queryFilter)
            }).then(function (qry) {
                if (qry.result.length) {
                    _.each(qry.result, function (link) {
                        linkPromArray.push(getTargetObj(link));
                    });

                    $.when.apply($, linkPromArray).then(function () {
                        prom.resolve(newLinks);
                    });
                } else {
                    return prom.resolve([]);
                }
            });
        }

        return prom;
    };

    obj.getLastAuditForObjectId = function (reconId, objectIdType, objectId) {
        var queryFilter = 'reconId eq "' + reconId + '" and ' + objectIdType + ' eq "' + objectId + '"';
        return obj.serviceCall({
            "type": "GET",
            "serviceUrl": "/" + Constants.context + "/audit/recon",
            "url": "?_queryFilter=" + encodeURIComponent(queryFilter)
        });
    };

    return obj;
});
