/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * Script used to help upgrade the connectionPool settings defined in datasource.jdbc-default.json file.
 */

(function () {
    exports.upgradeConnectionPool = function (existingConnectionPool, updatedConnectionPool) {
        var connectionPoolTarget = existingConnectionPool;
        if (connectionPoolTarget['type'] === 'bonecp') {
            var setIfAbsent = function(key) {
                if (connectionPoolTarget[key] === undefined) {
                    connectionPoolTarget[key] = updatedConnectionPool[key];
                }
            }
            Object.keys(updatedConnectionPool).forEach(setIfAbsent);
            return connectionPoolTarget;
        } else {
            throw {'message' : 'The connectionPoolPatchHelper handles connectionPool entries of type bonecp only. ' +
                'Existing connectionPool: ' + JSON.stringify(existingConnectionPool) };
        }
    };
}());
