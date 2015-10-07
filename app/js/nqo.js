/** @license copyright 2015, licensed to xmondox + chromeisburning.com, all rights reserved */
/** @license this file is licensed under the MIT license to any recipient (attribute xmondox) */


dojo.provide( "js.nqo" )

nqo = {};

nqo.debug = {};




/*----------------------------------- dojo.hitch style method proxies ------------------------------------*/



/**
 *  return a "dojo.hitch(scope,method)" style proxy,
 *  passCallerScope: truthy --> preserve the "true" scope, passing it as the first arg to method
 *  ie it calls scope.method( old_this, preArray..., caller_args..., postArray... )
 *  pre/postArray: [] to omit or pass only 2 args
 */
nqo.proxy = function(scope,method,preArray,postArray,passCallerScope) {
    method = dojo.isFunction(method) ? method : scope[method];
    if (arguments.length==2)
        return function() { return method.apply(scope,arguments); };
    else
        return function () {
            var args = passCallerScope ? [this] : [];
            return method.apply(scope, args.concat(preArray,[].slice.call(arguments),postArray));
        };
};




/*------------------------- manipulating array-like stuff ------------------------------------------------*/


/**
 *  get the fields of an object
 *  returns the fields of obj ...
 *  an array is returned as is
 *  a comma-delimited-string returns the array of strings split by commas
 *  an object returns an array of field names
 */
nqo.getFields = function(obj) {
    if ( dojo.isArrayLike( obj ) ) return obj;
    if ( dojo.isString( obj ) ) return obj.split( ',' );
    var nn = 0;
    var fields = [];
    for (var ii in obj) fields[nn++] = ii;
    return fields
};


/**
 * insert val into the already sorted array based on cmp
 * @param array sorted array to insert into
 * @param cmp the comparator (for both the insertion and by which array has been sorted)
 * @param val the value to insert
 */
nqo.insertSort = function(array,cmp,val) {
    for (var ii = 0; ii < array.length && cmp( array[ii], val ) <= 0; ii++) {}
    array.splice( ii, 0, val );
};


nqo.zeroish = function(val) { return Number(val) || 0; };
nqo.zeroishEach = function(val,index,array) { array[index] = Number(val) || 0; };
nqo.zeroEach = function(val,index,array) { array[index] = 0; };

nqo.deltaify = function(vo) { for (var ii=      vo.length-1; ii > 0; ii--) vo[ii] -= vo[ii-1]; return vo; };
nqo.deltainv = function(vo) { for (var ii=1; ii<vo.length;           ii++) vo[ii] += vo[ii-1]; return vo; };


/*----------------------------------- manipulate objects ------------------------------------*/



/**
 * make a shallow copy of src object, ie only copy fields that belong to the object, not it's prototype
 * @param src the source object
 * @param dst [optional] the destination object, defaults to a new object
 * @return {*|Object} the destination object
 */
nqo.shallow = function(src,/**Object?*/ dst) {
    dst = dst || {};
    for (var jj in src)
        src.hasOwnProperty(jj) && (dst[jj] = src[jj]);
    return dst;
};
/**
 * make a shallow copy of src objects, ie only copy fields that belong to the objects, not their prototype
 * @param src the source objects (varargs style)
 * @param dst the destination object (the final argument)
 * @return {*|Object} the destination object
 */
nqo.shallowx = function(/**Object...*/ src,dst) {
    var nn = arguments.length- 1, dst = arguments[nn];
    for (var ii=0; ii < nn; ii++) nqo.shallow(arguments[ii],dst);
    return dst;
};


/*----------------------------------- manipulate innerHTML/children ------------------------------------*/


/**
 * rip (and return) the childNodes from node and if truthy insert newChild (dom node or array of nodes)
 */
nqo.replaceChildren = function(node,newChild) {
    var array = [];
    while (node.firstChild) array.push( node.removeChild(node.firstChild) );
    if (dojo.isArrayLike(newChild))
        for (var ii = 0; ii < newChild.length; ii++) node.appendChild( newChild[ii] );
    else if (arguments.length > 1)
        for (var ii=1; ii < arguments.length; ii++)
            arguments[ii] && node.appendChild( arguments[ii] );
    return array;
};


/** append nodes to parent, return parent */
nqo.appendNodes = function(parent,nodes) {
    for (var ii = 0; ii < nodes.length; ii++) parent.appendChild( nodes[ii] );
    return parent;
};

/** append all remaining varargs to parent, and return the parent */
nqo.appendChilds = function(parent,children) {
    var ii = 0;
    var args = children;
    dojo.isArray(args) || (ii = 1, args = arguments);
    for (var nn = args.length; ii < nn; ii++) {
        var arg = args[ii];
        if (dojo.isString(arg)) parent.innerHTML += arg;
        else if (arg != null)   parent.appendChild( arg );
    }
    return parent;
};

/** insert a new script element with the given url */
nqo.insertScript = function(url,cb) {
    var head = dojo.query('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    if (cb) script.onload = cb;
    head.appendChild(script);
};



/*------------------------------------------ structure of vectors ----------------------------------------*/



/**
 * slice a struct-of-vectors (sv), returning an object with the kk'th entries of all arrays
 */
nqo.svSlice = function(sv,kk) {
    var ret = {};
    for (var ii in sv) {
        var val = sv[ii];
        if ( dojo.isArray( val ) ) ret[ii] = val[kk];
    }
    return ret;
};
/**
 *  return the length of a struct of vectors, ie the length of the first array field, or null if no array fields
 */
nqo.svLength = function(sv) {
    var fields = nqo.getFields( sv );
    for (var ii = 0; ii < fields.length; ii++) {
        var obj = sv[ fields[ii] ];
        if ( dojo.isArray( obj ) ) return obj.length;
    }
    return null;
};

/**
 *  return an array of objects, each a slice of the struct vect
 */
nqo.sv2vs = function(sv) {
    var vs = [];
    var nn = nqo.svLength( sv );
    for (var ii = 0; ii < nn; ii++) vs[ii] = nqo.svSlice( sv, ii );
    return vs;
};

/** @returns {Array} an array of the values in obj */
nqo.obj2array = function(obj,fields) {
    if (arguments.length==2 && dojo.isString(fields)) fields = fields.split(',');
    else if (arguments.length > 1) fields = [].slice.call(arguments,1);
    var array = [], ii = 0;
    if (fields) for (; ii<fields.length; ii++) array[ii] = obj[fields[ii]];
    else for (var jj in obj) array[ii++] = obj[jj];
    return array;
};

/** convert an array of objects (structures) to an object of arrays
 *  @param {Array} vs an array of objects
 *  @param {boolean} trim trim the arrays, else fill them
 *  @returns {Object} an object with all the fields from source */
nqo.vs2sv = function(vs,trim,fields) {
    if (!dojo.isArray(vs)) vs = nqo.obj2array(vs);
    var sv = {};
    for (var ii = 0; ii < vs.length; ii++) {
        var obj = vs[ii];
        for (var jj in obj) {
            if (obj.hasOwnProperty(jj)) {
                (jj in sv) || (sv[jj]         = []);
                if (trim)      sv[jj].     push(obj[jj]);
                else           sv[jj][ii]     = obj[jj];
            }
        }
    }
    return sv;
};

/** convert an array of objects (structures) to an object of arrays
 *  @param {Array} vs an array of objects
 *  @param {boolean} trim trim the arrays, else fill them
 *  @returns {Object} an object with all the fields from source */
nqo.vs2fields = function(vs,trim,fields) {
    var sv = {};
    if (!dojo.isArray(vs)) vs = nqo.obj2array(vs);
    if (vs.length==0) return sv;
    if (arguments.length==3 && dojo.isString(fields)) fields = fields.split(',');
    else if (arguments.length > 2) fields = [].slice.call(arguments,2);
    else fields = nqo.getFields(vs[0]);
    if (trim) return nqo.vs2trim(vs,fields);
    else      return nqo.vs2fill(vs,fields);
};

nqo.vs2trim = function(vs,fields) {
    // iterating index-first is faster than field-first
    // ie, it's better to handle each object completely
    // test set was a 10^6 length array, each entry having the same 13 fields
    // first pass was 6000 msec for field-first, 3000 msec for index-first
    // subsequent passes were fairly even at about 3000 msec
    var sv = {};
    for (var kk=0; kk<fields.length; kk++) sv[fields[kk]] = [];
    for (var ii = 0; ii < vs.length; ii++)
        for (var kk= 0,jj; kk<fields.length && (jj=fields[kk]); kk++)
            sv[jj].push(vs[ii][jj]);
    return sv;
};
nqo.vs2fill = function(vs,fields) {
    // index-first is assumed faster than field-first (see vs2trim above)
    // pre-allocing the arrays is much faster than array.push (1150 msec for the same test)
    //   first-pass, half that for latter passes
    var sv = {}, kk, ii, jj;
    for (kk=0; kk<fields.length; kk++) sv[fields[kk]] = new Array(vs.length);
    for (ii=0; ii < vs.length; ii++)
        for (kk=0; kk<fields.length && (jj=fields[kk],true); kk++)
            sv[jj][ii] = vs[ii][jj];
    return sv;
};

nqo.runtime = function(scope,method,args) {
    var xo = new Date();
    args = [].slice.call(arguments,2);
    var ret = method.apply(scope,args);
    var x1 = new Date();
    var delta = x1-xo;
    return [delta,ret];
};



/**  make a deep linear slice of an array
 *  @param {Array} array the array of objects to slice
 *  @param {...(string|number)} fields the indices to select with
 *  @returns {Array} array of vs[:][field1][field2][...] */
nqo.vsSlice = function(array,fields) {
    var slice = [], nn = array.length, mm = arguments.length;
    for (var ii = 0; ii < nn; ii++)
        for (var jj = 1, base = array[ii]; jj < mm && base; jj++)
            slice[ii] = base = base[ arguments[jj] ];
    return slice;
};
nqo.slice2 = function(array,fields) {
    var slice = [], nn = array.length, mm = arguments.length;
    for (var ii = 0; ii < nn; ii++) {
        for (var jj = 1, base = array[ii]; jj < mm && base; jj++) {
            var arg = arguments[jj];
            if (arg===null) {
                slice[ii] = nqo.slice2(base,[].slice.call(arguments,jj+1));
                break;
            }
            slice[ii] = base = base[ arguments[jj] ];
        }
    }
    return slice;
};

/**
 * select the named field from vs, skipping elements that don't define the field
 * @param vs the vect of structs to select from
 * @param {String} field the name of the field to select
 * @return {Array} a new array
 */
nqo.vsSelect = function(vs,field) {
    var nn = vs.length, array = [];
    for (var ii=0, jj=0; ii < nn; ii++) (field in vs[ii]) && (array[jj++] = vs[ii][field]);
    return array;
};

nqo.vsSlice.fast = function(vs,field) {
    var nn = vs.length, array = new Array(nn);
    for (var ii = 0; ii < nn; ii++) array[ii] = vs[ii][field];
    return array;
};


/*-------------------------------------------- math --------------------------------------------*/

/**
 * if val is an array and neither min nor max are supplied, return { min:min, max:max }
 * otherwise, apply the min and/or max to val (either a number or an array of numbers)
 * return the modified val
 */
nqo.bound = function(val,min,max) {
    var an = (min === undefined), ax = (max === undefined);
    if (dojo.isArrayLike( val )) {
        var nn = val.length;
        if ( an && ax )
            return { min:Math.min.apply( null, val ), max:Math.max.apply( null, val ) };
        else
            for (var ii = 0; ii < nn; ii++) {
                an || ( val[ii] = Math.max( val[ii], min ) );
                ax || ( val[ii] = Math.min( val[ii], max ) );
            }
    } else {
        an || ( val = Math.max( val, min ) );
        ax || ( val = Math.min( val, max ) );
    }
    return val;
}

/**
 *  return val rounded down (towards -infinity) to an integer multiple of mod
 */
nqo.floor2 = function(val,mod) { return Math.floor( val/mod ) * mod; }



/*----------------------------------------- events, queries and scrolling --------------------------------*/


/**
 * check if ctrl, alt or meta are pressed
 */
nqo.anyKeyMod = function(evt) { return evt.ctrlKey || evt.altKey || evt.metaKey; }

/**
 * check that the click is unmodified, on an 'A' tag, and that it has a parent of type tag (return that parent)
 **/
nqo.clickCheck = function(evt,tag,dontStop) {
    dontStop || dojo.stopEvent(evt);
    var node = evt.target;
    if (node.tagName != 'A') return null;
    return nqo.parentByTag( node, tag );
}

/**
 * ascend the parent tree until a node of tag (hint: UPPERCASE) is found, return it else null
 */
nqo.parentByTag = function(node,tag) {
    var aa = node;
    // fixme::dry -- is the aa.parentNode !== aa really needed ?
    while (aa && aa.tagName != tag && aa.parentNode != aa) { aa = aa.parentNode }
    return (aa && aa.tagName == tag) ? aa : null;
}


/**
 * scroll the page to val
 */
nqo.hackScroll = function(val) {
    if (dojo.isChrome) dojo.body().scrollTop = val;
    else dojo.doc.documentElement.scrollTop = val;
}


/**
  * if the node isn't on-screen, scroll the page to make the node near the middle
  */
nqo.scroll = function(row) {
    var view = dojo.window.getBox();
    var loc = dojo.coords( row, false );
    var middle = view.t + loc.y - view.h/2 + loc.h/2;
    if ( loc.y < 0 || loc.y+loc.h > view.h ) nqo.hackScroll( middle );
};

/** test if the (xx,yy) coordinates (or an event) are contained inside node */
nqo.nodeContains = function(node,xx,yy) {
    if (yy === undefined) { var evt = xx; xx = evt.clientX, yy = evt.clientY; }
    var rr = node.getBoundingClientRect();
    return (yy >= rr.top && yy < rr.bottom && xx >= rr.left && xx < rr.right);
}

/** which node in (array-like) items contains the point (xx,yy), else -1 -- if yy is omited, xx is treated as an dojo-normalized-event */
nqo.whichNode = function(items,xx,yy) {
    if (yy === undefined) { var evt = xx; xx = evt.clientX, yy = evt.clientY; }
    var nn = items.length;
    // fixme::overspec -- don't need to do the xx's, and could binary search the yy's
    for (var ii = 0; ii < nn; ii++)
        if (nqo.nodeContains(items[ii], xx, yy)) return ii;
    return -1;
}



/*----------------------------------------- enums and bi-directional mappings ----------------------------*/


/**
 * an enum class with value.owner that points back
 */
nqo.Enum = function(obj) {
    var _owner = this;
    function EnumVal(name,id) {
        this.name = name;
        this.id = id;
        this.owner = function() { return _owner; };
    }
    EnumVal.prototype.owner = function() { return _owner; };
    var ko = 0;
    for (var jj in obj) this[jj] = new EnumVal( jj, ko++ );
}

/**
 *   return a by-directional mapping between field indexes and field names
 *   obj is parsed by nqo.getFields (so comma-delimited-strings, an array of names, or the fields of an object)
 *   accessed by field names --> the index
 *   accessed as a function(index) --> the field name
 **/
nqo.fieldMapper = function(obj) {
    var names = nqo.getFields( obj );
    function get(index) { return index===undefined ? names : names[ index ]; }
    for (var ii=0; ii < names.length; ii++) get[ names[ ii ] ] = ii;
    return get;
}


/**
 * return a map from array[:][field] --> [:], ie that maps from the field to the index
 * where array is an (array or object) of (arrays or objects)
 * if field is undefined, maps from array[:] --> [:]
 */
nqo.hashmap = function(array,field) {
    var map = {}, ii;
    if (dojo.isArrayLike(array)) {
        var nn = array.length;
        if (field === undefined) for (ii=0; ii<nn; ii++) map[ array[ii]        ] = ii;
        else                     for (ii=0; ii<nn; ii++) map[ array[ii][field] ] = ii;
    } else {
        if (field === undefined) for (ii in array)        map[ array[ii] ] = ii;
        else                     for (ii in array) { var val = array[ii][field]; val && (map[ val ] = ii); }
    }
    return map;
}

// a = { blah:2, stuff:6, you:9 };
// b = new nqo.Mapper( a );
// var jj;
// while ((jj = ii.next())) console.log( jj );
// or:
// for (var ii; ii=b.next(); ) console.log( ii )

nqo.Mapper = function(obj) {
    // fixme:doc -- need to document what this does
    this.obj = obj;
    var names = this.names = nqo.getFields(obj);
    this.val = function(index) { return this.obj[ this.names[ index ] ]; }
    this.add = function(name,val) { this.names.push( name ); this.obj[name] = val; nn++; this.nn++; }
    var nn = this.nn = names.length;
    var ii = 0;
    this.get = function() { ii = 0; }
    this.next = function() { return ii < nn ? obj[ names[ ii++ ] ] : null; }
};

nqo.sliceObj = function(obj,field,trim) {
    var jj = 0, array = [];
    if (trim)
        for (var ii in obj)
            field in obj[ii] && (array[jj++] = obj[ii][field]);
    else
        for (var ii in obj)
            array[jj++] = obj[ii][field];
    return array;
};

nqo.Mapix = function() {};
nqo.Mapix.prototype.get = function(key,array) {
    if (this.hasOwnProperty(key))
        var index = this[key];
    return index===undefined ? index : array[index];
};
nqo.Mapix.prototype.geta = function(keys,data) {
    var res = [];
    for (var ii=0; ii<keys.length; ii++) {
        var key = keys[ii];
        if (this.hasOwnProperty(key)) {
            var index = this[key];
            var obj = {row:ii, index:index};
            if (data) obj.data = data[index];
            res.push(obj);
        }
    }
    return res;
};

/** return an object that maps the elements of an array (optionally field) to the index */
nqo.mapix = function(array,field) {
    var map = new nqo.Mapix(), ii=0;
    if (arguments.length==1)
        for (; ii<array.length; ii++) map[array[ii]] = ii;
    else if (arguments.length==2)
        for (; ii<array.length; ii++) map[array[ii][field]] = ii;
    else {
        var sub = nqo.slice2.apply(null,arguments);
        for (; ii<array.length; ii++) map[sub[ii]] = ii;
    }
    return map;
};


/*----------------------------------------- dom creation -------------------------------------------------*/

(function() {

var isdom = function(node) {
    return node && dojo.isObject(node) && ('nodeType' in node);
};
var extract = function(blob,name,dest,mod) {
    var prop;
    if (name in blob) {
        prop = blob[name];
        delete blob[name];
        dest && (dest[mod || name] = prop);
    }
    return prop;
};

nqo.tagr = function(baseName) {
    this.baseName = baseName || 'nqa';
};

nqo.tagr.prototype._tagrCreate = function(tag,args,skip,other) {
    skip = skip || 0;
    var na = args.length, n1=na;
    var nn = na-1;
    if (na <= skip) return dojo.create(tag,other);

    var nqa={}, nqa1=nqa, rika, ref;
    var aa = args[nn];

    var attrs = {};
    for (var ii in other) attrs[ii] = other[ii];

    if (isdom(aa))
        while (nn >= skip && isdom(args[nn])) n1 = nn--;
    else if (dojo.isArray(aa)) nn--;
    else if (aa==null) nn--;
    else if (dojo.isObject(aa));
    else attrs.innerHTML = args[nn--];
    if (nn >= skip) {
        if (dojo.isString(args[nn])) attrs.className = args[nn--];
        else rika = args[nn--];
    }
    if (nn == skip)
        nqa = args[nn];
    else if (nn > skip)
        throw(new Error());

    // fixme::perf -- in *some* cases, can just pass rika to dojo.create which might be faster
    for (ii in rika)
        switch(ii) {
            case 'inner': attrs.innerHTML = rika[ii]; break;
            case 'klass': attrs.className = rika[ii]; break;
            case   'nqa':             nqa = rika[ii]; break;
            case   'ref':             ref = rika[ii]; break;
            default     :       attrs[ii] = rika[ii];
        }



    nqo.classify(attrs);
    var node = dojo.create(tag,attrs,ref);
    nqa===nqa1 || (node[this.baseName] = nqa);

    if (dojo.isArray(aa))
        for (var ii =  0; ii < aa.length; ii++) node.appendChild(aa[ii]);
    else
        for (var ii = n1; ii < na; ii++) node.appendChild(args[ii]);
    return node;
};
nqo.classify = function(attrs) {
    var ko = attrs.className;
    if (ko && ko.charAt(0)=="#") {
        var pid = ko.split(" ",1)[0];
        var num = pid.length+1;
        attrs.id = pid.slice(1);
        if (num < ko.length) attrs.className = ko.slice(num);
        else delete attrs.className;
    }
};

nqo.tagr.prototype.time   = function(datetime,nqa,klass,childs) {
    return this._tagrCreate('time',arguments,1,{datetime:datetime});
};
nqo.tagr.prototype.img   = function(src,nqa,klass,childs) {
    if (src && dojo.isString(src))
        return this._tagrCreate('img',arguments,1,{src:src});
    else return this._tagrCreate('img',arguments);
};
nqo.tagr.prototype.a     = function(href,nqa,klass,childs) {
    if (href && dojo.isString(href))
         return this._tagrCreate('a',arguments,1,{href:href});
    else return this._tagrCreate('a',arguments);
};
nqo.tagr.prototype.p   = function(inner) {
    if (inner && dojo.isString(inner))
        return this._tagrCreate('p',arguments,1,{innerHTML:inner});
    else return this._tagrCreate('p', arguments);
};
nqo.tagr.prototype.pre   = function(inner) {
    if (inner && dojo.isString(inner))
        return this._tagrCreate('pre',arguments,1,{innerHTML:inner});
    else return this._tagrCreate('pre', arguments);
};
/**
 * create a new tag
 * arguments are allocated right to left
 * nqa, attrs, children ...
 * children can be a list of HTMLElement's or a string (used as innerHTML)
 *   or an array of children
 *   or anything else to indicate no children
 *   if the last arg isn't an object, it is skipped
 * attrs is a blob of properties to set
 *   inner and klass --> innerHTML and className
 *   nqa is set as a propery of the element (not an attribute)
 *   ref is set as the parent of the element (using dojo.place)
 *   everything else is passed to dojo.create which sets them as attributes
 *   stuff set in attrs takes precidence over other parameters
 * if attrs is a string, it's treated as the className
 *   anything else --> no attrs
 * nqa is set as a propery of the element
 * examples:
 *   div()
 *   div('myClass')
 *   div({klass:'myClass', ref:myParent})
 *   div(7,'myClass')                          -- node.nqa=7
 *   div('myClass','some text')                --
 *   div('myClass',child1,child2,...)
 *   div( {cb:myNqaCallback}, {ref:myParent,klass:'myClass'}, child1,child2 )
 * @returns {HTMLElement} a new html element
 */
true,
nqo.tagr.prototype.br       = function() { return this._tagrCreate(     'br', arguments); },
nqo.tagr.prototype.s        = function() { return this._tagrCreate(      's', arguments); },
nqo.tagr.prototype.b        = function() { return this._tagrCreate(      'b', arguments); },
nqo.tagr.prototype.hr       = function() { return this._tagrCreate(     'hr', arguments); },
nqo.tagr.prototype.div      = function() { return this._tagrCreate(    'div', arguments); },
nqo.tagr.prototype.span     = function() { return this._tagrCreate(   'span', arguments); },
nqo.tagr.prototype.li       = function() { return this._tagrCreate(     'li', arguments); },
nqo.tagr.prototype.ul       = function() { return this._tagrCreate(     'ul', arguments); },
nqo.tagr.prototype.table    = function() { return this._tagrCreate(  'table', arguments); },
nqo.tagr.prototype.tbody    = function() { return this._tagrCreate(  'tbody', arguments); },
nqo.tagr.prototype.tr       = function() { return this._tagrCreate(     'tr', arguments); },
nqo.tagr.prototype.td       = function() { return this._tagrCreate(     'td', arguments); },
nqo.tagr.prototype.th       = function() { return this._tagrCreate(     'th', arguments); },
nqo.tagr.prototype.h1       = function() { return this._tagrCreate(     'h1', arguments); },
nqo.tagr.prototype.h2       = function() { return this._tagrCreate(     'h2', arguments); },
nqo.tagr.prototype.h3       = function() { return this._tagrCreate(     'h3', arguments); },
nqo.tagr.prototype.textarea = function() { return this._tagrCreate('textarea',arguments); },
nqo.tagr.prototype.button   = function() { return this._tagrCreate( 'button', arguments); },
nqo.tagr.prototype.form     = function() { return this._tagrCreate(   'form', arguments); },
nqo.tagr.prototype.label    = function() { return this._tagrCreate(  'label', arguments); },
nqo.tagr.prototype.iframe   = function() { return this._tagrCreate( 'iframe', arguments); },
nqo.tagr.prototype.fieldset = function() { return this._tagrCreate('fieldset',arguments); },
nqo.tagr.prototype.radio    = function() { return this._tagrCreate(   'radio',arguments); },
nqo.tagr.prototype.radiogroup = function() { return this._tagrCreate('radiogroup',arguments); },
nqo.tagr.prototype.input    = function(type,value) {
    return (type && dojo.isObject(type))
        ? this._tagrCreate('input', arguments, 0, {type:'text'} )
        : this._tagrCreate('input', arguments, 2, { type:type||'text', value:value });
},
nqo.tagr.prototype.checkbox = function(name,value,checked) {
    var attrs = { type:'checkbox' };
    if (name && dojo.isObject(name))
        return this._tagrCreate('input',arguments,0,attrs);
    name && (attrs.name = name);
    value && (attrs.value = value);
    checked == !!checked && (attrs.checked = checked);
    return this._tagrCreate( 'input', arguments, 3, attrs );
};
nqo.tagr.prototype.text= function(inner) {  return dojo.doc.createTextNode(inner); };


})();



/*----------------------------------------- inheritance and models ---------------------------------------*/

/** return a simple constructor that chains to Super
 * @param {function} Super the superclass constructor to delegate to
 * @returns {function} a new constructor that chains to Super */
nqo.ctor = function(Super) {
    return function() {
        Super.apply(this,arguments);
    };
};

/**
 * return a constructor that delegates to Xtor, ie similates Xtor.apply(new,args)
 * @param {Class} Xtor the constructor to delegate to
 * @returns {function} Delegator(args) where args is an array of arguments that would be passed to apply
 */
nqo.ctorApply = function(Xtor) {
    var Delegator = function(xtor,args) { return xtor.apply(this,args); };
    Delegator.prototype = Xtor.prototype;
    return Delegator;
};

/**
 * mix the Super.prototype, props, and { constructor:Sub }, into Sub.prototype, and set Sub.Super = Super
 * truthy Sub, else use props.constructor, else wrap truthy Super, else function(){}
 * @param Sub
 * @param Super
 * @param props
 */
nqo.extend = function(Sub,/**Object?*/Super,/**Object?*/ props) {
    props = props || {};
    var Mixins = [];
    if (dojo.isArray(Super)) { Mixins = Super.slice(1); Super = Super[0]; }
    if ( dojo.isFunction( props ) ) props = props(Super);
    Super = Super || props.Super || Object;
    var pown = props && props.hasOwnProperty( 'constructor' ); // the browser might set constructor on props.prototype, eg to Object()
    Sub = Sub ||
        (pown && props.constructor ) ||
        (Super && function() { Super.apply( this, arguments ); }) ||
        function(){};
    // the order of inheritance is critical
    //   cache the existing prototype
    //   apply mixins left to right
    //   then the super prototype
    //   then the original prototype
    var proto = Sub.prototype;
    Sub.prototype = {};
    for (var ii = 0; ii < Mixins.length; ii++)
        dojo.extend( Sub, Mixins[ii].prototype );
    dojo.extend( Sub, Super.prototype );
    var propi = proto.classInit ? proto : props;
    if (propi && propi.classInit) {
        var ci = propi.classInit;
        delete propi.classInit;
    }
    props && dojo.extend( Sub, props );
    dojo.extend(Sub,proto);
    Sub.Super = Super;
    Sub.Mixins = Mixins;
    Sub.prototype.constructor = Sub;
    // don't put Super in prototype ... it can't chain anyway, and it's too tempting to use this.Super
    //   Sub.prototype.Super = Super;
    ci && ci.call(Sub.prototype,Sub);
    return Sub;
}

/**
 * merge the superclass and mixin values of a static field into the subclass
 * @param Sub the class to merge into
 * @param name the name of a static field of Sub
 * @param Mixins the superclasses to use (varargs style), merged in left to right, defaults to Sub.Mixins+Sub.Super
 */
nqo.inheritObject = function(Sub,name,/**Object...?*/Mixins) {
    var mixins = Mixins
        ? arguments.slice(2)
        : Sub.Mixins.concat(Sub.Super);
    var proto = Sub.prototype;
    if (! proto.hasOwnProperty(name)) proto[name] = {};
    // merge order: the mixins, the super, and then the original object (which might have gotten overwritten)
    var prop = proto[name];
    var dup = nqo.shallow(prop);
    var protos = nqo.vsSelect(mixins,'prototype');
    var mixers = nqo.vsSelect(protos,name);
    var args = [prop].concat(mixers,dup);
    dojo.mixin.apply(dojo,args);
    return prop;
}


/**
 * dojo.delegate the Sub class's prototype to the Super class's prototype, mixing in props, and return Sub
 */
nqo.inherit = function(Sub,Super,props) {
    Sub.prototype = dojo.delegate( Super.prototype, props );
    Sub.Super = Super;
    Sub.prototype.constructor = Sub;

    return Sub;
}

/**
 * return a constructor that chains (both constructor and prototype) to truthy Super, else Object
 * truthy preambleOrProps: either a method to call after Super constructor or a props object (in which case props.preamble is used)
 * Super and preamble get set in the prototype
 *
 */
nqo.subclass = function(Super,preambleOrProps) {
    ( !Super ) && ( Super = Object );
    var preamble, props;
    var isfunc = ! preambleOrProps || dojo.isFunction( preambleOrProps );
    if ( isfunc ) preamble = preambleOrProps;
    else { props = preambleOrProps; preamble = props.preamble; }
    var Sub = preamble
        ? function(a,b,c,d,e,f,g,h) { Super.call( this, a,b,c,d,e,f,g,h ); preamble.call( this, a,b,c,d,e,f,g,h ); }
        : function(a,b,c,d,e,f,g,h) { Super.call( this, a,b,c,d,e,f,g,h ); }
    nqo.inherit( Sub, Super, props );
    (isfunc && preamble) && (Sub.Preamble = preamble);
    return Sub;
}

nqo.extensionof = function(objOrSub,Super) {
    // test whether Super is in the nqo.extend Super-chain of objOrSub (or it's constructor if not a function)
    var Sub = dojo.isFunction( objOrSub ) ? objOrSub : objOrSub.constructor;
    for (var sup = Sub; sup; sup = sup.Super) if (sup == Super) return true;
    return false;
}

/** assert that objOrSub is an nqo.extend-sion of Super (or it's constructor if not a function) */
nqo.assertExtends = function(objOrSub,Super) {
    nqo.assert( nqo.extensionof( objOrSub, Super ), 'type mismatch' );
}

/** set up functions for loading content, ie strings suck */
nqo.require_demo = function() { dojo.require('js.demo'); };


/** label all functions in obj (or eval(namespace) no obj) with the string namespace as myfunction._nqoName */
nqo.namespacify = function(namespace,obj) {
    // for a string namespace, find all methods in eval(namespace) and set meth.name to namespace.method_name
    var ns = obj || dojo.eval( namespace );
    var toStringCustom = function(old) { return function() { return this.name + ' = ' + old.call(this); } };
    var toString = function() { return this.name + ' = ' + Object.toString.call(this); }
    var skip = { Super:1 };
    for (var ii in ns) {
        var val = ns[ii];
        if ( !skip[ii] && !val._nqoName && dojo.isFunction( val )) {
            val._nqoName = namespace + '.' + ii;
            //  var ots = val.prototype.toString;
            //  val.prototype.toString = (ots && ots === Object.toString) ? toString : toStringCustom(ots);
            //  console.log( val._nqoName );
            nqo.namespacify( val._nqoName, val );
        }
    }
}


// TODO: nqo.ccify... add a cc() method to an object, which has a prototype defining methods for each of the
//   object's methods, which return a method bound to the object
// eg, nqo.select(u2.blocks,true).map(this.control.viewList.cc().updateMatch());
// very sexy :)
// as an alternative, could define a token, eg HITCH, and replace each method with one that delegates to the orig
// checking the first arg for HITCH and in that case returning a hitched version
// eg, nqo.select(u2.blocks,true).map(this.control.viewList.updateMatch(HITCH));
// this has the nice property of "find usages" working, downside that if you forget to augment it silently fails
// both approaches are probably a little too cute / clever, ie confusing and error prone
// wip

nqo.ccify = function(xtor) {
    var proto = xtor.prototype;
    // add a cc method to the prototype
    var ccprot = {};
    var skip = { Super:1 };
    for (var ii in proto) {
        var val = proto[ii];
        if ( !skip[ii] && !val.cc && dojo.isFunction( val ) && proto.hasOwnProperty(ii))
            ccprot[ii] = function() { return nqo.proxy(this.self,val); };
    }
    var blah = function(self) { this.self = self; };
    blah.prototype = ccprot;
    proto.cc = function() {
        return new blah(this);
    };
};

nqo.HITCH = {};
nqo.hitchify = function(xtor,key) {
    var proto = xtor.prototype;
    var meth = proto[key];
    proto[key] = function(arg) {
        if (arg===nqo.HITCH) return nqo.proxy(this,meth);
        else                 return meth.call(this);
    };
};



/*----------------------------------------- linked lists -------------------------------------------------*/


// todo: cyclic lists need a way to terminate, might be nice for the comparison callback to take a data arg
//   how much faster would a hard-coded comparison be ?
//   how about a ( p[cmp] < q[cmp] ) ?
//   assume the modern browsers can inline a simple function ...


/**
 * sort a linked list using mergesort, ie stable, fast, no extra storage required
 * assumes only handles ele.next (ie, if it's a double linked list, need to fix the .prev links after sort)
 * algorithm described by simon tatham
 * http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
 */
nqo.linkedSort = function(list,cmp) {
    var block = 1, head = { next:list }, q, psize, qsize, e;
    while ( true ) {
        var p = head.next, nmerges = 0, tail = head;
        while (p) {
            nmerges++;
            q = p;
            for (psize = 0; psize < block && q; psize++) q = q.next;
            qsize = block;
            while (psize > 0 || (qsize > 0 && q)) {
                if      (psize == 0)       { e = q; q = q.next; qsize--; }
                else if (qsize == 0 || !q) { e = p; p = p.next; psize--; }
                else if (cmp(p,q) <= 0)    { e = p; p = p.next; psize--; }
                else                       { e = q; q = q.next; qsize--; }
                tail = tail.next = e;
            }
            p = q;
        }
        tail.next = null;
        if (nmerges <= 1) return head.next;
        block *= 2;
    }
};

/*----------------------------------------- time and dates -----------------------------------------------*/

(function() {

    nqo.dater = function(kday) { return new Date(epochLocal+kday*mpd); };

    // fixme::robustness -- we break with daylights savings or if the timezone changes, eg travel
    //   at the least should setTimer to adjust every midnight
    //   not sure about how to detect that the timezone has changed ...

    /** @type Number
     * milliseconds per day */
    var mpd = nqo.dater.mpd = 24*3600*1000;
    /** milliseconds per minute */ var mpm = nqo.dater.mpm = 60*1000;

    /** @type Number
     *  the milliseconds difference between local time and utc at the epoch */
    var epochLocal = nqo.dater.epochLocal = new Date(1970,0,1).getTime();

    /** @param {Date?} date the date to convert
     *  @returns {Number} the number of days since the epoch */
    nqo.dater.kdayᵩ = function(date) {
        date = date ? new Date(date.getTime()) : new Date();
        date.setHours(12);
        return Math.floor((date.getTime()-epochLocal) / mpd);
    };

    /** return the minutes since the epoch for the time on kday */
    nqo.dater.makeTime = function(timeString,kday) {
        var day = nqo.dater.parseTimeString(timeString,kday);
        return day.getTime() / mpm;
    };
    /** @param {Date|Number} date either a date object or a number of minutes since the epoch */
    nqo.dater.format = function(date) {
        date = (date instanceof Date) ? date : new Date(date*mpm);
        return dojo.date.locale.format(date, {selector: "time"});
    };


    /**
     * parse timeString and return date (or a new date) set to the time of day
     * timeString is lenient, eg: 8.05a, 9pm, 13:27, 11:15 pm, 3 15a ...
     *   hours[ .:minutes][space][am/pm]
     * @param {Date|number?} date the date object (or kday or null) to initialize the Date object
     * @returns {Date} the date object
     */
    nqo.dater.parseTimeString = function(timeString,date) {
        if (date==null) date = nqo.dater(0);
        else if (typeof date=='number') date = new Date(epochLocal+date*mpd+mpd/2);
        if (timeString == '') return null;
        date = date || nqo.dater(0);
        // hours, minutes, suffix
        var reg = /(\d+)([:. ](\d\d))?\s*(.?)/i;
        var time = timeString.match(reg);
        var hours = parseInt(time[1],10);
        var suffix = time[4].toLowerCase();
        if (suffix=='a' & hours==12) hours  = 0;
        if (suffix=='p' & hours <12) hours += 12;
        date.setHours(hours);
        date.setMinutes(parseInt(time[3],10) || 0);
        date.setSeconds(0);
        return date;
    };
    /*
        var times = '0,12am,12A,12:30a,1 20a,1 30 am,2.22a,11,11:30,12,12pm,12P,12 pm,12:30 pm,1pm,15,23,11:59pm'
            .split(',');
        for (var ii=0; ii < times.length; ii++)
            "" + times[ii] + nqo.dater.parseTimeString(times[ii],new Date());
    */


})();

/*----------------------------------------- other stuff / uncategorized ----------------------------------*/



nqo.not = function(val) { return val===null || val===undefined; };
nqo.nullfunc = function() {};
nqo.destroyIf = function(widget) { if (widget.destroyRecursive) widget.destroyRecursive(); };
nqo.defined = function(val) { return val !== undefined; };


nqo.softAssert = function(exp,message) {
    if (!exp)
        console.error( 'assert failed: ' + message );
};

/** assert that exp is true, else throw an error with the message */
nqo.assert = function(exp, message) {
    if (!exp) {
        throw new Error( 'assert failed', message );
    }
};

// special keys that don't generate keypress events (ie must use keydown)
nqo.pressless = {
    // based on http://www.quirksmode.org/js/keys.html
    17:'ctrl', 18:'alt', 20:'caps', 37:'left', 38:'up', 39:'right', 40:'down', 91:'windows', 144:'num',

    // experimentation (on chrome)
    27:'esc'
};
nqo.charOrCode = function(evt) {
    var code = evt.charCode;
    return code ? String.fromCharCode( code ) : evt.keyCode;
};

nqo.deepEquals = function(xo,yo,details) {
    var zo = nqo.shallow(yo);
    var diff = [];
    for (var ii in xo) {
        var j1 = JSON.stringify(xo[ii]);
        var j2 = JSON.stringify(yo[ii]);
        if (j1 !== j2) {
            if (!details) return false;
            diff.push(ii);
        }
        delete zo[ii];
    }
    for (ii in zo) {
        if (!details) return false;
        diff.push(ii);
    }
    if (details) return diff.length==0 ? null : diff;
    else return true;
};


nqo.cookie = function(key,value,expires,path) {
    var txt = key + "=" + value;
    if (expires)
        txt += "; expires=" + new Date(new Date().valueOf() + 24*60*1000*expires).toUTCString();
    if (path != undefined)
        txt += "; path=" + path;
    return txt;
};

// return obj[ind[:]]
nqo.select = function(obj,ind) { return ind.map(function(c) { return this[c] },obj); };
Array.prototype.cut = function(arr) { return this.map(function(c) { return this[c]; },arr); };
Array.prototype.get = function(arr) { return  arr.map(function(c) { return this[c]; },this); };


nqo.namespacify( 'nqo' );


