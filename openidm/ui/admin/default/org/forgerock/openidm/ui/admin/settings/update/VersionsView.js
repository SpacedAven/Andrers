"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "backgrid", "bootstrap-dialog", "backbone", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/openidm/ui/common/delegates/InfoDelegate", "org/forgerock/openidm/ui/common/util/BackgridUtils", "org/forgerock/commons/ui/common/util/DateUtil", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/admin/delegates/MaintenanceDelegate", "org/forgerock/openidm/ui/admin/delegates/ClusterDelegate"], function ($, _, Handlebars, Backgrid, BootstrapDialog, Backbone, AdminAbstractView, InfoDelegate, BackgridUtils, DateUtil, Constants, MaintenanceDelegate, ClusterDelegate) {

    var VersionsView = AdminAbstractView.extend({
        template: "templates/admin/settings/update/VersionsTemplate.html",
        element: "#versionsView",
        noBaseTemplate: true,
        events: {
            "click .checkUpdatesAvailable": "checkUpdatesAvailable",
            "click .closeErrorMsg": "closeErrorMsg"
        },
        data: {
            "errorMessage": false,
            "version": "",
            "revision": "",
            "noVersions": false,
            "updateCLI": false,
            "docHelpUrl": Constants.DOC_URL
        },
        model: {},
        partials: ["partials/settings/_updateVersionGridArchive.html"],

        /**
         * If not in a clustered environment and there are version they will be rendered
         *
         * @param {object} configs
         * @param {object} configs.errorMsg - the error message to display, if any
         * @param {object} configs.archiveSelected - the function called when an archive is selected
         * @param [callback]
         */
        render: function render(configs, callback) {
            var Versions = new Backbone.Collection();

            this.data.errorMessage = configs.errorMsg || false;
            this.model.archiveSelected = configs.archiveSelected;

            InfoDelegate.getVersion().then(_.bind(function (data) {
                this.data.version = data.productVersion;
                this.data.revision = data.productRevision;

                MaintenanceDelegate.availableUpdateVersions().then(_.bind(function (data) {

                    _.each(data, function (models) {
                        _.each(models, function (model) {
                            if (model.reason) {
                                this.data.errorMessage = model.reason;
                                this.data.revision = $.t("templates.update.versions.badRevision");
                            }
                            Versions.add(model);
                        }, this);
                    }, this);

                    this.data.noVersions = data.updates.length === 0;

                    ClusterDelegate.getNodes().then(_.bind(function (data) {

                        // There is only 1 node running, you can update using ui.
                        if (_.filter(data.results, { "state": "running" }).length === 1) {
                            this.init(true, Versions, callback);

                            // There is more than 1 node running, must use CLI.
                        } else {
                            this.data.updateCLI = true;
                            this.init(false, Versions, callback);
                        }
                    }, this), _.bind(function () {
                        this.data.errorMessage = $.t("templates.update.versions.failedClusterInfo");
                        this.init(false, Versions, callback);
                    }, this)); // END GET IS CLUSTERED
                }, this), _.bind(function (data) {

                    this.data.noVersions = true;
                    this.init(false, [], callback);
                }, this)); // END GET AVAILABLE VERSIONS
            }, this)); // END GET CURRENT VERSION
        },

        closeErrorMsg: function closeErrorMsg(e) {
            if (e) {
                e.preventDefault();
            }
            this.$el.find("#updateInstallError").hide();
        },

        checkUpdatesAvailable: function checkUpdatesAvailable(e) {
            if (e) {
                e.preventDefault();
            }

            this.render(this.model);
        },

        init: function init(updateable, Versions, callback) {
            var versionGrid,
                self = this;

            this.parentRender(_.bind(function () {
                if (Versions.length > 0 && updateable) {
                    versionGrid = new Backgrid.Grid({
                        className: "table backgrid",
                        emptyText: $.t("templates.update.versions.noVersionsBG"),
                        columns: BackgridUtils.addSmallScreenCell([{
                            label: $.t("templates.update.versions.file"),
                            name: "archive",
                            cell: Backgrid.Cell.extend({
                                className: "col-md-5",
                                render: function render() {
                                    var date;

                                    if (this.model.get("fileDate")) {
                                        date = DateUtil.formatDate(this.model.get("fileDate"), "MMM dd, yyyy");
                                    } else {
                                        date = "";
                                    }

                                    this.$el.html(Handlebars.compile("{{> settings/_updateVersionGridArchive}}")({
                                        "archive": this.model.get("archive"),
                                        "version": this.model.get("toVersion"),
                                        "date": date
                                    }));

                                    return this;
                                }
                            }),
                            sortable: false,
                            editable: false
                        }, {
                            name: "",
                            cell: Backgrid.Cell.extend({
                                className: "col-md-5",
                                render: function render() {
                                    var description;
                                    if (this.model.get("description")) {
                                        description = this.model.get("description");
                                    } else {
                                        description = $.t("templates.update.versions.badBinary");
                                    }
                                    this.$el.html("<span class='version-description'>" + description + "</span>");
                                    return this;
                                }
                            }),
                            sortable: false,
                            editable: false
                        }, {
                            name: "",
                            cell: Backgrid.Cell.extend({
                                events: {
                                    "click .test": "openDialog"
                                },
                                className: "col-md-2",

                                render: function render() {
                                    var disable, button;

                                    if (this.model.get("reason")) {
                                        disable = "disabled";
                                    }
                                    button = '<button type="button" class="test pull-right btn btn-primary btn-sm"' + disable + '>' + $.t("templates.update.versions.install") + '</button>';

                                    this.$el.html(button);
                                    this.delegateEvents();
                                    return this;
                                },

                                openDialog: function openDialog() {
                                    BootstrapDialog.show({
                                        title: $.t("templates.update.versions.enableMaintenanceMode"),
                                        type: "type-default",
                                        message: $.t("templates.update.versions.enableMaintenanceModeDesc"),
                                        buttons: [{
                                            label: $.t('common.form.cancel'),
                                            action: function action(dialog) {
                                                dialog.close();
                                            }
                                        }, {
                                            label: $.t("templates.update.versions.confirmAndInstall"),
                                            cssClass: "btn-primary",
                                            action: _.bind(function (dialog) {
                                                self.model.archiveSelected(this.model);
                                                dialog.close();
                                            }, this)
                                        }]
                                    });
                                }
                            }),
                            sortable: false,
                            editable: false
                        }], true),
                        collection: Versions
                    });

                    this.$el.find("#versionGrid").append(versionGrid.render().el);
                }

                if (callback) {
                    callback();
                }
            }, this));
        }
    });

    return new VersionsView();
});
