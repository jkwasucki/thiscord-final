"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
// Import the functions you need from the SDKs you need
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
const firebaseConfig = {
    apiKey: "AIzaSyD33w1TK9bLzqtQuKzZ4-h0EV80ZG1ojM4",
    authDomain: "dscrd-cca37.firebaseapp.com",
    projectId: "dscrd-cca37",
    storageBucket: "dscrd-cca37.appspot.com",
    messagingSenderId: "669101095211",
    appId: "1:669101095211:web:e1682962bfeb1adc072d6e",
    measurementId: "G-4X9RWMLEVM"
};
// Initialize Firebase
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.storage = (0, storage_1.getStorage)(app);
