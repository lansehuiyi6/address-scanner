"use strict"

function isPromise(p) {
    return p && Object.prototype.toString.call(p) === "[object Promise]";
}

module.exports = class TimeoutPromise extends Promise {
    constructor(cbOrPromise, ms = 30 * 1000, hint = 'PTIMEOUT') {
        let timeout;
        let wrapperPromise = Promise.race([
            isPromise(cbOrPromise) ? cbOrPromise : new Promise(cbOrPromise),
            new Promise((resolve, reject) => {
                timeout = setTimeout(() => {
                    reject(new Error(hint));
                }, ms);
            }),
        ]);

        return wrapperPromise.then((data) => {
            clearTimeout(timeout);
            return data;
        }).catch((error) => {
            clearTimeout(timeout);
            throw error; // if timeout, reject the hint error
        })

        //   super((resolve, reject) => {
        //       wrapperPromise.then((data) => {
        //           clearTimeout(timeout);
        //           resolve(data);
        //       }).catch((error) => {
        //           clearTimeout(timeout);
        //           reject(error); // if timeout, reject the hint error
        //       })
        //   });
    }
}