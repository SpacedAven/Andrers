/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*global version */

(function () {
    if (request.method !== "read") {
         throw "Unsupported operation on info version service: " + request.method;
    }
    
    return version;
}());
