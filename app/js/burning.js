/** @license copyright 2015 xmondox + chromeisburning.com, all rights reserved */
/** @license this file is licensed under the MIT license to any recipient */


var src = chrome.extension.getURL('app/index.html');

window.stop();
document.open();
document.write('');
document.close();


void function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET',src);
    xhr.onload = function() {
        document.open();
        document.write(this.response);
        document.close();
    };
    xhr.send();
}();




var getblob = function(photox) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET',photox.url);
    xhr.responseType = 'blob';
    xhr.onload = function() {
        var inner = document.getElementById(photox.options.eid);
        if (!inner) {
            // todo: figure out why this happens
            // the img element isn't (maybe no longer) on the page ...
            console.log('photoize.missing',photox,xhr);
            debugger;
            return;
        }
        var parent = inner.parentNode;
        var url = URL.createObjectURL(xhr.response);

        var image = inner.cloneNode();
        for (var ii in inner)
            if (inner.hasOwnProperty(ii))
                image[ii] = inner[ii];
        image.src = url;
        parent.replaceChild(image, inner);
    };
    xhr.send();
};

chrome.runtime.onMessage.addListener(getblob);


