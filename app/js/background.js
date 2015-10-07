/** @license copyright 2015 xmondox + chromeisburning.com, all rights reserved */
/** @license this file is licensed under the MIT license to any recipient */


(function() {




var Owner = function() {
    this.welcome = 'app/welcome.html';
    this.oauthurl = null; // loaded dynamically
    this.sender = null;
    this.port = null;
    this.nextAuth = false;
    this.loadurl();
};
Owner.prototype = {
    loadurl: function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET',this.welcome);
        xhr.responseType = 'text';
        var self = this;
        xhr.onload = function() {
            var parser = new DOMParser();
            var dom = parser.parseFromString(this.responseText,'text/html');
            var link = dojo.query('a',dom)[0];
            self.oauthurl = link.href;
        };
        xhr.send();
    },
    ajaxproxy: function(payload,sender,callback) {
        var req = payload.req, token = payload.token;
        var xhr = new XMLHttpRequest();
        xhr.open(req.type, req.url);

        xhr.responseType = 'json';

        // handle user agent using webRequest.onBeforeSendHeaders.addListener instead
        // chrome "Refused to set unsafe header "User-Agent""
        // request.setRequestHeader('User-Agent', 'Tinder Android Version 3.3.2');

        // mlike and mpass use x-www ... sniffed with mitm
        // KLUDGE: should be encoded in make_mlike, keep a reference here as a reminder :(
        if (false)
            var unused = this.higgs.make_mlike('XXXX');
        var ismlike = req.type=='POST' && req.url.startsWith('https://api.gotinder.com/moment/');
        var ct = ismlike
            ? 'application/x-www-form-urlencoded'
            : 'application/json; charset=utf-8';


        xhr.setRequestHeader(     'platform', 'android'  );
        xhr.setRequestHeader( 'X-Auth-Token',  token     );
        xhr.setRequestHeader(   'os-version',  18        );
        xhr.setRequestHeader(  'app-version',  763       );
        xhr.setRequestHeader( 'Content-Type',  ct        );

        var self = this;
        // event handlers: this:xhr, arguments:[XMLHttpRequestProgressEvent]
        xhr.onload = function() {
            // AjaxproxyData
            var reply = { iserror:false, response:this.response, status:this.status };
            callback(reply);
        };
        xhr.onerror = function() {
            // AjaxproxyData
            var reply = { iserror:true, response:this.response, status:this.status };
            callback(reply);
        };

        this.saved_xhr = [req,xhr];

        if (req.type==='POST')
            xhr.send(JSON.stringify(req.data || {}));
        else xhr.send();

        return true;
    },
    ajaxImage: function(url,cb) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            var blb = new Blob([xhr.response], {type: 'image/png'});
            var url = (window.URL || window.webkitURL).createObjectURL(blb);
            cb(url,blb);
        };
        xhr.open('GET',url);
        xhr.send();
    },
    photoize: function(xx,sender,sendee) {
        console.log('photox',xx);
        var url=xx.url,key=xx.key,fallback=xx.fallback,options=xx.options;
        var self = this;

        var cb = function(url2,blob) {
            if (fallback) sendee(!!url2);
            if (url2) {
                var photox = {type:'photox',url:url2,options:options};
                chrome.tabs.sendMessage(sender.tab.id,photox);
                if (blob) writefile(key,blob);
            }
        };

        readfile(key,true,function(file) {
            if (file)                       cb(file.toURL(),null);
            else if (fallback)              cb(null,null);
            else self.ajaxImage(url,cb);
        }.bind(this));
        return fallback;
    },
    active: function(tabid) {
        return this.sender && this.sender.tab.id !== tabid;
    },
    start: function() {
        chrome.browserAction.onClicked.addListener(function(tab) {
            if (this.active(tab.id))
                this.warp();
            else
                this.oauthnow(tab);
        }.bind(this));
        chrome.runtime.onConnect.addListener(this.connector.bind(this));
        chrome.runtime.onMessage.addListener(this.listener.bind(this));
        chrome.runtime.onConnectExternal.addListener(this.connector.bind(this));
        chrome.runtime.onMessageExternal.addListener(this.listener.bind(this));
    },
    warp: function (sender) {
        if (! this.sender)
            chrome.tabs.reload(sender.tab.id);
        chrome.tabs.update(this.sender.tab.id, {selected: true});
        chrome.windows.get(this.sender.tab.windowId, function (win) {
            if (!win.focused)
                this.port.postMessage('forceFocus');
        }.bind(this));

    },
    connector: function (port) {
        var reply = { type: 'deputize', token: !this.sender };
        port.postMessage(reply);
        if (!this.sender) {
            this.port = port;
            this.sender = port.sender;
            port.onDisconnect.addListener(function (port) {
                this.sender = null;
            }.bind(this));
            var token = localStorage.facebook_token;
            if (!token)
                this.oauthnow(this.sender.tab);
            else if (this.nextAuth)
                port.postMessage({type:'tinderauth',token:token});
            this.nextAuth = false;
        }
    },
    oauthnow: function(tab) {
        var url = (localStorage.facebook_token && this.oauthurl) || this.welcome;
        chrome.tabs.update(tab.id, {selected:true, url:url});
    },
    listener: function (request, sender, sendResponse) {
        if (request.type === 'facebookAuth' && request.token) {
            localStorage.facebook_token = request.token;
            console.log("facebookAuth complete: facebook_token stored", request.token);
            this.nextAuth = true;
            chrome.tabs.update(sender.tab.id, {url: 'http://chromeisburning.com'});
        }
        else if (request.type === 'warp') this.warp(sender);
        else if (request.type === 'oauth')
            this.oauthnow(this.sender.tab);
        else if (request.type === 'ajax')
            return this.ajaxproxy(request,sender,sendResponse);
        else if (request.type === 'photox')
            return this.photoize(request,sender,sendResponse);
    }
};
var owner = qq = new Owner();
owner.start();


// to copy localStorage qq.port.postMessage({type:'copy', data:localStorage});
//   this prints out in the console for the active page, save as temp1
//   dojo.mixin(localStorage, temp1.data)

var headerlist = {
    'Accept-Encoding'     : true,
    'app-version'         : true,
    'Connection'          : true,
    'Content-Length'      : true,
    'Content-Type'        : true,
    'Host'                : true,
    'If-Modified-Since'   : true,
    'If-None-Match'       : true,
    'os-version'          : true,
    'platform'            : true,
    'User-Agent'          : true,
    'X-Auth-Token'        : true
};




//  sniffed the proper user agent using mitmproxy
var uafilter = function(details,isdalvik) {
    var headers = details.requestHeaders;
    var dalvik = "Dalvik/1.6.0 (Linux; U; Android 4.3)";
    var tinder = "Tinder Android Version 3.3.2";
    var agent = isdalvik ? dalvik : tinder;
    var sent = [];
    for (var ii = 0; ii < headers.length; ii++) {
        var header = headers[ii], key = header.name;
        if (key === 'User-Agent')      header.value = agent;
        if (key === 'Accept-Encoding') header.value = 'gzip';
        if (headerlist[key]) sent.push(header);
    }
    return {requestHeaders: sent};
};
var uafilter2 = function(details) {
    var headers = details.requestHeaders;
    var dalvik = "Dalvik/1.6.0 (Linux; U; Android 4.3)";
    var sent = [];
    for (var ii = 0; ii < headers.length; ii++) {
        var header = headers[ii], key = header.name;
        if (key === 'User-Agent') header.value = dalvik;
        if (key !== 'Origin') sent.push(header);
    }
    return {requestHeaders: sent};
};

// edit user-agent for api
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        var images = new RegExp("^http.?://(images|moments-photos).gotinder.com/");
        return uafilter(details, images.test(details.url));
    },
    {urls: ["*://*.gotinder.com/*"]},
    ["blocking", "requestHeaders"]
);
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        return uafilter2(details,true);
    },
    {urls: [
        "*://*.facebook.com/v2.0/dialog/oauth?*api_key=464891386855067*"
        ,"*://*.facebook.com/v2.0/dialog/oauth?*client_id=464891386855067*"
    ]},
    ["blocking", "requestHeaders"]
);



//  if we're not currently logged into facebook when we try to oauth, we get redirected
//    to a login page and then again to the oauth page
//    facebook adds a _rdr suffix as some sort of a security thing
//    we sniff the redirect and strip the suffix
//    unfortunately, this requires having facebook in permissions (needed for sniffing)
//    it might be better to just force the user to log in first
//      so we don't need to ask for the (scary-looking) facebook permission
chrome.webRequest.onBeforeRequest.addListener(
    function(details){
        var uri = details.url;
        var len = uri.indexOf("?");
        var host = uri.substring(0,len);
        var query = uri.substring(len+1, uri.length);
        var obj = dojo.queryToObject(query);
        var key, del = false;
        (key = '_rdr') in obj && (del = delete obj[key]);
        (key = '_rdr#_') in obj && (del = delete obj[key]);
        if (del) {
            obj.display = 'popup';
            var modded = host+'?'+dojo.objectToQuery(obj);
            var br = {redirectUrl:modded};
        }
        console.log('CiB.redirect',del,uri,modded);
        return br;
    },
    {urls: [
        "*://*.facebook.com/v2.0/dialog/oauth?*api_key=464891386855067*"
        ,"*://*.facebook.com/v2.0/dialog/oauth?*client_id=464891386855067*"
    ]},
    ["blocking"]
);

    var errorHandler = function() { console.log("fs error",arguments,this); };

    var writefile = function(name,blob,cb) {
        var init = function(fs) {
            fs.root.getFile(name, {create:true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function(e) {
                        if (cb) cb(fileEntry);
                        console.log('Write completed',fileEntry.toURL());
                    };
                    fileWriter.onerror = function(e) { console.log('Write failed: ' + e.toString()); };
                    fileWriter.write(blob);
                }, errorHandler);
            });
        };
        var rfs = window.requestFileSystem || window.webkitRequestFileSystem;
        rfs(window.PERSISTENT, 128 * 1024 * 1024, init, errorHandler);
    };

    var readfile = function(name,urlonly,cb) {
        var init = function(fs) {
            window.stuff = fs;
            fs.root.getFile(name, {}, function(fileEntry) {
                    if (urlonly) cb(fileEntry);
                    else fileEntry.file(function (file) {
                            if (cb) cb(file);
                            else console.log(window.URL.createObjectURL(file));
                        },
                        function(error) { cb(null,error,fileEntry); });
                },
                function(error) { cb(null); });
        };
        var rfs = window.requestFileSystem || window.webkitRequestFileSystem;
        rfs(window.PERSISTENT, 128 * 1024 * 1024, init, errorHandler);
    };


// yep ... these will print from the background, even if the page isn't open (has never been opened)
if (false) window.setInterval(function() {
    chrome.notifications.create({type:'basic',title:'stuff',message:'blah',iconUrl:'../icons/icon.png'})
},10000);


})();

