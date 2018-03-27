/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*global object */

var userId = object._id,
    notificationPointer,
    findUserNotificationsParams = {
        "_queryId": "get-notifications-for-user",
        "userId": userId
    },
    notificationQueryResult;

notificationQueryResult = openidm.query("repo/ui/notification", findUserNotificationsParams);
if (notificationQueryResult.result && notificationQueryResult.result.length!==0) {

    for (notificationPointer=0;notificationPointer<notificationQueryResult.result.length;notificationPointer++) {
        var notification = notificationQueryResult.result[notificationPointer];
        openidm['delete']('repo/ui/notification/' + notification._id, notification._rev);
    }

}

// delete idpData related to this user
try {
    openidm.query("managed/user/" + object._id + "/idps",
        { "_queryFilter": "true"}, ["*"]).result.forEach(function (relationship) {
        openidm['delete'](relationship._ref, relationship._rev);
    });
} catch (e) {
    // no problem, simply unable to find an /idps endpoint
}
