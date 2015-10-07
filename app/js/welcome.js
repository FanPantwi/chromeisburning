/** @license copyright 2015 xmondox + chromeisburning.com, all rights reserved */



// use a proxy to make managing quota easier
XlocalStorage = function() {
    this.callback = null;
};
XlocalStorage.prototype = {
    optional: { data_recs: true },
    quota: {
        data_update: 4000000,
        data_feed:   4000000,
        data_mymo:   1000000,
        data_recs:    300000
    },
    setLocal: function(name,val) {
        var quota = this.quota[name] || 100000, opt = this.optional[name] || false;
        if (val.length < quota)
            localStorage[name] = val;
        else if (!opt && this.callback)
            this.callback(name,val);
    },
    set facebook_token(val) { this.setLocal('facebook_token',val); },
    set data_auth     (val) { this.setLocal('data_auth'    , val); },
    set data_count    (val) { this.setLocal('data_count'   , val); },
    set data_fake     (val) { this.setLocal('data_fake'    , val); },
    set data_fake2    (val) { this.setLocal('data_fake2'   , val); },
    set data_feed     (val) { this.setLocal('data_feed'    , val); },
    set data_like     (val) { this.setLocal('data_like'    , val); },
    set data_likeable (val) { this.setLocal('data_likeable', val); },
    set data_mymo     (val) { this.setLocal('data_mymo'    , val); },
    set data_profile  (val) { this.setLocal('data_profile' , val); },
    set data_recs     (val) { this.setLocal('data_recs'    , val); },
    set data_update   (val) { this.setLocal('data_update'  , val); },
    set data_util     (val) { this.setLocal('data_util'    , val); }
};

xlocalStorage = new XlocalStorage();

moment.locale('en', {
    calendar : {
        lastDay : '[Yesterday at] LT',
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        lastWeek : 'ddd [at] LT',
        nextWeek : '[this] dddd [at] LT',
        sameElse : "MMM D"
    }
});

window.DummyProp = true;

var useDebugger = window['Dummy'+'Prop'];
var debuggerish = function() {
    if (useDebugger)
        debugger;
};

var tagr = new nqo.tagr();


var extid = tagr.a(document.baseURI).host;

nu = {};


ViewBase = function() {
    /** @type HTMLDivElement
     * the toplevel div                                    */  this.page = null;
    this.page = tagr.div('this view not yet initialized');
};
ViewBase.prototype = {
    /**
     * initialize the view
     * @param {nu.Control} control the highlevel controller that owns this view
     * @param {String} viewName name of the view
     * @param {String} viewTitle title for the view
     */
    setupᵧₒ: function(control,viewName,viewTitle) {
        /** @type nu.Control */
        this.control = control;
        this.keyfoc = null;
        this.viewName = viewName;
        this.viewTitle = viewTitle;
        control.setViewMapping( this, viewName );
        this.init();
        return this;
    },
    init: function() {}, // for subclass lifecycle
    /** initialize the view to the passed state - to be overridden by subclasses */
    initState: function() { throw new Error('must be overridden by subclasses'); },
    /** @returns nu.Stateᵢᵧ */
    getState: function() { throw new Error('must be overridden by subclasses'); },
    /** set the state for the view
     *  ie, restore the view to the state provided
     *  @param {nu.Stateᵢᵧ} state the state to set, ie a prior value of this.getState()
     */
    setState: function(state) {},
    /** activate the view */
    vuActivate: function() { this.control.injectView( this, this.page ); },
    /** @return {Object} the scope specified by the view-specific args */
    scopesᵧₒ: function() { return null; },
    click: function(evt) {
        var node = evt.target, cb;
        if (cb = this.iscallback(node)) {
            this.callCallback(cb, evt);
            dojo.stopEvent(evt);
        }
    },
    statify: function(replace,state,title,hash) {
        this.control.statify(replace,state,title,hash);
    },
    toolify: function(method,title,inner,attr) {
        if (dojo.isString(attr)) attr = {klass:attr};
        attr = attr || {};
        attr.onclick = method.bind(this);
        if (title) attr.title = title;
        var div = tagr.div(attr);
        var span = dojo.isString(inner) ? tagr.span('headify',inner) : inner;
        nqo.appendChilds(div,span);
        return div;
    },
    toolUpdate: function() { return [tagr.span('u'),tagr.span('headify3','Pdate')]; },
    // return an avatar for the person
    personify: function(match,href,nameonly) {
        var person = match.person;
        var attrs = href ? {href:href} : {};
        var blocked = this.higgs.blocked(match._id);
        var style = (blocked ? tagr.s:tagr.b).bind(tagr);
        var age = calculateAge(new Date(person.birth_date));
        with (tagr) {
            return nameonly
                ? style(person.name)
                : [
                    div('listPic',
                        img(person.photos[0].processedFiles[2].url, attrs, null)),
                    div('caption', style('left', person.name), div('right', age))
                ];
        }
    },
    // TODO -- used by both person and match, doesn't belong in the generic view but don't want an intermediate class
    setDistance: function(person) {
        var dist = person.distance_mi;
        var klass = "distSpan";
        if (dist===undefined) {
            dist = "Some";
            klass += " msgPlaceholder";
        }
        nqo.replaceChildren(this.distdiv,
            tagr.span(klass,
                dist + " miles away"),
            tagr.span("lastSpan",
                tagr.text('Active '),this.higgs.formatDate(person.ping_time))
        );
    },
    isActive: function() { return this===this.control.view; },
    iscallback: function(node) {
        if (node.nqa) {
            if (node.nqa.meth) return node.nqa;
            else if (node.nqa.cb) return node.nqa.cb;
            else if (dojo.isString(node.nqa)) return node.nqa;
        }
        return false;
    },
    callCallback: function(cb,evt) {
        if (dojo.isFunction(cb))
            return cb.call(this,evt);
        var scope = this, meth = cb;
        if (dojo.isString(cb)) cb = cb.split(',');
        if (dojo.isArray(cb)) {
            for (var ii=0; ii<cb.length-1; ii++) scope = scope[cb[ii]];
            meth = cb[cb.length-1];
        }
        return scope[meth].call(scope,evt);
    },
    /** get the action for the given key
     *  @param {String} key the key to lookup
     *  @returns {function} the action for the key */
    getkeymap: function(key) {
        var keymap = this.keymap || {};
        var full = 'keymap_' + key;
        var func = keymap[ key ] || this[full];
        return func;
    },
    keymapify: function() {
        this.keymap = this.keymap || {};
        for (var ii=0; ii < this.actions.length; ii++) {
            var action = this.actions[ii];
            if (action.ackey) this.keymap[action.ackey] = action;
        }
    },
    keyhandler: function(key,evt) {
        var kf = this.keyfoc;
        var node = evt.target;
        if (kf) return kf.meth.call(kf.scope,evt,key);
        // fixme:expressiveness -- should be able to "pass" arguments to the keymap (use an array - scope/meth/arg0/.../argn ?)
        //   and provide a means of saying that the key wasn't handled, eg handling Enter on an <A>, but not other tags
        var func = this.getkeymap(key);
        if (func===true)                               { dojo.stopEvent(evt); return true; }
        else if (func) { this.callCallback( func, evt ); dojo.stopEvent(evt); return true; }
        else if (key === dojo.keys.ENTER && node.tagName === 'A' && node.nqa) { this.click(evt); dojo.stopEvent(evt); return true; }
        else return false;
    }
};
nqo.extend(ViewBase);

var calculateAge = function(date) {
    var ageDifMs = Date.now() - date.getTime();
    return Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
};

// view the list of matches
ViewList = function(higgs,viewMatch) {
    this.higgs = higgs;
    this.krow = 0;
    this.klast = -1;
    this.keymap = nqo.shallow(this.keymap);
    this.page = null;
    this.tbody = null;
    this.rowmap = [];  // krow --> kmat
    this.matmap = {};  // kmat --> krow
    this.rowmapifyx();
    this.lasttime = 0; // last match pingtime
    this.freshenx = [];
    this.rowsort();
    ViewBase.apply(this,arguments);
    with (tagr) {
        this.page = div("listDiv",
            table(
                this.tbody = tbody()
            ));
        this.nomatches = div(null,"no matches are available");
        this.tools =
            div('tools7',
                this.toolify(this.requestUser,'update user info, shortcut:i','Info'),
                this.toolify(this.checkUpdates,'check for updates, shortcut:p',this.toolUpdate())
            );
    }
};
ViewList.prototype = {
    classInit: function() {
        this.keymap = {};
        this.keymap.j = this.nextMat;
        this.keymap.k = this.prevMat;
        this.keymap.J = this.nextMat5;
        this.keymap.K = this.prevMat5;
        this.keymap.o = this.openMat;
        this.keymap.i = this.requestUser;
        this.keymap.p = this.checkUpdates;
    },
    rowmapifyx: function() {
        this.higgs.updates.matches.forEach(this.rowmapify,this);
    },
    rowmapify: function(mat,kmat) {
        var blocked = !mat || this.higgs.blocked(mat._id);
        if (!blocked)
            this.matmap[kmat] = this.rowmap.push(kmat) - 1;
    },
    updateTimestamp: function() {
        this.rowsort();
    },
    checkUpdates: function() {
        this.control.cmd_update();
    },
    rowsort: function() {
        var stamps = this.higgs.util.timestamps;
        var map = this.rowmap
            .map(function (kmat) { return {kmat:kmat,stamp:stamps[kmat]}})
            .sort(function(a,b) { return b.stamp-a.stamp })
            .map(function (pair) { return pair.kmat; });
        this.rowrev(map);
    },
    // sort on the most recent of: message (to or from), match, moment
    rowrev: function(map) {
        var lastmat = this.rowmap[this.klast];
        if (map==undefined)
            this.rowmap.reverse();
        else
            this.rowmap = map;
        var rows = this.ready && nqo.replaceChildren(this.tbody);
        this.rowmap.forEach(function(kmat,krow) {
            var old = this.matmap[kmat];
            this.matmap[kmat] = krow;
            if (this.ready) this.tbody.appendChild(rows[old]);
        },this);
        this.klast = this.matmap[lastmat];
        this.ready && this.change(0,true);
    },
    getrow: function(kmat) {
        var krow = this.matmap[kmat];
        var row = krow >= 0 ? this.tbody.rows[krow] : undefined;
        return row;
    },
    openMat: function() {
        if (this.control.autostate())
            this.requestUser();
        this.control.viewMatch.build(this.rowmap[this.krow]);
    },
    nextMat: function() { this.change(1); },
    prevMat: function() { this.change(-1); },
    nextMat5: function() { this.change(5); },
    prevMat5: function() { this.change(-5); },
    requestUser: function() {
        var kmat = this.rowmap[this.krow];
        var match = this.higgs.updates.matches[kmat];
        this.control.cmd_user(match);
    },
    updateUser: function(match) {
        var kmat = this.higgs.matchmap[match._id];
        var row = this.getrow(kmat);
        row && this.genDist(kmat,row);
    },
    alertMatch: function(kmat,row,clear) {
        if (kmat !== null && clear) this.higgs.util.modified[kmat] = 0;
        if (clear) this.listAlertify(true);
        row = row || this.getrow(kmat);
        if (!row) return; // kludge ... might not be built yet
        var img = row.firstChild.firstChild;
        nu.util.alertify(img,null,!!clear);
    },
    listAlertify: function(clear) {
        if (!clear==!!this.alertStatus) return;
        function needed(kmat) { return this[kmat]; }
        var any = this.rowmap.some(needed,this.higgs.util.modified);
        nu.util.alertify(this.control.headerMats,'alertz',!any);
        this.alertStatus = any;
    },
    updateMatch: function(kmat,them) {
        var mat = this.higgs.updates.matches[kmat];
        var blocked = this.higgs.blocked(mat._id);
        var rows = this.tbody.rows;
        var krow = this.matmap[kmat];
        if (blocked && !them)
            return void this.removeMatch(kmat,krow);
        var newrow = this.genRow(kmat);
        // todo::kludge -- this works so long as only blocked users aren't mapped (but that could change)
        //   ie, what about the case of a message arriving from a user we don't want to display
        if (krow===undefined) {
            this.rowmapify(rows.length,kmat);
            if (this.ready)
                nqo.appendChilds(this.tbody,newrow);
            else if (this.isActive())
                this.build();
        }
        else if (this.ready) {
            this.tbody.replaceChild(newrow, rows[krow]);
            if (krow==this.krow) dojo.addClass(newrow,"listSelect");
        }
        if (them && this.higgs.isnotify(0x01)) this.alertMatch(kmat);
    },
    removeMatch: function(kmat,krow) {
        if (krow===undefined) krow = this.matmap[kmat];
        if (krow===undefined) return;
        this.rowmap.splice(krow,1);
        delete this.matmap[kmat];
        for (var ii=krow; ii < this.rowmap.length; ii++)
            this.matmap[this.rowmap[ii]] = ii;
        if (this.ready)
            this.tbody.removeChild(this.tbody.rows[krow]);
        if (krow==this.krow) this.klast = -1;
        if (this.isActive()) this.build();
        // this.higgs.updates.matches[kmat] = null;
    },
    click: function(evt) {
        var sel = window.getSelection();
        if (sel.toString().length) return;
        var node = evt.target, cb;
        var td = nqo.parentByTag(node, 'TD');
        var row = nqo.parentByTag(node, 'TR');
        if (!row) return;
        dojo.stopEvent(evt);
        var krow = row.rowIndex;
        var row2 = this.krow;
        this.change(krow,true);
        if (row.lastChild==td)
            this.requestUser();
        else if (row.firstChild==td || krow==row2)
            this.control.viewMatch.build(this.rowmap[krow]);
    },
    nextrow: function(step,abs) {
        var index = abs ? step||0 : this.krow+step;
        this.krow = nqo.bound(index,0,this.rowmap.length-1);
        return this.rowmap[this.krow];
    },
    // advance to the next match, either by row if delta else by the given kmat
    nextMatch: function(kmat_or_delta,delta) {
        if (delta) return this.nextrow(kmat_or_delta);
        var krow = this.matmap[kmat_or_delta];
        if (krow !== undefined) this.krow = krow;
        return kmat_or_delta;
    },
    // the header is fixed and tends to cover the selected row when cursoring up, kludge to fix it
    listscroll: function(rows,krow) {
        var row = rows && rows[krow];
        var rox = rows && rows[krow-1];
        row && row.scrollIntoViewIfNeeded(false);
        rox && rox.scrollIntoViewIfNeeded(false);
        krow==0 && window.scroll(0,0);
    },
    change: function(step,abs) {
        this.nextrow(step,abs);
        var row = this.tbody.rows[this.krow ];
        if (this.krow !== this.klast) {
            this.klast >= 0 && dojo.removeClass(this.tbody.rows[this.klast],"listSelect");
            this.krow  >= 0 && dojo.   addClass(                       row ,"listSelect");
            this.klast = this.krow;
        }
        if (this.isActive()) {
            this.listscroll(this.tbody.rows, this.krow);
            this.statify(location.hash == '', {kmat: this.krow}, 'Matches', '#');
        }
    },
    genDist: function(kmat,row) {
        var match = this.higgs.updates.matches[kmat];
        var ping = this.higgs.util.pingstamp[kmat];
        var xo = match.person;
        var node;
        if (ping > this.lasttime)
            this.lasttime = ping;
        var dist="", last = this.higgs.formatDate(xo.ping_time);
        if (xo.distance_mi >= 0)
            dist = xo.distance_mi + " miles";
        with (tagr) {
            node = td({klass:'listDist',title:'click to update, shortcut: i'},
                div(dist),
                div(last))
        }
        if (row) row.replaceChild(node,row.cells[3]);
        this.freshenx[kmat] = Date.now();
        return node;
    },
    genRow: function(kmat) {
        if (kmat > 10000)
            debugger;
        var mat = this.higgs.updates.matches[kmat];
        var modified = this.higgs.util.modified[kmat];
        var xo = mat.person;
        var bio = xo.bio.slice(0,200);
        var age = calculateAge(new Date(xo.birth_date));
        var mm = mat.messages[mat.messages.length-1];
        var txt = mm && mm.message.slice(0,60);
        var row;
        var message = [
            tagr.div(
                tagr.div('matchDate',
                    tagr.text("matched "), this.higgs.formatDate(mat.created_date)))
            ];
        if (mm)
            message.push(tagr.div(txt));
        var blocked = this.higgs.blocked(mat._id);
        var style = (blocked ? tagr.s:tagr.b).bind(tagr);
        with (tagr) {
            row = tr(
                td('listToon',
                    this.personify(mat)
                ),
                td("listInfo",
//                    div(style(xo.name), text(", " + age)),
                    div(message)
                ),
                td("listBio", bio),
                this.genDist(kmat)
            );
        }
        if (modified) this.alertMatch(null,row);
        return row;
    },
    restore: function(state) {
        this.build();
    },
    /** @param {nu.FoodPayload} payload */
    build: function() {
        this.statify(location.hash=='',{},'Matches','#');
        var len = this.rowmap.length;
        if (!this.ready && len) {
            this.ready = true;
            nqo.appendChilds(
                this.tbody,
                this.rowmap.map(this.genRow,this));
        }
        this.control.injectView(this,len ? this.page:this.nomatches,this.tools);
        this.change(0);
        if (this.checkAlert) this.listAlertify();
    }
};
nqo.extend(ViewList,ViewBase);

ViewQuota = function(higgs) {
    /** @type UserData */
    this.higgs = higgs;
    this.settingsx = {};
    this.settings = null;
    ViewBase.apply(this, arguments);
};
ViewQuota.prototype = {
    quotaBlocks: function(evt) {
        this.higgs.delete_blocked();
        evt.preventDefault();
    },
    genSettings: function() {
        var xx = this.settingsx;
        with (tagr)
            this.settings = div(
                div('spacer100',null), // mousewheel hack
                div('settings',
                    h2('Storage Quota'),
                    ul(
                        li('clean up stored data')
                    ),
                    table(
                        tr(
                            td(span(
                                xx.blocks = button('delete blocked matches'))))
                )));
        xx.blocks.onclick = this.quotaBlocks.bind(this);
    },
    restore: function() { this.build(); },
    build: function() {
        var hash = '#quota';
        this.statify(location.hash==hash,{},'Storage Quota',hash);
        this.settings || this.genSettings();
        this.control.injectView(this, this.settings);
    }
};
nqo.extend(ViewQuota,ViewBase);



ViewSettings = function(higgs) {
    this.higgs = higgs;
    this.settingsx = {};
    this.settings = null;
    ViewBase.apply(this, arguments);
};
ViewSettings.prototype = {
    settingsReset: function(evt) {
        this.settings = null;
        this.build(); // kludge - easier that changing the input values :)
        evt.preventDefault();
    },
    settingsSubmit: function(evt) {
        var xx = this.settingsx;
        var dist = nqo.bound(Math.round(+xx.dist.value || 0),1,100);
        var age1 = nqo.bound(Math.round(+xx.age1.value || 0),18,54);
        var age2 = nqo.bound(Math.round(+xx.age2.value || 0),age1,55);
        if (age2==55) age2 = 1000;
        var women = xx.womn.checked;
        var men = xx.menn.checked;
        var gender = men ? (women?-1:0):1;
        var disc = xx.disc.checked;
        var req = this.control.cmd_profile(dist,age1,age2,gender,disc);
        console.log('settings',req,JSON.stringify(req.data));
        return false;
    },
    updateProfile: function() {
        this.settings = null;
        if (this.isActive()) this.control.viewPerson.build();
        this.control.cmd_recs();
    },
    genSettings: function() {
        var user1 = this.higgs.profile, auth=this.higgs.auth;
        var user = (user1.nqa_timestamp > auth.nqa_timestamp) ? user1 : auth.user;
        var xx = this.settingsx;
        var agemax = Math.min(user.age_filter_max,999); // displays better
        with (tagr)
        this.settings = div(
            div('spacer100',null), // mousewheel hack
            div('settings',
                h2('Discovery Settings'),
                ul(
                    li('by default uses existing settings from Tinder')
                ),
                xx.form = form(table(
                    tr(
                        td('ages:'),
                        td(span(
                            xx.age1 = input('number', user.age_filter_min),
                            text(' to '),
                            xx.age2 = input('number', agemax)))),
                    tr(
                        td('distance:'),
                        td(span(
                            xx.dist = input('number', user.distance_filter)))),
                    tr(
                        td('show me:'),
                        td(span(
                            span(
                                xx.menn = checkbox({checked: user.gender_filter !== 1}), text('men ')),
                            span(
                                xx.womn = checkbox({checked: user.gender_filter !== 0}), text('women'))))),
                    tr(
                        td('discoverable:'),
                        td(span(
                            xx.disc = checkbox({checked: user.discoverable})))),
                    tr(
                        td(),
                        td(span(
                            xx.subm = input('submit','submit'),
                            xx.rset = button('reset')
                        )))))
            ));
        xx.rset.onclick = this.settingsReset.bind(this);
        xx.form.onsubmit = this.settingsSubmit.bind(this);
    },
    restore: function() { this.build(); },
    build: function() {
        var hash = '#settings';
        this.statify(location.hash==hash,{},'Discovery Settings',hash);
        this.settings || this.genSettings();
        this.control.injectView(this, this.settings);
    }
};
nqo.extend(ViewSettings,ViewBase);


ViewHelp = function(higgs) {
    this.higgs = higgs;
    ViewBase.apply(this, arguments);
    this.genHelp();
};
ViewHelp.prototype = {
    restore: function() { this.build(); },
    build: function() {
        var hash = '#help';
        this.statify(location.hash==hash,{},'Help and Settings',hash);
        this.control.injectView(this, this.shortcuts);
    }
};
ViewHelp.prototype.genHelp = function() {
    var webstore = 'https://chrome.google.com/webstore/detail/chrome-is-burning/';
    var support = webstore + extid + '/support';
    var repo = 'https://github.com/xmondox/chromeisburning/issues';
    var key = function(key,description) {
        var str = dojo.isString(key);
        with (tagr) return true,
            tr(
                td('keycombo',str ? span(key):key),   td('keycolon',':'), td(description));
    };
    with (tagr) {
        var basic =
            div('helpblurb',
                h2('Chrome is Burning'),
                ul(
                    li('uses your profile, location and search settings from Tinder'),
                    li('browser navigation (forwards, backwards) should work'),
                    li('only one tab can be active, additional tabs will be read-only'),
                    li('navigation icons are in the upper left and action icons to the right'),
                    li('not able to post moments or use Tinder Plus features'),
                    li(text('for support, visit '),a(support,'the play store'),text(' or '),a(repo,'the github project'))
            ));
        var navigation =
            div('grid',
                h2('Switching Views'),
                table(tbody(
                    key('r','switch to Recommendations view'),
                    key('m','switch to Matches view'),
                    key('t','switch to Moments view'),
                    key('y','switch to My Moments view'),
                    key('?','switch to Help view')
                )));
        var general =
            div('grid',
                h2('General Commands'),
                table(tbody(
                    key('j','go to the next item'),
                    key('k','go to the previous item'),
                    key('n','jump to the next notification'),
                    key('N','clear all notifications'),
                    key('p','check for updates for the current view'),
                    key('z','toggle automatic updates, or click the play/pause button')
            )));
        var autoup =
            div('grid',
                h2('Auto Update Mode'),
                ul('autoup',
                    li('current mode is indicated to the right of the help menubar entry'),
                    li('this setting persists when reloading the page'),
                    li('frequency of updates is high when you\'re actively using the app' +
                        ' and diminish the longer you\'re idle'),
                    li('only recommendations and matches are checked when idle'),
                    li('browsing moments, my moments and user profiles also trigger an update'),
                    li('if you\'re idle late at night (4am-10am) the updates are suspended')
                ));
        var recs =
            div('grid',
                h2('Recommendations View'),
                table(tbody(
                    key('s','go to Settings view'),
                    key('l','like this user, ie swipe right'),
                    key('h','pass on this user, ie swipe left')
                )));
        var matches =
            div('grid',
                h2('Matches View'),
                table(tbody(
                    key('i','update user info (or click the distance)'))),
                h3('overview'),
                ul(
                    li('click a row to select it'),
                    li('click a selected row or thumbnail to open it')
                ),
                table(tbody(
                    key('o','open the selected match'),
                    key('J','go forward 5 matches'),
                    key('K','go backward 5 matches'))),
                h3('viewing a match'),
                table(tbody(
                    key('o','view the full size photos in the lightbox (or click a thumbnail)'),
                    key('u','return to the matches overview')
            )));
        var feed =
            div('grid clear',
                h2('Moments View'),
                ul(
                    li('moments waiting to be rated are highlighted in orange, ' +
                        'and moments you\'ve liked in green')
                ),
                table(tbody(
                    key('l','like this moment, ie swipe right'),
                    key('h','pass on this moment, ie swipe left')
                )),
                h3('overview'),
                ul(
                    li('click a moment to select it'),
                    li('click a selected moment to open it')
                ),
                table(tbody(
                    key('o','open the moment'))),
                h3('viewing a moment'),
                table(tbody(
                    key('u','return to the overview'),
                    key('o','open the user\'s match view')))
            );
        var mymo =
            div('grid',
                h2('My Moments View'),
                ul(
                    li('moments with new likes are highlighted in orange')
                ),
                table(tbody(
                    key('i','download statistics for the selected moment'))),
                h3('overview'),
                table(tbody(
                    key('o','open the moment'))),
                h3('viewing a moment'),
                ul(
                    li('click an avatar to jump to the match')
                ),
                table(tbody(
                    key('u','return to the overview')))
            );
        var lightbox =
            div('grid',
                h2('LightBox'),
                ul(
                    li('click to close')
                ),
                table(tbody(
                    key([span('Esc'),text('or'),span('u')],'close'),
                    key([span('←'  ),text('or'),span('k')],'previous photo'),
                    key([span('→'  ),text('or'),span('j')],'next photo')
                ))
            );
        this.shortcuts = div(
            basic,
            div('shortcuts',navigation,general,autoup,recs,matches,feed,mymo,lightbox));
    }
};
nqo.extend(ViewHelp,ViewBase);

ViewFeed = function(higgs) {
    this.higgs = higgs;
    this.kmom = 0;
    this.images = {};
    this.list = true;
    this.mommap = {};
    this.rowmap = [];
    this.photon = 0;
    this.page = null;
    this.mommapify();
    with (tagr) {
        this.tools =
            div('tools7',
                this.toolPass = this.toolify(this.keymap_h,'','Hate'),
                this.toolLike = this.toolify(this.keymap_l,'','Like')
            );
        this.tools2 =
            div('tools7',
                this.toolCheck = this.toolify(this.keymap_p,'Check for new moments, shortcut:p',this.toolUpdate())
            );
    }
    ViewBase.apply(this,arguments);
};
ViewFeed.prototype = {
    keymap_p: function() { this.control.cmd_feed(); },
    keymap_o: function() {
        this.list ? this.build(this.kmom,false) : this.followUser();
    },
    keymap_u: function() { this.list || this.build(this.kmom,true ); },
    keymap_j: function() { this.change(1); },
    keymap_k: function() { this.change(-1); },
    keymap_l: function() { this.rateMoment(true); },
    keymap_h: function() { this.rateMoment(false); },
    // optional kmom --> add kmom to the mommap
    // otherwise, add the entire higgs.feed
    mommapify: function(kmom) {
        if (kmom !== undefined)
            return this.mommap[kmom] = this.rowmap.push(kmom)-1;
        var moms = this.higgs.feed.moments;
        moms.forEach(function(mom,kmom) {
                if (!this.higgs.mom2mat(mom)) return;
                if (this.hours(mom) < 96) this.rowmap.push(kmom);
                if (!this.higgs.util.feedrate[kmom]) this.higgs.getRating(kmom);
            },
            this);
        this.rowmap.sort(function(k1,k2) {
            return moms[k1].date.localeCompare(moms[k2].date);
        });
        this.rowmap.forEach(function(kmom,krow) { this.mommap[kmom] = krow; }, this);
    },
    greyout: function() {
        var grey = !!this.higgs.getRating(this.kmom);
        var method = grey ? dojo.addClass : dojo.removeClass;
        method.call(dojo,this.toolPass,'greyTool');
        method.call(dojo,this.toolLike,'greyTool');
        this.toolPass.title = grey ? 'this moment has already been rated' : 'shortcut:h';
        this.toolLike.title = grey ? 'this moment has already been rated' : 'shortcut:l';
    },
    getRating: function(mom) {
        var rating = this.higgs.getRating(mom);
        return rating==2 ? ' liking' : !rating ? ' alert' : '';
    },
    rateMoment: function(like) {
        var mom = this.higgs.feed.moments[this.kmom];
        var rating = this.higgs.getRating(this.kmom);
        if (!rating) {
            nu.util.alertify(this.page, 'pending');
            var prm = this.control.cmd_mlike(mom._id, like);
            return prm;
        }
    },
    feedAlertify: function() {
        // todo: a moment could have timed out (ie, 24 hours old) but not yet been fixed in feedrate
        function pending(val) { return val===0 }
        var any = this.higgs.util.feedrate.some(pending);
        nu.util.alertify(this.headertab,'alertz',!any);
    },
    mlike_cb: function(reply,mom_id,like) {
        var kmom = this.higgs.feedmap[mom_id];
        var good = reply.status==200, same = kmom==this.kmom;

        // even out of date moments give status 200, deal with it when it happens i guess ...
        //   biggest worry is that a rating fails and we never advance past it
        if (!good)
            debuggerish();

        if (same)
            nu.util.alertify(this.page,"pending",true);
        if (same && good)
            setTimeout(function(self,kmom) {
                if (self.kmom==kmom) self.build();
            }, 500, this, kmom);
        if (!good && same)        nu.util.alertify  (this.page,"failing",1000);
        if (good && same && like) nu.util.alertify  (this.page,'liking');
        this.feedAlertify();
    },
    hours: function(mom) {
        var delta = new Date() - new Date(mom.date);
        return delta / (3600*1000);
    },
    //  map rows <--> kmom
    //
    change: function(step,abs) {
        var krow = this.mommap[this.kmom] + step || 0;
        krow = nqo.bound(krow,0,this.rowmap.length-1);
        var kmom = abs ? step : this.rowmap[krow];
        kmom = nqo.bound(kmom,0,this.higgs.feed.moments.length-1);
        if (kmom==this.kmom) return;
        if (this.list) {
            krow = this.mommap[kmom]; // we're already a list ... the kmom is valid
            this.kmom = kmom;
            dojo.query(".listSelect").removeClass("listSelect");
            var widget = dojo.query('.feedDiv > div')[krow];
            dojo.addClass(widget, "listSelect");
            $(".listSelect")[0].scrollIntoViewIfNeeded();
        }
        else this.build(kmom);
    },
    followUser: function() {
        var mom = this.higgs.feed.moments[this.kmom];
        var kmat = this.higgs.usermap[mom.created_by];
        this.control.viewMatch.build(kmat);
    },
    click: function(evt) {
        var sel = window.getSelection();
        if (sel.toString().length) return;
        var node = evt.target;
        dojo.stopEvent(evt);
        if (!this.list) {
            if (!dojo.hasClass(node,'feedimg')) {
                var href = node.getAttribute('href');
                if (href) this.control.historyifier({state:{hash:href}});
                return;
            }
            return;
        }
        var row = (node.parentNode || {}).parentNode;
        var div = row.parentNode;
        if (node.tagName !== 'IMG') return;
        var index = [].indexOf.call(div.children,row);
        var kmom = this.rowmap[index];
        if (kmom==this.kmom)  this.build(kmom,false);
        else                  this.change(kmom,true);
    },
    photoize2: function(mom,inner,klass) {
        var url = mom.media.processedFiles.medium;
        var key = "moment." + mom._id + ".medium";
        var delta = new Date() - new Date(mom.date);
        var fallback = delta >= 24*3600*1000;
        inner.id = 'photoize_' + this.photon++;
        var xx = {type: 'photox', url:url, key:key, fallback:fallback, options:{eid: inner.id} };
        var node = document.getElementById(xx.options.eid);
        chrome.runtime.sendMessage(extid, xx, function (success) {
            if (success) return;
            var parent = inner.parentNode;
            var image =
                tagr.div(klass,
                    tagr.p('No longer available'));
            for (var ii in inner)
                if (inner.hasOwnProperty(ii))
                    image[ii] = inner[ii];
            parent.replaceChild(image, inner);
        });
    },
    postInit: function() { this.feedAlertify(); },
    // kmom has been added to the higgs, now add it to the view
    updateMoment: function(kmom) {
        var mom = this.higgs.feed.moments[kmom];
        var match = this.higgs.mom2mat(mom);
        if (!match)
            return;
        var first = this.rowmap.length==0;
        this.mommapify(kmom);
        if (this.isActive() && first)
            this.build();
        else if (this.isActive() && this.list)
            this.page.appendChild(this.buildRow(kmom,true));
        this.control.notifier(match.person.name,'New moment from: ',mom.text||'',this.gethref(mom._id));
        this.feedAlertify();
    },
    nextRate: function(kmom,func) {
        if (kmom < 0) kmom = 0;
        var moms = this.higgs.feed.moments;
        var now = new Date();
        for (var ii=0; ii<moms.length; ii++) {
            var jj = (ii+kmom) % moms.length;
            var mom = moms[jj];
            if (func) {
                if (func.call(this, mom, jj)) return jj;
            }
            else if (!this.higgs.util.feedrate[jj]) {
                if ((now - new Date(mom.date)) / (3600*1000) < 24)
                    return jj;
            }
        }
        return undefined;
    },
    buildRow: function(kmom,list) {
        var mom = this.higgs.feed.moments[kmom];
        var match = this.higgs.mom2mat(mom);
        if (!match)
            // this should only happen for non-list, ie url-based navigation
            return tagr.h1("this moment is no longer available");
        var url3 = '#temp';
        var when = this.higgs.formatDate(mom.date,48);
        var klass = (kmom==this.kmom) ? "listSelect" : null;
        var kmat = this.higgs.usermap[mom.created_by];
        var k2 = 'feedimg' + this.getRating(mom);
        var href = this.control.viewMatch.gethref(kmat);
        var page;
        var fake = list ? 'fakeimage ' : 'fakedetail ';
        var photo = tagr.img(url3,null);
        var nameish = this.personify(match,href,list);
        if (list) with (tagr) {
            page =
                div(klass,
                    div(k2,
                        photo,
                        div('left', nameish),
                        div('right', when)));
        }
        else with (tagr) {
            page = div('mymoDetails',
                div(
                    div("grid",
                        nameish
                    ),
                    div("grid",
                        p(when),
                        div(k2,photo),
                        p(mom.text))
                ));
        }
        this.photoize2(mom,photo,fake);
        return page;
    },
    restore: function(state) {
        var detail = (state.hash || location.hash).split('/')[1];
        var list = (detail==undefined);
        var kmom = list ? undefined : state.kmom || +detail || 0;
        this.build(kmom,list);
    },
    gethref: function(mom_id) { return '#feed/' + this.higgs.feedmap[mom_id]; },
    build: function(next,list) {
        if (next !== undefined) this.kmom = next;
        if (list !== undefined) this.list = list;
        if (this.control.autostate())
            this.control.cmd_feed();
        var moms = this.higgs.feed.moments;
        // for the list, need to verify that the kmom is in the list so it highlights right
        this.kmom = nqo.bound(this.kmom,0,moms.length-1);
        if (this.list && this.mommap[this.kmom]==undefined)
            this.kmom = this.rowmap[0];
        var hash = this.list ? '#feed' : '#feed/'+this.kmom;
        var same = this.list ? location.hash==hash : location.hash.startsWith('#feed/');
        this.statify(same,{kmom:this.kmom},'Moments',hash);
        if (this.rowmap.length==0) {
            this.page = tagr.h1("none of your matches have posted moments recently");
            this.control.injectView( this, this.page );
            return;
        }
        if (this.list) {
            this.page = tagr.div("feedDiv",null);
            for (var ii=0; ii<this.rowmap.length; ii++)
                this.page.appendChild(this.buildRow(this.rowmap[ii],true));
        }
        else
            this.page = this.buildRow(this.kmom,false);
        this.control.injectView(this, this.page, this.list ? this.tools2:this.tools);
        if (this.list) $(".listSelect")[0].scrollIntoViewIfNeeded();
        else this.greyout();
    }
};
nqo.extend(ViewFeed,ViewBase);


ViewMymo = function(higgs) {
    this.higgs = higgs;
    this.kmom = 0;
    this.list = true;
    this.alertStatus = false;
    ViewBase.apply(this,arguments);
    with (tagr) {
        this.tools =
            div('tools7',
                this.toolInfo = this.toolify(this.keymap_i,'Per moment info, shortcut:i','Info'),
                this.toolFresh = this.toolify(this.keymap_p,'Update stats, shortcut:p',this.toolUpdate())
            );
    }
};
ViewMymo.prototype = {
    keymap_o: function() { this.list && this.build(this.kmom,false); },
    keymap_u: function() { this.list || this.build(this.kmom,true ); },
    keymap_j: function() { this.change(1); },
    keymap_k: function() { this.change(-1); },
    keymap_p: function() { this.control.cmd_mymo(); },
    keymap_i: function() {
        var mom = this.higgs.mymo.moments[this.kmom];
        if (mom) this.control.cmd_mymoment(mom._id);
    },
    change: function(step) {
        var next = nqo.bound(this.kmom + step,0,this.higgs.mymo.moments.length-1);
        if (next==this.kmom) return;
        this.build(next); // kludge
    },
    mymoAlertify: function(kmom,clear) {
        if (this.alertStatus == !clear) return;
        var moms = this.higgs.mymo.moments;
        var any;
        if (!clear && +kmom===kmom) any = this.isfresh(kmom);
        else
            for (var ii=0; !any && ii < moms.length; ii++)
                any = this.isfresh(ii);
        if (!clear == any) {
            nu.util.alertify(this.control.headerMymo, 'alertz', clear);
            this.alertStatus = any;
        }
    },
    isfresh: function(kmom) {
        var mom = this.higgs.mymo.moments[kmom];
        var num = (this.higgs.mlikes.freshen[kmom] || 0);
        var freshen = mom.likes_count > num && num >= 0;
        return freshen;
    },
    // phase2 --> updates the moment, otherwise the summary
    updateMymo: function(moment_id,phase2) {
        var kmom = this.higgs.mymomap[moment_id];
        if (moment_id) this.mymoAlertify(kmom,phase2);
        if (this.control.view !== this)
            return;
        var mom = this.higgs.mymo.moments[this.kmom];
        if (this.list && moment_id===undefined ||!this.list && mom._id==moment_id)
            this.build();
    },
    click: function(evt) {
        var sel = window.getSelection();
        if (sel.toString().length) return;
        var node = evt.target, cb;
        dojo.stopEvent(evt);
        if (!this.list) {
            var href = node.getAttribute('href');
            if (href)
                this.control.historyifier({state:{hash:href}});
            return;
        }
        var row = (node.parentNode || {}).parentNode;
        var div = row.parentNode;
        if (node.tagName !== 'IMG') return;
        var index = [].indexOf.call(div.children,row);
        if (index==this.kmom) this.build(index,false);
        else                  this.build(index,true); // kludge
    },
    buildLikes: function(parent,kmom) {
        var mv = this.higgs.util.momLikes[kmom] || [];
        var users = this.higgs.mlikes.kuser;
        for (var ii=0; ii<mv.length; ii++) {
            var kmat = users[mv[ii]];
            var mat = this.higgs.updates.matches[kmat];
            if (!mat)
                continue;
            var xo =  mat.person;
            var age = calculateAge(new Date(xo.birth_date));
            var blocked = this.higgs.blocked(mat._id);
            var href = this.control.viewMatch.gethref(kmat);
            var style = (blocked ? tagr.s:tagr.b).bind(tagr);
            with (tagr) {
                row = div("grid",
                    this.personify(mat,href)
                );
                parent.appendChild(row);
            }
        }
    },
    buildRow: function(kmom,list) {
        var mom = this.higgs.mymo.moments[kmom];
        var url = mom.media.processedFiles.medium;
        var when = this.higgs.formatDate(mom.date,48);
        var klass = (kmom==this.kmom) ? "listSelect" : null;
        var num = (this.higgs.mlikes.freshen[kmom] || 0);
        var freshen = mom.likes_count > num && num >= 0;
        var klikes = this.higgs.util.momLikes[kmom] || [];
        var likes = freshen || num < 0 ? mom.likes_count : klikes.length;
        var k2 = freshen ? "alert" : null;
        if (list) with (tagr) {
            return div(div(klass,
                img(url,k2,null),
                div(when), div("likes_count",mom.likes_count + " likes")
            ));
        }
        else {
            var liker, page;
            with (tagr) page = div('mymoDetails',
                p(when),
                div(div("grid",
                    img(url,k2,null),
                    p(mom.text),
                    p(likes + " likes")),
                liker = div('sideright',null))
            );
            this.buildLikes(liker,kmom);
            return page;
        }
    },
    gethref: function(mom_id) { return '#mymo/' + this.higgs.mymomap[mom_id]; },
    restore: function(state) {
        var detail = (state.hash || location.hash).split('/')[1];
        var list = (detail==undefined);
        var kmom = list ? undefined : state.kmom || +detail || 0;
        this.build(kmom,list);
    },
    build: function(next,list) {
        if (next !== undefined) this.kmom = next;
        if (list !== undefined) this.list = list;
        var moms = this.higgs.mymo.moments;
        this.kmom = nqo.bound(this.kmom,0,moms.length-1);
        if (this.control.autostate()) {
            if (this.list) this.control.cmd_mymo();
            else           this.control.cmd_mymoment(moms[this.kmom]._id);
        }
        var hash = this.list ? '#mymo' : '#mymo/'+this.kmom;
        var same = this.list ? location.hash==hash : location.hash.startsWith('#mymo/');
        this.statify(same,{kmom:this.kmom},'My Moments',hash);
        if (moms.length==0) {
            this.page = tagr.h1("you haven't posted any moments to display");
            this.control.injectView( this, this.page, this.tools);
            return;
        }
        if (this.list) {
            this.page = tagr.div("mymoDiv",null);
            for (var ii=0; ii<moms.length; ii++)
                this.page.appendChild(this.buildRow(ii,true));
        }
        else
            this.page = this.buildRow(this.kmom,false);
        this.control.injectView(this, this.page,this.tools);
        if (this.list) $(".listSelect")[0].parentNode.scrollIntoViewIfNeeded();
    }
};
nqo.extend(ViewMymo,ViewBase);


// view and rate a recommendation
ViewPerson = function(higgs) {
    /** UserData */
    this.higgs = higgs;
    this.kmat = 0;
    this.keymap = nqo.shallow(this.keymap);
    this.distdiv = null;
    this.lightbox = new LightBox();
    ViewBase.apply(this,arguments);
    with (tagr) {
        this.tools =
            div('tools7',
                this.toolNum = div({title:'likes in the last 12 hours (local only)'},null),
                this.toolSettings1 = this.toolify(this.goSettings,
                    'modify discovery settings, shortcut:s','Settings'),
                this.toolPass = this.toolify(this.passMat,'','Hate'), // handle title in greyout
                this.toolLike = this.toolify(this.likeMat,'','Like')
            );
        this.tools2 =
            div('tools7',
                this.toolSettings2 = this.toolify(this.goSettings,
                    'modify discovery settings, shortcut:s','Settings'),
                this.toolCheck = this.toolify(this.refreshRecs,
                    'Refresh recommendations, shortcut:p',this.toolUpdate())
            );
    }
};
ViewPerson.prototype = {
    classInit: function() {
        this.keymap = {};
        this.keymap.j = this.nextMat;
        this.keymap.k = this.prevMat;
        this.keymap.l = this.likeMat;
        this.keymap.h = this.passMat;
        this.keymap.p = this.refreshRecs;
        this.keymap.o = this.openPics;
        this.keymap.s = this.goSettings;
    },
    refreshRecs: function() { this.control.cmd_recs(); },
    likeMat: function() { this.rateMat(true); },
    passMat: function() { this.rateMat(false); },
    rateMat: function(like) {
        var rec = this.higgs.recs[this.kmat];
        if (!rec || this.higgs.util.likeable[this.kmat]==0) return;
        var prm = this.control.cmd_like(rec,like);
        this.firstRate(this.kmat+1);
        return prm;
    },
    goSettings: function () {
        this.control.viewSettings.build();
    },
    firstRate: function (first) {
        var able = this.higgs.util.likeable;
        for (var kmat = +first||0; kmat < able.length && able[kmat]===0; kmat++) {}
        this.build(kmat);
    },
    nextMat: function() { this.change(1); },
    prevMat: function() { this.change(-1); },
    change: function(step) {
        var next = nqo.bound(this.kmat + step,0,this.higgs.recs.length-1);
        if (next==this.kmat) return;
        this.build(next);
    },
    click: function(evt) {
        var node = evt.target;
        dojo.stopEvent(evt);
        if (node.tagName=='IMG') {
            var kimg = [].indexOf.call(node.parentNode.children, node);
            this.openPics(kimg);
        }
    },
    openPics: function(kimg) {
        var person = this.higgs.recs[this.kmat];
        var urls = person.photos.map(function(pic){ return pic.processedFiles[0].url });
        this.lightbox.lbstart(urls,+kimg || 0);
    },
    greyout: function() {
        grey = !(this.higgs.util.likeable[this.kmat]===1);
        var method = grey ? dojo.addClass : dojo.removeClass;
        method.call(dojo,this.toolPass,'greyTool');
        method.call(dojo,this.toolLike,'greyTool');
        this.toolPass.title = grey ? 'this recommendation has already been rated' : 'shortcut:h';
        this.toolLike.title = grey ? 'this recommendation has already been rated' : 'shortcut:l';
    },
    recsNum: function() {
        this.toolNum.innerText = this.higgs.util.likestamps.length;
    },
    recsAlertify: function() {
        function remains(val) { return val==1; }
        var any = this.higgs.util.likeable.some(remains);
        nu.util.alertify(this.control.headerRecs,'alertz',!any);
    },
    updateRecs: function() {
        this.recsAlertify();
        this.kmat = -1;
        if (this.control.view==this)
            this.build();
    },
    restore: function(state) {
        this.build();
    },
    /** @param {nu.FoodPayload} payload */
    build: function(kmat) {
        if (kmat===undefined)
            kmat = this.higgs.util.likeable.indexOf(1);
        var recs = this.higgs.recs, len = recs.length;
        if (kmat >= len) kmat = -1;
        this.kmat = kmat;
        this.statify(location.hash=='#recs',null,'Recommendations','#recs');
        if (this.control.quotax.qpercent > 90) {
            this.control.injectView(this,
                tagr.div(null,"storage quota near 100% - block some matches to free up space"),this.tools2);
            return;
        }
        if (kmat < 0) {
            this.control.injectView(this,tagr.div(null,"no recommendations are available near you"),this.tools2);
            return;
        }

        var xo = recs[kmat];
        var po = xo.photos;
        var age = calculateAge(new Date(xo.birth_date));
        var page;
        with (tagr) {
            page = div(
                div("blurbDiv",
                    p(xo.name+", "+age),
                    p(xo.bio),
                    this.distdiv = div("distDiv",null)
                ),
                hr(),
                div(
                    po.map(function(x) { return img(x.processedFiles[1].url); })
                )
            );
        }
        this.setDistance(xo);
        this.greyout();
        this.recsNum();
        this.control.injectView(this, page, this.tools);
    }
};
nqo.extend(ViewPerson,ViewBase);


// view someone that you've matched with
ViewMatch = function(higgs) {
    /** @type UserData */
    this.higgs = higgs;
    this.kmat = null;
    this.keymap = nqo.shallow(this.keymap);
    this.msgbox = null;
    this.sendbu = null;
    this.convodiv = null;
    this.distdiv = null;
    this.lightbox = new LightBox();
    this.lasttime = {};
    ViewBase.apply(this,arguments);
    with (tagr) {
        this.tools =
            div('tools7',
                this.toolify(this.blockUserTrigger,'unmatch this user','Block'),
                this.toolify(this.requestUser,'update user info, shortcut:i','Info')
            );
    }
};
ViewMatch.prototype = {
    classInit: function() {
        this.keymap = {};
        this.keymap.j = this.nextMat;
        this.keymap.k = this.prevMat;
        this.keymap.i = this.requestUser;
        this.keymap.u = this.toList;
        this.keymap.o = this.openPics;
    },
    requestUser: function() {
        var match = this.higgs.updates.matches[this.kmat];
        this.control.cmd_user(match);
    },
    blockUserTrigger: function() {
        this.control.overlayify("unmatch this user",this.blockUser);
    },
    blockUser: function() {
        var match = this.higgs.updates.matches[this.kmat];
        this.control.cmd_delete(match);
    },
    toList: function() { this.control.viewList.build(); },
    nextMat: function() { this.change(1); },
    prevMat: function() { this.change(-1); },
    change: function(step) {
        this.build(step,true);
    },
    click: function(evt) {
        var sel = window.getSelection();
        if (sel.toString().length) return;
        var node = evt.target, cb;
        dojo.stopEvent(evt);
        if (node==this.sendbu)
            return this.sendMsg();
        var row = nqo.parentByTag(node, 'DIV');
        if (row.className=='distDiv')
            this.requestUser();
        else if (row.className=='picDiv') {
            var kimg = [].indexOf.call(row.children, node);
            this.openPics(kimg);
        }
        var href = node.getAttribute('href');
        if (href) this.control.historyifier({state:{hash:href}});
    },
    openPics: function(kimg) {
        var mat = this.higgs.updates.matches[this.kmat];
        if (!mat) return;
        var urls = mat.person.photos.map(function(pic){ return pic.processedFiles[0].url });
        this.lightbox.lbstart(urls,+kimg || 0);
    },
    sendMsg: function(evt) {
        var mat = this.higgs.updates.matches[this.kmat];
        if (!mat) return;
        var msg = this.msgbox.value;
        this.msgbox.value = ''; // TODO: ideally would post it as pending in case it fails ...
        this.control.cmd_send(mat._id,msg);
        var sx = window.scrollX, sy = window.scrollY;
        document.activeElement.blur();
        window.scrollTo(sx,sy);
    },
    // wrap a moment, so it can be used as a message
    momifier: function(mom) { return mom && { mom:mom, timestamp:new Date(mom.date).valueOf() }; },
    sort: function(msgs,moms) {
        var i1=0, i2=0, n1=msgs.length, n2=moms.length;
        var result = [];
        var mom2 = this.momifier(moms[0]);
        while (i1 < n1 || i2 < n2) {
            if      (i1<n1 && i2==n2) result.push(msgs[i1++]);
            else if (i1<n1 && msgs[i1].timestamp <= mom2.timestamp) result.push(msgs[i1++]);
            else {
                result.push(mom2);
                mom2 = this.momifier(moms[++i2]);
            }
        }
        return result;
    },
    addMsgs: function(msgs,moms,person) {
        this.lasttime[person._id] = 0;
        var m2 = msgs;
        msgs = this.sort(msgs, moms);
        for (ii = 0; ii < msgs.length; ii++) {
            var msg = msgs[ii];
            this.addMsg(msg,person);
        }
    },
    // add a new moment (no kmat) or a new mymo like (by kmat) to the convo
    addMoment: function(kmom,kmat) {
        var mom = (kmat===undefined)      ? this.higgs.feed.moments[kmom] : this.higgs.mymo.moments[kmom];
        if        (kmat===undefined) kmat = this.higgs.usermap[mom.created_by];
        var mat = this.higgs.updates.matches[kmat];
        if (kmat==this.kmat && mat)
            this.addMsg(this.momifier(mom), mat.person, true);
    },
    addMsg: function(msg,person,forcescroll) {
        var last = this.lasttime[person._id] || 0;
        var delta = 1000 * 60 * 5;
        var timestamp = msg.timestamp || Date.now(); // cmd_send replies don't have this
        if (timestamp - last > delta) {
            this.lasttime[person._id] = timestamp;
            var when = this.higgs.formatDate(timestamp);
            tagr.div({ref: this.convodiv, klass: "msgTime"}, when);
        }
        var from = msg.mom ? msg.mom.created_by : msg.from;
        var kuser = this.higgs.auth.user._id;
        var mine = (from === kuser);
        var klass = mine ? "msgSelf" : "msgOther";
        var inner, outer;
        if (msg.mom) {
            var href = (mine ? this.control.viewMymo:this.control.viewFeed).gethref(msg.mom._id);
            var rating = !mine && this.higgs.getRating(msg.mom);
            var ratingCss = 'feedimg' + (mine ? ' liking' : this.control.viewFeed.getRating(msg.mom));
            var name = person.name;
            var blurb;
            if (mine)           blurb =                name + " liked your moment";
            else if (rating==2) blurb = 'you liked ' + name + "'s moment";
            else                blurb =                name + " posted a moment";
            inner = tagr.p(blurb,'feedBlurb',null);
            var photo = tagr.img(
                mine ? msg.mom.media.processedFiles.small : undefined,
                {href:href, klass:ratingCss});
            outer =
            tagr.div({ref:this.convodiv, klass:klass}, inner, photo);
        }
        else
            outer =
            tagr.div({ref:this.convodiv, klass:klass}, tagr.p(msg.message));
        if (msg.mom && !mine)
            this.control.viewFeed.photoize2(msg.mom,photo,'fakeimage '+ratingCss);
        if (forcescroll) {
            // if it's ours, we prolly just sent it, could come from another device but that's rare
            //   do the exepected thing for the common case
            this.msgbox.scrollIntoView();
            if (!mine || msg.mom) nu.util.alertify(outer,null,1000);
        }
    },
    gethref: function(kmat) { return '#match/'+kmat; },
    restore: function(state) {
        var detail = (state.hash || location.hash).split('/')[1];
        var kmat = state.kmat || +detail || 0;
        this.build(kmat);
    },
    /** build the match, where change implies relative (wrt viewlist) krow and already rendered */
    build: function(delta_or_kmat,change) {
        var kmat = this.control.viewList.nextMatch(delta_or_kmat,change);
        if (kmat==this.kmat && change)
            return;
        this.kmat = kmat;
        var prefix = '#match/';
        var same = location.hash.startsWith(prefix);
        this.statify(same,{kmat:kmat},'Your Match',prefix+kmat);
        var missing = this.higgs.updates.matches.length
            ? "this match is no longer available"
            : "you haven't matched with anyone yet";
        var match = this.higgs.updates.matches[kmat];
        if (!match)
            return void this.control.injectView(this,tagr.div(null,missing));
        this.control.viewList.alertMatch(kmat,null,true);
        var xo = match.person;
        var momz = (this.higgs.util.userLikes[kmat] || []).map(
            function(kk) { return this.mymo.moments[this.mlikes.kmom[kk]]; },
            this.higgs);
        var momx = this.higgs.feed.moments.filter(function(mom) { return mom.created_by==xo._id; });
        var moms = [].concat(momx,momz).sort(function(a,b){return a.date.localeCompare(b.date)});
        var po = xo.photos;
        var mo = match.messages;
        var age = calculateAge(new Date(xo.birth_date));
        var ii;
        // kludge to make the msgDiv fill the available area without overflowing
        // ie, keeps the layout the same as you switch between matches, ie pics or no pics on right
        // if the width is just right that the difference between them is the scrollbar width
        // can still go back and forth
        var placeholder = ". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ";
        placeholder += placeholder;
        placeholder += placeholder;
        var picdiv;
        with (tagr) {
            this.page = div(
                this.blurb = div("blurbDiv",
                    p(xo.name+", "+age),
                    p(xo.bio),
                    this.distdiv = div({klass:"distDiv",title:'click to update info, shortcut:i'},null)
                ),
                hr(),
                div("msgDiv",
                    this.convodiv = div("convoDiv",
                        div("msgPlaceholder",placeholder)
                    ),
                    snddiv = div("sendDiv",
                        hr(),
                        this.msgbox = textarea(),
                        this.sendbu = button('sendMsg',null,'Send')
                    )
                ),
                picdiv      = div("picDiv",null)
            );
            this.addMsgs(mo,moms,xo);
            for (ii=0; ii<po.length; ii++) img(po[ii].processedFiles[2].url,{ref:picdiv});
        }
        this.setDistance(xo);
        var blocked = this.higgs.blocked(match._id);
        if (blocked) nqo.appendChilds(this.distdiv,tagr.span("lastSpan","blocked"));
        this.control.injectView(this, this.page, this.tools);
        this.msgbox.scrollIntoView();
    },
    // we've been blocked, update even tho a message my be being composed (can't send it anymore)
    updateBlock: function(kmat,them) {
        // todo: overlay a giant "BLOCKED" message
        if (this !== this.control.view) return;
        if (kmat !== this.kmat) return;
        this.build(kmat);
        if (them) nu.util.alertify(this.blurb,null,1000);
    },
    updateUser: function(match) {
        var match1 = this.higgs.updates.matches[this.kmat];
        if (match !== match1) return;
        if (this.distdiv) this.setDistance(match.person);
    },
    updateMessage: function(match,msg) {
        var kmat = this.higgs.matchmap[match._id];
        var same = (match==this.higgs.updates.matches[this.kmat]);
        var ours = msg.from===this.higgs.auth.user._id;
        if (same)
            this.addMsg(msg,match.person,true);
        var seen = ours || same && this.isActive() && document.hasFocus();
        if (kmat > 10000)
            debugger;
        if (!seen) this.higgs.util.modified[kmat] = 1;
        return !seen;
    }
};
nqo.extend(ViewMatch,ViewBase);

/*
 from 2014.11.14, mark.44839
 ---------------------------
 platform: android
 User-Agent: Tinder Android Version 3.3.2
 X-Auth-Token: c4be30bc-f2dd-481c-b8b9-f066e4a459de
 os-version: 18
 app-version: 763
 Content-Type: application/json; charset=utf-8
 Host: api.gotinder.com
 Connection: Keep-Alive
 Accept-Encoding: gzip
 */


UserData = function(control) {
    /** nu.Control */
    this.control = control;

    var parse = function(msg) {
        return msg===undefined ? null : JSON.parse(msg);
    };

    // at least in (some) modern cases
    // match._id == match.person._id + auth.user._id
    // user id is constant across different accounts (ie mondo and mark25 see the same id for perri)
    // assuming that rec._id === match.person._id

    this.auth   = parse(localStorage.data_auth) || {token:'',user:{}};
    this.recs   = parse(localStorage.data_recs) || [];
    this.updates= parse(localStorage.data_update) ||
        { matches:[], blocks:[], lists:[], deleted_lists:[], last_activity_date:'' };
    this.feed   = parse(localStorage.data_feed) || {last_activity_date:null,moments:[]};
    this.mymo   = parse(localStorage.data_mymo) || {last_activity_date:null,moments:[]};
    this.profile = parse(localStorage.data_profile) || {};

    // metadata of info corresponding to mymoment likes
    this.mlikes = {
        // like events, ie when a user likes a mymoment
        /** array indexed by klike, the date of the like event  */  date: [],
        /** array indexed by klike, the kuser that liked it     */  kuser: [],
        /** array indexed by klike, the kmom that the user liked*/  kmom: [],

        /** array indexed by kmom, the last recorded
          *   # of likes that the kmom-th mymoment got
          *   ie, moment.likes_count, updated after retrieving mlikes
          *   (often, the number of mlikes may not match likes_count)
          *   ie, it serves as a marker indicating that we've
          *   retrieved the mlikes after the likes_count increased */  freshen: []
    };
    this.mlikes = parse(localStorage.data_like) || this.mlikes;

    // object mapping from moment id to index into feed.moments
    this.feedmap = this.feed.moments.reduce(function(map,mom,ii) { map[mom._id]=ii; return map; },{});
    // object mapping from moment id to index into mymo.moments
    this.mymomap = this.mymo.moments.reduce(function(map,mom,ii) { map[mom._id]=ii; return map; },{});

    /** map from match.person._id to index into this.updates.matches */  this.usermap = {};
    /** map from kmom.kuser to index into this.mlikes                */  this.likemap = {};
    /** map from matchId to index into this.updates.matches          */  this.matchmap = {};
    /** map from matchId to index into this.updates.blocks           */  this.blockmap = {};


    this.updates.matches.forEach(function(mat,ii) {
        if (mat) this.usermap[mat.person._id] = this.matchmap[mat._id] = ii;
    },this);


    this.updates.blocks = this.updates.blocks.filter(function(block) {
        return block in this.matchmap;
    },this);

    this.updates.blocks.forEach(function(block,ii) {
        this.blockmap[block] = ii;
    },this);

    this.updates.matches.forEach(function(mat,kmat,mats) {
        var kb = mat && this.blockmap[mat._id];
        kb != null && this.delete_match(kmat);
    },this);


    var u2 = parse(localStorage.data_util) || { modified:'', feedrate:'', likestamps:'' };

    // transitional helper for existing localstorage ... can be deleted post-transition
    if (u2.feedrate===undefined) u2.feedrate = '';
    if (!this.mlikes.freshen) this.mlikes.freshen = [];

    var likeable = localStorage.data_likeable || '';
    var pingstamp = this.updates.matches.map(function(mat) {
        return !mat ? 0:new Date(mat.person.ping_time).valueOf(); });

    this.util = {
        // rating given to feed moments, 0:none, 1:pass, 2:like, 3:out-of-date, length:#moments
        feedrate: u2.feedrate.split("").map(Number),

        // has the match convo updated since last viewed, length:#matches
        modified: u2.modified.split("").map(Number), // updates to the convo

        likestamps: nqo.deltainv(u2.likestamps || []),

        // is the recommendation likeable, length:#recs
        likeable: likeable.split("").map(Number),

        // array of arrays comprising klike (ie index into mlikes), corresponding to each match (user)
        // map from kmat to array of klikes
        userLikes: [],
        // array of arrays comprising klike (ie index into mlikes), corresponding to each moment (ie kmom)
        // map from kmom to array of klikes
        momLikes: [],
        // array of timestamps corresponding to each match
        pingstamp: pingstamp,
        timestamps: [],
        newpersons: {},
        cibconfig: {
            /* autoupdate on startup     */   useauto:   true,
            /* bits - 0:update, 1:mymo   */   prenotify: 0x03
        },

        toJSON: function() {
            return {
                modified: this.modified.join(""),
                feedrate: this.feedrate.join(""),
                likestamps: nqo.deltaify(this.likestamps),
                cibconfig: this.cibconfig
            };
        }
    };

    if (u2.cibconfig)
        this.util.cibconfig = u2.cibconfig;

    this.timestampifyx();
    this.likemappify();

    // limit the length of the request log
    var log = localStorage.log_reqs;
    this.storedRequests = (log && log.length < 100000) ? parse(localStorage.log_reqs) : null;
};
UserData.prototype = {
    // use last="" for update all
    make_manual : function(last)    { return this.make('updates',          'POST',{last_activity_date:last}); },
    make_auth   : function(token)   { return this.make('auth',             'POST',{facebook_token: token  }); },
    make_loc    : function(lat,lon) { return this.make('user/ping',        'POST',{lon:lon,lat:lat        }); },
    make_recs   : function()        { return this.make('user/recs',        'POST',{limit: "40"            }); },
    make_msg    : function(mid,msg) { return this.make('user/matches/'+mid,'POST',{message:msg            }); },
    make_mlike  : function(mom)     { return this.make('moment/'+mom+'/like','POST',{}                    ); },
    make_mpass  : function(mom)     { return this.make('moment/'+mom+'/pass','POST',{}                    ); },
    make_feed : function(last) {
        var data = {last_activity_date:"",last_moment_id:last||""};
        return this.make('feed/moments', 'POST', data);
    },
    make_update : function() {
        var last = this.updates.last_activity_date;
        return this.make_manual(last);
    },
    // show me:
    // defaults to 25, 18, 55, women, discoverable
    // gender ... -1:both, 0:men, 1:women
    make_profile: function(dist,age1,age2,gender,disc) {
        if (gender !== -1 && gender !==0) gender = 1;
        var data = {
            distance_filter : dist || 25,
            age_filter_max  : age2 || 55,
            age_filter_min  : age1 || 18,
            gender_filter   : gender,
            discoverable    : disc !== false
        };
        return this.make('profile', 'POST', data);
    },
    make_user   : function(uid)     { return this.make('user/'+uid,            'GET'); },
    make_like   : function(rid)     { return this.make('like/'+rid,            'GET'); },
    make_pass   : function(rid)     { return this.make('pass/'+rid,            'GET'); },
    make_del    : function(mid)     { return this.make('user/matches/'+mid,    'DELETE'); },
    make_moment : function(mid)     { return this.make('moment/'+mid+'/likes', 'GET'); },
    make_moments: function(mid) {
        if (!mid) mid = "";
        return this.make('user/moments?last_id='+mid,'POST',{});
    },

    make: function (path,method,data) {
        var token = this.auth.token;
        return {
            url: 'https://api.gotinder.com/' + path,
            type: method,
            data: data
        };
    },
    merge_recs: function(recs,force) {
        if (recs.length==0 && !force) return;
        this.recs = recs;
        this.util.likeable = [];
        for (var ii = 0; ii < recs.length; ii++) this.util.likeable[ii] = 1;
        this.control.viewPerson.updateRecs();
        xlocalStorage.data_recs = JSON.stringify(recs);
        xlocalStorage.data_likeable = this.util.likeable.join('');
    },
    merge_like: function(person,like,reply) {
        var krec = this.recs.indexOf(person);
        if (krec < 0)
            return console.log('higgs.merge_like: person not found',person,krec);
        this.util.likeable[krec] = 0;
        this.util.newpersons[person._id] = person;
        this.control.viewPerson.updateRecs();
        xlocalStorage.data_likeable = this.util.likeable.join('');
    },
    formatDate: function(timestamp,maxago) {
        return timez.formatz(timestamp,maxago);
    }
    /** merge user2 into (optional) match.person, returning true iff data was modified */
    ,merge_user: function(user2,match) {
        var match = match || this.getMatch(null,user2._id);
        if (!match)
            return false;
        var mod = false;
        var user1 = match.person;
        var fields = ["distance_mi", "ping_time", "photos"];
        for (var ii=0; ii < fields.length; ii++) {
            var field = fields[ii];
            var val1 = user1[field];
            var val2 = user2[field];
            if (val2===undefined) continue;
            var equal = (typeof val1==="object") ? JSON.stringify(val1)===JSON.stringify(val2) : val1===val2;
            if (!equal) { user1[field] = val2; mod = true; }
        }
        if (mod) this.control.viewMatch.updateUser(match);
        if (mod) this.control.viewList.updateUser(match);
        return mod;
    }
    ,merge_message: function(message) {
        var kmat = this.matchmap[message.match_id];
        var match = this.getMatch(message.match_id);
        if (!match)
            return;
        this.merge_messages(match,[message]);
        this.timestampify_match(match,kmat);
        this.control.viewList.updateTimestamp();
    }
    /** merge messages in array t2 into match */
    ,merge_messages: function(match,t2) {
        if (!match)
            return;
        var kmat = this.matchmap[match._id];
        var store=false, alert=null;
        var t1 = match.messages;
        var mapper = {}, ii;
        for (ii=0; ii<t1.length; ii++) mapper[t1[ii]._id]=ii;
        for (ii=0; ii<t2.length; ii++) {
            var msg = t2[ii];
            var kt = mapper[msg._id];
            if (kt===undefined) {
                t1.push(msg);
                store = true;
                var unseen = this.control.viewMatch.updateMessage(match,msg);
                if (unseen && this.isnotify(0x01))
                    alert = msg;
            }
            else {
                var msgx = t1[kt];
                if (msg.message !== msgx.message)
                    console.error("messages have same ids, but different text: %O vs %O",msgx,msg);
                else {
                    // TODO: delete this message assuming no problems appear with message merging
                    //   we know that messages get dupd when they are sent and then the next update
                    //   only apparent difference is timestamp (which isn't used)
                    console.log("dup message is dup %O", msg);
                    nqo.shallow(msg,msgx);
                }
            }
        }
        var href = this.control.viewMatch.gethref(kmat);
        if (alert)
            this.control.notifier(match.person.name, 'New message from: ', alert.message, href);
        this.control.viewList.updateMatch(kmat,alert);
        return store;
    }
    // merge new info in match (from tinder update) into the list of matches
    ,merge_match: function(match) {
        if (dojo.isString(match)) return false; // immediately blocked, ie no match profile, just and id
        var store = false;
        var kmat = this.matchmap[match._id];
        if (kmat===undefined) {
            if (!match.person) {
                console.log("merge_match:missing person",match);
                return false;
            }
            kmat = this.updates.matches.push(match)-1;
            if (kmat > 10000)
                debugger;
            this.util.modified[kmat] = this.isnotify(0x01) ? 1:0;
            this.matchmap[match.       _id] = kmat;
            this. usermap[match.person._id] = kmat;
            this.util.pingstamp[kmat] = new Date(match.person.ping_time).valueOf();
            store = true;
            var dupp = this.util.newpersons[match.person._id];
            var href = this.control.viewMatch.gethref(kmat);
            if (dupp)
                delete this.util.newpersons[match.person._id];
            if (this.isnotify(0x01))
                this.control.notifier(match.person.name,'New match: ',match.person.bio,href);
            this.control.viewList.updateMatch(kmat,store);
        }
        else
            store = this.merge_messages(this.updates.matches[kmat],match.messages);
        if (store) {
            this.timestampify_match(match, kmat);
            this.control.viewList.updateTimestamp();
        }
        return store;
    }
    ,merge_feed: function(feed) {
        if (feed.moments.length==0) return;
        // TODO: need to check mitmproxy to see how last_activity_date should be set
        this.feed.last_activity_date = feed.last_activity_date;
        var moms = this.feed.moments;
        var mod = false;
        feed.moments.sort(function(mom1,mom2) {
            return mom1.date.localeCompare(mom2.date);
        });
        for (var ii=0; ii<feed.moments.length; ii++) {
            var mom = feed.moments[ii];
            var kmom = this.feedmap[mom._id];
            if (kmom !== undefined) continue; // could verify data hasn't changed ...
            kmom = this.feedmap[mom._id] = moms.push(mom)-1;
            this.util.feedrate[kmom] = 0;
            this.control.viewFeed.updateMoment(kmom);
            this.control.viewMatch.addMoment(kmom);
            this.timestampify_moment(mom);
            mod = true;
        }
        if (mod) {
            xlocalStorage.data_feed = JSON.stringify(this.feed);
            this.control.viewList.updateTimestamp();
        }
    }
    ,merge_mlike: function(reply,mom_id,like) {
        var kmom = this.feedmap[mom_id];
        this.util.feedrate[kmom] = like ? 2:1;
    }
    ,merge_profile: function(reply) {
        reply.nqa_timestamp = new Date().toISOString();
        this.profile = reply;
        xlocalStorage.data_profile = JSON.stringify(this.profile);
        this.control.viewSettings.updateProfile();
    }
    ,merge_mymo: function(reply) {
        this.mymo.last_activity_date = reply.last_activity_date;
        var update = false;
        for (var ii=0; ii<reply.moments.length; ii++) {
            var mom = reply.moments[ii];
            var kmom = this.mymomap[mom._id];
            var moms = this.mymo.moments;
            var likes = null;
            if (kmom===undefined)
                kmom = this.mymomap[mom._id] = moms.push(mom)-1;
            else
                likes = moms[kmom].likes_count;
            moms[kmom].likes_count = mom.likes_count || 0;
            if (!this.isnotify(0x02)) this.mlikes.freshen[kmom] = -1;
            if (mom.likes_count !== likes || likes==null) {
                update = true;
                this.control.viewMymo.updateMymo(mom._id);
            }
        }
        if (update) {
            xlocalStorage.data_mymo = JSON.stringify(this.mymo);
            this.control.viewMymo.updateMymo();
        }
        if (!this.isnotify(0x02))
            this.storeLikes();
        this.util.cibconfig.prenotify &= ~0x02;
        return update;
    }
    ,merge_mymoment: function(moment_id,reply) {
        // need to be able to look up the likes for a moment, the moments a user has liked
        //   and whether a like already exists, ie user+mom
        // store {date,user,mom} and mappings from user and mom to arrays of indices
        // could be 100s of moments/users ... 1000s of likes
        var count = 0;
        for (var ii=0; ii<reply.length; ii++) {
            var like = reply[ii];
            var num = this.mlikeAdd(like.user, moment_id, like.date); // could be null
            if (num) count += num;
        }
        var kmom = this.mymomap[moment_id];
        var mom = this.mymo.moments[kmom];
        var freshen = mom.likes_count > (this.mlikes.freshen[kmom] || 0);
        this.mlikes.freshen[kmom] = mom.likes_count;
        if (count || freshen) this.storeLikes();
        console.log('merge_mymoment complete, count: %d',count);
        return count;
    }
    ,storeLikes: function() {
        this.mlikes.freshen.forEach(nqo.zeroishEach);
        xlocalStorage.data_like = JSON.stringify(this.mlikes)
    }
    ,delete_blocked: function() {
        this.updates.matches.forEach(function(mat,kmat) {
            if (mat && this.blockmap[mat._id] != null) {
                this.control.viewList.removeMatch(kmat);
                this.delete_match(kmat);
            }
        }.bind(this));
    }
    ,delete_match: function(kmat) {
        var mat = this.updates.matches[kmat];
        delete this.usermap[mat.person._id];
        delete this.matchmap[mat._id];
        var kb = this.blockmap[mat._id];
        if (kb != null) {
            var blocks = this.updates.blocks;
            var lastid = blocks[blocks.length-1];
            blocks[kb] = lastid;
            blocks.length--;
            this.blockmap[lastid] = kb;
        }
        delete this.blockmap[mat._id];
        this.updates.matches[kmat] = null;
    }
    ,add_block: function(matchId,ours) {
        if (this.blockmap[matchId] != null)
            return false;
        this.blockmap[matchId] = this.updates.blocks.push(matchId)-1;
        var kmat = this.matchmap[matchId];
        if (kmat !== undefined) {
            this.control.viewList.updateMatch(kmat, !ours);
            this.control.viewMatch.updateBlock(kmat, !ours);
            if (ours) this.delete_match(kmat);
        }
        return true;
    }
    ,merge_update: function(update) {
        var store = false;
        var u1 = this.updates;
        var u2 = update;
        var ii;

        [].push.apply(u1.        lists, u2.        lists);
        [].push.apply(u1.deleted_lists, u2.deleted_lists);

        for (ii=0; ii< u2.matches.length; ii++)
            store = this.merge_match(u2.matches[ii]) || store;

        for (ii=0; ii<u2.blocks.length; ii++)
            store = this.add_block(u2.blocks[ii]) || store;

        if (store) this.control.viewList.listAlertify();

        u1.last_activity_date =         u2.last_activity_date;
        // todo - delete this logging ???
        var fields = ["matches", "blocks", "lists", "deleted_lists"];
        for (ii = 0; ii < fields.length; ii++) {
            var field = fields[ii];
            var len = u2[field].length;
            if (len) console.log("update",field,len);
        }
        if (u2.        lists.length > 0 ||
            u2.deleted_lists.length > 0) store = true;
        if (store) this.storeUpdate("merge_update",update);
        this.util.cibconfig.prenotify &= ~0x01;
    }
    ,storeUpdate: function(command,reply) {
        // TODO: use command and reply to save only the incremental, allowing restore on load
        var string = JSON.stringify(this.updates);
        if (string.length > 2000000 && false)
            string = this.stripStore();
        xlocalStorage.data_update = string;
        var use_data_count = false;
        if (use_data_count) {
            var count = parseInt(localStorage.data_count) || 0;
            if (command === "merge_update") {
                xlocalStorage['data_' + count] = JSON.stringify(reply);
                xlocalStorage.data_count = count + 1;
            }
        }
    }
    ,clearStore: function() {
        localStorage.clear();
    }
    ,stripStore: function() {
        // todo - remove moments too (they use person._id which isn't preserved, so need to do it first)
        var mats = this.updates.matches;
        var map = this.control.viewList.matmap;
        for (var ii=0; ii < mats.length; ii++)
            ii in map || (mats[ii] = null);

        var string = JSON.stringify(this.updates);
        return string;

        var moms = this.feed.moments;
        var moma = this.control.viewFeed.mommap;
    }
    ,setUpdate: function(update) {
        // todo: some matches may only be a naked id, ie already blocked - delete them
        this.updates = update;
        this.storeUpdate("merge_update",update);
    }
    // add mappings from kuser and kmom to klike, ie the index into mlikes
    ,mlikeIndex: function(kuser,kmom,klike) {
        var uv = this.util.userLikes, mv = this.util.momLikes;
        if (uv[kuser]) uv[kuser].push(klike); else uv[kuser] = [klike];
        if (mv[kmom ]) mv[kmom ].push(klike); else mv[kmom ] = [klike];
    }
    ,mlikeAdd: function(uid,mid,date) {
        var kuser = this.usermap[uid];
        var kmom = this.mymomap[mid];
        if (kmom==undefined || kuser==undefined) return null;
        var key = kmom+'.'+kuser;
        if (this.likemap[key]==undefined) {
            var likes = this.mlikes;
            var count = likes.date.length;
            likes.date [count] = date;
            likes.kuser[count] = kuser;
            likes.kmom [count] = kmom;
            this.likemap[key] = count;
            this.mlikeIndex(kuser,kmom,count);
            this.timestampify(kuser,date);
            this.control.viewMatch.addMoment(kmom,kuser);
            return 1;
        }
        return 0;
    }
    // iterate thru and populate the initial mlike mappings
    ,likemappify: function() {
        var count = this.mlikes.date.length;
        for (var klike=0; klike < count; klike++) {
            var kuser = this.mlikes.kuser[klike];
            var kmom  = this.mlikes.kmom [klike];
            var key = kmom+'.'+kuser;
            if (this.likemap[key] !== undefined) console.log('likemap.dup: ' + key, klike);
            this.likemap[key] = klike;
            this.mlikeIndex(kuser,kmom,klike);
        }
    }
    ,isnotify: function(bit) {
        var cc = this.util.cibconfig;
        return (cc.prenotify & bit)==0;
    }
    // calculate (and store) the rating for the moment ... 0:unrated, 1:liked, 2:passed, 3:expired
    // mom can be either a moment or a kmom
    ,getRating: function(mom) {
        var kmom = mom;
        if (+mom==mom) mom = this.feed.moments[kmom];
        else          kmom = this.feedmap[mom._id];
        var rating = this.util.feedrate[kmom];
        var hours = nu.util.hours(mom.date);
        var kmat = this.usermap[mom.created_by];
        var mat = this.updates.matches[kmat];
        var blocked = !mat || this.blocked(mat._id);

        if (!rating && (hours >= 24 || blocked))
            rating = this.util.feedrate[kmom] = 3;
        return rating || 0;
    }
    // the match corresponding to the moment
    ,mom2mat: function(mom) {
        var kmat = mom && this.usermap[mom.created_by];
        return this.updates.matches[kmat];
    }
    // get match by either user_id (if provided) else by match_id
    ,getMatch: function(match_id,user_id) {
        var kmat = user_id===undefined ? this.matchmap[match_id] : this.usermap[user_id];
        return this.updates.matches[kmat];
    }
    ,blocked: function(match_id) {
        return this.blockmap[match_id] != null;
    }
    ,timestampify: function(kmat,stamp) {
        if (dojo.isString(stamp)) stamp = +new Date(stamp);
        var prev = this.util.timestamps[kmat];
        if (!prev || stamp > prev) this.util.timestamps[kmat] = stamp;
    }
    ,timestampify_match: function(match,kmat) {
        if (!match)
            return void this.timestampify(kmat,0);
        this.timestampify(kmat,match.created_date);
        var msgs = match.messages;
        var msg = msgs && msgs[msgs.length-1];
        if (msg)
            this.timestampify(kmat,msg.timestamp || msg.sent_date);
        var likes = this.util.userLikes[kmat];
        likes && likes.forEach(function(klike) {
            this.timestampify(kmat,this.mlikes.date[klike])
        },this)
    }
    ,timestampify_moment: function(mom) {
        var kmat = this.usermap[mom.created_by];
        this.timestampify(kmat,mom.date);
    }
    ,timestampifyx: function() {
        this.updates.matches.forEach(this.timestampify_match,this);
        this.feed.moments.forEach(this.timestampify_moment,this);
    }
    ,logRequest: function(req) {
        var log = this.storedRequests;
        if (req===null && log) {
            var txt = JSON.stringify(log);
            if (txt.length < 200000) xlocalStorage.log_reqs = txt;
        }
        else if (log) {
            var bin = log[req.url] || (log[req.url] = []);
            if (bin.length < 10) bin.push(req);
        }
    }
};

nu.Control = function() {
    /** an dictionary object that maps from a view name to the view (nu.ViewBaseᵧₒ subclass) */
    this.viewMap = {};
    /** a mapping of the location hash to a nu.Stateᵢᵧ representing the view (richer info than the hash itself)
     * @type Object<nu.Stateᵢᵧ> */
    this.lochash = {};
    this.curhash = null;
    /** @type nu.ViewBaseᵧₒ
     * the current view */  this.view = null;
    this.higgs = new UserData(this);
    this.saved_xhr = null;
    this.failedAuth = null;
    this.headerTop = $('.container-top')[0];
    this.overlayMain = $('.container-overlay')[0];
    this.page = $('.container-middle')[0];

    /** notify timeout callback (truthy)    */  this.noteh = null;
    /** list of pending note datas          */  this.notes = [];
    /** mapping href to note data           */  this.noteq = {};
    /** the current notification            */  this.notex = null;
    this.notez = this.notez.bind(this);
    this.notifierx = this.notifierx.bind(this);

    this.deputize = this.deputize.bind(this);
    this.deputy = false;
    this.deputymode = 0; // 1:current, 2:ext disconnected, 3:reauth

    this.autoUpdatex = this.autoUpdatex.bind(this);
    this.autoActivity = +new Date();
    this.autoflip = false;
    this.autohandle = [];
    this.limitHandle = null;

    this.infotime = {};
    this.ajaxMonitor = this.ajaxMonitor.bind(this);
    this.ajaxPending = [];
    this.sonarMessage = tagr.span();
    this.headerSonar = tagr.div('hidden',
        tagr.div(),
        this.sonarMessage);

    xlocalStorage.callback = this.quotaify.bind(this);
    /** @type Stuff */
    this.stuff = stuffify(Stuff,this);
    this.stuff.bar();

    /** @type LikeStamper */
    this.likestamper = stuffify(LikeStamper,this);

    /** @type Quotax */
    this.quotax = stuffify(Quotax,this);
};
var stuffify = function(klass,outer) {
    var prev = klass.prototype;
    klass.prototype = outer;
    var obj = new klass();
    dojo.mixin(obj,prev);
    klass.prototype = prev;
    if (obj.postInit) obj.postInit();
    return obj;
};

/** @augments nu.Control */
Stuff = function() {
    // can't access the prototype in the constructor
    this.foo = 'hello world' + this.infotime;
};
Stuff.prototype = {
    blah: function() { return this.infotime; },
    bar: function() {}
};


/** @augments nu.Control */
LikeStamper = function() {};
LikeStamper.prototype = {
    postInit: function() {
        this.lsHandler = this.lsHandler.bind(this);
        this.lsoffset = 12*3600*1000;
        this.lshandle = null;
        this.lsTimer();
    },
    lsTimer: function() {
        var cutoff = Date.now() - this.lsoffset;
        var ls = this.higgs.util.likestamps;
        if (ls.length && this.lshandle==null)
            this.lshandle = setTimeout(this.lsHandler,Math.max(1000,ls[0]-cutoff));
        if (this.viewPerson) this.viewPerson.recsNum();
    },
    lsHandler: function() {
        this.lshandle = null;
        var cutoff = Date.now() - this.lsoffset;
        var ls = this.higgs.util.likestamps;
        var num = ls.length;
        while (ls.length && ls[0] <= cutoff) ls.shift();
        console.log('lsHandler',num-ls.length);
        this.lsTimer();
    },
    lsPush: function() {
        this.higgs.util.likestamps.push(Date.now());
        this.lsTimer();
    }
};

/** @augments nu.Control */
Quotax = function() {};
Quotax.prototype = {
    postInit: function() {
        this.qpercent = 0;
        this.qtitle = 'percent of storage capacity in use, max is 4MB';
        this.qtitle90 = 'storage capacity near max, likes are disabled - block some matches';
        this.qtitle100 = 'storage capacity exceeded, updates are disabled - block some matches';
        this.quotaspan = tagr.div(
            {klass:'headify5',click:function() { this.viewQuota.build(); }.bind(this),title:this.qtitle},null);
        this.quotaDelay = function() { this.quotaMessage() }.bind(this);
    },
    qalert: function() {
        nu.util.alertify(this.quotaspan,'qalert',1000);
    },
    quotaMessage: function(stamp) {
        if (this.ajaxPending.length) return;
        var delay = stamp && stamp+500-Date.now();
        if (delay > 0) return void setTimeout(this.quotaDelay,delay);
        var size = lsdir(localStorage,true);
        var maxsize = 4000000;
        var percent = Math.round(100*size/maxsize);
        this.qpercent = percent;
        var msg = percent + '%';
        this.quotaspan.className = 'headify5' + (percent > 90 ? ' red' : '');
        this.quotaspan.innerText = msg;
        this.quotaspan.title =
            percent >= 100 ? this.qtitle100 :
                percent > 90 ? this.qtitle90 :
                    this.qtitle;
        this.headerSonar.className = '';
        nqo.replaceChildren(this.sonarMessage,this.quotaspan);
    }
};


nu.Control.prototype = {
    set: function() {
        this.headerize();
        this.ajaxMessage();

        /** ViewPerson */
        this.viewPerson = new ViewPerson(this.higgs).setupᵧₒ(this, 'viewPerson', 'Food Diary');
        this.viewMatch = new ViewMatch(this.higgs).setupᵧₒ(this, 'viewMatch', 'Food Diary');
        this.viewList = new ViewList(this.higgs,this.viewMatch).setupᵧₒ(this, 'viewList', 'Food Diary');
        this.viewFeed = new ViewFeed(this.higgs).setupᵧₒ(this, 'viewFeed', 'Feed Moments');
        this.viewMymo = new ViewMymo(this.higgs).setupᵧₒ(this, 'viewMymo', 'My Moments');
        this.viewHelp = new ViewHelp(this.higgs).setupᵧₒ(this, 'viewHelp', 'Help');
        this.viewSettings = new ViewSettings(this.higgs).setupᵧₒ(this, 'viewSettings', 'Settings');
        this.viewQuota    = new ViewQuota   (this.higgs).setupᵧₒ(this, 'viewQuota', 'Quota');

        this.viewPerson.headertab = this.headerRecs;
        this.viewMatch .headertab = this.headerMats;
        this.viewList  .headertab = this.headerMats;
        this.viewFeed  .headertab = this.headerFeed;
        this.viewMymo  .headertab = this.headerMymo;
        this.viewHelp .headertab = this.headerHelp;
        this.viewSettings.headertab = this.headerRecs;

        this.viewFeed.postInit();
        this.viewList.listAlertify();
        this.viewPerson.recsAlertify();
        this.viewMymo.mymoAlertify();

        var target = dojo.doc.documentElement;
        this.kpd = dojo.connect( target, "onkeypress", this, this.keypress_cb );
        this.click = dojo.connect( document, "onclick", this, this.click_cb );
        this.view = null;

        return this;
    },
    reloadPage: function() {
        window.location.reload();
    },
    quotaify: function(name,val) {
        if (this.deputymode==5) return;
        this.deputymode = 5;
        this.headerize();
        this.overlayify(
                "local storage is over quota, this is probably a bug - " +
                "press OK to reload which may fix the problem, " +
                "or cancel to continue in offline mode<br>" +
                "if the problem persists, it may be necessary to delete localStorage",
            this.reloadPage,null,this);
    },
    // bound
    ajaxMonitor: function(reply,status,prm) {
        var ap = this.ajaxPending;
        for (var ii=0,obj; (obj = ap[ii]) && obj.prm !== prm; ii++) {}
        ap.splice(ii,1);
        this.ajaxMessage(ii,obj);
    },
    ajaxMessage: function(kpend,last) {
        var ap = this.ajaxPending;
        // console.log('ajaxMessage',kpend,ap);
        if (ap.length==0) {
            this.quotax.quotaMessage(last && last.stamp);
        }
        else if (kpend==0) {
            this.headerSonar.className = 'sonar';
            nqo.replaceChildren(this.sonarMessage,tagr.span('sonarmsg',ap[0].msg));
        }
    },
    reauthTrigger: function() {
        // response:
        //  {status: 401, error: "No session found for user with api_token: e6e11709-af0d-4d3f-8044-e5c6ecf3cc0d"}
        this.preUnload();
        this.deputymode = 3;
        this.deputy = false;
        this.headerize();
        this.overlayify(
            "command failed - press OK to reauthorize with facebook, or cancel to continue in offline mode",
            this.reauthNow,null,this);
    },
    reauthNow: function() {
        chrome.runtime.sendMessage(extid,{type: 'oauth'});
    },
    // if the key has been modified in the last delta, update the modified time and return true
    checktime: function(key,delta) {
        var last = this.infotime[key] || 0;
        var curr = Date.now();
        if (curr - last < delta) return true;
        this.infotime[key] = curr;
    },
    // requests can be silently dropped if 2 or more are outstanding
    ajaxer: function(req,msg) {
        if (!this.deputy || this.ajaxPending.length >= 2) return {done:function(){}};

        this.higgs.logRequest(req);
        var token = this.higgs.auth.token;

        var payload = {
            type:'ajax', req:req, token:token
        };

        var prm = {
            done: function(method) { this.ondone = method; },
            fail: function(method) { this.onfail = method; }
        };
        var self = this;
        // from background.js: AjaxproxyData
        var handler = function(reply) {
            self.ajaxMonitor(null,null,prm);
            if (reply.iserror)
                console.log('ajaxer.error',reply);
            if (reply.iserror || reply.status !== 200)
                prm.onfail && prm.onfail.call(self,reply.response,reply.status,reply);
            else
                prm.ondone && prm.ondone.call(self,reply.response,reply.status,reply);
            if (reply.status==401)
                self.reauthTrigger();
        };

        {
            var kpend = this.ajaxPending.push({req:req,prm:prm,msg:msg,stamp:Date.now()})-1;
            this.ajaxMessage(kpend);
            this.saved_xhr = [req,prm];
            chrome.runtime.sendMessage(extid,payload,handler);
        }

        return prm;
    },
    // set the location to (lat,lon), by default with a bit of randomness for privacy - disable with nopriv true
    cmd_loc: function(lat,lon,nopriv) {
        if (!lat || !lon) return;
        // 1 degree --> ~100000 feet (bit more for lat, bit less for long in 32N-42N
        //                   0.00001 is one foot
        var max = nopriv ? 0:0.00020;
        var r1 = Math.random()-.5, r2 = Math.random()-.5;
        var req = this.higgs.make_loc(lat+r1*max,lon+r2*max);
        var prm = this.ajaxer(req,'updating location');
        prm.done(function(reply) {
            console.log("cmd_loc complete: %O", reply);
        });
        return prm;
    },
    cmd_profile: function(dist,age1,age2,gender,disc) {
        var req = this.higgs.make_profile(dist,age1,age2,gender,disc);
        var prm = this.ajaxer(req,'updating profile');
        prm.done(function(reply) {
            console.log("cmd_profile complete: %O", reply);
            this.higgs.merge_profile(reply);
        }.bind(this));
        return prm;
    },
    cmd_feed: function(last) {
        if (this.quotax.qpercent >= 100) return void this.quotax.qalert();
        if (this.checktime('cmd_feed::check',30000)) return;
        var mom = this.higgs.feed.moments
            .reduce(function(max,mom) { return max && max.date < mom.date ? max:mom },undefined);
        if (last===undefined) last = mom ? mom._id : '';
        var req = this.higgs.make_feed(last);
        var prm = this.ajaxer(req,'downloading feed');
        var self = this;
        prm.done(function(reply) {
            self.higgs.merge_feed(reply);
            console.log("cmd_feed complete: %O", reply);
        });
        return prm;
    },
    cmd_mlike: function(mom_id,like) {
        var req = like
            ? this.higgs.make_mlike(mom_id)
            : this.higgs.make_mpass(mom_id);
        var prm = this.ajaxer(req,'rating moment');
        var self = this;
        prm.done(function(reply) {
            console.log("cmd_mlike complete: %o",reply);
            if (reply.status==200) self.higgs.merge_mlike(reply,mom_id,like);
            self.viewFeed.mlike_cb(reply,mom_id,like);
        });
        return prm;
    },
    cmd_mymo: function() {
        if (this.quotax.qpercent >= 100) return void this.quotax.qalert();
        if (this.checktime('cmd_mymo::check',30000)) return;
        var req = this.higgs.make_moments();
        var prm = this.ajaxer(req,'downloading my moment statistics');
        var self = this;
        prm.done(function(reply) {
            console.log("cmd_mymo complete",reply);
            self.higgs.merge_mymo(reply);
        });
        return prm;
    },
    cmd_mymoment: function(moment_id) {
        if (moment_id==undefined) return;
        if (this.checktime('cmd_mymoment::' + moment_id,30000)) return;
        var req = this.higgs.make_moment(moment_id);
        var prm = this.ajaxer(req,'downloading my moment likes');
        var self = this;
        prm.done(function(reply) {
            console.log("cmd_mymoment complete",reply);
            var update = self.higgs.merge_mymoment(moment_id,reply);
            if (update)
                self.viewMymo.updateMymo(moment_id,true);
        });
        return prm;
    },
    ajaxImage: function(url,cb,type) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            var blb = new Blob([xhr.response], {type: 'image/png'});
            var url = (window.URL || window.webkitURL).createObjectURL(blb);
            cb(url,blb);
        };
        xhr.open(type||'GET',url);
        xhr.send();
    },
    cmd_like: function(person,like) {
        if (this.quotax.qpercent > 90) return void this.quotax.qalert();
        var req = like
            ? this.higgs.make_like(person._id)
            : this.higgs.make_pass(person._id);
        var prm = this.ajaxer(req,'rating a user');
        var self = this;
        var callback;
        prm.done(callback = function(reply) {
            if (like) self.likestamper.lsPush();
            self.higgs.merge_like(person,like,reply);
            if (reply.match) {
                nu.util.alertify(self.headerMats, "alertx", 2000);
                // could set a notification, but don't have a kmat to refer to ... just handle it in update
                self.cmd_update();
            }
            var krec = self.higgs.util.likeable.indexOf(1);
            if (reply.likes_remaining===0) {
            }
            if (krec < 0 && this.autostate())
                self.cmd_recs();
            console.log("cmd_like complete", person.name, reply);
        });
        prm.fail(function(reply) {
            if (reply.status==500) callback.apply(this,arguments);
        });
        return prm;
    },
    cmd_recs: function() {
        if (this.quotax.qpercent > 90) return void this.quotax.qalert();
        var req = this.higgs.make_recs();
        var prm = this.ajaxer(req,'downloading new recommendations');
        var self = this;
        prm.done(function(reply) {
            var recs = reply.results || [];
            self.higgs.merge_recs(recs);
            self.limitUntil();
            console.log("cmd_recs complete",recs);
        });
        return prm;
    },
    cmd_user: function(match) {
        var blocked = !match || this.higgs.blocked(match._id);
        if (blocked || this.checktime('cmd_user::' + match._id,10000)) return;
        var self = this;
        var req = this.higgs.make_user(match.person._id);
        var prm = this.ajaxer(req,'getting user info');
        prm.done(function(reply) {
            var user = reply.results;
            var mod = self.higgs.merge_user(user);
            if (mod) self.higgs.storeUpdate("merge_user",user);
            console.log("cmd_user complete",reply);
        });
    },
    cmd_delete: function(match) {
        var blocked = !match || this.higgs.blocked(match._id);
        if (blocked) return;
        var self = this;
        var req = this.higgs.make_del(match._id);
        var prm = this.ajaxer(req,'blocking a user');
        prm.done(function(reply) {
            self.higgs.add_block(match._id,true);
            self.higgs.storeUpdate("cmd_delete",null); // kind of gratuitous
            console.log("cmd_delete complete",reply,match);
        });
    },
    /** send message msg to match_id, returns the xhr promise */
    cmd_send: function(match_id,msg) {
        var blocked = this.higgs.blocked(match._id);
        if (blocked) return;
        var self = this;
        var req = this.higgs.make_msg(match_id,msg);
        var prm = this.ajaxer(req,'sending a message');
        prm.done(function(reply) {
            var message = reply;
            self.higgs.merge_message(message);
            self.higgs.storeUpdate("merge_message",message);
            console.log("cmd_send complete");
        });
        return prm;
    },
    cmd_update: function(callback) {
        if (this.quotax.qpercent >= 100) return void this.quotax.qalert();
        var self = this;
        if (this.checktime('cmd_update::update',2000)) return;
        var req = this.higgs.make_update();
        var prm = this.ajaxer(req,'downloading update');
        prm.done(function(reply) {
            var update = reply;
            console.log("cmd_update complete: %O",update);
            self.higgs.merge_update(update);
            if (callback) callback.call(self);
        });
        return prm;
    },
    cmd_authorize: function(callback) {
        if (!this.deputy)
            return callback && callback(false,null);
        var self = this;
        var token = localStorage.facebook_token;
        var req = self.higgs.make_auth(token);
        var prm = this.ajaxer(req,'authorizing with tinder');
        prm.done(function(auth) {
            auth.nqa_timestamp = new Date().toISOString();
            self.authCheck(auth);
            console.log("cmd_authorize complete");
            if (callback) callback(true,auth);
        });
        prm.fail(function() {
            var args = [].slice.call(arguments);
            self.failedAuth = { req:req, reply:args };
            console.error('attempt to authorize with tinder failed');
            if (callback) callback(false,self.failedAuth);
        });
        return prm;
    },
    authChanged: function(clear,auth) {
        var disabled = true;
        // fixme -- disabled for now
        if (disabled)
            return;
        xlocalStorage.data_auth = JSON.stringify(auth);
        // should be everything except auth and fb token ...
        delete localStorage.data_feed;
        delete localStorage.data_like;
        delete localStorage.data_likeable;
        delete localStorage.data_mymo;
        delete localStorage.data_recs;
        delete localStorage.data_update;
        delete localStorage.data_util;
        delete localStorage.data_fake;
        delete localStorage.data_fake2;
        window.location.reload();
    },
    authCheck: function(auth) {
        var a2 = this.higgs.auth;
        var changed = a2.user._id && auth.user._id !== a2.user._id;
        // fixme -- disabled for now
        var enabled = false;
        if (changed && enabled) {
            this.deputymode = 4;
            this.deputy = false;
            this.headerize();
            this.overlayify(
                "facebook user ID changed - " +
                    "press OK to delete the current saved user data and reload, " +
                    "or cancel to continue in offline mode",
                this.authChanged,null,this,auth);
            return;
        }
        xlocalStorage.data_auth = JSON.stringify(auth);
        this.higgs.auth = auth;
    },
    limitExpired: function() {
        this.limitHandle = null;
        this.higgs.merge_recs([],true);
        if (this.autostate()) this.cmd_recs();
        this.notifier('','The Tinder rate limit has expired','','#recs');
    },
    // when are we rate limited till ? else null
    limitUntil: function(stamp) {
        var recs = this.higgs.recs;
        var id = recs.length && recs[0]._id;
        if (id && id.startsWith("tinder_rate_limited_id_") || stamp) {
            stamp = stamp || +id.split('_')[4] + 12*3600*1000;
            var delay = Math.max(stamp-Date.now(),0);
            if (this.limitHandle==null)
                this.limitHandle = setTimeout(this.limitExpired.bind(this),delay);
        }
    },
    /**
     * save a mapping from name to view
     * @param {nu.ViewBaseᵧₒ} view the view to save
     * @param {String} name the name that maps to the view
     */
    setViewMapping: function(view,name) {
        this.viewMap[ name ] = view;
    },
    /** inject view and it's dom node page into the current page and stash the history state
     * @param {nu.ViewBaseᵧₒ} view the view to make current
     * @param {HTMLElement} page an element (usually a div) with the new content
     */
    injectView: function(view,page,tools) {
        if (this.view && this.view.deactivate) this.view.deactivate();
        this.view = view;
        nu.util.radioify(this.view.headertab,'active',this.headerMain);
        nqo.replaceChildren(this.page, page);
        this.setTools(tools);
        timez.refreshz(true);
    },
    setTools: function(tools) {
        if (tools==this.headerTools) return;
        var blank = this.headerTools7;
        this.headerTop.replaceChild(tools || blank,this.headerTools || blank);
        this.headerTools = tools;
    },
    keypress_cb: function (evt) {
        var node = evt.target;
        var key = nqo.charOrCode( evt );
        if ( nqo.anyKeyMod(evt) ) return;
        if (evt.type !== 'keypress') return;

        var dk = dojo.keys;
        if (evt.keyCode == dk.ESCAPE && node.tagName == 'INPUT') node.blur();
        if (evt.keyCode == dk.ESCAPE && node.tagName == 'TEXTAREA') node.blur();

        if (this.overlayx) {
            if (key==dojo.keys.ENTER ) this.click_cb(evt);
            if (key==dojo.keys.ESCAPE) this.overlayConfirm(evt,true);
            return;
        }
        this.autoUpdatez();

        if (node == this.cli) return;
        if (node.tagName == 'INPUT' && (node.type=='text' || node.type=='password')) return;
        if (node.tagName == 'TEXTAREA') return;
        nqo.debug.kpe = evt;
        if ( this.view.keyhandler(key,evt) ) return;
        switch(key){
            case "m" : this.viewList.build(); break;
            case "r" : this.viewPerson.build(); break;
            case "t" : this.viewFeed.build(); break;
            case "y" : this.viewMymo.build(undefined,true); break;
            case "?" : this.viewHelp.build(); break;

            case "f" : this.cmd_feed(); break;
            case "n" : this.notenext(); break;
            case "N" : this.noteclose(); break;
            case "z" : this.autoToggle(); break;
        }
    },
    click_cb: function(evt) {
        if ( nqo.anyKeyMod(evt) ) return null;
        this.autoUpdatez();
        var node = evt.target;
        var tag = evt.target.tagName;
        if (this.overlayx) {
            if (node.parentNode===this.overlayx.parent)
                this.overlayConfirm(evt,node!==this.overlayx.overconfirm);
            dojo.stopEvent(evt);
            return;
        }
        if ( tag == 'INPUT' ) return null;
        if (dojo.isDescendant(evt.target,this.headerMain)) {
            for (var ii=evt.target; ii && ii.parentNode != this.headerMain; ii=ii.parentNode);
            if (ii==this.headerRecs) this.viewPerson.build();
            if (ii==this.headerMats) this.viewList.build();
            if (ii==this.headerFeed) this.viewFeed.build(undefined,true);
            if (ii==this.headerMymo) this.viewMymo.build(undefined,true);
            if (ii==this.headerHelp) this.viewHelp.build();
        }
        if (dojo.isDescendant(evt.target,this.page))
            return this.view.click(evt);
//        dojo.stopEvent(evt);
    },
    noteclear: function(href) {
        var data = this.noteq[href];
        if (data) {
            var kdata = this.notes.indexOf(data);
            this.notes.splice(kdata,1);
            delete this.noteq[href];
            this.noteplace();
        }
    },
    notenext: function() {
        var data = this.notes.pop();
        if (data) {
            if (data.href) delete this.noteq[data.href];
            if (data.href) this.historyifier({state: {hash: data.href}});
            this.noteplace();
        }
    },
    noteclose: function() {
        this.notes.length = 0;
        this.noteplace();
    },
    notez: function(event) {
        console.log('notez',event.type,this.notes.length,this.notex);
        // if closed externally, delete all notifications, not just the current one
        // otherwise, display the next one in the chain
        var note = event.target; // should equal this.notex
        if (event.type == 'click')
            this.notenext();
        else if (event.type=='close') {
            // clicked note : pop and display next one
            // clicked close: clear
            // replaced     : noop
            this.notes.length = 0;
            this.notex = null;
        }
    },
    //  match/message/moment/mylike : user
    //  how should multiple notes combine ?
    //  factors: time between, number, similarity (type, user), activity level (eg clicking, keying)
    //  if there are "many" events ... combine them all, adjust as they're viewed
    //  "new message from josie ... and 27 other notifications"
    //  show only one note, on click, warp to the href and display the next one
    //
    notifierx: function() {
        if (Notification.permission==='denied') return this.noteh = null;
        if (Notification.permission==='default')
            return Notification.requestPermission(this.notifierx);

        var kdata = this.notes.length-1;
        var data = this.notes[kdata];

        // guard against a race (seems far fetched, but better safe than sorry)
        //   one note up, schedule a close/repost at the same time user clicks close
        //   close runs first, then this timeout
        //   (might be impossible, but i don't know the js runtime internals enough to know)
        if (data) {
            var foot = kdata ? '\n... plus '+kdata+' more notifications' : '';
            var opts = {body:data.msg+foot,icon:'../icons/icon.png',data:data};
            var note = new Notification(data.blurb + data.name,opts);
            note.onclick = this.notez;
            note.onclose = this.notez;
            this.notex = note;
        }
        this.noteh = null;
        console.log('notify',this.notes.length,this.notex,data);
        return note;
    },
    // clear any existing note, add the optional data to the list of pending data, and schedule a display
    noteplace: function(data) {
        if (this.notex) {
            this.notex.onclose = null;
            this.notex.close();
            this.notex = null;
        }
        if (data) {
            var prev = data.href && this.noteq[data.href];
            var kdata = prev && this.notes.indexOf(prev);
            if (kdata >= 0) this.notes[kdata] = data;
            else this.notes.push(data);
            this.noteq[data.href] = data;
        }
        if (!this.noteh && this.notes.length) this.noteh = setTimeout(this.notifierx,0);
        // todo: if permission default, list could get long ...
    },
    notifier: function(name,blurb,message,href) {
        var data = {name:name, blurb:blurb, msg:message, href:href};
        this.noteplace(data);
    },
    preUnload: function() {
        if (this.deputy && this.higgs.util) {
            xlocalStorage.data_util = JSON.stringify(this.higgs.util);
            this.higgs.logRequest(null);
            // NOTE: breakpoints inside onbeforeunload aren't always honored (eg, ctrl-r vs reload button)
            //       store a timestamp to verify it ran
            xlocalStorage.data_fake = new Date() + JSON.stringify(this.higgs.util);
        }
    },
    overlayConfirm: function(evt,clear) {
        dojo.stopEvent(evt);
        console.log('close overlay, clear:', clear, evt);
        this.overlayMain.removeChild(this.overlayx.overlay);
        var xx = this.overlayx;
        this.overlayx = undefined;
        if (!clear && xx.confirm) xx.confirm.call(xx.self || this.view,clear,xx.data);
        if ( clear && xx.cancel ) xx.cancel .call(xx.self || this.view,clear,xx.data);
    },
    // pop up a modal dialog with message, ok and cancel buttons, with scope self for callbacks
    // cancel===true --> cancel=confirm
    // callbacks are function(cancel) {}
    overlayify: function(msg,confirm,cancel,self,data) {
        if (cancel===true) cancel = confirm;
        var xx = this.overlayx = { msg:msg, confirm:confirm, cancel:cancel, self:self, data:data };
        var overlay;
        msg = msg || 'Content goes here ?';
        with (tagr) {
            xx.overlay =
            div("#overlay",
                div(
                    p(msg),
                    xx.parent = div(
                        xx.overconfirm = button('Ok'),
                        xx.overcancel = button('Cancel')
                    )));
        }
        this.overlayMain.appendChild(xx.overlay);
        xx.overconfirm.focus();
    },
    statify: function(replace,state,title,hash) {
        this.noteclear(hash);
        state = state || {};
        state.hash = hash;
        var newloc = location.origin + location.pathname + hash;
        if (replace) history.replaceState(state,title,newloc);
        else         history.   pushState(state,title,newloc);
        document.title = 'Chrome is Burning: ' + title;
        var shash = location.hash || '#';
        if (hash !== shash) console.log('statify:__%s__%s',hash,shash);
    },
    deputizex: function() {
        this.preUnload();
        this.deputy = false;
        this.deputymode = 2;
        this.headerize();
    },
    deputize: function(reply) {
        this.deputy = reply.token;
        this.deputymode = this.deputy ? 1:0;
        // bypass sendmessage try/catch for easier debugging, ie fail-fast
        setTimeout(function() {
            this.set();
            if (this.deputy) this.limitUntil();
            var done = this.historyifier(null);
            if (done) this.autoUpdatey();
        }.bind(this),0);
    },
    historyifier: function(event) {
        // console.log('historify',event,location.hash);
        var state = (event ? event.state : history.state) || {};
        hash = (state.hash || location.hash).split('/')[0];
        if (hash=='' || hash=='#') this.viewList.restore(state);
        if (hash=='#recs') this.viewPerson.restore(state);
        if (hash=='#feed') this.viewFeed.restore(state);
        if (hash=='#mymo') this.viewMymo.restore(state);
        if (hash=='#match') this.viewMatch.restore(state);
        if (hash=='#help') this.viewHelp.restore(state);
        if (hash=='#settings') this.viewSettings.restore(state);
        if (hash=='#auth')
            return this.tinderauth();
        return true;
    },
    tinderauth: function(reply) {
        if (reply)
            xlocalStorage.facebook_token = reply.token;
        console.log('cib.auth',reply);
        if (this.deputy && localStorage.facebook_token)
            this.cmd_authorize(function() {
                this.viewList.restore();
                this.autoUpdatey();
            }.bind(this));
        return false;
    },
    autoUpdatez: function() {
        var now = this.autoActivity = +new Date();
        var hand = this.autohandle;
        if (hand[0] > now + 5*1000) {
            clearTimeout(hand[1]);
            this.autoUpdatex();
        }
    },
    autoUpdatey: function() {
        this.autoToggle(!this.higgs.util.cibconfig.useauto);
    },
    autostate: function() { return this.autohandle.length > 0 && this.ajaxPending.length==0; },
    // toggle the auto update feature, force to pause if true or false
    autoToggle: function(pause) {
        var hand = this.autohandle;
        var active = (pause===!!pause) ? !pause : hand.length==0;
        if (hand.length) {
            clearTimeout(hand[1]);
            hand.length = 0;
            console.log('autoToggle: disable');
        }
        if (active)
            this.autoUpdatex();
        this.autopause.innerHTML = active ? '⏯':'▶';
        this.autopause.title     = active
            ? 'click to pause auto update, shortcut:z'
            : 'click to enable auto update, shortcut:z';
        this.higgs.util.cibconfig.useauto = active;
    },
    autoUpdatex: function() {
        var now = new Date();
        var hours = now.getHours();
        var sleep = hours >= 2 && hours < 11;
        var min=60*1000;
        var delta = Math.min(+now-this.autoActivity,3*60*min);
        var coin = Math.random();
        var flip = Math.random() < .2;
        var next;

        if      (                 delta <  1*min) next =    3*1000;
        else if (this.autoflip || delta < 20*min) next = coin*min;
        else if (sleep)                           next = 9*60*min;
        else                                      next = Math.min(coin*delta,(5+coin*20)*min);

        this.autoUpdate(delta < 5*min);
        this.autohandle = [+now+next,setTimeout(this.autoUpdatex,2*1000+next)];
        if (flip) this.autoflip = !this.autoflip;
        if (next > 10*min) this.autoflip = true;
        console.log('autoUpdatex',this.autoflip,next,now);
    },
    autorecs: function() {
        var kmat = this.higgs.util.likeable.indexOf(1);
        if (kmat < 0) this.cmd_recs();
    },
    autoUpdate: function(active) {
        if (!this.autostate()) return;
        var coin = Math.random();
        var cum = 0;
        if (false);
        else if (active && coin < (cum +=.05)) this.cmd_feed();
        else if (active && coin < (cum +=.01)) this.cmd_mymo();
        else if (          coin < (cum + .10)) this.autorecs();
        else                                   this.cmd_update();
    },
    headerize: function() {

        with (tagr) {
            var othertab =
                div({klass:'alertz'},'Read Only Mode <br>another tab is active');
            othertab.title = 'click to switch to the active tab';
            othertab.onclick = function() {
                chrome.runtime.sendMessage(extid,{type: 'warp'});
            };

            var conndied =
                div({klass:'alertz'},'Read Only Mode <br>the extension has reloaded');
            conndied.title = 'click to reload this page';
            conndied.onclick = function() {
                window.location.reload();
            };

            var needauth =
                div({klass:'alertz'},'Read Only Mode <br>reauthorization is required');
            needauth.title = 'click to go to facebook to reauthorize';
            needauth.onclick = this.reauthNow.bind(this);

            var authchange =
                div({klass:'alertz'},'Read Only Mode <br>facebook user ID has changed');
            authchange.title = 'click to delete saved data and reload as the new user';
            authchange.onclick = this.authChanged.bind(this);

            var localquota =
                div({klass:'alertz'},'Read Only Mode <br>local storage quota exceeded');
            localquota.title = 'click to reload this page';
            localquota.onclick = function() {
                window.location.reload();
            };

            var modes = {0:othertab, 1:this.headerSonar, 2:conndied, 3:needauth, 4:authchange, 5:localquota};

            var status = modes[this.deputymode];

            var auto = div('#autopauser',null);
            auto.title = 'toggle autoupdate mode, shortcut:z';
            auto.onclick = this.autoToggle.bind(this);
            this.autopause = auto;

            // todo: do i really need double spans for 'headify' ???
            this.headerMain = div(
                this.headerRecs = div(span('headify','R'),    span('ecs')   ),
                this.headerMats = div(span('headify','M'),   span('atches')   ),
                this.headerFeed = div(span('momen'),  span('headify2','Ts')   ),
                this.headerMymo = div(span('m'),      span('headify2','Y moments') ),
                this.headerHelp = div(span('help'),   span('headify4','?')),
                auto,
                status
            );


            this.headerTools = this.headerTools7 = div('tools7',null);

        }
        nqo.replaceChildren(this.headerTop,this.headerMain,this.headerTools);
    },
    forceFocus: function() {
        window.alert('This is the active tab for this extension');
    },
    initialLoad: function() {
        window.addEventListener("popstate",this.historyifier.bind(this));
        window.addEventListener('focus',this.autoUpdatez.bind(this));
        window.onbeforeunload = this.preUnload.bind(this);
        var port = chrome.runtime.connect(extid);
        port.onMessage.addListener(function(reply){
            if      (reply=='forceFocus') this.forceFocus();
            else if (reply.type=='tinderauth') this.tinderauth(reply);
            else if (reply.type=='copy') {
                console.log(reply);
            }
            else this.deputize(reply);
        }.bind(this));
        port.onDisconnect.addListener(this.deputizex.bind(this));
    }
};

var urlify = function(id,pid,size) {
    var base = "http://images.gotinder.com/";
    var shape = size ? size+"x"+size+"_" : "";
    return base+id+"/"+shape+pid+".jpg";
};

var checkProcessed = function(man,pic,proc,size) {
    return proc.width===size && proc.height==size &&
        proc.url===urlify(man._id,pic.id,size);
};

var photo = function(man,pic) {
    var base = "http://images.gotinder.com/";
    var proc = pic.processedFiles;
    var valid =
        pic.extension==="jpg"
        && pic.fileName===pic.id+".jpg"
        && pic.url===urlify(man._id,pic.id)
        && proc.length==4
        && checkProcessed(man,pic,proc[0],640)
        && checkProcessed(man,pic,proc[1],320)
        && checkProcessed(man,pic,proc[2],172)
        && checkProcessed(man,pic,proc[3],84);
    return valid;
};

var person = function(recs) {
    var fields = "name,bio,birth_date,gender,_id,ping_time".split(',');
    var sv = nqo.vs2fill(recs,fields);
    var birth = new Array(recs.length);
    for (var ii=0; ii < recs.length; ii++) {
        var mat = recs[ii];
        var date = mat.birth_date.split('T')[0];
        birth[ii] = date;
    }
    sv.birth_date = birth;
    sv.pics = nqo.slice2(recs,'photos',null,'id');
    return sv;
};
var match = function(mats) {
    var persons = nqo.vsSlice(mats,'person');
    var fields = "name,bio,birth_date,gender,_id,ping_time".split(',');
    var sv = nqo.vs2fill(mats,fields);
    var birth = new Array(mats.length);
    for (var ii=0; ii < mats.length; ii++) {
        var mat = mats[ii];
        var date = mat.birth_date.split('T')[0];
        birth[ii] = date;
    }
    sv.birth_date = birth;
    sv.pics = nqo.slice2(mats,'photos',null,'id');
    return sv;
};


nu.util = {
    alertList: [],
    hours: function(timestamp) {
        var delta = new Date() - new Date(timestamp);
        return delta / (3600*1000);
    },
    radioify: function(next,klass,parent) {
        var current = dojo.query('.'+klass,parent);
        current && current.removeClass(klass);
        next && dojo.addClass(next,klass);
    },
    unalertify: function (node,klass) {
        if (!klass) klass = "alert";
        if (node==null) dojo.removeClass(this.node,this.klass);
        else dojo.removeClass(node,klass);
    },
    // timeout (strictly) true --> clear now
    // otherwise set, and if positive number to clear in milliseconds
    alertify: function (node,klass,timeout) {
        if (!klass) klass = "alert";
        (timeout===true ? dojo.removeClass:dojo.addClass)(node,klass);
        if (+timeout===timeout && timeout > 0) {
            var data = {node: node, klass:klass, timeout:timeout};
            if (document.hasFocus())
                setTimeout(this.unalertify.bind(data), timeout);
            else this.alertList.push(data);
        }
    },
    alertFocus: function() {
        this.alertList.forEach(function(data) {
            setTimeout(this.unalertify.bind(data), data.timeout); }, this);
        this.alertList = [];
    }
};

setTimeout(function() {
    window.addEventListener('focus', nu.util.alertFocus.bind(nu.util), true); }, 0);



nu.Timez = function() {
    this.nearest = 0;
    this.lastd2 = this.lastd3 = Date.now();
    this.handlez = null;
    this.refreshz = this.refreshz.bind(this);
    this.schedulez = 0;
};

//  if no future times, then only need the most recent
//  for future times, record them all and as time passes, drop them as they enter the past (keep 1 past time)
//    push new times to the end
//    only need to sort if we drop a time and push a time
//
//  for now, only handle the past
//
//  no easy way to handle content that may have been swapped out
//    ie, created DOM but not attached to body
//    when it gets swapped back in it could be out-of-date
//    if you know that you've done it, refreshz(true) will rescan everything
//
//  currently accessing timez thru outerHTML, ie a kludge, so nqa_maxago isn't working
//  should allow a configuration and not just maxago

nu.Timez.prototype = {
    refreshz: function(force) {
        // console.log('Timez.refreshz',new Date());
        var curr = Date.now();
        var d2 = curr-this.lastd2 >   60*1000 || force;
        var d3 = curr-this.lastd3 > 3600*1000 || force;
        if (d2) this.lastd2 = curr;
        if (d3) this.lastd3 = curr;
        var nodes = dojo.query('time');
        for (var ii=0; ii<nodes.length; ii++) {
            var node = nodes[ii];
            var timestamp = Number(node.getAttribute('datetime'));
            var d1 = curr-timestamp;
            if (d1 <      60*1000       ||
                d1 <    3600*1000 && d2 || d3) this.formatz(timestamp,node.nqa_maxago,node);
        }
        if (!force) this.handlez = null;
        if (!force) this.checkz();
    },
    push: function(ts) {
        if (ts > this.nearest) {
            this.nearest = ts;
            this.checkz(true);
        }
    },
    checkz: function(check) {
        var delta = Date.now() - this.nearest;
        var timer = 0;
        if      (delta <   60*1000) timer =    5*1000;
        else if (delta < 3600*1000) timer =   60*1000;
        else                        timer = 3600*1000;
        var future = Date.now()+timer;
        var slop = 500;
        // doesn't need to be perfect, use slop to cut down on churn
        var clear = future+slop < this.schedulez;
        if (clear && check) this.handlez = window.clearTimeout(this.handlez);
        if (clear || !check || this.schedulez==0) {
            if (timer < 60000) console.log('checkz.timer',timer);
            if (this.handlez != null)
                console.log('handlez ...');
            this.schedulez = future;
            this.handlez = window.setTimeout(this.refreshz, timer);
        }
    },
    formatz: function(timestamp,maxago,node) {
        var txt;
        var cutoff = (maxago==undefined) ? 1:maxago;
        var mom = moment(timestamp);
        var hours = (Date.now()-mom)/(1000*3600);
        if      (hours < cutoff) txt = mom.fromNow();
        else if (hours < 24*365) txt = mom.calendar();
        else                     txt = mom.format("MMM D YYYY");
        if (!node) {
            this.push(+mom);
            node = tagr.time(+mom, {klass: 'timecss'});
            if (maxago !== undefined) node.nqa_maxago = maxago;
        }
        node.innerHTML = txt;
        return node;
    }
};

var timez = new nu.Timez();


dojo.addOnLoad(function() {
    // outsmart the horrid dojo error handling
    setTimeout(initialLoad,0);
});

var initialLoad = function(){
    zz = new nu.Control();
    zz.initialLoad();
};



var filterObject = function(base,regex,callback,self) {
    var obj = {};
    for (var ii in base)
        if (base.hasOwnProperty(ii))
            if (!regex || regex.test(ii)) {
                if (callback) obj[ii] = callback.call(self||base,ii,base);
                else obj[ii] = base[ii];
            }
    return obj;
};

var lsdir = function(base,silent) {
    var sum = 0, len = 0;
    for (var ii in base)
        if (base.hasOwnProperty(ii)) {
            sum += len = base[ii].length || 0;
            silent || console.log(ii,len,sum);
        }
    return sum;
};


var lsdirr = function(base,sum,hasher) {
    var initd;
    if (!sum) {
        sum = [];
        hasher = hasher || {};
        initd = true;
    }
    if (base.nqa_visited) {
        console.log('revisit',base);
        return;
    }
    sum.push(base);
    for (var ii in base)
        if (base.hasOwnProperty(ii)) {
            if (+ii !== + +ii)
                hasher[ii] = true;
            var obj = base[ii];
            if (obj && dojo.isObject(obj)) lsdirr(obj,sum,hasher);
        }
    base.nqa_visited = true;
    if (initd) {
        for (var jj=0; jj<sum.length; jj++) delete sum[jj].nqa_visited;
        var result = [];
        for (ii in hasher) result.push('"'+ii+'",');
        console.log(result.join(''));
    }
    return hasher;
};


console.log('localstorage size: ' + lsdir(localStorage,true));



var LightBox = function(){
    this.lbclose = this.lbclose.bind(this);
    this.lbkey = this.lbkey.bind(this);
    this.lbclick = this.lbclick.bind(this);
    this.lboverlay = this.old_okd = this.urls = this.kimg = this.back = undefined;
};
LightBox.prototype = {
    lbstart: function(urls,index) {
        this.urls = urls;
        var kids = this.back = [].slice.call(document.body.children);
        // http://jasonmillerdesign.com/Programming/Overlay_Text_On_Images_With_CSS
        with (tagr)
            this.lboverlay =
                div('lightbox',
                    this.lbtop = div(
                        this.lbprev = a(null,'lbprev',null),
                        this.lbnext = a(null,'lbnext',null)
                ));
        this.lbmove(index||0);
        for (var ii=0; ii<kids.length; ii++)
            dojo.addClass(kids[ii],'lbhide');
        document.body.appendChild(this.lboverlay);
        this.old_okd = document.body.onkeydown;
        document.body.onkeydown = this.lbkey;
        this.lboverlay.onclick = this.lbclose;
        this.lbprev.onclick = this.lbnext.onclick = this.lbclick;
    },
    lbclick: function(evt) {
        this.lbmove(evt.target==this.lbnext ? 1:-1,true);
        dojo.stopEvent(evt);
    },
    lbmove: function(delta,close) {
        var max = this.urls.length-1;
        var kimg = nqo.bound((this.kimg||0)+delta,0,max);
        if (kimg===this.kimg)
            return close && this.lbclose(), void 0;
        this.kimg = kimg;
        this.lbprev.className = (kimg===0  ) ? 'lbprev lbexit':'lbprev';
        this.lbnext.className = (kimg===max) ? 'lbnext lbexit':'lbnext';
        nqo.replaceChildren(this.lbtop,tagr.img(this.urls[this.kimg]),this.lbprev,this.lbnext);
    },
    lbkey: function(evt) {
        var code = evt.keyCode;
        var key = String.fromCharCode(code);
        if (nqo.anyKeyMod(evt))
            return;
        if (key=='J' || code==dojo.keys.RIGHT_ARROW) this.lbmove(1);
        if (key=='K' || code==dojo.keys.LEFT_ARROW ) this.lbmove(-1);
        if (key=='U' || code==dojo.keys.ESCAPE     ) this.lbclose();
        dojo.stopEvent(evt);
    },
    lbclose: function(evt) {
        document.body.removeChild(this.lboverlay);
        for (var ii=0; ii<this.back.length; ii++) dojo.removeClass(this.back[ii],'lbhide');
        document.body.onkeydown = this.old_okd;
        if (evt) dojo.stopEvent(evt);
        this.lboverlay = this.old_okd = this.urls = this.kimg = this.back = undefined;
    }
};






if (localStorage.data_fake && localStorage.data_fake===localStorage.data_fake2)
    console.log('data_fake: unload failed',{ fake1:localStorage.data_fake, fake2:localStorage.data_fake2});
xlocalStorage.data_fake2 = localStorage.data_fake;



