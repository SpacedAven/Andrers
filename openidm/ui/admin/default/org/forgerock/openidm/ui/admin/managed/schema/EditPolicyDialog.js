"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/UIUtils", "bootstrap-dialog", "org/forgerock/openidm/ui/admin/util/AdminUtils", "backbone", "backgrid", "org/forgerock/openidm/ui/common/util/BackgridUtils", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, handlebars, AbstractView, conf, uiUtils, BootstrapDialog, AdminUtils, Backbone, Backgrid, BackgridUtils, UIUtils) {
    var EditPolicyDialog = AbstractView.extend({
        template: "templates/admin/managed/schema/EditPolicyDialogTemplate.html",
        el: "#dialogs",
        model: {},
        /**
        * @param {object} args - two properties { policy: policyToBeEdited, savePolicy: functionToSaveThePolicy }
        * @param {function} callback - a function to be executed after load
        */
        render: function render(args, onLoadCallback) {
            var _this = this;

            var self = this;

            if (args.policy) {
                this.data.policy = args.policy;
                this.dialogTitle = $.t("templates.managed.schemaEditor.editPolicy");
                this.saveButtonLabel = $.t('common.form.save');
            } else {
                this.data.policy = {
                    policyId: "",
                    params: {}
                };
                this.dialogTitle = $.t("templates.managed.schemaEditor.addPolicy");
                this.saveButtonLabel = $.t('common.form.add');
            }

            this.savePolicy = args.savePolicy;

            this.data.policyParams = _.map(_.keys(this.data.policy.params), function (paramName) {
                return {
                    paramName: paramName,
                    value: _this.data.policy.params[paramName]
                };
            });

            $.when(UIUtils.preloadPartial("partials/managed/schema/_policyParamNewRow.html"), UIUtils.preloadPartial("partials/managed/schema/_policyParamEditableRow.html")).then(function () {
                _this.currentDialog = $('<div id="editPolicyDialog"></div>');

                $('#dialogs').append(_this.currentDialog);

                //change dialog
                _this.dialog = BootstrapDialog.show({
                    title: _this.dialogTitle,
                    type: BootstrapDialog.TYPE_DEFAULT,
                    message: _this.currentDialog,
                    size: BootstrapDialog.SIZE_WIDE,
                    cssClass: "objecttype-windows",
                    onshown: function onshown(dialogRef) {
                        _this.loadTemplate();

                        if (_this.onLoadCallback) {
                            _this.onLoadCallback();
                        }
                    },
                    buttons: [{
                        label: $.t('common.form.cancel'),
                        id: "editPolicyDialogCloseBtn",
                        action: function action(dialogRef) {
                            dialogRef.close();
                        }
                    }, {
                        label: _this.saveButtonLabel,
                        cssClass: "btn-primary",
                        id: "editPolicyDialogSaveBtn",
                        action: function action(dialogRef) {
                            self.setPolicy();
                            dialogRef.close();
                            self.savePolicy(self.data.policy);
                        }
                    }]
                });
            });
        },
        loadTemplate: function loadTemplate() {
            var _this2 = this;

            uiUtils.renderTemplate(this.template, this.currentDialog, _.extend({}, conf.globalData, this.data), function () {
                _this2.setupPolicyParamsGrid(_this2.data.policyParams);
            }, "replace");
        },
        /**
         *
         */
        setupPolicyParamsGrid: function setupPolicyParamsGrid(policyParams) {
            var _this3 = this;

            var self = this,
                listElement = this.currentDialog.find(".paramsList"),
                cols = [{
                name: "paramName",
                label: $.t("templates.managed.schemaEditor.parameterName"),
                cell: "string",
                sortable: false,
                editable: false
            }, {
                name: "value",
                label: $.t("templates.managed.schemaEditor.value"),
                cell: "string",
                sortable: false,
                editable: false
            }, {
                label: "",
                cell: BackgridUtils.ButtonCell([{
                    className: "fa fa-times grid-icon col-sm-1 pull-right",
                    callback: function callback(e) {
                        var itemIndex = AdminUtils.getClickedRowIndex(e);
                        _this3.data.policyParams.splice(itemIndex, 1);
                        _this3.setPolicy();
                        _this3.loadTemplate(true);
                    }
                }, {
                    // No callback necessary, the row click will trigger the edit
                    className: "fa fa-pencil grid-icon col-sm-1 pull-right"
                }]),
                sortable: false,
                editable: false
            }],
                policyParamsGrid,
                newRow;

            //empty the existing
            listElement.empty();

            newRow = $(handlebars.compile("{{> managed/schema/_policyParamNewRow}}")());

            this.model.policyParamsCollection = new Backbone.Collection(this.data.policyParams);

            policyParamsGrid = new Backgrid.Grid({
                className: "table backgrid table-hover",
                columns: BackgridUtils.addSmallScreenCell(cols),
                collection: this.model.policyParamsCollection,
                row: BackgridUtils.ClickableRow.extend({
                    callback: function callback(e) {
                        var row = $(e.target).closest("tr"),
                            paramName = this.model.get("paramName"),
                            editableRow = $(handlebars.compile("{{> managed/schema/_policyParamEditableRow}}")({
                            paramName: this.model.get("paramName"),
                            value: this.model.get("value")
                        }));

                        e.preventDefault();

                        //open policyDialog here
                        if (!$(e.target).hasClass("fa-times")) {
                            row.replaceWith(editableRow);

                            //hide the add row
                            editableRow.parent().find(".policyParamNewRow").hide();

                            editableRow.find(".cancelEditPolicyParam").click(function (e) {
                                e.preventDefault();
                                self.loadTemplate();
                            });

                            editableRow.find(".saveEditPolicyParam").click(function (e) {
                                e.preventDefault();
                                self.savePolicyParamRow(e);
                            });
                        }
                    }
                })
            });

            listElement.append(policyParamsGrid.render().el);

            listElement.find("tbody").append(newRow);

            newRow.find(".addNewPolicyParamButton").click(function (e) {
                _this3.savePolicyParamRow(e, true);
            });
        },
        savePolicyParamRow: function savePolicyParamRow(e, isNew) {
            var row = $(e.target).closest("tr"),
                paramName = row.find(".policyParamName").val(),
                paramValue = row.find(".policyParamValue").val(),
                rowIndex = AdminUtils.getClickedRowIndex(e),
                param = {
                paramName: paramName,
                value: paramValue
            };

            if (paramName.length) {
                if (isNew) {
                    this.data.policyParams.push(param);
                } else {
                    this.data.policyParams[rowIndex] = param;
                }
                this.setPolicy();
                this.loadTemplate(true);
            }
        },
        setPolicy: function setPolicy() {
            var params = {};
            this.data.policy.policyId = this.currentDialog.find(".policyId").val();

            _.each(this.data.policyParams, function (param) {
                params[param.paramName] = param.value;
            });

            this.data.policy.params = params;
        }
    });

    return new EditPolicyDialog();
});
