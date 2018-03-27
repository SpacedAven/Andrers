"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "backbone", "bootstrap", "bootstrap-dialog", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/openidm/ui/admin/util/TreeGridUtils", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/SpinnerManager", "org/forgerock/openidm/ui/admin/delegates/MaintenanceDelegate"], function ($, _, Handlebars, Backbone, Bootstrap, BootstrapDialog, AdminAbstractView, TreeGridUtils, UIUtils, Constants, SpinnerManager, MaintenanceDelegate) {

    var InstallPreviewView = AdminAbstractView.extend({
        template: "templates/admin/settings/update/InstallationPreviewTemplate.html",
        element: "#installationPreviewView",
        noBaseTemplate: true,
        events: {
            "click .show-modified-files": "showModifiedTreegrid",
            "click .show-all-files": "showAllTreegrid",
            "click #cancelUpdate": "cancelUpdate",
            "click #installUpdate": "installUpdate",
            "click .treegrid-expander": "showHideNode",
            "click .collapse-treegrid": "collapseTreegrid",
            "click .expand-treegrid": "expandTreegrid"
        },
        partials: ["partials/settings/_updateTreeGrid.html", "partials/settings/_updateReposGrid.html"],
        data: {
            "version": "",
            "link": false,
            "modifiedFilesExist": true,
            "repoUpdatesExist": false,
            "all": false,
            "treeGrid": {}
        },
        model: {},

        /**
         * @param configs {object}
         * @param configs.files {array}
         * @param configs.archiveModel {object}
         * @param configs.install {function}
         * @param configs.cancel {function}
         * @param configs.error {function}
         * @param [callback]
         */
        render: function render(configs, callback) {
            var _this = this;

            this.model = configs.model || configs;
            if (configs.data) {
                this.data = _.extend(this.data, configs.data);
            }

            // Manipulating the treegrid could take a few seconds given enough data, so we invoke the spinner manually.
            SpinnerManager.showSpinner();

            // This partial is used before the parent render where it would normally be loaded.
            UIUtils.preloadPartial("partials/settings/_updateStatePopover.html").then(function () {

                _this.data.link = _this.model.archiveModel.get("resource");
                _this.data.version = _this.model.archiveModel.get("toVersion");

                if (_this.data.all && _.has(_this.model, "allTreeGrid")) {
                    _this.data.treeGrid = _this.model.allTreeGrid;
                } else if (!_this.data.all && _.has(_this.model, "modifiedTreeGrid")) {
                    _this.data.treeGrid = _this.model.modifiedTreeGrid;
                } else {
                    _this.data.treeGrid = TreeGridUtils.filepathToTreegrid("filePath", _this.formatFiles(_this.data.all), ["filePath", "fileState"]);

                    if (_this.data.all) {
                        _this.model.allTreeGrid = _this.data.treeGrid;
                    } else {
                        _this.model.modifiedTreeGrid = _this.data.treeGrid;
                    }
                }

                _this.parentRender(function () {
                    SpinnerManager.hideSpinner();
                    $('[data-toggle="popover"]').popover();

                    if (_this.data.repoUpdatesExist) {
                        _this.$el.find('#previewWrapper').hide();
                        _this.model.repoUpdates({ "model": _this.model, "data": _this.data });
                    }

                    if (callback) {
                        callback();
                    }
                });
            });
        },

        showModifiedTreegrid: function showModifiedTreegrid(e) {
            if (e) {
                e.preventDefault();
            }

            this.$el.find(".filter-file-list").toggleClass("active", false);
            $(e.currentTarget).toggleClass("active");
            this.data.all = false;
            this.render({ "data": this.data, "model": this.model });
        },

        showAllTreegrid: function showAllTreegrid(e) {
            if (e) {
                e.preventDefault();
            }

            this.$el.find(".filter-file-list").toggleClass("active", false);
            $(e.currentTarget).toggleClass("active");
            this.data.all = true;
            this.render({ "data": this.data, "model": this.model });
        },

        installUpdate: function installUpdate(e) {
            var _this2 = this;

            if (e) {
                e.preventDefault();
            }

            MaintenanceDelegate.getLicense(this.model.archiveModel.get("archive")).then(function (response) {
                if (response.license) {

                    var self = _this2;
                    BootstrapDialog.show({
                        title: $.t("templates.update.preview.licenseAgreement"),
                        type: "type-default",
                        message: response.license,
                        cssClass: "scrollingLicenseAgreement",
                        buttons: [{
                            label: $.t('common.form.cancel'),
                            action: _.bind(function (dialog) {
                                dialog.close();
                                this.model.cancel();
                            }, _this2)
                        }, {
                            label: $.t("templates.update.preview.acceptLicense"),
                            cssClass: "btn-primary",
                            action: _.bind(function (dialog) {
                                dialog.close();
                                self.showUpdatesOrInstall();
                            }, _this2)
                        }]
                    });
                } else {
                    _this2.showUpdatesOrInstall();
                }
            }, function () {
                _this2.model.error($.t("templates.update.preview.errorInitiatingUpdate"));
            });
        },

        showUpdatesOrInstall: function showUpdatesOrInstall() {
            var _this3 = this;

            MaintenanceDelegate.getRepoUpdates(this.model.archiveModel.get("archive")).then(function (data) {
                if (data && data.length > 0) {
                    _this3.data.repoUpdatesList = data;
                    _this3.data.repoUpdatesExist = true;
                    _this3.model.repoUpdates({ "archiveModel": _this3.model.archiveModel, "data": _this3.data, "files": _this3.model.files });
                } else {
                    _this3.model.install(_this3.model.archiveModel, _this3.data.repoUpdatesList);
                }
            });
        },

        cancelUpdate: function cancelUpdate(e) {
            if (e) {
                e.preventDefault();
            }

            this.model.cancel();
        },

        collapseTreegrid: function collapseTreegrid(e) {
            var _this4 = this;

            // Manipulating the treegrid could take a few seconds given enough data, so we invoke the spinner manually.
            SpinnerManager.showSpinner();

            // The delay is to ensure that the spinner is rendered before any resource heavy rendering
            // beings, otherwise the spinner may not show at all.
            _.delay(function () {
                _this4.$el.find(".node-container").hide();
                _this4.$el.find(".treegrid-expander").toggleClass("fa-caret-right", true);
                _this4.$el.find(".treegrid-expander").toggleClass("fa-caret-down", false);
                SpinnerManager.hideSpinner();
            }, 1);
        },

        expandTreegrid: function expandTreegrid(e) {
            var _this5 = this;

            // Manipulating the treegrid could take a few seconds given enough data, so we invoke the spinner manually.
            SpinnerManager.showSpinner();

            // The delay is to ensure that the spinner is rendered before any resource heavy rendering
            // beings, otherwise the spinner may not show at all.
            _.delay(function () {
                _this5.$el.find(".node-container").show();
                _this5.$el.find(".treegrid-expander").toggleClass("fa-caret-right", false);
                _this5.$el.find(".treegrid-expander").toggleClass("fa-caret-down", true);
                SpinnerManager.hideSpinner();
            }, 1);
        },

        showHideNode: function showHideNode(e) {
            $(e.currentTarget).siblings("div").toggle();
            $(e.currentTarget).toggleClass("fa-caret-right");
            $(e.currentTarget).toggleClass("fa-caret-down");
        },

        formatFiles: function formatFiles(all) {
            var formattedFileList = [],
                files = _.clone(this.model.files, true);

            if (all) {
                formattedFileList = _.map(files, function (file) {
                    var temp = file.filePath.split("/");
                    file.fileState = Handlebars.compile("{{> settings/_updateStatePopover}}")({
                        "desc": $.t("templates.update.preview.fileStates." + file.fileState + ".desc"),
                        "name": $.t("templates.update.preview.fileStates." + file.fileState + ".previewName")
                    });
                    file.fileName = _.last(temp);
                    file.partialFilePath = _.take(temp, temp.length - 1).join("");
                    return file;
                });
            } else {
                files = _.filter(files, function (file) {
                    return _.has(file, "fileState") && file.fileState !== "UNCHANGED";
                });

                if (files.length === 0) {
                    this.data.modifiedFilesExist = false;
                    this.data.all = true;
                    this.render(_.extend(this.data, this.model));
                } else {
                    formattedFileList = _.map(files, function (file) {
                        var temp = file.filePath.split("/");
                        file.fileState = Handlebars.compile("{{> settings/_updateStatePopover}}")({
                            "desc": $.t("templates.update.preview.fileStates." + file.fileState + ".desc"),
                            "name": $.t("templates.update.preview.fileStates." + file.fileState + ".previewName")
                        });
                        file.fileName = _.last(temp);
                        file.partialFilePath = _.take(temp, temp.length - 1).join("");
                        return file;
                    });
                }
            }

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

    return new InstallPreviewView();
});
