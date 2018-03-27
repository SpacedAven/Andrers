"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, AdminAbstractView, ConfigDelegate, EventManager, Constants) {

    var auditDataChanges = {},
        auditData = {},
        AuditAdminAbstractView = AdminAbstractView.extend({
        retrieveAuditData: function retrieveAuditData(callback) {
            ConfigDelegate.readEntity("audit").then(_.bind(function (data) {
                auditDataChanges = _.clone(data, true);
                auditData = _.clone(data, true);
                if (callback) {
                    callback();
                }
            }, this));
        },

        getAuditData: function getAuditData() {
            return _.clone(auditDataChanges, true);
        },

        getTopics: function getTopics() {
            return _.union(_.keys(_.clone(auditDataChanges.eventTopics, true)), ["authentication", "access", "activity", "recon", "sync", "config"]);
        },

        setProperties: function setProperties(properties, object) {
            _.each(properties, function (prop) {
                if (_.isEmpty(object[prop]) && !_.isNumber(object[prop]) && !_.isBoolean(object[prop])) {
                    delete auditDataChanges[prop];
                } else {
                    auditDataChanges[prop] = object[prop];
                }
            }, this);
        },

        setFilterPolicies: function setFilterPolicies(policies) {
            auditDataChanges.auditServiceConfig.filterPolicies = policies;
        },

        setUseForQueries: function setUseForQueries(event) {
            // event handler used for queries must be enabled
            _.find(auditDataChanges.eventHandlers, function (eventHandler) {
                return eventHandler.config.name === event;
            }).config.enabled = true;
            auditDataChanges.auditServiceConfig.handlerForQueries = event;
        },

        saveAudit: function saveAudit(callback) {
            ConfigDelegate.updateEntity("audit", auditDataChanges).then(_.bind(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "auditSaveSuccess");
                auditData = _.clone(auditDataChanges, true);

                if (callback) {
                    callback();
                }
            }, this));
        }
    });

    return AuditAdminAbstractView;
});
