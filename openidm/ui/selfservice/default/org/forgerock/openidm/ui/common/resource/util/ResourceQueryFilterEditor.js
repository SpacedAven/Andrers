"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/util/QueryFilterEditor", "org/forgerock/openidm/ui/common/delegates/ScriptDelegate", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate"], function ($, _, QueryFilterEditor, ScriptDelegate, ResourceDelegate) {

    var ResourceQueryFilterEditor = QueryFilterEditor.extend({
        events: {
            "change .expressionTree :input": "updateFilterNodeValue",
            "change .expressionTree": "editorOnChange",
            "click .expressionTree .add-btn": "addFilterNode",
            "click .expressionTree .remove-btn": "removeFilterNode"
        },
        model: {},

        render: function render(args, callback) {
            this.setElement(args.element);

            this.args = args;

            this.data = {
                config: {
                    ops: ["and", "or", "not", "expr"],
                    tags: ["pr", "equalityMatch", "approxMatch", "co", "greaterOrEqual", "gt", "lessOrEqual", "lt"]
                },
                showSubmitButton: false
            };

            ResourceDelegate.getSchema(args.resource.split("/")).then(_.bind(function (resourceSchema) {
                this.model.resourceSchema = resourceSchema;
                this.model.sourceProps = _.filter(_.keys(resourceSchema.properties), function (prop) {
                    var searchable = resourceSchema.properties[prop].searchable;

                    //if nativeType is available this is a system object
                    //in this case use nativeType
                    if (resourceSchema.properties[prop].nativeType) {
                        searchable = resourceSchema.properties[prop].nativeType === "string";
                    }

                    return searchable;
                }).sort();

                this.data.filterString = args.queryFilter;

                if (this.data.filterString !== "") {
                    ScriptDelegate.parseQueryFilter(this.data.filterString).then(_.bind(function (queryFilterTree) {
                        this.data.queryFilterTree = queryFilterTree;
                        this.data.filter = this.transform(this.data.queryFilterTree);
                        this.delegateEvents(this.events);
                        this.renderExpressionTree(_.bind(function () {
                            this.changeToDropdown();
                            if (callback) {
                                callback();
                            }
                        }, this));
                    }, this));
                } else {
                    this.data.filter = { "op": "none", "children": [] };
                    this.delegateEvents(this.events);
                    this.renderExpressionTree(_.bind(function () {
                        this.changeToDropdown();
                        if (callback) {
                            callback();
                        }
                    }, this));
                }
            }, this));
        },
        removeFilterNode: function removeFilterNode(event) {
            this.removeNode(event, _.bind(function () {
                this.changeToDropdown();
            }, this));
        },
        addFilterNode: function addFilterNode(event) {
            this.addNodeAndReRender(event, _.bind(function () {
                this.changeToDropdown();
            }, this));
        },
        updateFilterNodeValue: function updateFilterNodeValue(event) {
            this.updateNodeValue(event, _.bind(function () {
                this.changeToDropdown();
            }, this));
        },
        changeToDropdown: function changeToDropdown() {
            var _this = this;

            this.$el.find(".name").each(function (name, index) {
                var currentSelect = this,
                    parentHolder = $(currentSelect).closest(".node"),
                    tempValue,
                    newSelect = _this.createNameDropdown(this);

                $(currentSelect).replaceWith(newSelect);

                $(newSelect).selectize({
                    create: true
                });

                $(newSelect)[0].selectize.setValue($(newSelect).val());

                $(newSelect)[0].selectize.on('option_add', function (value, data) {
                    if (_this.model.previousSelectizeAdd !== value) {
                        _this.model.previousSelectizeAdd = "/" + value;

                        $(newSelect)[0].selectize.removeOption(value);
                        $(newSelect)[0].selectize.addOption({ value: "/" + value, text: value });
                        $(newSelect)[0].selectize.addItem("/" + value);
                    }
                });
            });

            this.editorOnChange();
        },
        createNameDropdown: function createNameDropdown(input) {
            var baseElement = $('<select style="width:100%;" class="name form-control"></select>'),
                tempValue = $(input).val(),
                displayValue;

            _.each(this.model.sourceProps, function (source) {
                if (source !== undefined) {
                    baseElement.append('<option value="/' + source + '">' + source + '</option>');
                }
            });

            if (tempValue.length > 0 && baseElement.find("option[value='/" + tempValue + "']").length === 0 && baseElement.find("option[value='/" + tempValue + "']").length === 0) {
                displayValue = tempValue.replace("/", "");

                baseElement.append('<option value="/' + tempValue + '">' + displayValue + '</option>');
            }

            baseElement.val(tempValue);

            return baseElement;
        },
        editorOnChange: function editorOnChange() {
            if (this.args.onChange) {
                this.args.onChange();
            }
        }
    });

    return ResourceQueryFilterEditor;
});
