"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView"], function ($, _, AbstractView) {
    var AdminAbstractView = AbstractView.extend({

        compareObjects: function compareObjects(property, obj1, obj2) {
            function compare(val1, val2) {
                _.each(val1, function (property, key) {
                    if (_.isEmpty(property) && !_.isNumber(property) && !_.isBoolean(property)) {
                        delete val1[key];
                    }
                });

                _.each(val2, function (property, key) {
                    if (_.isEmpty(property) && !_.isNumber(property) && !_.isBoolean(property)) {
                        delete val2[key];
                    }
                });

                return _.isEqual(val1, val2);
            }

            return compare(obj1[property], obj2[property]);
        }
    });

    return AdminAbstractView;
});
