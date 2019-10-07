module.exports=function(t){var e={};function r(n){if(e[n])return e[n].exports;var i=e[n]={i:n,l:!1,exports:{}};return t[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}return r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)r.d(n,i,function(e){return t[e]}.bind(null,i));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=40)}([function(t,e){t.exports=require("three")},function(t,e,r){(function(e){var n=r(10),i=r(14),a=r(15),o=r(18),s=r(5),u=r(20),c=r(21),l=e.BufferGeometry;function f(t){l.call(this),"string"==typeof t&&(t={text:t}),this._opt=s({},t),t&&this.update(t)}t.exports=function(t){return new f(t)},i(f,l),f.prototype.update=function(t){if("string"==typeof t&&(t={text:t}),!(t=s({},this._opt,t)).font)throw new TypeError("must specify a { font } in options");this.layout=n(t);var e=!1!==t.flipY,r=t.font,i=r.common.scaleW,c=r.common.scaleH,l=this.layout.glyphs.filter(function(t){var e=t.data;return e.width*e.height>0});this.visibleGlyphs=l;var f=u.positions(l),h=u.uvs(l,i,c,e),p=a({clockwise:!0,type:"uint16",count:l.length});if(o.index(this,p,1,"uint16"),o.attr(this,"position",f,2),o.attr(this,"uv",h,2),!t.multipage&&"page"in this.attributes)this.removeAttribute("page");else if(t.multipage){var d=u.pages(l);o.attr(this,"page",d,1)}},f.prototype.computeBoundingSphere=function(){null===this.boundingSphere&&(this.boundingSphere=new e.Sphere);var t=this.attributes.position.array,r=this.attributes.position.itemSize;if(!t||!r||t.length<2)return this.boundingSphere.radius=0,void this.boundingSphere.center.set(0,0,0);c.computeSphere(t,this.boundingSphere),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.')},f.prototype.computeBoundingBox=function(){null===this.boundingBox&&(this.boundingBox=new e.Box3);var t=this.boundingBox,r=this.attributes.position.array,n=this.attributes.position.itemSize;!r||!n||r.length<2?t.makeEmpty():c.computeBox(r,t)}}).call(this,r(0))},function(t,e,r){var n=r(22),i=function(){},a=r(30),o=r(31),s=r(34),u=r(35),c=r(38),l=self.XMLHttpRequest&&"withCredentials"in new XMLHttpRequest;t.exports=function(t,e){e="function"==typeof e?e:i,"string"==typeof t?t={uri:t}:t||(t={}),t.binary&&(t=function(t){if(l)return c(t,{responseType:"arraybuffer"});if(void 0===self.XMLHttpRequest)throw new Error("your browser does not support XHR loading");var e=new self.XMLHttpRequest;return e.overrideMimeType("text/plain; charset=x-user-defined"),c({xhr:e},t)}(t)),n(t,function(r,n,c){if(r)return e(r);if(!/^2/.test(n.statusCode))return e(new Error("http status code: "+n.statusCode));if(!c)return e(new Error("no body result"));var l,f,h=!1;if(l=c,"[object ArrayBuffer]"===Object.prototype.toString.call(l)){var p=new Uint8Array(c);c=new Buffer(p,"binary")}u(c)&&(h=!0,"string"==typeof c&&(c=new Buffer(c,"binary"))),h||(Buffer.isBuffer(c)&&(c=c.toString(t.encoding)),c=c.trim());try{var d=n.headers["content-type"];f=h?s(c):/json/.test(d)||"{"===c.charAt(0)?JSON.parse(c):/xml/.test(d)||"<"===c.charAt(0)?o(c):a(c)}catch(t){e(new Error("error parsing font "+t.message)),e=i}e(null,f)})}},function(t,e,r){(function(e){var n=r(5);t.exports=function(t){var r="number"==typeof(t=t||{}).opacity?t.opacity:1,i="number"==typeof t.alphaTest?t.alphaTest:1e-4,a=t.precision||"highp",o=t.color,s=t.map;return delete t.map,delete t.color,delete t.precision,delete t.opacity,n({uniforms:{opacity:{type:"f",value:r},map:{type:"t",value:s||new e.Texture},color:{type:"c",value:new e.Color(o)}},vertexShader:["attribute vec2 uv;","attribute vec4 position;","uniform mat4 projectionMatrix;","uniform mat4 modelViewMatrix;","varying vec2 vUv;","void main() {","vUv = uv;","gl_Position = projectionMatrix * modelViewMatrix * position;","}"].join("\n"),fragmentShader:["#ifdef GL_OES_standard_derivatives","#extension GL_OES_standard_derivatives : enable","#endif","precision "+a+" float;","uniform float opacity;","uniform vec3 color;","uniform sampler2D map;","varying vec2 vUv;","float aastep(float value) {","  #ifdef GL_OES_standard_derivatives","    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;","  #else","    float afwidth = (1.0 / 32.0) * (1.4142135623730951 / (2.0 * gl_FragCoord.w));","  #endif","  return smoothstep(0.5 - afwidth, 0.5 + afwidth, value);","}","void main() {","  vec4 texColor = texture2D(map, vUv);","  float alpha = aastep(texColor.a);","  gl_FragColor = vec4(color, opacity * alpha);",0===i?"":"  if (gl_FragColor.a < "+i+") discard;","}"].join("\n")},t)}}).call(this,r(0))},function(t,e){t.exports=function(t){switch(t){case"int8":return Int8Array;case"int16":return Int16Array;case"int32":return Int32Array;case"uint8":return Uint8Array;case"uint16":return Uint16Array;case"uint32":return Uint32Array;case"float32":return Float32Array;case"float64":return Float64Array;case"array":return Array;case"uint8_clamped":return Uint8ClampedArray}}},function(t,e,r){"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/var n=Object.getOwnPropertySymbols,i=Object.prototype.hasOwnProperty,a=Object.prototype.propertyIsEnumerable;t.exports=function(){try{if(!Object.assign)return!1;var t=new String("abc");if(t[5]="de","5"===Object.getOwnPropertyNames(t)[0])return!1;for(var e={},r=0;r<10;r++)e["_"+String.fromCharCode(r)]=r;if("0123456789"!==Object.getOwnPropertyNames(e).map(function(t){return e[t]}).join(""))return!1;var n={};return"abcdefghijklmnopqrst".split("").forEach(function(t){n[t]=t}),"abcdefghijklmnopqrst"===Object.keys(Object.assign({},n)).join("")}catch(t){return!1}}()?Object.assign:function(t,e){for(var r,o,s=function(t){if(null==t)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(t)}(t),u=1;u<arguments.length;u++){for(var c in r=Object(arguments[u]))i.call(r,c)&&(s[c]=r[c]);if(n){o=n(r);for(var l=0;l<o.length;l++)a.call(r,o[l])&&(s[o[l]]=r[o[l]])}}return s}},function(t,e){t.exports="dist/fada3974be425c3cf154896e766bbf14.fnt"},function(t,e){t.exports="dist/560b5576ec7fff45bd99f1cde02b93f7.png"},function(t,e){t.exports="dist/acc01c51e77e2578af7e5d45dd8f6889.fnt"},function(t,e){t.exports="dist/d8f9636fe5f40c9ffbc15a9faf3e4d01.png"},function(t,e,r){var n=r(11),i=r(12),a=r(13),o=["x","e","a","o","n","s","r","c","u","m","v","w","z"],s=["m","w"],u=["H","I","N","E","F","K","L","T","U","V","W","X","Y","Z"],c="\t".charCodeAt(0),l=" ".charCodeAt(0),f=0,h=1,p=2;function d(t){this.glyphs=[],this._measure=this.computeMetrics.bind(this),this.update(t)}function g(t){return new Function(["return function "+t+"() {","  return this._"+t,"}"].join("\n"))()}function y(t,e){if(!t.chars||0===t.chars.length)return null;var r=v(t.chars,e);return r>=0?t.chars[r]:null}function m(t,e,r){if(!t.kernings||0===t.kernings.length)return 0;for(var n=t.kernings,i=0;i<n.length;i++){var a=n[i];if(a.first===e&&a.second===r)return a.amount}return 0}function v(t,e,r){for(var n=r=r||0;n<t.length;n++)if(t[n].id===e)return n;return-1}t.exports=function(t){return new d(t)},d.prototype.update=function(t){if(t=i({measure:this._measure},t),this._opt=t,this._opt.tabSize=a(this._opt.tabSize,4),!t.font)throw new Error("must provide a valid bitmap font");var e=this.glyphs,r=t.text||"",s=t.font;this._setupSpaceGlyphs(s);var c=n.lines(r,t),l=t.width||0;e.length=0;var d=c.reduce(function(t,e){return Math.max(t,e.width,l)},0),g=0,y=0,w=a(t.lineHeight,s.common.lineHeight),b=s.common.base,x=w-b,E=t.letterSpacing||0,M=w*c.length-x,S=function(t){if("center"===t)return h;if("right"===t)return p;return f}(this._opt.align);y-=M,this._width=d,this._height=M,this._descender=w-b,this._baseline=b,this._xHeight=function(t){for(var e=0;e<o.length;e++){var r=o[e].charCodeAt(0),n=v(t.chars,r);if(n>=0)return t.chars[n].height}return 0}(s),this._capHeight=function(t){for(var e=0;e<u.length;e++){var r=u[e].charCodeAt(0),n=v(t.chars,r);if(n>=0)return t.chars[n].height}return 0}(s),this._lineHeight=w,this._ascender=w-x-this._xHeight;var A=this;c.forEach(function(t,n){for(var i,a=t.start,o=t.end,u=t.width,c=a;c<o;c++){var l=r.charCodeAt(c),f=A.getGlyph(s,l);if(f){i&&(g+=m(s,i.id,f.id));var v=g;S===h?v+=(d-u)/2:S===p&&(v+=d-u),e.push({position:[v,y],data:f,index:c,line:n}),g+=f.xadvance+E,i=f}}y+=w,g=0}),this._linesTotal=c.length},d.prototype._setupSpaceGlyphs=function(t){if(this._fallbackSpaceGlyph=null,this._fallbackTabGlyph=null,t.chars&&0!==t.chars.length){var e=y(t,l)||function(t){for(var e=0;e<s.length;e++){var r=s[e].charCodeAt(0),n=v(t.chars,r);if(n>=0)return t.chars[n]}return 0}(t)||t.chars[0],r=this._opt.tabSize*e.xadvance;this._fallbackSpaceGlyph=e,this._fallbackTabGlyph=i(e,{x:0,y:0,xadvance:r,id:c,xoffset:0,yoffset:0,width:0,height:0})}},d.prototype.getGlyph=function(t,e){var r=y(t,e);return r||(e===c?this._fallbackTabGlyph:e===l?this._fallbackSpaceGlyph:null)},d.prototype.computeMetrics=function(t,e,r,n){var i,a=this._opt.letterSpacing||0,o=this._opt.font,s=0,u=0,c=0;if(!o.chars||0===o.chars.length)return{start:e,end:e,width:0};r=Math.min(t.length,r);for(var l=e;l<r;l++){var f,h=t.charCodeAt(l);if(f=this.getGlyph(o,h)){f.xoffset;var p=(s+=i?m(o,i.id,f.id):0)+f.xadvance+a,d=s+f.width;if(d>=n||p>=n)break;s=p,u=d,i=f}c++}return i&&(u+=i.xoffset),{start:e,end:e+c,width:u}},["width","height","descender","ascender","xHeight","baseline","capHeight","lineHeight"].forEach(function(t){Object.defineProperty(d.prototype,t,{get:g(t),configurable:!0})})},function(t,e){var r=/\n/,n="\n",i=/\s/;function a(t,e,r,n){var i=t.indexOf(e,r);return-1===i||i>n?n:i}function o(t){return i.test(t)}function s(t,e,r,n){return{start:e,end:e+Math.min(n,r-e)}}t.exports=function(e,r){return t.exports.lines(e,r).map(function(t){return e.substring(t.start,t.end)}).join("\n")},t.exports.lines=function(t,e){if(0===(e=e||{}).width&&"nowrap"!==e.mode)return[];t=t||"";var i="number"==typeof e.width?e.width:Number.MAX_VALUE,u=Math.max(0,e.start||0),c="number"==typeof e.end?e.end:t.length,l=e.mode,f=e.measure||s;return"pre"===l?function(t,e,n,i,a){for(var o=[],s=n,u=n;u<i&&u<e.length;u++){var c=e.charAt(u),l=r.test(c);if(l||u===i-1){var f=l?u:u+1,h=t(e,s,f,a);o.push(h),s=u+1}}return o}(f,t,u,c,i):function(t,e,r,i,s,u){var c=[],l=s;"nowrap"===u&&(l=Number.MAX_VALUE);for(;r<i&&r<e.length;){for(var f=a(e,n,r,i);r<f&&o(e.charAt(r));)r++;var h=t(e,r,f,l),p=r+(h.end-h.start),d=p+n.length;if(p<f){for(;p>r&&!o(e.charAt(p));)p--;if(p===r)d>r+n.length&&d--,p=d;else for(d=p;p>r&&o(e.charAt(p-n.length));)p--}if(p>=r){var g=t(e,r,p,l);c.push(g)}r=d}return c}(f,t,u,c,i,l)}},function(t,e){t.exports=function(){for(var t={},e=0;e<arguments.length;e++){var n=arguments[e];for(var i in n)r.call(n,i)&&(t[i]=n[i])}return t};var r=Object.prototype.hasOwnProperty},function(t,e){t.exports=function(t,e){return"number"==typeof t?t:"number"==typeof e?e:0}},function(t,e){"function"==typeof Object.create?t.exports=function(t,e){t.super_=e,t.prototype=Object.create(e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}})}:t.exports=function(t,e){t.super_=e;var r=function(){};r.prototype=e.prototype,t.prototype=new r,t.prototype.constructor=t}},function(t,e,r){var n=r(4),i=r(16),a=r(17),o=[0,2,3],s=[2,1,3];t.exports=function(t,e){t&&(i(t)||a(t))||(e=t||{},t=null);for(var r="string"==typeof(e="number"==typeof e?{count:e}:e||{}).type?e.type:"uint16",u="number"==typeof e.count?e.count:1,c=e.start||0,l=!1!==e.clockwise?o:s,f=l[0],h=l[1],p=l[2],d=6*u,g=t||new(n(r))(d),y=0,m=0;y<d;y+=6,m+=4){var v=y+c;g[v+0]=m+0,g[v+1]=m+1,g[v+2]=m+2,g[v+3]=m+f,g[v+4]=m+h,g[v+5]=m+p}return g}},function(t,e){var r=Object.prototype.toString;t.exports=function(t){return t.BYTES_PER_ELEMENT&&"[object ArrayBuffer]"===r.call(t.buffer)||Array.isArray(t)}},function(t,e){function r(t){return!!t.constructor&&"function"==typeof t.constructor.isBuffer&&t.constructor.isBuffer(t)}
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
t.exports=function(t){return null!=t&&(r(t)||function(t){return"function"==typeof t.readFloatLE&&"function"==typeof t.slice&&r(t.slice(0,0))}(t)||!!t._isBuffer)}},function(t,e,r){(function(e){var n=r(19),i=!1;function a(t,r,a,o){if(r=r||[],!t||function(t,e,r){if(t.itemSize!==r)return!0;if(!t.array)return!0;var n=t.array.length;return Array.isArray(e)&&Array.isArray(e[0])?n!==e.length*r:n!==e.length}(t,r,a)){r=n(r,o);var s=t&&"function"!=typeof t.setArray;return t&&!s||(s&&!i&&(i=!0,console.warn(["A WebGL buffer is being updated with a new size or itemSize, ","however this version of ThreeJS only supports fixed-size buffers.","\nThe old buffer may still be kept in memory.\n","To avoid memory leaks, it is recommended that you dispose ","your geometries and create new ones, or update to ThreeJS r82 or newer.\n","See here for discussion:\n","https://github.com/mrdoob/three.js/pull/9631"].join(""))),t=new e.BufferAttribute(r,a)),t.itemSize=a,t.needsUpdate=!0,"function"==typeof t.setArray&&t.setArray(r),t}return n(r,t.array),t.needsUpdate=!0,null}t.exports.attr=function(t,e,r,n,i){"number"!=typeof n&&(n=3);"string"!=typeof i&&(i="float32");if(Array.isArray(r)&&Array.isArray(r[0])&&r[0].length!==n)throw new Error("Nested vertex array has unexpected size; expected "+n+" but found "+r[0].length);var o=a(t.getAttribute(e),r,n,i);o&&t.addAttribute(e,o)},t.exports.index=function(t,e,r,n){"number"!=typeof r&&(r=1);"string"!=typeof n&&(n="uint16");var i=!t.index&&"function"!=typeof t.setIndex,o=a(i?t.getAttribute("index"):t.index,e,r,n);o&&(i?t.addAttribute("index",o):t.index=o)}}).call(this,r(0))},function(t,e,r){var n=r(4);t.exports=function(t,e,r){if(!t)throw new TypeError("must specify data as first parameter");if(r=0|+(r||0),Array.isArray(t)&&t[0]&&"number"==typeof t[0][0]){var i,a,o,s,u=t[0].length,c=t.length*u;e&&"string"!=typeof e||(e=new(n(e||"float32"))(c+r));var l=e.length-r;if(c!==l)throw new Error("source length "+c+" ("+u+"x"+t.length+") does not match destination length "+l);for(i=0,o=r;i<t.length;i++)for(a=0;a<u;a++)e[o++]=null===t[i][a]?NaN:t[i][a]}else if(e&&"string"!=typeof e)e.set(t,r);else{var f=n(e||"float32");if(Array.isArray(t)||"array"===e)for(e=new f(t.length+r),i=0,o=r,s=e.length;o<s;o++,i++)e[o]=null===t[i]?NaN:t[i];else 0===r?e=new f(t):(e=new f(t.length+r)).set(t,r)}return e}},function(t,e){t.exports.pages=function(t){var e=new Float32Array(4*t.length*1),r=0;return t.forEach(function(t){var n=t.data.page||0;e[r++]=n,e[r++]=n,e[r++]=n,e[r++]=n}),e},t.exports.uvs=function(t,e,r,n){var i=new Float32Array(4*t.length*2),a=0;return t.forEach(function(t){var o=t.data,s=o.x+o.width,u=o.y+o.height,c=o.x/e,l=o.y/r,f=s/e,h=u/r;n&&(l=(r-o.y)/r,h=(r-u)/r),i[a++]=c,i[a++]=l,i[a++]=c,i[a++]=h,i[a++]=f,i[a++]=h,i[a++]=f,i[a++]=l}),i},t.exports.positions=function(t){var e=new Float32Array(4*t.length*2),r=0;return t.forEach(function(t){var n=t.data,i=t.position[0]+n.xoffset,a=t.position[1]+n.yoffset,o=n.width,s=n.height;e[r++]=i,e[r++]=a,e[r++]=i,e[r++]=a+s,e[r++]=i+o,e[r++]=a+s,e[r++]=i+o,e[r++]=a}),e}},function(t,e){var r=2,n={min:[0,0],max:[0,0]};function i(t){var e=t.length/r;n.min[0]=t[0],n.min[1]=t[1],n.max[0]=t[0],n.max[1]=t[1];for(var i=0;i<e;i++){var a=t[i*r+0],o=t[i*r+1];n.min[0]=Math.min(a,n.min[0]),n.min[1]=Math.min(o,n.min[1]),n.max[0]=Math.max(a,n.max[0]),n.max[1]=Math.max(o,n.max[1])}}t.exports.computeBox=function(t,e){i(t),e.min.set(n.min[0],n.min[1],0),e.max.set(n.max[0],n.max[1],0)},t.exports.computeSphere=function(t,e){i(t);var r=n.min[0],a=n.min[1],o=n.max[0]-r,s=n.max[1]-a,u=Math.sqrt(o*o+s*s);e.center.set(r+o/2,a+s/2,0),e.radius=u/2}},function(t,e,r){"use strict";var n=r(23),i=r(24),a=r(25),o=r(29);function s(t,e,r){var n=t;return i(e)?(r=e,"string"==typeof t&&(n={uri:t})):n=o(e,{uri:t}),n.callback=r,n}function u(t,e,r){return c(e=s(t,e,r))}function c(t){if(void 0===t.callback)throw new Error("callback argument missing");var e=!1,r=function(r,n,i){e||(e=!0,t.callback(r,n,i))};function n(){var t=void 0;if(t=l.response?l.response:l.responseText||function(t){try{if("document"===t.responseType)return t.responseXML;var e=t.responseXML&&"parsererror"===t.responseXML.documentElement.nodeName;if(""===t.responseType&&!e)return t.responseXML}catch(t){}return null}(l),m)try{t=JSON.parse(t)}catch(t){}return t}function i(t){return clearTimeout(f),t instanceof Error||(t=new Error(""+(t||"Unknown XMLHttpRequest Error"))),t.statusCode=0,r(t,v)}function o(){if(!c){var e;clearTimeout(f),e=t.useXDR&&void 0===l.status?200:1223===l.status?204:l.status;var i=v,o=null;return 0!==e?(i={body:n(),statusCode:e,method:p,headers:{},url:h,rawRequest:l},l.getAllResponseHeaders&&(i.headers=a(l.getAllResponseHeaders()))):o=new Error("Internal XMLHttpRequest Error"),r(o,i,i.body)}}var s,c,l=t.xhr||null;l||(l=t.cors||t.useXDR?new u.XDomainRequest:new u.XMLHttpRequest);var f,h=l.url=t.uri||t.url,p=l.method=t.method||"GET",d=t.body||t.data,g=l.headers=t.headers||{},y=!!t.sync,m=!1,v={body:void 0,headers:{},statusCode:0,method:p,url:h,rawRequest:l};if("json"in t&&!1!==t.json&&(m=!0,g.accept||g.Accept||(g.Accept="application/json"),"GET"!==p&&"HEAD"!==p&&(g["content-type"]||g["Content-Type"]||(g["Content-Type"]="application/json"),d=JSON.stringify(!0===t.json?d:t.json))),l.onreadystatechange=function(){4===l.readyState&&setTimeout(o,0)},l.onload=o,l.onerror=i,l.onprogress=function(){},l.onabort=function(){c=!0},l.ontimeout=i,l.open(p,h,!y,t.username,t.password),y||(l.withCredentials=!!t.withCredentials),!y&&t.timeout>0&&(f=setTimeout(function(){if(!c){c=!0,l.abort("timeout");var t=new Error("XMLHttpRequest timeout");t.code="ETIMEDOUT",i(t)}},t.timeout)),l.setRequestHeader)for(s in g)g.hasOwnProperty(s)&&l.setRequestHeader(s,g[s]);else if(t.headers&&!function(t){for(var e in t)if(t.hasOwnProperty(e))return!1;return!0}(t.headers))throw new Error("Headers cannot be set on an XDomainRequest object");return"responseType"in t&&(l.responseType=t.responseType),"beforeSend"in t&&"function"==typeof t.beforeSend&&t.beforeSend(l),l.send(d||null),l}t.exports=u,t.exports.default=u,u.XMLHttpRequest=n.XMLHttpRequest||function(){},u.XDomainRequest="withCredentials"in new u.XMLHttpRequest?u.XMLHttpRequest:n.XDomainRequest,function(t,e){for(var r=0;r<t.length;r++)e(t[r])}(["get","put","post","patch","head","delete"],function(t){u["delete"===t?"del":t]=function(e,r,n){return(r=s(e,r,n)).method=t.toUpperCase(),c(r)}})},function(t,e){var r;r="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},t.exports=r},function(t,e){t.exports=function(t){var e=r.call(t);return"[object Function]"===e||"function"==typeof t&&"[object RegExp]"!==e||"undefined"!=typeof window&&(t===window.setTimeout||t===window.alert||t===window.confirm||t===window.prompt)};var r=Object.prototype.toString},function(t,e,r){var n=r(26),i=r(27);t.exports=function(t){if(!t)return{};var e={};return i(n(t).split("\n"),function(t){var r,i=t.indexOf(":"),a=n(t.slice(0,i)).toLowerCase(),o=n(t.slice(i+1));void 0===e[a]?e[a]=o:(r=e[a],"[object Array]"===Object.prototype.toString.call(r)?e[a].push(o):e[a]=[e[a],o])}),e}},function(t,e){(e=t.exports=function(t){return t.replace(/^\s*|\s*$/g,"")}).left=function(t){return t.replace(/^\s*/,"")},e.right=function(t){return t.replace(/\s*$/,"")}},function(t,e,r){"use strict";var n=r(28),i=Object.prototype.toString,a=Object.prototype.hasOwnProperty;t.exports=function(t,e,r){if(!n(e))throw new TypeError("iterator must be a function");var o;arguments.length>=3&&(o=r),"[object Array]"===i.call(t)?function(t,e,r){for(var n=0,i=t.length;n<i;n++)a.call(t,n)&&(null==r?e(t[n],n,t):e.call(r,t[n],n,t))}(t,e,o):"string"==typeof t?function(t,e,r){for(var n=0,i=t.length;n<i;n++)null==r?e(t.charAt(n),n,t):e.call(r,t.charAt(n),n,t)}(t,e,o):function(t,e,r){for(var n in t)a.call(t,n)&&(null==r?e(t[n],n,t):e.call(r,t[n],n,t))}(t,e,o)}},function(t,e,r){"use strict";var n=Function.prototype.toString,i=/^\s*class\b/,a=function(t){try{var e=n.call(t);return i.test(e)}catch(t){return!1}},o=Object.prototype.toString,s="function"==typeof Symbol&&"symbol"==typeof Symbol.toStringTag;t.exports=function(t){if(!t)return!1;if("function"!=typeof t&&"object"!=typeof t)return!1;if("function"==typeof t&&!t.prototype)return!0;if(s)return function(t){try{return!a(t)&&(n.call(t),!0)}catch(t){return!1}}(t);if(a(t))return!1;var e=o.call(t);return"[object Function]"===e||"[object GeneratorFunction]"===e}},function(t,e){t.exports=function(){for(var t={},e=0;e<arguments.length;e++){var n=arguments[e];for(var i in n)r.call(n,i)&&(t[i]=n[i])}return t};var r=Object.prototype.hasOwnProperty},function(t,e){function r(t,e){if(!(t=t.replace(/\t+/g," ").trim()))return null;var r=t.indexOf(" ");if(-1===r)throw new Error("no named row at line "+e);var i=t.substring(0,r);t=(t=(t=(t=t.substring(r+1)).replace(/letter=[\'\"]\S+[\'\"]/gi,"")).split("=")).map(function(t){return t.trim().match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)});for(var a=[],o=0;o<t.length;o++){var s=t[o];0===o?a.push({key:s[0],data:""}):o===t.length-1?a[a.length-1].data=n(s[0]):(a[a.length-1].data=n(s[0]),a.push({key:s[1],data:""}))}var u={key:i,data:{}};return a.forEach(function(t){u.data[t.key]=t.data}),u}function n(t){return t&&0!==t.length?0===t.indexOf('"')||0===t.indexOf("'")?t.substring(1,t.length-1):-1!==t.indexOf(",")?function(t){return t.split(",").map(function(t){return parseInt(t,10)})}(t):parseInt(t,10):""}t.exports=function(t){if(!t)throw new Error("no data provided");var e={pages:[],chars:[],kernings:[]},n=(t=t.toString().trim()).split(/\r\n?|\n/g);if(0===n.length)throw new Error("no data in BMFont file");for(var i=0;i<n.length;i++){var a=r(n[i],i);if(a)if("page"===a.key){if("number"!=typeof a.data.id)throw new Error("malformed file at line "+i+" -- needs page id=N");if("string"!=typeof a.data.file)throw new Error("malformed file at line "+i+' -- needs page file="path"');e.pages[a.data.id]=a.data.file}else"chars"===a.key||"kernings"===a.key||("char"===a.key?e.chars.push(a.data):"kerning"===a.key?e.kernings.push(a.data):e[a.key]=a.data)}return e}},function(t,e,r){var n=r(32),i=r(33),a={scaleh:"scaleH",scalew:"scaleW",stretchh:"stretchH",lineheight:"lineHeight",alphachnl:"alphaChnl",redchnl:"redChnl",greenchnl:"greenChnl",bluechnl:"blueChnl"};function o(t){return function(t){for(var e=[],r=0;r<t.attributes.length;r++)e.push(t.attributes[r]);return e}(t).reduce(function(t,e){var r;return t[(r=e.nodeName,a[r.toLowerCase()]||r)]=e.nodeValue,t},{})}t.exports=function(t){t=t.toString();var e=i(t),r={pages:[],chars:[],kernings:[]};["info","common"].forEach(function(t){var i=e.getElementsByTagName(t)[0];i&&(r[t]=n(o(i)))});var a=e.getElementsByTagName("pages")[0];if(!a)throw new Error("malformed file -- no <pages> element");for(var s=a.getElementsByTagName("page"),u=0;u<s.length;u++){var c=s[u],l=parseInt(c.getAttribute("id"),10),f=c.getAttribute("file");if(isNaN(l))throw new Error('malformed file -- page "id" attribute is NaN');if(!f)throw new Error('malformed file -- needs page "file" attribute');r.pages[parseInt(l,10)]=f}return["chars","kernings"].forEach(function(t){var i=e.getElementsByTagName(t)[0];if(i)for(var a=t.substring(0,t.length-1),s=i.getElementsByTagName(a),u=0;u<s.length;u++){var c=s[u];r[t].push(n(o(c)))}}),r}},function(t,e){t.exports=function(t){for(var e in"chasrset"in t&&(t.charset=t.chasrset,delete t.chasrset),t)"face"!==e&&"charset"!==e&&(t[e]="padding"===e||"spacing"===e?t[e].split(",").map(function(t){return parseInt(t,10)}):parseInt(t[e],10));return t}},function(t,e){t.exports=void 0!==self.DOMParser?function(t){return(new self.DOMParser).parseFromString(t,"application/xml")}:void 0!==self.ActiveXObject&&new self.ActiveXObject("Microsoft.XMLDOM")?function(t){var e=new self.ActiveXObject("Microsoft.XMLDOM");return e.async="false",e.loadXML(t),e}:function(t){var e=document.createElement("div");return e.innerHTML=t,e}},function(t,e){var r=[66,77,70];function n(t,e,r){if(r>e.length-1)return 0;var n=e.readUInt8(r++),a=e.readInt32LE(r);switch(r+=4,n){case 1:t.info=function(t,e){var r={};r.size=t.readInt16LE(e);var n=t.readUInt8(e+2);r.smooth=n>>7&1,r.unicode=n>>6&1,r.italic=n>>5&1,r.bold=n>>4&1,n>>3&1&&(r.fixedHeight=1);return r.charset=t.readUInt8(e+3)||"",r.stretchH=t.readUInt16LE(e+4),r.aa=t.readUInt8(e+6),r.padding=[t.readInt8(e+7),t.readInt8(e+8),t.readInt8(e+9),t.readInt8(e+10)],r.spacing=[t.readInt8(e+11),t.readInt8(e+12)],r.outline=t.readUInt8(e+13),r.face=function(t,e){return i(t,e).toString("utf8")}(t,e+14),r}(e,r);break;case 2:t.common=function(t,e){var r={};r.lineHeight=t.readUInt16LE(e),r.base=t.readUInt16LE(e+2),r.scaleW=t.readUInt16LE(e+4),r.scaleH=t.readUInt16LE(e+6),r.pages=t.readUInt16LE(e+8);t.readUInt8(e+10);return r.packed=0,r.alphaChnl=t.readUInt8(e+11),r.redChnl=t.readUInt8(e+12),r.greenChnl=t.readUInt8(e+13),r.blueChnl=t.readUInt8(e+14),r}(e,r);break;case 3:t.pages=function(t,e,r){for(var n=[],a=i(t,e),o=a.length+1,s=r/o,u=0;u<s;u++)n[u]=t.slice(e,e+a.length).toString("utf8"),e+=o;return n}(e,r,a);break;case 4:t.chars=function(t,e,r){for(var n=[],i=r/20,a=0;a<i;a++){var o={},s=20*a;o.id=t.readUInt32LE(e+0+s),o.x=t.readUInt16LE(e+4+s),o.y=t.readUInt16LE(e+6+s),o.width=t.readUInt16LE(e+8+s),o.height=t.readUInt16LE(e+10+s),o.xoffset=t.readInt16LE(e+12+s),o.yoffset=t.readInt16LE(e+14+s),o.xadvance=t.readInt16LE(e+16+s),o.page=t.readUInt8(e+18+s),o.chnl=t.readUInt8(e+19+s),n[a]=o}return n}(e,r,a);break;case 5:t.kernings=function(t,e,r){for(var n=[],i=r/10,a=0;a<i;a++){var o={},s=10*a;o.first=t.readUInt32LE(e+0+s),o.second=t.readUInt32LE(e+4+s),o.amount=t.readInt16LE(e+8+s),n[a]=o}return n}(e,r,a)}return 5+a}function i(t,e){for(var r=e;r<t.length&&0!==t[r];r++);return t.slice(e,r)}t.exports=function(t){if(t.length<6)throw new Error("invalid buffer length for BMFont");if(!r.every(function(e,r){return t.readUInt8(r)===e}))throw new Error("BMFont missing BMF byte header");var e=3;if(t.readUInt8(e++)>3)throw new Error("Only supports BMFont Binary v3 (BMFont App v1.10)");for(var i={kernings:[],chars:[]},a=0;a<5;a++)e+=n(i,t,e);return i}},function(t,e,r){var n=r(36),i=new Buffer([66,77,70,3]);t.exports=function(t){return"string"==typeof t?"BMF"===t.substring(0,3):t.length>4&&n(t.slice(0,4),i)}},function(t,e,r){var n=r(37).Buffer;t.exports=function(t,e){if(n.isBuffer(t)&&n.isBuffer(e)){if("function"==typeof t.equals)return t.equals(e);if(t.length!==e.length)return!1;for(var r=0;r<t.length;r++)if(t[r]!==e[r])return!1;return!0}}},function(t,e){t.exports=require("buffer")},function(t,e){t.exports=function(){for(var t={},e=0;e<arguments.length;e++){var n=arguments[e];for(var i in n)r.call(n,i)&&(t[i]=n[i])}return t};var r=Object.prototype.hasOwnProperty},,function(t,e,r){"use strict";r.r(e);var n=r(1),i=r.n(n),a=r(2),o=r.n(a),s=r(3),u=r.n(s),c=r(6),l=r.n(c),f=r(7),h=r.n(f),p=r(8),d=r.n(p),g=r(9),y=r.n(g),m=r(0),v=new m.TextureLoader,w=null,b=null,x=null,E=null;function M(t,{color:e}={}){const r=i()({align:"left",font:w});r.update(t);const n=new m.RawShaderMaterial(u()({map:b,transparent:!0,color:e||16777215,side:m.DoubleSide}));return new m.Mesh(r,n)}function S(t,{color:e}={}){const r=i()({align:"left",font:x});r.update(t);const n=new m.RawShaderMaterial(u()({map:E,transparent:!0,color:e||16777215,side:m.DoubleSide}));return new m.Mesh(r,n)}function A(t,{color:e,font:r}={}){return"runic"===r?S(t,{color:e}):M(t,{color:e})}const I=15,j=.5,O=15,L=30,T=Math.PI/32;class _{constructor(t=[]){this.children=t.filter(t=>t),this.radius=1,this.scale=1,this.underline=!0,this.totalWidthInRadians=0,this.childSpacing=I,this.underlineResolution=T}addChildSlice(t){this.children.push(t)}runLayout(t=1,e=1){return this.radius=t,this.scale=e,this.totalWidthInRadians=this.childSpacing*this.scale/this.radius,this.children.forEach(r=>{this.totalWidthInRadians+=r.runLayout(t,e),this.totalWidthInRadians+=this.childSpacing*this.scale/this.radius}),this.totalWidthInRadians}addMeshesToContainer(t,e=0){let r=e+this.childSpacing*this.scale*.5/this.radius;this.children.forEach(e=>{e.addMeshesToContainer(t,r),r+=e.totalWidthInRadians,r+=this.childSpacing*this.scale/this.radius}),this.underline&&(r=e+this.childSpacing*this.scale*.5/this.radius)}recolor(t){this.children.forEach(e=>e.recolor(t))}getMeshCenter(){const t=new m.Vector3;return this.children.forEach(e=>t.add(e.getMeshCenter())),t.multiplyScalar(1/this.children.length),t}getMaxRadius(){return this.children.reduce((t,e)=>Math.max(t,e.getMaxRadius()),this.radius)}}class C{constructor(t=[]){this.children=t.filter(t=>t),this.radius=1,this.scale=1,this.totalWidthInRadians=0,this.radiusSpacing=L}runLayout(t=1,e=1){this.radius=t,this.scale=e;let r=t,n=0;return this.children.forEach(t=>{n=Math.max(n,t.runLayout(r,e)),r+=this.radiusSpacing*this.scale}),this.totalWidthInRadians=n,this.totalWidthInRadians}addMeshesToContainer(t,e=0){const r=e+this.totalWidthInRadians/2;this.children.forEach(e=>{const n=r-e.totalWidthInRadians/2;e.addMeshesToContainer(t,n)})}recolor(t){this.children.forEach(e=>e.recolor(t))}getMeshCenter(){const t=new m.Vector3;return this.children.forEach(e=>t.add(e.getMeshCenter())),t.multiplyScalar(1/this.children.length),t}getMaxRadius(){return this.children.reduce((t,e)=>Math.max(t,e.getMaxRadius()),this.radius)}}class R{constructor(t,e={}){this.text=t||"",this.textMeshes=[],this.scale=1,this.radius=1,this.totalMeshWidth=0,this.totalWidthInRadians=0,this.characterSpacing=j,this.spaceWidth=O,this.colorAndFont=e}setText(t){this.text=t,this.textMeshes=[]}_buildMeshes(){for(let t=0;t<this.text.length;t++){const e=this.text[t],r=A(e,this.colorAndFont);r.geometry.computeBoundingBox(),r.scale.multiplyScalar(this.scale),this.textMeshes.push(r);let n=r.geometry.layout.width;" "===e&&(n=this.spaceWidth),this.totalMeshWidth+=n*this.scale,t<this.text.length-1&&(this.totalMeshWidth+=this.characterSpacing*this.scale)}}runLayout(t=1,e=1){return this.radius=t,this.scale=e,this.textMeshes.length||this._buildMeshes(),this.totalWidthInRadians=this.totalMeshWidth/this.radius,this.totalWidthInRadians}addMeshesToContainer(t,e=0){this.textMeshes.length||this._buildMeshes();let r=e;this.textMeshes.map((e,n)=>{const i=this.text[n];e.position.x=this.radius*Math.cos(r),e.position.y=this.radius*Math.sin(r),e.rotation.z=r+Math.PI/2,t.add(e);let a=e.geometry.layout.width;" "===i&&(a=this.spaceWidth),r+=a*this.scale/this.radius,r+=this.characterSpacing*this.scale/this.radius}),this.centerTheta=(e+r)/2}recolor(t){this.textMeshes.forEach(e=>{e.material.uniforms.color.value=t})}getMeshCenter(){const t=new m.Vector3;return this.textMeshes.forEach(e=>t.add(e.position)),t.multiplyScalar(1/this.textMeshes.length),t}getMaxRadius(){return this.radius}}const k=t=>({File:e=>t(e.program),Program:e=>{return new _(e.body.map(t))},ExpressionStatement:e=>t(e.expression),Literal:t=>new R(`${t.value}`),NumericLiteral:t=>new R(`${t.value}`),StringLiteral:t=>new R(`${t.value}`),CallExpression:e=>{const r=t(e.callee);let n=[new R("-")];return e.arguments&&e.arguments.length&&(n=e.arguments.map(t)),new C([r,new _(n)].filter(t=>t))},Identifier:t=>new R(t.name),ArrowFunctionExpression:e=>new _([...[e.params||[]].map(t),t(e.body)]),FunctionDeclaration:e=>new C([new R(`${e.id.name}()`),new _([...(e.params||[]).map(t),t(e.body)])]),FunctionExpression:e=>new C([new R(`${e.id?e.id.name:"F"}()`),new _([...(e.params||[]).map(t),t(e.body)])]),BlockStatement:e=>new _(e.body.map(t)),VariableDeclaration:e=>new _(e.declarations.map(t)),VariableDeclarator:e=>new _([t(e.id),new R("<-"),t(e.init)]),AssignmentExpression:e=>new _([t(e.left),new R("<-"),t(e.right)]),MemberExpression:e=>new _([t(e.object),t(e.property)]),NewExpression:e=>new _([t(e.callee),...(e.arguments||[]).map(t)]),UnaryExpression:e=>new _([new R(e.operator),t(e.argument)]),IfStatement:e=>new C([new _([new R("IF"),t(e.test)]),t(e.consequent)]),LogicalExpression:e=>new _([t(e.left),new R(e.operator),t(e.right)]),BinaryExpression:e=>new _([t(e.left),new R(e.operator),t(e.right)]),ReturnStatement:e=>new _([new R("return"),e.argument?t(e.argument):null]),ObjectExpression:e=>new _([new R("{"),...(e.properties||[]).map(t),new R("}")]),Property:e=>new _([t(e.key),t(e.value)]),ArrayExpression:e=>new _([new R("["),...(e.elements||[]).map(t),new R("]")]),ForStatement:e=>new C([new _([t(e.init),t(e.test),t(e.update)]),t(e.body)]),UpdateExpression:e=>new _([t(e.argument),new R(e.operator)]),TryStatement:e=>t(e.block),ThisExpression:t=>new R("this")});const U={createText:M,createRunicText:S,loadAllFonts:async function(){await async function(){w||(w=await new Promise((t,e)=>o()(l.a,(r,n)=>{if(r)return e(r);t(n)}))),b||(b=await new Promise((t,e)=>v.load(h.a,e=>{t(e)})))}(),await async function(){x||(x=await new Promise((t,e)=>o()(d.a,(r,n)=>{if(r)return e(r);t(n)}))),E||(E=await new Promise((t,e)=>v.load(y.a,e=>{t(e)})))}()},CircleGroupSlice:_,CircleStackSlice:C,CircleTextSlice:R,runLayout:function(t){let e=1,r=t.runLayout(e);for(let n=0;n<2;n++)e*=r/(2*Math.PI),r=t.runLayout(e);return t},convertScriptToSlices:function(t){const e=[];let r;function n(t){if(!t)return null;const n=r[t.type];if(n){const r=n(t);return e[`${t.start}:${t.end}`]=r,r}return null}return r=k(n),[{slicesByPosition:e},n(t)]}};e.default=U}]).default;
//# sourceMappingURL=index.js.map