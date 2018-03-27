"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/openidm/ui/admin/util/TreeGridUtils", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/util/DateUtil", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/SpinnerManager", "org/forgerock/openidm/ui/admin/delegates/MaintenanceDelegate"], function ($, _, Handlebars, AdminAbstractView, TreeGridUtils, UIUtils, DateUtil, Constants, SpinnerManager, MaintenanceDelegate) {

    var InstallationReportView = AdminAbstractView.extend({
        template: "templates/admin/settings/update/InstallationReportTemplate.html",
        element: "#installationReportView",
        noBaseTemplate: true,
        events: {
            "click .treegrid-expander": "showHideNode",
            "click .collapse-treegrid": "collapseTreegrid",
            "click .expand-treegrid": "expandTreegrid",
            "click .back": "back"
        },
        partials: ["partials/settings/_updateTreeGrid.html"],
        data: {
            "treeGrid": {},
            "responseJSON": "",
            "version": ""
        },
        model: {},

        /**
         * @param configs
         * @param configs.response {object}
         * @param configs.version {string}
         * @param configs.error {function}
         * @param configs.back {function}
         * @param [callback]
         */
        render: function render(configs, callback) {
            // Manipulating the treegrid could take a few seconds given enough data, so we invoke the spinner manually.
            SpinnerManager.showSpinner();

            this.model = configs;
            this.data = _.extend(this.data, _.pick(this.model, ["treeGrid", "responseJSON", "version"]));
            this.data.docHelpUrl = Constants.DOC_URL;

            if (configs.isHistoricalInstall) {
                this.data.isHistoricalInstall = true;
                this.data.date = DateUtil.formatDate(this.model.response.endDate, "MMM dd, yyyy");
                this.data.user = this.model.response.userName;

                if (configs.response.status === "FAILED") {
                    this.data.failed = true;
                }
            }

            MaintenanceDelegate.getLogDetails(this.model.runningID).then(function (logData) {
                this.model.response.files = logData.files;

                UIUtils.preloadPartial("partials/settings/_updateStatePopover.html").then(_.bind(function () {
                    this.data.treeGrid = TreeGridUtils.filepathToTreegrid("filePath", this.formatFiles(), ["filePath", "actionTaken"]);

                    if (this.model.response) {
                        this.data.responseJSON = JSON.stringify(this.model.response);
                    }

                    this.parentRender(_.bind(function () {
                        SpinnerManager.hideSpinner();

                        this.$el.find('[data-toggle="popover"]').popover({
                            placement: 'top',
                            container: 'body',
                            title: ''
                        });

                        if (callback) {
                            callback();
                        }
                    }, this));
                }, this));
            }.bind(this));
        },

        back: function back(e) {
            if (e) {
                e.preventDefault();
            }
            this.model.back();
        },

        collapseTreegrid: function collapseTreegrid(e) {
            if (e) {
                e.preventDefault();
            }

            // Manipulating the treegrid could take a few seconds given enough data, so we invoke the spinner manually.
            SpinnerManager.showSpinner();

            // The delay is to ensure that the spinner is rendered before any resource heavy rendering
            // beings, otherwise the spinner may not show at all.
            _.delay(_.bind(function () {
                this.$el.find(".node-container").hide();
                this.$el.find(".treegrid-expander").toggleClass("fa-caret-right", true);
                this.$el.find(".treegrid-expander").toggleClass("fa-caret-down", false);
                SpinnerManager.hideSpinner();
            }, this), 1);
        },

        expandTreegrid: function expandTreegrid(e) {
            if (e) {
                e.preventDefault();
            }

            // Manipulating the treegrid could take a few seconds given enough data, so we invoke the spinner manually.
            SpinnerManager.showSpinner();

            // The delay is to ensure that the spinner is rendered before any resource heavy rendering
            // beings, otherwise the spinner may not show at all.
            _.delay(_.bind(function () {
                this.$el.find(".node-container").show();
                this.$el.find(".treegrid-expander").toggleClass("fa-caret-right", false);
                this.$el.find(".treegrid-expander").toggleClass("fa-caret-down", true);
                SpinnerManager.hideSpinner();
            }, this), 1);
        },

        showHideNode: function showHideNode(e) {
            if (e) {
                e.preventDefault();
            }

            $(e.currentTarget).siblings("div").toggle();
            $(e.currentTarget).toggleClass("fa-caret-right");
            $(e.currentTarget).toggleClass("fa-caret-down");
        },

        formatFiles: function formatFiles() {
            var formattedFileList,
                files = _.clone(this.model.response.files, true);

            formattedFileList = _.map(files, function (file) {
                var temp = file.filePath.split("/");
                file.actionTaken = Handlebars.compile("{{> settings/_updateStatePopover}}")({
                    "desc": $.t("templates.update.review.actionTaken." + file.actionTaken + ".desc"),
                    "name": $.t("templates.update.review.actionTaken." + file.actionTaken + ".reportName")
                });
                file.fileName = _.last(temp);
                file.partialFilePath = _.take(temp, temp.length - 1).join("");
                return file;
            });

            return _.sortByAll(formattedFileList, [function (i) {
                if (i.partialFilePath.length > 0) {
                    return i.partialFilePath.toLowerCase();
                } else {
                    return false;
                }
            }, function (i) {
                return i.fileName.toLowerCase();
            }]);
        }
    });

    return new InstallationReportView();
});