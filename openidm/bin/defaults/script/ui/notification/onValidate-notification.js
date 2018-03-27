/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * @author jdabrowski
 * 
 * This script validates if notification is valid.
 */

/*global object */

var errors = [];

function requiredValidator(toValidate, fieldName) {
    if (!toValidate || toValidate === "") {
        errors.push(fieldName + " is required");
    }
}

function isNotificationValid() {
    var notification = openidm.decrypt(object);
    
    if ( (!notification.requester || notification.requester === "") 
            && (!notification.requesterId || notification.requesterId === "") ) {
        errors.push("Notification Requester or Requester ID is required");
    }
    
    requiredValidator(notification.receiverId, "Notification Receiver");
    requiredValidator(notification.createDate, "Create Date");
    requiredValidator(notification.type, "Notification Type");
    requiredValidator(notification.message, "Notification Message");
    
    if(errors.length > 0) {
        throw errors;
    }
}

isNotificationValid();
