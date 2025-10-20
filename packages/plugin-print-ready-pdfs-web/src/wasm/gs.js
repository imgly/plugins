
var Module = (() => {
  var _scriptName = import.meta.url;

  return (
async function(moduleArg = {}) {
  var moduleRtn;

var f = Object.assign({}, moduleArg), aa, ba, ca = new Promise((a, b) => {
  aa = a;
  ba = b;
});
"getExceptionMessage incrementExceptionRefcount decrementExceptionRefcount _memory ___indirect_function_table _main onRuntimeInitialized".split(" ").forEach(a => {
  Object.getOwnPropertyDescriptor(ca, a) || Object.defineProperty(ca, a, {get:() => h("You are getting " + a + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js"), set:() => h("You are setting " + a + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js"),});
});
var da = "object" == typeof window, ea = "function" == typeof importScripts, fa = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node, ha = !da && !fa && !ea;
if (f.ENVIRONMENT) {
  throw Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}
if (fa) {
  const {createRequire:a} = await import("module");
  var require = a(import.meta.url);
}
f.noInitialRun = !0;
var ia = Object.assign({}, f), ja = [], ka = "./this.program", la = (a, b) => {
  throw b;
}, l = "", ma, na, oa;
if (fa) {
  if ("undefined" == typeof process || !process.release || "node" !== process.release.name) {
    throw Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  }
  var pa = process.versions.node, qa = pa.split(".").slice(0, 3);
  qa = 10000 * qa[0] + 100 * qa[1] + 1 * qa[2].split("-")[0];
  if (160000 > qa) {
    throw Error("This emscripten-generated code requires node v16.0.0 (detected v" + pa + ")");
  }
  var fs = require("fs"), ra = require("path");
  l = require("url").fileURLToPath(new URL("./", import.meta.url));
  ma = (a, b) => {
    a = sa(a) ? new URL(a) : ra.normalize(a);
    return fs.readFileSync(a, b ? void 0 : "utf8");
  };
  oa = a => {
    a = ma(a, !0);
    a.buffer || (a = new Uint8Array(a));
    n(a.buffer);
    return a;
  };
  na = (a, b, c, d = !0) => {
    a = sa(a) ? new URL(a) : ra.normalize(a);
    fs.readFile(a, d ? void 0 : "utf8", (e, g) => {
      e ? c(e) : b(d ? g.buffer : g);
    });
  };
  !f.thisProgram && 1 < process.argv.length && (ka = process.argv[1].replace(/\\/g, "/"));
  ja = process.argv.slice(2);
  la = (a, b) => {
    process.exitCode = a;
    throw b;
  };
} else if (ha) {
  if ("object" == typeof process && "function" === typeof require || "object" == typeof window || "function" == typeof importScripts) {
    throw Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  }
} else if (da || ea) {
  ea ? l = self.location.href : "undefined" != typeof document && document.currentScript && (l = document.currentScript.src);
  _scriptName && (l = _scriptName);
  l.startsWith("blob:") ? l = "" : l = l.substr(0, l.replace(/[?#].*/, "").lastIndexOf("/") + 1);
  if ("object" != typeof window && "function" != typeof importScripts) {
    throw Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  }
  ma = a => {
    var b = new XMLHttpRequest();
    b.open("GET", a, !1);
    b.send(null);
    return b.responseText;
  };
  ea && (oa = a => {
    var b = new XMLHttpRequest();
    b.open("GET", a, !1);
    b.responseType = "arraybuffer";
    b.send(null);
    return new Uint8Array(b.response);
  });
  na = (a, b, c) => {
    var d = new XMLHttpRequest();
    d.open("GET", a, !0);
    d.responseType = "arraybuffer";
    d.onload = () => {
      200 == d.status || 0 == d.status && d.response ? b(d.response) : c();
    };
    d.onerror = c;
    d.send(null);
  };
} else {
  throw Error("environment detection error");
}
var ta = f.print || console.log.bind(console), p = f.printErr || console.error.bind(console);
Object.assign(f, ia);
ia = null;
q("ENVIRONMENT");
q("GL_MAX_TEXTURE_IMAGE_UNITS");
q("SDL_canPlayWithWebAudio");
q("SDL_numSimultaneouslyQueuedBuffers");
q("INITIAL_MEMORY");
q("wasmMemory");
q("arguments");
q("buffer");
q("canvas");
q("doNotCaptureKeyboard");
q("dynamicLibraries");
q("elementPointerLock");
q("extraStackTrace");
q("forcedAspectRatio");
q("keyboardListeningElement");
q("freePreloadedMediaOnUse");
q("loadSplitModule");
q("logReadFiles");
q("mainScriptUrlOrBlob");
q("mem");
q("monitorRunDependencies");
q("noExitRuntime");
q("onAbort");
q("onCustomMessage");
q("onExit");
q("onFree");
q("onFullScreen");
q("onMalloc");
q("onRealloc");
q("onRuntimeInitialized");
q("postMainLoop");
q("postRun");
q("preInit");
q("preMainLoop");
q("preinitializedWebGLContext");
q("preloadPlugins");
q("quit");
q("setStatus");
q("statusMessage");
q("stderr");
q("stdin");
q("stdout");
q("thisProgram");
q("wasm");
q("wasmBinary");
q("websocket");
q("fetchSettings");
ua("arguments", "arguments_");
ua("thisProgram", "thisProgram");
ua("quit", "quit_");
n("undefined" == typeof f.memoryInitializerPrefixURL, "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
n("undefined" == typeof f.pthreadMainPrefixURL, "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
n("undefined" == typeof f.cdInitializerPrefixURL, "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
n("undefined" == typeof f.filePackagePrefixURL, "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
n("undefined" == typeof f.read, "Module.read option was removed (modify read_ in JS)");
n("undefined" == typeof f.readAsync, "Module.readAsync option was removed (modify readAsync in JS)");
n("undefined" == typeof f.readBinary, "Module.readBinary option was removed (modify readBinary in JS)");
n("undefined" == typeof f.setWindowTitle, "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
n("undefined" == typeof f.TOTAL_MEMORY, "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
ua("asm", "wasmExports");
ua("read", "read_");
ua("readAsync", "readAsync");
ua("readBinary", "readBinary");
ua("setWindowTitle", "setWindowTitle");
n(!ha, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");
ua("wasmBinary", "wasmBinary");
"object" != typeof WebAssembly && p("no native wasm support detected");
var va, wa = !1, xa;
function n(a, b) {
  a || h("Assertion failed" + (b ? ": " + b : ""));
}
var v, ya, za, w, A, Aa;
function Ba() {
  var a = va.buffer;
  f.HEAP8 = v = new Int8Array(a);
  f.HEAP16 = za = new Int16Array(a);
  f.HEAPU8 = ya = new Uint8Array(a);
  f.HEAPU16 = new Uint16Array(a);
  f.HEAP32 = w = new Int32Array(a);
  f.HEAPU32 = A = new Uint32Array(a);
  f.HEAPF32 = new Float32Array(a);
  f.HEAPF64 = new Float64Array(a);
  f.HEAP64 = Aa = new BigInt64Array(a);
  f.HEAPU64 = new BigUint64Array(a);
}
n(!f.STACK_SIZE, "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
n("undefined" != typeof Int32Array && "undefined" !== typeof Float64Array && void 0 != Int32Array.prototype.subarray && void 0 != Int32Array.prototype.set, "JS engine does not provide full typed array support");
n(!f.wasmMemory, "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");
n(!f.INITIAL_MEMORY, "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");
function Ca() {
  if (!wa) {
    var a = Da();
    0 == a && (a += 4);
    var b = A[a >> 2], c = A[a + 4 >> 2];
    34821223 == b && 2310721022 == c || h(`Stack overflow! Stack cookie has been overwritten at ${Ea(a)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${Ea(c)} ${Ea(b)}`);
    1668509029 != A[0] && h("Runtime error: The application has corrupted its heap memory area (address zero)!");
  }
}
var Fa = new Int16Array(1), Ga = new Int8Array(Fa.buffer);
Fa[0] = 25459;
if (115 !== Ga[0] || 99 !== Ga[1]) {
  throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
}
var Ha = [], Ia = [], Ja = [], Ka = [], La = !1;
n(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
n(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
n(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
n(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
var Ma = 0, Na = null, Oa = null, Pa = {};
function Qa(a) {
  for (var b = a;;) {
    if (!Pa[a]) {
      return a;
    }
    a = b + Math.random();
  }
}
function Ra(a) {
  Ma++;
  a ? (n(!Pa[a]), Pa[a] = 1, null === Na && "undefined" != typeof setInterval && (Na = setInterval(() => {
    if (wa) {
      clearInterval(Na), Na = null;
    } else {
      var b = !1, c;
      for (c in Pa) {
        b || (b = !0, p("still waiting on run dependencies:")), p(`dependency: ${c}`);
      }
      b && p("(end of list)");
    }
  }, 10000))) : p("warning: run dependency added without ID");
}
function Sa(a) {
  Ma--;
  a ? (n(Pa[a]), delete Pa[a]) : p("warning: run dependency removed without ID");
  0 == Ma && (null !== Na && (clearInterval(Na), Na = null), Oa && (a = Oa, Oa = null, a()));
}
function h(a) {
  a = "Aborted(" + a + ")";
  p(a);
  wa = !0;
  xa = 1;
  a = new WebAssembly.RuntimeError(a);
  ba(a);
  throw a;
}
var Ta = a => a.startsWith("data:application/octet-stream;base64,"), sa = a => a.startsWith("file://");
function C(a, b) {
  return (...c) => {
    n(La, `native function \`${a}\` called before runtime initialization`);
    var d = D[a];
    n(d, `exported native function \`${a}\` not found`);
    n(c.length <= b, `native function \`${a}\` called with ${c.length} args but expects ${b}`);
    return d(...c);
  };
}
class E extends Error {
}
class Ua extends E {
}
class Va extends E {
  constructor(a) {
    super(a);
    this.F = a;
    a = Wa(a);
    this.name = a[0];
    this.message = a[1];
  }
}
var Xa;
function Ya(a) {
  if (oa) {
    return oa(a);
  }
  throw "both async and sync fetching of the wasm failed";
}
function Za(a) {
  if (da || ea) {
    if ("function" == typeof fetch && !sa(a)) {
      return fetch(a, {credentials:"same-origin"}).then(b => {
        if (!b.ok) {
          throw `failed to load wasm binary file at '${a}'`;
        }
        return b.arrayBuffer();
      }).catch(() => Ya(a));
    }
    if (na) {
      return new Promise((b, c) => {
        na(a, d => b(new Uint8Array(d)), c);
      });
    }
  }
  return Promise.resolve().then(() => Ya(a));
}
function $a(a, b, c) {
  return Za(a).then(d => WebAssembly.instantiate(d, b)).then(c, d => {
    p(`failed to asynchronously prepare wasm: ${d}`);
    sa(Xa) && p(`warning: Loading from a file URI (${Xa}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    h(d);
  });
}
function ab(a, b) {
  var c = Xa;
  return "function" != typeof WebAssembly.instantiateStreaming || Ta(c) || sa(c) || fa || "function" != typeof fetch ? $a(c, a, b) : fetch(c, {credentials:"same-origin"}).then(d => WebAssembly.instantiateStreaming(d, a).then(b, function(e) {
    p(`wasm streaming compile failed: ${e}`);
    p("falling back to ArrayBuffer instantiation");
    return $a(c, a, b);
  }));
}
function ua(a, b) {
  Object.getOwnPropertyDescriptor(f, a) || Object.defineProperty(f, a, {configurable:!0, get() {
    h(`\`Module.${a}\` has been replaced by \`${b}\`` + " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }});
}
function q(a) {
  Object.getOwnPropertyDescriptor(f, a) && h(`\`Module.${a}\` was supplied but \`${a}\` not included in INCOMING_MODULE_JS_API`);
}
function bb(a) {
  return "FS_createPath" === a || "FS_createDataFile" === a || "FS_createPreloadedFile" === a || "FS_unlink" === a || "addRunDependency" === a || "FS_createLazyFile" === a || "FS_createDevice" === a || "removeRunDependency" === a;
}
function cb(a, b) {
  "undefined" != typeof globalThis && Object.defineProperty(globalThis, a, {configurable:!0, get() {
    db(`\`${a}\` is not longer defined by emscripten. ${b}`);
  }});
}
cb("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");
cb("asm", "Please use wasmExports instead");
function eb(a) {
  Object.getOwnPropertyDescriptor(f, a) || Object.defineProperty(f, a, {configurable:!0, get() {
    var b = `'${a}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
    bb(a) && (b += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you");
    h(b);
  }});
}
function fb(a) {
  this.name = "ExitStatus";
  this.message = `Program terminated with exit(${a})`;
  this.status = a;
}
var gb = a => {
  for (; 0 < a.length;) {
    a.shift()(f);
  }
}, Ea = a => {
  n("number" === typeof a);
  return "0x" + (a >>> 0).toString(16).padStart(8, "0");
}, db = a => {
  db.pa || (db.pa = {});
  db.pa[a] || (db.pa[a] = 1, fa && (a = "warning: " + a), p(a));
}, hb = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, ib = (a, b) => {
  for (var c = b + NaN, d = b; a[d] && !(d >= c);) {
    ++d;
  }
  if (16 < d - b && a.buffer && hb) {
    return hb.decode(a.subarray(b, d));
  }
  for (c = ""; b < d;) {
    var e = a[b++];
    if (e & 128) {
      var g = a[b++] & 63;
      if (192 == (e & 224)) {
        c += String.fromCharCode((e & 31) << 6 | g);
      } else {
        var k = a[b++] & 63;
        224 == (e & 240) ? e = (e & 15) << 12 | g << 6 | k : (240 != (e & 248) && db("Invalid UTF-8 leading byte " + Ea(e) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!"), e = (e & 7) << 18 | g << 12 | k << 6 | a[b++] & 63);
        65536 > e ? c += String.fromCharCode(e) : (e -= 65536, c += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023));
      }
    } else {
      c += String.fromCharCode(e);
    }
  }
  return c;
}, F = a => {
  n("number" == typeof a, `UTF8ToString expects a number (got ${typeof a})`);
  return a ? ib(ya, a) : "";
}, jb = [], kb = 0, lb = 0;
class mb {
  constructor(a) {
    this.F = a;
    this.v = a - 24;
  }
  L(a, b) {
    A[this.v + 16 >> 2] = 0;
    A[this.v + 4 >> 2] = a;
    A[this.v + 8 >> 2] = b;
  }
}
var qb = a => {
  var b = lb?.F;
  if (!b) {
    return nb(0), 0;
  }
  var c = new mb(b);
  A[c.v + 16 >> 2] = b;
  var d = A[c.v + 4 >> 2];
  if (!d) {
    return nb(0), b;
  }
  for (var e in a) {
    var g = a[e];
    if (0 === g || g === d) {
      break;
    }
    if (ob(g, d, c.v + 16)) {
      return nb(g), b;
    }
  }
  nb(d);
  return b;
}, rb = (a, b) => {
  for (var c = 0, d = a.length - 1; 0 <= d; d--) {
    var e = a[d];
    "." === e ? a.splice(d, 1) : ".." === e ? (a.splice(d, 1), c++) : c && (a.splice(d, 1), c--);
  }
  if (b) {
    for (; c; c--) {
      a.unshift("..");
    }
  }
  return a;
}, G = a => {
  var b = "/" === a.charAt(0), c = "/" === a.substr(-1);
  (a = rb(a.split("/").filter(d => !!d), !b).join("/")) || b || (a = ".");
  a && c && (a += "/");
  return (b ? "/" : "") + a;
}, sb = a => {
  var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
  a = b[0];
  b = b[1];
  if (!a && !b) {
    return ".";
  }
  b &&= b.substr(0, b.length - 1);
  return a + b;
}, tb = a => {
  if ("/" === a) {
    return "/";
  }
  a = G(a);
  a = a.replace(/\/$/, "");
  var b = a.lastIndexOf("/");
  return -1 === b ? a : a.substr(b + 1);
}, ub = (...a) => G(a.join("/")), vb = (a, b) => G(a + "/" + b), wb = () => {
  if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues) {
    return c => crypto.getRandomValues(c);
  }
  if (fa) {
    try {
      var a = require("crypto");
      if (a.randomFillSync) {
        return c => a.randomFillSync(c);
      }
      var b = a.randomBytes;
      return c => (c.set(b(c.byteLength)), c);
    } catch (c) {
    }
  }
  h("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: (array) => { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };");
}, xb = a => (xb = wb())(a), yb = (...a) => {
  for (var b = "", c = !1, d = a.length - 1; -1 <= d && !c; d--) {
    c = 0 <= d ? a[d] : H.cwd();
    if ("string" != typeof c) {
      throw new TypeError("Arguments to path.resolve must be strings");
    }
    if (!c) {
      return "";
    }
    b = c + "/" + b;
    c = "/" === c.charAt(0);
  }
  b = rb(b.split("/").filter(e => !!e), !c).join("/");
  return (c ? "/" : "") + b || ".";
}, zb = (a, b) => {
  function c(k) {
    for (var m = 0; m < k.length && "" === k[m]; m++) {
    }
    for (var r = k.length - 1; 0 <= r && "" === k[r]; r--) {
    }
    return m > r ? [] : k.slice(m, r - m + 1);
  }
  a = yb(a).substr(1);
  b = yb(b).substr(1);
  a = c(a.split("/"));
  b = c(b.split("/"));
  for (var d = Math.min(a.length, b.length), e = d, g = 0; g < d; g++) {
    if (a[g] !== b[g]) {
      e = g;
      break;
    }
  }
  d = [];
  for (g = e; g < a.length; g++) {
    d.push("..");
  }
  d = d.concat(b.slice(e));
  return d.join("/");
}, Ab = [], Bb = a => {
  for (var b = 0, c = 0; c < a.length; ++c) {
    var d = a.charCodeAt(c);
    127 >= d ? b++ : 2047 >= d ? b += 2 : 55296 <= d && 57343 >= d ? (b += 4, ++c) : b += 3;
  }
  return b;
}, Cb = (a, b, c, d) => {
  n("string" === typeof a, `stringToUTF8Array expects a string (got ${typeof a})`);
  if (!(0 < d)) {
    return 0;
  }
  var e = c;
  d = c + d - 1;
  for (var g = 0; g < a.length; ++g) {
    var k = a.charCodeAt(g);
    if (55296 <= k && 57343 >= k) {
      var m = a.charCodeAt(++g);
      k = 65536 + ((k & 1023) << 10) | m & 1023;
    }
    if (127 >= k) {
      if (c >= d) {
        break;
      }
      b[c++] = k;
    } else {
      if (2047 >= k) {
        if (c + 1 >= d) {
          break;
        }
        b[c++] = 192 | k >> 6;
      } else {
        if (65535 >= k) {
          if (c + 2 >= d) {
            break;
          }
          b[c++] = 224 | k >> 12;
        } else {
          if (c + 3 >= d) {
            break;
          }
          1114111 < k && db("Invalid Unicode code point " + Ea(k) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
          b[c++] = 240 | k >> 18;
          b[c++] = 128 | k >> 12 & 63;
        }
        b[c++] = 128 | k >> 6 & 63;
      }
      b[c++] = 128 | k & 63;
    }
  }
  b[c] = 0;
  return c - e;
};
function Db(a) {
  var b = Array(Bb(a) + 1);
  a = Cb(a, b, 0, b.length);
  b.length = a;
  return b;
}
var Eb = [];
function Fb(a, b) {
  Eb[a] = {input:[], output:[], I:b};
  Gb(a, Hb);
}
var Hb = {open(a) {
  var b = Eb[a.node.rdev];
  if (!b) {
    throw new H.g(43);
  }
  a.tty = b;
  a.seekable = !1;
}, close(a) {
  a.tty.I.fsync(a.tty);
}, fsync(a) {
  a.tty.I.fsync(a.tty);
}, read(a, b, c, d) {
  if (!a.tty || !a.tty.I.wa) {
    throw new H.g(60);
  }
  for (var e = 0, g = 0; g < d; g++) {
    try {
      var k = a.tty.I.wa(a.tty);
    } catch (m) {
      throw new H.g(29);
    }
    if (void 0 === k && 0 === e) {
      throw new H.g(6);
    }
    if (null === k || void 0 === k) {
      break;
    }
    e++;
    b[c + g] = k;
  }
  e && (a.node.timestamp = Date.now());
  return e;
}, write(a, b, c, d) {
  if (!a.tty || !a.tty.I.la) {
    throw new H.g(60);
  }
  try {
    for (var e = 0; e < d; e++) {
      a.tty.I.la(a.tty, b[c + e]);
    }
  } catch (g) {
    throw new H.g(29);
  }
  d && (a.node.timestamp = Date.now());
  return e;
},}, Ib = {wa() {
  a: {
    if (!Ab.length) {
      var a = null;
      if (fa) {
        var b = Buffer.alloc(256), c = 0, d = process.stdin.fd;
        try {
          c = fs.readSync(d, b, 0, 256);
        } catch (e) {
          if (e.toString().includes("EOF")) {
            c = 0;
          } else {
            throw e;
          }
        }
        0 < c && (a = b.slice(0, c).toString("utf-8"));
      } else {
        "undefined" != typeof window && "function" == typeof window.prompt && (a = window.prompt("Input: "), null !== a && (a += "\n"));
      }
      if (!a) {
        a = null;
        break a;
      }
      Ab = Db(a);
    }
    a = Ab.shift();
  }
  return a;
}, la(a, b) {
  null === b || 10 === b ? (ta(ib(a.output, 0)), a.output = []) : 0 != b && a.output.push(b);
}, fsync(a) {
  a.output && 0 < a.output.length && (ta(ib(a.output, 0)), a.output = []);
}, Na() {
  return {ab:25856, cb:5, $a:191, bb:35387, Za:[3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]};
}, Oa() {
  return 0;
}, Pa() {
  return [24, 80];
},}, Jb = {la(a, b) {
  null === b || 10 === b ? (p(ib(a.output, 0)), a.output = []) : 0 != b && a.output.push(b);
}, fsync(a) {
  a.output && 0 < a.output.length && (p(ib(a.output, 0)), a.output = []);
},}, Kb = () => {
  h("internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported");
};
function Lb(a, b) {
  var c = a.j ? a.j.length : 0;
  c >= b || (b = Math.max(b, c * (1048576 > c ? 2.0 : 1.125) >>> 0), 0 != c && (b = Math.max(b, 256)), c = a.j, a.j = new Uint8Array(b), 0 < a.o && a.j.set(c.subarray(0, a.o), 0));
}
var J = {H:null, m() {
  return J.createNode(null, "/", 16895, 0);
}, createNode(a, b, c, d) {
  if (24576 === (c & 61440) || H.isFIFO(c)) {
    throw new H.g(63);
  }
  J.H || (J.H = {dir:{node:{A:J.h.A, s:J.h.s, lookup:J.h.lookup, B:J.h.B, rename:J.h.rename, unlink:J.h.unlink, rmdir:J.h.rmdir, readdir:J.h.readdir, symlink:J.h.symlink}, stream:{u:J.i.u}}, file:{node:{A:J.h.A, s:J.h.s}, stream:{u:J.i.u, read:J.i.read, write:J.i.write, U:J.i.U, O:J.i.O, S:J.i.S}}, link:{node:{A:J.h.A, s:J.h.s, readlink:J.h.readlink}, stream:{}}, sa:{node:{A:J.h.A, s:J.h.s}, stream:H.Ha}});
  c = H.createNode(a, b, c, d);
  K(c.mode) ? (c.h = J.H.dir.node, c.i = J.H.dir.stream, c.j = {}) : H.isFile(c.mode) ? (c.h = J.H.file.node, c.i = J.H.file.stream, c.o = 0, c.j = null) : 40960 === (c.mode & 61440) ? (c.h = J.H.link.node, c.i = J.H.link.stream) : 8192 === (c.mode & 61440) && (c.h = J.H.sa.node, c.i = J.H.sa.stream);
  c.timestamp = Date.now();
  a && (a.j[b] = c, a.timestamp = c.timestamp);
  return c;
}, kb(a) {
  return a.j ? a.j.subarray ? a.j.subarray(0, a.o) : new Uint8Array(a.j) : new Uint8Array(0);
}, h:{A(a) {
  var b = {};
  b.dev = 8192 === (a.mode & 61440) ? a.id : 1;
  b.ino = a.id;
  b.mode = a.mode;
  b.nlink = 1;
  b.uid = 0;
  b.gid = 0;
  b.rdev = a.rdev;
  K(a.mode) ? b.size = 4096 : H.isFile(a.mode) ? b.size = a.o : 40960 === (a.mode & 61440) ? b.size = a.link.length : b.size = 0;
  b.atime = new Date(a.timestamp);
  b.mtime = new Date(a.timestamp);
  b.ctime = new Date(a.timestamp);
  b.J = 4096;
  b.blocks = Math.ceil(b.size / b.J);
  return b;
}, s(a, b) {
  void 0 !== b.mode && (a.mode = b.mode);
  void 0 !== b.timestamp && (a.timestamp = b.timestamp);
  if (void 0 !== b.size && (b = b.size, a.o != b)) {
    if (0 == b) {
      a.j = null, a.o = 0;
    } else {
      var c = a.j;
      a.j = new Uint8Array(b);
      c && a.j.set(c.subarray(0, Math.min(b, a.o)));
      a.o = b;
    }
  }
}, lookup() {
  throw H.ea[44];
}, B(a, b, c, d) {
  return J.createNode(a, b, c, d);
}, rename(a, b, c) {
  if (K(a.mode)) {
    try {
      var d = L(b, c);
    } catch (g) {
    }
    if (d) {
      for (var e in d.j) {
        throw new H.g(55);
      }
    }
  }
  delete a.parent.j[a.name];
  a.parent.timestamp = Date.now();
  a.name = c;
  b.j[c] = a;
  b.timestamp = a.parent.timestamp;
  a.parent = b;
}, unlink(a, b) {
  delete a.j[b];
  a.timestamp = Date.now();
}, rmdir(a, b) {
  var c = L(a, b), d;
  for (d in c.j) {
    throw new H.g(55);
  }
  delete a.j[b];
  a.timestamp = Date.now();
}, readdir(a) {
  var b = [".", ".."], c;
  for (c of Object.keys(a.j)) {
    b.push(c);
  }
  return b;
}, symlink(a, b, c) {
  a = J.createNode(a, b, 41471, 0);
  a.link = c;
  return a;
}, readlink(a) {
  if (40960 !== (a.mode & 61440)) {
    throw new H.g(28);
  }
  return a.link;
},}, i:{read(a, b, c, d, e) {
  var g = a.node.j;
  if (e >= a.node.o) {
    return 0;
  }
  a = Math.min(a.node.o - e, d);
  n(0 <= a);
  if (8 < a && g.subarray) {
    b.set(g.subarray(e, e + a), c);
  } else {
    for (d = 0; d < a; d++) {
      b[c + d] = g[e + d];
    }
  }
  return a;
}, write(a, b, c, d, e, g) {
  n(!(b instanceof ArrayBuffer));
  b.buffer === v.buffer && (g = !1);
  if (!d) {
    return 0;
  }
  a = a.node;
  a.timestamp = Date.now();
  if (b.subarray && (!a.j || a.j.subarray)) {
    if (g) {
      return n(0 === e, "canOwn must imply no weird position inside the file"), a.j = b.subarray(c, c + d), a.o = d;
    }
    if (0 === a.o && 0 === e) {
      return a.j = b.slice(c, c + d), a.o = d;
    }
    if (e + d <= a.o) {
      return a.j.set(b.subarray(c, c + d), e), d;
    }
  }
  Lb(a, e + d);
  if (a.j.subarray && b.subarray) {
    a.j.set(b.subarray(c, c + d), e);
  } else {
    for (g = 0; g < d; g++) {
      a.j[e + g] = b[c + g];
    }
  }
  a.o = Math.max(a.o, e + d);
  return d;
}, u(a, b, c) {
  1 === c ? b += a.position : 2 === c && H.isFile(a.node.mode) && (b += a.node.o);
  if (0 > b) {
    throw new H.g(28);
  }
  return b;
}, U(a, b, c) {
  Lb(a.node, b + c);
  a.node.o = Math.max(a.node.o, b + c);
}, O(a, b, c, d, e) {
  if (!H.isFile(a.node.mode)) {
    throw new H.g(43);
  }
  a = a.node.j;
  if (e & 2 || a.buffer !== v.buffer) {
    if (0 < c || c + b < a.length) {
      a.subarray ? a = a.subarray(c, c + b) : a = Array.prototype.slice.call(a, c, c + b);
    }
    c = !0;
    b = Kb();
    if (!b) {
      throw new H.g(48);
    }
    v.set(a, b);
  } else {
    c = !1, b = a.byteOffset;
  }
  return {v:b, ra:c};
}, S(a, b, c, d) {
  J.i.write(a, b, 0, d, c, !1);
  return 0;
},},}, Mb = (a, b, c) => {
  var d = Qa(`al ${a}`);
  na(a, e => {
    n(e, `Loading data file "${a}" failed (no arrayBuffer).`);
    b(new Uint8Array(e));
    d && Sa(d);
  }, () => {
    if (c) {
      c();
    } else {
      throw `Loading data file "${a}" failed.`;
    }
  });
  d && Ra(d);
}, Nb = [], Ob = (a, b, c, d) => {
  "undefined" != typeof Browser && Browser.L();
  var e = !1;
  Nb.forEach(g => {
    !e && g.canHandle(b) && (g.handle(a, b, c, d), e = !0);
  });
  return e;
}, Pb = (a, b) => {
  var c = 0;
  a && (c |= 365);
  b && (c |= 146);
  return c;
}, Qb = {EPERM:63, ENOENT:44, ESRCH:71, EINTR:27, EIO:29, ENXIO:60, E2BIG:1, ENOEXEC:45, EBADF:8, ECHILD:12, EAGAIN:6, EWOULDBLOCK:6, ENOMEM:48, EACCES:2, EFAULT:21, ENOTBLK:105, EBUSY:10, EEXIST:20, EXDEV:75, ENODEV:43, ENOTDIR:54, EISDIR:31, EINVAL:28, ENFILE:41, EMFILE:33, ENOTTY:59, ETXTBSY:74, EFBIG:22, ENOSPC:51, ESPIPE:70, EROFS:69, EMLINK:34, EPIPE:64, EDOM:18, ERANGE:68, ENOMSG:49, EIDRM:24, ECHRNG:106, EL2NSYNC:156, EL3HLT:107, EL3RST:108, ELNRNG:109, EUNATCH:110, ENOCSI:111, EL2HLT:112,
EDEADLK:16, ENOLCK:46, EBADE:113, EBADR:114, EXFULL:115, ENOANO:104, EBADRQC:103, EBADSLT:102, EDEADLOCK:16, EBFONT:101, ENOSTR:100, ENODATA:116, ETIME:117, ENOSR:118, ENONET:119, ENOPKG:120, EREMOTE:121, ENOLINK:47, EADV:122, ESRMNT:123, ECOMM:124, EPROTO:65, EMULTIHOP:36, EDOTDOT:125, EBADMSG:9, ENOTUNIQ:126, EBADFD:127, EREMCHG:128, ELIBACC:129, ELIBBAD:130, ELIBSCN:131, ELIBMAX:132, ELIBEXEC:133, ENOSYS:52, ENOTEMPTY:55, ENAMETOOLONG:37, ELOOP:32, EOPNOTSUPP:138, EPFNOSUPPORT:139, ECONNRESET:15,
ENOBUFS:42, EAFNOSUPPORT:5, EPROTOTYPE:67, ENOTSOCK:57, ENOPROTOOPT:50, ESHUTDOWN:140, ECONNREFUSED:14, EADDRINUSE:3, ECONNABORTED:13, ENETUNREACH:40, ENETDOWN:38, ETIMEDOUT:73, EHOSTDOWN:142, EHOSTUNREACH:23, EINPROGRESS:26, EALREADY:7, EDESTADDRREQ:17, EMSGSIZE:35, EPROTONOSUPPORT:66, ESOCKTNOSUPPORT:137, EADDRNOTAVAIL:4, ENETRESET:39, EISCONN:30, ENOTCONN:53, ETOOMANYREFS:141, EUSERS:136, EDQUOT:19, ESTALE:72, ENOTSUP:138, ENOMEDIUM:148, EILSEQ:25, EOVERFLOW:61, ECANCELED:11, ENOTRECOVERABLE:56,
EOWNERDEAD:62, ESTRPIPE:135,};
function N(a) {
  try {
    return a();
  } catch (c) {
    if (!c.code) {
      throw c;
    }
    if ("UNKNOWN" === c.code) {
      throw new H.g(28);
    }
    a = H.g;
    var b = c.code;
    n(b in Qb, `unexpected node error code: ${b} (${c})`);
    throw new a(Qb[b]);
  }
}
function Rb(a) {
  var b;
  return N(() => {
    b = fs.lstatSync(a);
    O.ja && (b.mode |= (b.mode & 292) >> 2);
    return b.mode;
  });
}
function P(a) {
  for (var b = []; a.parent !== a;) {
    b.push(a.name), a = a.parent;
  }
  b.push(a.m.X.root);
  b.reverse();
  return ub(...b);
}
var O = {ja:!1, qa() {
  O.ja = !!process.platform.match(/^win/);
  var a = process.binding("constants");
  a.fs && (a = a.fs);
  O.ba = {1024:a.O_APPEND, 64:a.O_CREAT, 128:a.O_EXCL, 256:a.O_NOCTTY, 0:a.O_RDONLY, 2:a.O_RDWR, 4096:a.O_SYNC, 512:a.O_TRUNC, 1:a.O_WRONLY, 131072:a.O_NOFOLLOW,};
  n(0 === O.ba["0"]);
}, m(a) {
  n(fa);
  return O.createNode(null, "/", Rb(a.X.root), 0);
}, createNode(a, b, c) {
  if (!K(c) && !H.isFile(c) && 40960 !== (c & 61440)) {
    throw new H.g(28);
  }
  a = H.createNode(a, b, c);
  a.h = O.h;
  a.i = O.i;
  return a;
}, h:{A(a) {
  var b = P(a), c;
  N(() => c = fs.lstatSync(b));
  O.ja && (c.J || (c.J = 4096), c.blocks || (c.blocks = (c.size + c.J - 1) / c.J | 0), c.mode |= (c.mode & 292) >> 2);
  return {dev:c.dev, ino:c.ino, mode:c.mode, nlink:c.nlink, uid:c.uid, gid:c.gid, rdev:c.rdev, size:c.size, atime:c.atime, mtime:c.mtime, ctime:c.ctime, J:c.J, blocks:c.blocks};
}, s(a, b) {
  var c = P(a);
  N(() => {
    void 0 !== b.mode && (fs.chmodSync(c, b.mode), a.mode = b.mode);
    void 0 !== b.size && fs.truncateSync(c, b.size);
  });
}, lookup(a, b) {
  var c = P(a);
  c = G(c + "/" + b);
  c = Rb(c);
  return O.createNode(a, b, c);
}, B(a, b, c, d) {
  var e = O.createNode(a, b, c, d), g = P(e);
  N(() => {
    K(e.mode) ? fs.mkdirSync(g, e.mode) : fs.writeFileSync(g, "", {mode:e.mode});
  });
  return e;
}, rename(a, b, c) {
  var d = P(a), e = vb(P(b), c);
  N(() => fs.renameSync(d, e));
  a.name = c;
}, unlink(a, b) {
  var c = vb(P(a), b);
  N(() => fs.unlinkSync(c));
}, rmdir(a, b) {
  var c = vb(P(a), b);
  N(() => fs.rmdirSync(c));
}, readdir(a) {
  var b = P(a);
  return N(() => fs.readdirSync(b));
}, symlink(a, b, c) {
  var d = vb(P(a), b);
  N(() => fs.symlinkSync(c, d));
}, readlink(a) {
  var b = P(a);
  return N(() => fs.readlinkSync(b));
},}, i:{open(a) {
  var b = P(a.node);
  N(() => {
    if (H.isFile(a.node.mode)) {
      a.R.Ba = 1;
      var c = fs, d = c.openSync, e = a.flags;
      e &= -2721793;
      var g = 0, k;
      for (k in O.ba) {
        e & k && (g |= O.ba[k], e ^= k);
      }
      if (e) {
        throw new H.g(28);
      }
      a.W = d.call(c, b, g);
    }
  });
}, close(a) {
  N(() => {
    H.isFile(a.node.mode) && a.W && 0 === --a.R.Ba && fs.closeSync(a.W);
  });
}, Ja(a) {
  a.R.Ba++;
}, read(a, b, c, d, e) {
  return 0 === d ? 0 : N(() => fs.readSync(a.W, new Int8Array(b.buffer, c, d), 0, d, e));
}, write(a, b, c, d, e) {
  return N(() => fs.writeSync(a.W, new Int8Array(b.buffer, c, d), 0, d, e));
}, u(a, b, c) {
  var d = b;
  1 === c ? d += a.position : 2 === c && H.isFile(a.node.mode) && N(() => {
    d += fs.fstatSync(a.W).size;
  });
  if (0 > d) {
    throw new H.g(28);
  }
  return d;
}, O(a, b, c) {
  if (!H.isFile(a.node.mode)) {
    throw new H.g(43);
  }
  var d = Kb();
  O.i.read(a, v, d, b, c);
  return {v:d, ra:!0};
}, S(a, b, c, d) {
  O.i.write(a, b, 0, d, c, !1);
  return 0;
},},}, Q = {aa:16895, T:33279, na:null, m(a) {
  function b(g) {
    g = g.split("/");
    for (var k = d, m = 0; m < g.length - 1; m++) {
      var r = g.slice(0, m + 1).join("/");
      let t, y;
      (t = e)[y = r] || (t[y] = Q.createNode(k, g[m], Q.aa, 0));
      k = e[r];
    }
    return k;
  }
  function c(g) {
    g = g.split("/");
    return g[g.length - 1];
  }
  n(ea);
  Q.na || (Q.na = new FileReaderSync());
  var d = Q.createNode(null, "/", Q.aa, 0), e = {};
  Array.prototype.forEach.call(a.X.files || [], function(g) {
    Q.createNode(b(g.name), c(g.name), Q.T, 0, g, g.lastModifiedDate);
  });
  (a.X.blobs || []).forEach(function(g) {
    Q.createNode(b(g.name), c(g.name), Q.T, 0, g.data);
  });
  (a.X.packages || []).forEach(function(g) {
    g.metadata.files.forEach(function(k) {
      var m = k.filename.substr(1);
      Q.createNode(b(m), c(m), Q.T, 0, g.blob.slice(k.start, k.end));
    });
  });
  return d;
}, createNode(a, b, c, d, e, g) {
  d = H.createNode(a, b, c);
  d.mode = c;
  d.h = Q.h;
  d.i = Q.i;
  d.timestamp = (g || new Date()).getTime();
  n(Q.T !== Q.aa);
  c === Q.T ? (d.size = e.size, d.j = e) : (d.size = 4096, d.j = {});
  a && (a.j[b] = d);
  return d;
}, h:{A(a) {
  return {dev:1, ino:a.id, mode:a.mode, nlink:1, uid:0, gid:0, rdev:0, size:a.size, atime:new Date(a.timestamp), mtime:new Date(a.timestamp), ctime:new Date(a.timestamp), J:4096, blocks:Math.ceil(a.size / 4096),};
}, s(a, b) {
  void 0 !== b.mode && (a.mode = b.mode);
  void 0 !== b.timestamp && (a.timestamp = b.timestamp);
}, lookup() {
  throw new H.g(44);
}, B() {
  throw new H.g(63);
}, rename() {
  throw new H.g(63);
}, unlink() {
  throw new H.g(63);
}, rmdir() {
  throw new H.g(63);
}, readdir(a) {
  var b = [".", ".."], c;
  for (c of Object.keys(a.j)) {
    b.push(c);
  }
  return b;
}, symlink() {
  throw new H.g(63);
},}, i:{read(a, b, c, d, e) {
  if (e >= a.node.size) {
    return 0;
  }
  a = a.node.j.slice(e, e + d);
  d = Q.na.readAsArrayBuffer(a);
  b.set(new Uint8Array(d), c);
  return a.size;
}, write() {
  throw new H.g(29);
}, u(a, b, c) {
  1 === c ? b += a.position : 2 === c && H.isFile(a.node.mode) && (b += a.node.size);
  if (0 > b) {
    throw new H.g(28);
  }
  return b;
},},}, Sb = {0:"Success", 1:"Arg list too long", 2:"Permission denied", 3:"Address already in use", 4:"Address not available", 5:"Address family not supported by protocol family", 6:"No more processes", 7:"Socket already connected", 8:"Bad file number", 9:"Trying to read unreadable message", 10:"Mount device busy", 11:"Operation canceled", 12:"No children", 13:"Connection aborted", 14:"Connection refused", 15:"Connection reset by peer", 16:"File locking deadlock error", 17:"Destination address required",
18:"Math arg out of domain of func", 19:"Quota exceeded", 20:"File exists", 21:"Bad address", 22:"File too large", 23:"Host is unreachable", 24:"Identifier removed", 25:"Illegal byte sequence", 26:"Connection already in progress", 27:"Interrupted system call", 28:"Invalid argument", 29:"I/O error", 30:"Socket is already connected", 31:"Is a directory", 32:"Too many symbolic links", 33:"Too many open files", 34:"Too many links", 35:"Message too long", 36:"Multihop attempted", 37:"File or path name too long",
38:"Network interface is not configured", 39:"Connection reset by network", 40:"Network is unreachable", 41:"Too many open files in system", 42:"No buffer space available", 43:"No such device", 44:"No such file or directory", 45:"Exec format error", 46:"No record locks available", 47:"The link has been severed", 48:"Not enough core", 49:"No message of desired type", 50:"Protocol not available", 51:"No space left on device", 52:"Function not implemented", 53:"Socket is not connected", 54:"Not a directory",
55:"Directory not empty", 56:"State not recoverable", 57:"Socket operation on non-socket", 59:"Not a typewriter", 60:"No such device or address", 61:"Value too large for defined data type", 62:"Previous owner died", 63:"Not super-user", 64:"Broken pipe", 65:"Protocol error", 66:"Unknown protocol", 67:"Protocol wrong type for socket", 68:"Math result not representable", 69:"Read only file system", 70:"Illegal seek", 71:"No such process", 72:"Stale file handle", 73:"Connection timed out", 74:"Text file busy",
75:"Cross-device link", 100:"Device not a stream", 101:"Bad font file fmt", 102:"Invalid slot", 103:"Invalid request code", 104:"No anode", 105:"Block device required", 106:"Channel number out of range", 107:"Level 3 halted", 108:"Level 3 reset", 109:"Link number out of range", 110:"Protocol driver not attached", 111:"No CSI structure available", 112:"Level 2 halted", 113:"Invalid exchange", 114:"Invalid request descriptor", 115:"Exchange full", 116:"No data (for no delay io)", 117:"Timer expired",
118:"Out of streams resources", 119:"Machine is not on the network", 120:"Package not installed", 121:"The object is remote", 122:"Advertise error", 123:"Srmount error", 124:"Communication error on send", 125:"Cross mount point (not really error)", 126:"Given log. name not unique", 127:"f.d. invalid for this operation", 128:"Remote address changed", 129:"Can   access a needed shared lib", 130:"Accessing a corrupted shared lib", 131:".lib section in a.out corrupted", 132:"Attempting to link in too many libs",
133:"Attempting to exec a shared library", 135:"Streams pipe error", 136:"Too many users", 137:"Socket type not supported", 138:"Not supported", 139:"Protocol family not supported", 140:"Can't send after socket shutdown", 141:"Too many references", 142:"Host is down", 148:"No medium (in tape drive)", 156:"Level 2 not synchronized",};
function Gb(a, b) {
  H.ua[a] = {i:b};
}
function K(a) {
  return 16384 === (a & 61440);
}
function L(a, b) {
  var c = K(a.mode) ? (c = Tb(a, "x")) ? c : a.h.lookup ? 0 : 2 : 54;
  if (c) {
    throw new H.g(c);
  }
  for (c = H.G[Ub(a.id, b)]; c; c = c.P) {
    var d = c.name;
    if (c.parent.id === a.id && d === b) {
      return c;
    }
  }
  return H.lookup(a, b);
}
function T(a, b = {}) {
  a = yb(a);
  if (!a) {
    return {path:"", node:null};
  }
  b = Object.assign({da:!0, oa:0}, b);
  if (8 < b.oa) {
    throw new H.g(32);
  }
  a = a.split("/").filter(k => !!k);
  for (var c = H.root, d = "/", e = 0; e < a.length; e++) {
    var g = e === a.length - 1;
    if (g && b.parent) {
      break;
    }
    c = L(c, a[e]);
    d = G(d + "/" + a[e]);
    c.C && (!g || g && b.da) && (c = c.C.root);
    if (!g || b.D) {
      for (g = 0; 40960 === (c.mode & 61440);) {
        if (c = H.readlink(d), d = yb(sb(d), c), c = T(d, {oa:b.oa + 1}).node, 40 < g++) {
          throw new H.g(32);
        }
      }
    }
  }
  return {path:d, node:c};
}
function Vb(a) {
  for (var b;;) {
    if (H.$(a)) {
      return a = a.m.Aa, b ? "/" !== a[a.length - 1] ? `${a}/${b}` : a + b : a;
    }
    b = b ? `${a.name}/${b}` : a.name;
    a = a.parent;
  }
}
function Ub(a, b) {
  for (var c = 0, d = 0; d < b.length; d++) {
    c = (c << 5) - c + b.charCodeAt(d) | 0;
  }
  return (a + c >>> 0) % H.G.length;
}
function Wb(a) {
  var b = Ub(a.parent.id, a.name);
  a.P = H.G[b];
  H.G[b] = a;
}
function Xb(a) {
  var b = Ub(a.parent.id, a.name);
  if (H.G[b] === a) {
    H.G[b] = a.P;
  } else {
    for (b = H.G[b]; b;) {
      if (b.P === a) {
        b.P = a.P;
        break;
      }
      b = b.P;
    }
  }
}
function Yb(a) {
  var b = ["r", "w", "rw"][a & 3];
  a & 512 && (b += "w");
  return b;
}
function Tb(a, b) {
  if (H.ha) {
    return 0;
  }
  if (!b.includes("r") || a.mode & 292) {
    if (b.includes("w") && !(a.mode & 146) || b.includes("x") && !(a.mode & 73)) {
      return 2;
    }
  } else {
    return 2;
  }
  return 0;
}
function Zb(a, b) {
  try {
    return L(a, b), 20;
  } catch (c) {
  }
  return Tb(a, "wx");
}
function $b(a, b, c) {
  try {
    var d = L(a, b);
  } catch (e) {
    return e.l;
  }
  if (a = Tb(a, "wx")) {
    return a;
  }
  if (c) {
    if (!K(d.mode)) {
      return 54;
    }
    if (H.$(d) || Vb(d) === H.cwd()) {
      return 10;
    }
  } else {
    if (K(d.mode)) {
      return 31;
    }
  }
  return 0;
}
function U(a) {
  a = H.va(a);
  if (!a) {
    throw new H.g(8);
  }
  return a;
}
function ac(a, b = -1) {
  a = Object.assign(new H.Ea(), a);
  if (-1 == b) {
    a: {
      for (b = 0; b <= H.Fa; b++) {
        if (!H.streams[b]) {
          break a;
        }
      }
      throw new H.g(33);
    }
  }
  a.fd = b;
  return H.streams[b] = a;
}
function bc(a, b = -1) {
  a = ac(a, b);
  a.i?.Ja?.(a);
  return a;
}
function cc(a) {
  var b = [];
  for (a = [a]; a.length;) {
    var c = a.pop();
    b.push(c);
    a.push(...c.V);
  }
  return b;
}
function dc(a, b, c) {
  "undefined" == typeof c && (c = b, b = 438);
  return H.B(a, b | 8192, c);
}
function ec() {
  H.mkdir("/dev");
  Gb(H.N(1, 3), {read:() => 0, write:(d, e, g, k) => k,});
  dc("/dev/null", H.N(1, 3));
  Fb(H.N(5, 0), Ib);
  Fb(H.N(6, 0), Jb);
  dc("/dev/tty", H.N(5, 0));
  dc("/dev/tty1", H.N(6, 0));
  var a = new Uint8Array(1024), b = 0, c = () => {
    0 === b && (b = xb(a).byteLength);
    return a[--b];
  };
  H.K("/dev", "random", c);
  H.K("/dev", "urandom", c);
  H.mkdir("/dev/shm");
  H.mkdir("/dev/shm/tmp");
}
function fc() {
  H.mkdir("/proc");
  var a = H.mkdir("/proc/self");
  H.mkdir("/proc/self/fd");
  H.m({m() {
    var b = H.createNode(a, "fd", 16895, 73);
    b.h = {lookup(c, d) {
      var e = U(+d);
      c = {parent:null, m:{Aa:"fake"}, h:{readlink:() => e.path},};
      return c.parent = c;
    }};
    return b;
  }}, {}, "/proc/self/fd");
}
function gc(a, b) {
  try {
    var c = T(a, {D:!b});
    a = c.path;
  } catch (e) {
  }
  var d = {$:!1, exists:!1, error:0, name:null, path:null, object:null, Ua:!1, Wa:null, Va:null};
  try {
    c = T(a, {parent:!0}), d.Ua = !0, d.Wa = c.path, d.Va = c.node, d.name = tb(a), c = T(a, {D:!b}), d.exists = !0, d.path = c.path, d.object = c.node, d.name = c.node.name, d.$ = "/" === c.path;
  } catch (e) {
    d.error = e.l;
  }
  return d;
}
function hc(a, b, c, d) {
  a = "string" == typeof a ? a : Vb(a);
  b = G(a + "/" + b);
  return H.create(b, Pb(c, d));
}
function ic(a) {
  if (!(a.Qa || a.Ra || a.link || a.j)) {
    if ("undefined" != typeof XMLHttpRequest) {
      throw Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
    }
    if (ma) {
      try {
        a.j = Db(ma(a.url)), a.o = a.j.length;
      } catch (b) {
        throw new H.g(29);
      }
    } else {
      throw Error("Cannot load without read() or XMLHttpRequest.");
    }
  }
}
var H = {root:null, V:[], ua:{}, streams:[], Sa:1, G:null, ta:"/", Z:!1, ha:!0, g:class extends Error {
  constructor(a) {
    super(Sb[a]);
    this.name = "ErrnoError";
    this.l = a;
    for (var b in Qb) {
      if (Qb[b] === a) {
        this.code = b;
        break;
      }
    }
  }
}, ea:{}, La:null, Y:0, Ea:class {
  constructor() {
    this.R = {};
    this.node = null;
  }
  get object() {
    return this.node;
  }
  set object(a) {
    this.node = a;
  }
  get flags() {
    return this.R.flags;
  }
  set flags(a) {
    this.R.flags = a;
  }
  get position() {
    return this.R.position;
  }
  set position(a) {
    this.R.position = a;
  }
}, Da:class {
  constructor(a, b, c, d) {
    a ||= this;
    this.parent = a;
    this.m = a.m;
    this.C = null;
    this.id = H.Sa++;
    this.name = b;
    this.mode = c;
    this.h = {};
    this.i = {};
    this.rdev = d;
  }
  get read() {
    return 365 === (this.mode & 365);
  }
  set read(a) {
    a ? this.mode |= 365 : this.mode &= -366;
  }
  get write() {
    return 146 === (this.mode & 146);
  }
  set write(a) {
    a ? this.mode |= 146 : this.mode &= -147;
  }
  get Ra() {
    return K(this.mode);
  }
  get Qa() {
    return 8192 === (this.mode & 61440);
  }
}, createNode(a, b, c, d) {
  n("object" == typeof a);
  a = new H.Da(a, b, c, d);
  Wb(a);
  return a;
}, $(a) {
  return a === a.parent;
}, isFile(a) {
  return 32768 === (a & 61440);
}, isFIFO(a) {
  return 4096 === (a & 61440);
}, isSocket(a) {
  return 49152 === (a & 49152);
}, Fa:4096, va:a => H.streams[a], Ha:{open(a) {
  a.i = H.Ma(a.node.rdev).i;
  a.i.open?.(a);
}, u() {
  throw new H.g(70);
},}, ka:a => a >> 8, mb:a => a & 255, N:(a, b) => a << 8 | b, Ma:a => H.ua[a], Ca(a, b) {
  function c(k) {
    n(0 < H.Y);
    H.Y--;
    return b(k);
  }
  function d(k) {
    if (k) {
      if (!d.Ka) {
        return d.Ka = !0, c(k);
      }
    } else {
      ++g >= e.length && c(null);
    }
  }
  "function" == typeof a && (b = a, a = !1);
  H.Y++;
  1 < H.Y && p(`warning: ${H.Y} FS.syncfs operations in flight at once, probably just doing extra work`);
  var e = cc(H.root.m), g = 0;
  e.forEach(k => {
    if (!k.type.Ca) {
      return d(null);
    }
    k.type.Ca(k, a, d);
  });
}, m(a, b, c) {
  if ("string" == typeof a) {
    throw a;
  }
  var d = "/" === c;
  if (d && H.root) {
    throw new H.g(10);
  }
  if (!d && c) {
    var e = T(c, {da:!1});
    c = e.path;
    e = e.node;
    if (e.C) {
      throw new H.g(10);
    }
    if (!K(e.mode)) {
      throw new H.g(54);
    }
  }
  b = {type:a, X:b, Aa:c, V:[]};
  a = a.m(b);
  a.m = b;
  b.root = a;
  d ? H.root = a : e && (e.C = b, e.m && e.m.V.push(b));
  return a;
}, rb(a) {
  a = T(a, {da:!1});
  if (!a.node.C) {
    throw new H.g(28);
  }
  a = a.node;
  var b = a.C, c = cc(b);
  Object.keys(H.G).forEach(d => {
    for (d = H.G[d]; d;) {
      var e = d.P;
      c.includes(d.m) && Xb(d);
      d = e;
    }
  });
  a.C = null;
  b = a.m.V.indexOf(b);
  n(-1 !== b);
  a.m.V.splice(b, 1);
}, lookup(a, b) {
  return a.h.lookup(a, b);
}, B(a, b, c) {
  var d = T(a, {parent:!0}).node;
  a = tb(a);
  if (!a || "." === a || ".." === a) {
    throw new H.g(28);
  }
  var e = Zb(d, a);
  if (e) {
    throw new H.g(e);
  }
  if (!d.h.B) {
    throw new H.g(63);
  }
  return d.h.B(d, a, b, c);
}, create(a, b) {
  return H.B(a, (void 0 !== b ? b : 438) & 4095 | 32768, 0);
}, mkdir(a, b) {
  return H.B(a, (void 0 !== b ? b : 511) & 1023 | 16384, 0);
}, nb(a, b) {
  a = a.split("/");
  for (var c = "", d = 0; d < a.length; ++d) {
    if (a[d]) {
      c += "/" + a[d];
      try {
        H.mkdir(c, b);
      } catch (e) {
        if (20 != e.l) {
          throw e;
        }
      }
    }
  }
}, symlink(a, b) {
  if (!yb(a)) {
    throw new H.g(44);
  }
  var c = T(b, {parent:!0}).node;
  if (!c) {
    throw new H.g(44);
  }
  b = tb(b);
  var d = Zb(c, b);
  if (d) {
    throw new H.g(d);
  }
  if (!c.h.symlink) {
    throw new H.g(63);
  }
  return c.h.symlink(c, b, a);
}, rename(a, b) {
  var c = sb(a), d = sb(b), e = tb(a), g = tb(b);
  var k = T(a, {parent:!0});
  var m = k.node;
  k = T(b, {parent:!0});
  k = k.node;
  if (!m || !k) {
    throw new H.g(44);
  }
  if (m.m !== k.m) {
    throw new H.g(75);
  }
  var r = L(m, e);
  a = zb(a, d);
  if ("." !== a.charAt(0)) {
    throw new H.g(28);
  }
  a = zb(b, c);
  if ("." !== a.charAt(0)) {
    throw new H.g(55);
  }
  try {
    var t = L(k, g);
  } catch (y) {
  }
  if (r !== t) {
    b = K(r.mode);
    if (e = $b(m, e, b)) {
      throw new H.g(e);
    }
    if (e = t ? $b(k, g, b) : Zb(k, g)) {
      throw new H.g(e);
    }
    if (!m.h.rename) {
      throw new H.g(63);
    }
    if (r.C || t && t.C) {
      throw new H.g(10);
    }
    if (k !== m && (e = Tb(m, "w"))) {
      throw new H.g(e);
    }
    Xb(r);
    try {
      m.h.rename(r, k, g);
    } catch (y) {
      throw y;
    } finally {
      Wb(r);
    }
  }
}, rmdir(a) {
  var b = T(a, {parent:!0}).node;
  a = tb(a);
  var c = L(b, a), d = $b(b, a, !0);
  if (d) {
    throw new H.g(d);
  }
  if (!b.h.rmdir) {
    throw new H.g(63);
  }
  if (c.C) {
    throw new H.g(10);
  }
  b.h.rmdir(b, a);
  Xb(c);
}, readdir(a) {
  a = T(a, {D:!0}).node;
  if (!a.h.readdir) {
    throw new H.g(54);
  }
  return a.h.readdir(a);
}, unlink(a) {
  var b = T(a, {parent:!0}).node;
  if (!b) {
    throw new H.g(44);
  }
  a = tb(a);
  var c = L(b, a), d = $b(b, a, !1);
  if (d) {
    throw new H.g(d);
  }
  if (!b.h.unlink) {
    throw new H.g(63);
  }
  if (c.C) {
    throw new H.g(10);
  }
  b.h.unlink(b, a);
  Xb(c);
}, readlink(a) {
  a = T(a).node;
  if (!a) {
    throw new H.g(44);
  }
  if (!a.h.readlink) {
    throw new H.g(28);
  }
  return yb(Vb(a.parent), a.h.readlink(a));
}, stat(a, b) {
  a = T(a, {D:!b}).node;
  if (!a) {
    throw new H.g(44);
  }
  if (!a.h.A) {
    throw new H.g(63);
  }
  return a.h.A(a);
}, lstat(a) {
  return H.stat(a, !0);
}, chmod(a, b, c) {
  a = "string" == typeof a ? T(a, {D:!c}).node : a;
  if (!a.h.s) {
    throw new H.g(63);
  }
  a.h.s(a, {mode:b & 4095 | a.mode & -4096, timestamp:Date.now()});
}, lchmod(a, b) {
  H.chmod(a, b, !0);
}, fchmod(a, b) {
  a = U(a);
  H.chmod(a.node, b);
}, chown(a, b, c, d) {
  a = "string" == typeof a ? T(a, {D:!d}).node : a;
  if (!a.h.s) {
    throw new H.g(63);
  }
  a.h.s(a, {timestamp:Date.now()});
}, lchown(a, b, c) {
  H.chown(a, b, c, !0);
}, fchown(a, b, c) {
  a = U(a);
  H.chown(a.node, b, c);
}, truncate(a, b) {
  if (0 > b) {
    throw new H.g(28);
  }
  a = "string" == typeof a ? T(a, {D:!0}).node : a;
  if (!a.h.s) {
    throw new H.g(63);
  }
  if (K(a.mode)) {
    throw new H.g(31);
  }
  if (!H.isFile(a.mode)) {
    throw new H.g(28);
  }
  var c = Tb(a, "w");
  if (c) {
    throw new H.g(c);
  }
  a.h.s(a, {size:b, timestamp:Date.now()});
}, jb(a, b) {
  a = U(a);
  if (0 === (a.flags & 2097155)) {
    throw new H.g(28);
  }
  H.truncate(a.node, b);
}, sb(a, b, c) {
  a = T(a, {D:!0}).node;
  a.h.s(a, {timestamp:Math.max(b, c)});
}, open(a, b, c) {
  if ("" === a) {
    throw new H.g(44);
  }
  if ("string" == typeof b) {
    var d = {r:0, "r+":2, w:577, "w+":578, a:1089, "a+":1090,}[b];
    if ("undefined" == typeof d) {
      throw Error(`Unknown file open mode: ${b}`);
    }
    b = d;
  }
  c = b & 64 ? ("undefined" == typeof c ? 438 : c) & 4095 | 32768 : 0;
  if ("object" == typeof a) {
    var e = a;
  } else {
    a = G(a);
    try {
      e = T(a, {D:!(b & 131072)}).node;
    } catch (g) {
    }
  }
  d = !1;
  if (b & 64) {
    if (e) {
      if (b & 128) {
        throw new H.g(20);
      }
    } else {
      e = H.B(a, c, 0), d = !0;
    }
  }
  if (!e) {
    throw new H.g(44);
  }
  8192 === (e.mode & 61440) && (b &= -513);
  if (b & 65536 && !K(e.mode)) {
    throw new H.g(54);
  }
  if (!d && (c = e ? 40960 === (e.mode & 61440) ? 32 : K(e.mode) && ("r" !== Yb(b) || b & 512) ? 31 : Tb(e, Yb(b)) : 44)) {
    throw new H.g(c);
  }
  b & 512 && !d && H.truncate(e, 0);
  b &= -131713;
  e = ac({node:e, path:Vb(e), flags:b, seekable:!0, position:0, i:e.i, Xa:[], error:!1});
  e.i.open && e.i.open(e);
  !f.logReadFiles || b & 1 || (H.ma || (H.ma = {}), a in H.ma || (H.ma[a] = 1));
  return e;
}, close(a) {
  if (null === a.fd) {
    throw new H.g(8);
  }
  a.M && (a.M = null);
  try {
    a.i.close && a.i.close(a);
  } catch (b) {
    throw b;
  } finally {
    H.streams[a.fd] = null;
  }
  a.fd = null;
}, u(a, b, c) {
  if (null === a.fd) {
    throw new H.g(8);
  }
  if (!a.seekable || !a.i.u) {
    throw new H.g(70);
  }
  if (0 != c && 1 != c && 2 != c) {
    throw new H.g(28);
  }
  a.position = a.i.u(a, b, c);
  a.Xa = [];
  return a.position;
}, read(a, b, c, d, e) {
  n(0 <= c);
  if (0 > d || 0 > e) {
    throw new H.g(28);
  }
  if (null === a.fd) {
    throw new H.g(8);
  }
  if (1 === (a.flags & 2097155)) {
    throw new H.g(8);
  }
  if (K(a.node.mode)) {
    throw new H.g(31);
  }
  if (!a.i.read) {
    throw new H.g(28);
  }
  var g = "undefined" != typeof e;
  if (!g) {
    e = a.position;
  } else if (!a.seekable) {
    throw new H.g(70);
  }
  b = a.i.read(a, b, c, d, e);
  g || (a.position += b);
  return b;
}, write(a, b, c, d, e, g) {
  n(0 <= c);
  if (0 > d || 0 > e) {
    throw new H.g(28);
  }
  if (null === a.fd) {
    throw new H.g(8);
  }
  if (0 === (a.flags & 2097155)) {
    throw new H.g(8);
  }
  if (K(a.node.mode)) {
    throw new H.g(31);
  }
  if (!a.i.write) {
    throw new H.g(28);
  }
  a.seekable && a.flags & 1024 && H.u(a, 0, 2);
  var k = "undefined" != typeof e;
  if (!k) {
    e = a.position;
  } else if (!a.seekable) {
    throw new H.g(70);
  }
  b = a.i.write(a, b, c, d, e, g);
  k || (a.position += b);
  return b;
}, U(a, b, c) {
  if (null === a.fd) {
    throw new H.g(8);
  }
  if (0 > b || 0 >= c) {
    throw new H.g(28);
  }
  if (0 === (a.flags & 2097155)) {
    throw new H.g(8);
  }
  if (!H.isFile(a.node.mode) && !K(a.node.mode)) {
    throw new H.g(43);
  }
  if (!a.i.U) {
    throw new H.g(138);
  }
  a.i.U(a, b, c);
}, O(a, b, c, d, e) {
  if (0 !== (d & 2) && 0 === (e & 2) && 2 !== (a.flags & 2097155)) {
    throw new H.g(2);
  }
  if (1 === (a.flags & 2097155)) {
    throw new H.g(2);
  }
  if (!a.i.O) {
    throw new H.g(43);
  }
  return a.i.O(a, b, c, d, e);
}, S(a, b, c, d, e) {
  n(0 <= c);
  return a.i.S ? a.i.S(a, b, c, d, e) : 0;
}, ia(a, b, c) {
  if (!a.i.ia) {
    throw new H.g(59);
  }
  return a.i.ia(a, b, c);
}, readFile(a, b = {}) {
  b.flags = b.flags || 0;
  b.encoding = b.encoding || "binary";
  if ("utf8" !== b.encoding && "binary" !== b.encoding) {
    throw Error(`Invalid encoding type "${b.encoding}"`);
  }
  var c, d = H.open(a, b.flags);
  a = H.stat(a).size;
  var e = new Uint8Array(a);
  H.read(d, e, 0, a, 0);
  "utf8" === b.encoding ? c = ib(e, 0) : "binary" === b.encoding && (c = e);
  H.close(d);
  return c;
}, writeFile(a, b, c = {}) {
  c.flags = c.flags || 577;
  a = H.open(a, c.flags, c.mode);
  if ("string" == typeof b) {
    var d = new Uint8Array(Bb(b) + 1);
    b = Cb(b, d, 0, d.length);
    H.write(a, d, 0, b, void 0, c.Ga);
  } else if (ArrayBuffer.isView(b)) {
    H.write(a, b, 0, b.byteLength, void 0, c.Ga);
  } else {
    throw Error("Unsupported data type");
  }
  H.close(a);
}, cwd:() => H.ta, chdir(a) {
  a = T(a, {D:!0});
  if (null === a.node) {
    throw new H.g(44);
  }
  if (!K(a.node.mode)) {
    throw new H.g(54);
  }
  var b = Tb(a.node, "x");
  if (b) {
    throw new H.g(b);
  }
  H.ta = a.path;
}, qa() {
  [44].forEach(a => {
    H.ea[a] = new H.g(a);
    H.ea[a].stack = "<generic error, no stack>";
  });
  H.G = Array(4096);
  H.m(J, {}, "/");
  H.mkdir("/tmp");
  H.mkdir("/home");
  H.mkdir("/home/web_user");
  ec();
  fc();
  H.La = {MEMFS:J, NODEFS:O, WORKERFS:Q,};
}, L(a, b, c) {
  n(!H.L.Z, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  H.L.Z = !0;
  f.stdin = a || f.stdin;
  f.stdout = b || f.stdout;
  f.stderr = c || f.stderr;
  f.stdin ? H.K("/dev", "stdin", f.stdin) : H.symlink("/dev/tty", "/dev/stdin");
  f.stdout ? H.K("/dev", "stdout", null, f.stdout) : H.symlink("/dev/tty", "/dev/stdout");
  f.stderr ? H.K("/dev", "stderr", null, f.stderr) : H.symlink("/dev/tty1", "/dev/stderr");
  a = H.open("/dev/stdin", 0);
  b = H.open("/dev/stdout", 1);
  c = H.open("/dev/stderr", 1);
  n(0 === a.fd, `invalid handle for stdin (${a.fd})`);
  n(1 === b.fd, `invalid handle for stdout (${b.fd})`);
  n(2 === c.fd, `invalid handle for stderr (${c.fd})`);
}, pb() {
  H.L.Z = !1;
  jc(0);
  for (var a = 0; a < H.streams.length; a++) {
    var b = H.streams[a];
    b && H.close(b);
  }
}, ib(a, b) {
  a = gc(a, b);
  return a.exists ? a.object : null;
}, gb(a, b) {
  a = "string" == typeof a ? a : Vb(a);
  for (b = b.split("/").reverse(); b.length;) {
    var c = b.pop();
    if (c) {
      var d = G(a + "/" + c);
      try {
        H.mkdir(d);
      } catch (e) {
      }
      a = d;
    }
  }
  return d;
}, K(a, b, c, d) {
  a = vb("string" == typeof a ? a : Vb(a), b);
  b = Pb(!!c, !!d);
  H.K.ka || (H.K.ka = 64);
  var e = H.N(H.K.ka++, 0);
  Gb(e, {open(g) {
    g.seekable = !1;
  }, close() {
    d?.buffer?.length && d(10);
  }, read(g, k, m, r) {
    for (var t = 0, y = 0; y < r; y++) {
      try {
        var u = c();
      } catch (z) {
        throw new H.g(29);
      }
      if (void 0 === u && 0 === t) {
        throw new H.g(6);
      }
      if (null === u || void 0 === u) {
        break;
      }
      t++;
      k[m + y] = u;
    }
    t && (g.node.timestamp = Date.now());
    return t;
  }, write(g, k, m, r) {
    for (var t = 0; t < r; t++) {
      try {
        d(k[m + t]);
      } catch (y) {
        throw new H.g(29);
      }
    }
    r && (g.node.timestamp = Date.now());
    return t;
  }});
  return dc(a, b, e);
}, Ia(a, b, c, d, e) {
  function g(u, z, M, I, B) {
    u = u.node.j;
    if (B >= u.length) {
      return 0;
    }
    I = Math.min(u.length - B, I);
    n(0 <= I);
    if (u.slice) {
      for (var x = 0; x < I; x++) {
        z[M + x] = u[B + x];
      }
    } else {
      for (x = 0; x < I; x++) {
        z[M + x] = u.get(B + x);
      }
    }
    return I;
  }
  class k {
    constructor() {
      this.ga = !1;
      this.F = [];
      this.fa = void 0;
      this.xa = this.ya = 0;
    }
    get(u) {
      if (!(u > this.length - 1 || 0 > u)) {
        var z = u % this.chunkSize;
        return this.fa(u / this.chunkSize | 0)[z];
      }
    }
    Ta(u) {
      this.fa = u;
    }
    za() {
      var u = new XMLHttpRequest();
      u.open("HEAD", c, !1);
      u.send(null);
      if (!(200 <= u.status && 300 > u.status || 304 === u.status)) {
        throw Error("Couldn't load " + c + ". Status: " + u.status);
      }
      var z = Number(u.getResponseHeader("Content-length")), M, I = (M = u.getResponseHeader("Accept-Ranges")) && "bytes" === M;
      u = (M = u.getResponseHeader("Content-Encoding")) && "gzip" === M;
      var B = 1048576;
      I || (B = z);
      var x = this;
      x.Ta(R => {
        var X = R * B, Y = (R + 1) * B - 1;
        Y = Math.min(Y, z - 1);
        if ("undefined" == typeof x.F[R]) {
          var pb = x.F;
          if (X > Y) {
            throw Error("invalid range (" + X + ", " + Y + ") or no bytes requested!");
          }
          if (Y > z - 1) {
            throw Error("only " + z + " bytes available! programmer error!");
          }
          var S = new XMLHttpRequest();
          S.open("GET", c, !1);
          z !== B && S.setRequestHeader("Range", "bytes=" + X + "-" + Y);
          S.responseType = "arraybuffer";
          S.overrideMimeType && S.overrideMimeType("text/plain; charset=x-user-defined");
          S.send(null);
          if (!(200 <= S.status && 300 > S.status || 304 === S.status)) {
            throw Error("Couldn't load " + c + ". Status: " + S.status);
          }
          X = void 0 !== S.response ? new Uint8Array(S.response || []) : Db(S.responseText || "");
          pb[R] = X;
        }
        if ("undefined" == typeof x.F[R]) {
          throw Error("doXHR failed!");
        }
        return x.F[R];
      });
      if (u || !z) {
        B = z = 1, B = z = this.fa(0).length, ta("LazyFiles on gzip forces download of the whole file when length is accessed");
      }
      this.ya = z;
      this.xa = B;
      this.ga = !0;
    }
    get length() {
      this.ga || this.za();
      return this.ya;
    }
    get chunkSize() {
      this.ga || this.za();
      return this.xa;
    }
  }
  if ("undefined" != typeof XMLHttpRequest) {
    if (!ea) {
      throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
    }
    var m = new k();
    var r = void 0;
  } else {
    r = c, m = void 0;
  }
  var t = hc(a, b, d, e);
  m ? t.j = m : r && (t.j = null, t.url = r);
  Object.defineProperties(t, {o:{get:function() {
    return this.j.length;
  }}});
  var y = {};
  Object.keys(t.i).forEach(u => {
    var z = t.i[u];
    y[u] = (...M) => {
      ic(t);
      return z(...M);
    };
  });
  y.read = (u, z, M, I, B) => {
    ic(t);
    return g(u, z, M, I, B);
  };
  y.O = (u, z, M) => {
    ic(t);
    var I = Kb();
    if (!I) {
      throw new H.g(48);
    }
    g(u, v, I, z, M);
    return {v:I, ra:!0};
  };
  t.i = y;
  return t;
}, Ya() {
  h("FS.absolutePath has been removed; use PATH_FS.resolve instead");
}, eb() {
  h("FS.createFolder has been removed; use FS.mkdir instead");
}, fb() {
  h("FS.createLink has been removed; use FS.symlink instead");
}, lb() {
  h("FS.joinPath has been removed; use PATH.join instead");
}, ob() {
  h("FS.mmapAlloc has been replaced by the top level function mmapAlloc");
}, qb() {
  h("FS.standardizePath has been removed; use PATH.normalize instead");
},};
function kc(a, b, c) {
  if ("/" === b.charAt(0)) {
    return b;
  }
  a = -100 === a ? H.cwd() : U(a).path;
  if (0 == b.length) {
    if (!c) {
      throw new H.g(44);
    }
    return a;
  }
  return G(a + "/" + b);
}
function lc(a, b, c) {
  a = a(b);
  w[c >> 2] = a.dev;
  w[c + 4 >> 2] = a.mode;
  A[c + 8 >> 2] = a.nlink;
  w[c + 12 >> 2] = a.uid;
  w[c + 16 >> 2] = a.gid;
  w[c + 20 >> 2] = a.rdev;
  Aa[c + 24 >> 3] = BigInt(a.size);
  w[c + 32 >> 2] = 4096;
  w[c + 36 >> 2] = a.blocks;
  b = a.atime.getTime();
  var d = a.mtime.getTime(), e = a.ctime.getTime();
  Aa[c + 40 >> 3] = BigInt(Math.floor(b / 1000));
  A[c + 48 >> 2] = b % 1000 * 1000;
  Aa[c + 56 >> 3] = BigInt(Math.floor(d / 1000));
  A[c + 64 >> 2] = d % 1000 * 1000;
  Aa[c + 72 >> 3] = BigInt(Math.floor(e / 1000));
  A[c + 80 >> 2] = e % 1000 * 1000;
  Aa[c + 88 >> 3] = BigInt(a.ino);
  return 0;
}
var mc = void 0;
function nc() {
  n(void 0 != mc);
  var a = w[+mc >> 2];
  mc += 4;
  return a;
}
var oc = (a, b, c) => {
  n("number" == typeof c, "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  Cb(a, ya, b, c);
}, pc = a => 0 === a % 4 && (0 !== a % 100 || 0 === a % 400), qc = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], rc = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], sc = {}, uc = () => {
  if (!tc) {
    var a = {USER:"web_user", LOGNAME:"web_user", PATH:"/", PWD:"/", HOME:"/home/web_user", LANG:("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", _:ka || "./this.program"}, b;
    for (b in sc) {
      void 0 === sc[b] ? delete a[b] : a[b] = sc[b];
    }
    var c = [];
    for (b in a) {
      c.push(`${b}=${a[b]}`);
    }
    tc = c;
  }
  return tc;
}, tc, wc = a => {
  xa = a;
  vc();
  xa = a;
  wa = !0;
  la(a, new fb(a));
}, xc = (a, b, c, d) => {
  for (var e = 0, g = 0; g < c; g++) {
    var k = A[b >> 2], m = A[b + 4 >> 2];
    b += 8;
    k = H.read(a, v, k, m, d);
    if (0 > k) {
      return -1;
    }
    e += k;
    if (k < m) {
      break;
    }
    "undefined" != typeof d && (d += k);
  }
  return e;
}, yc = (a, b, c, d) => {
  for (var e = 0, g = 0; g < c; g++) {
    var k = A[b >> 2], m = A[b + 4 >> 2];
    b += 8;
    k = H.write(a, v, k, m, d);
    if (0 > k) {
      return -1;
    }
    e += k;
    "undefined" != typeof d && (d += k);
  }
  return e;
}, zc = a => {
  if (a instanceof fb || "unwind" == a) {
    return xa;
  }
  Ca();
  a instanceof WebAssembly.RuntimeError && 0 >= V() && p("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 131072)");
  la(1, a);
}, Ac;
f.incrementExceptionRefcount = a => Bc(a);
f.decrementExceptionRefcount = a => Cc(a);
var Wa = a => {
  var b = V(), c = Dc(4), d = Dc(4);
  Ec(a, c, d);
  a = A[c >> 2];
  d = A[d >> 2];
  c = F(a);
  Fc(a);
  if (d) {
    var e = F(d);
    Fc(d);
  }
  W(b);
  return [c, e];
};
f.getExceptionMessage = a => Wa(a);
H.hb = (a, b, c, d, e, g, k, m, r, t) => {
  function y(M) {
    function I(B) {
      t?.();
      if (!m) {
        var x = a, R = b;
        x && (x = "string" == typeof x ? x : Vb(x), R = b ? G(x + "/" + b) : x);
        x = Pb(d, e);
        R = H.create(R, x);
        if (B) {
          if ("string" == typeof B) {
            for (var X = Array(B.length), Y = 0, pb = B.length; Y < pb; ++Y) {
              X[Y] = B.charCodeAt(Y);
            }
            B = X;
          }
          H.chmod(R, x | 146);
          X = H.open(R, 577);
          H.write(X, B, 0, B.length, 0, r);
          H.close(X);
          H.chmod(R, x);
        }
      }
      g?.();
      Sa(z);
    }
    Ob(M, u, I, () => {
      k?.();
      Sa(z);
    }) || I(M);
  }
  var u = b ? yb(G(a + "/" + b)) : a, z = Qa(`cp ${u}`);
  Ra(z);
  "string" == typeof c ? Mb(c, y, k) : y(c);
};
H.qa();
fa && O.qa();
var Vc = {__assert_fail:(a, b, c, d) => {
  h(`Assertion failed: ${F(a)}, at: ` + [b ? F(b) : "unknown filename", c, d ? F(d) : "unknown function"]);
}, __cxa_begin_catch:a => {
  a = new mb(a);
  0 == v[a.v + 12] && (v[a.v + 12] = 1, kb--);
  v[a.v + 13] = 0;
  jb.push(a);
  Bc(a.F);
  if (Gc(A[a.v + 4 >> 2])) {
    a = A[a.F >> 2];
  } else {
    var b = A[a.v + 16 >> 2];
    a = 0 !== b ? b : a.F;
  }
  return a;
}, __cxa_find_matching_catch_2:() => qb([]), __cxa_find_matching_catch_3:a => qb([a]), __resumeException:a => {
  lb ||= new Va(a);
  throw lb;
}, __syscall_dup:function(a) {
  try {
    var b = U(a);
    return bc(b).fd;
  } catch (c) {
    if ("undefined" == typeof H || "ErrnoError" !== c.name) {
      throw c;
    }
    return -c.l;
  }
}, __syscall_dup3:function(a, b, c) {
  try {
    var d = U(a);
    n(!c);
    if (d.fd === b) {
      return -28;
    }
    var e = H.va(b);
    e && H.close(e);
    return bc(d, b).fd;
  } catch (g) {
    if ("undefined" == typeof H || "ErrnoError" !== g.name) {
      throw g;
    }
    return -g.l;
  }
}, __syscall_fcntl64:function(a, b, c) {
  mc = c;
  try {
    var d = U(a);
    switch(b) {
      case 0:
        var e = nc();
        if (0 > e) {
          break;
        }
        for (; H.streams[e];) {
          e++;
        }
        return bc(d, e).fd;
      case 1:
      case 2:
        return 0;
      case 3:
        return d.flags;
      case 4:
        return e = nc(), d.flags |= e, 0;
      case 12:
        return e = nc(), za[e + 0 >> 1] = 2, 0;
      case 13:
      case 14:
        return 0;
    }
    return -28;
  } catch (g) {
    if ("undefined" == typeof H || "ErrnoError" !== g.name) {
      throw g;
    }
    return -g.l;
  }
}, __syscall_fstat64:function(a, b) {
  try {
    var c = U(a);
    return lc(H.stat, c.path, b);
  } catch (d) {
    if ("undefined" == typeof H || "ErrnoError" !== d.name) {
      throw d;
    }
    return -d.l;
  }
}, __syscall_getdents64:function(a, b, c) {
  try {
    var d = U(a);
    d.M || (d.M = H.readdir(d.path));
    a = 0;
    for (var e = H.u(d, 0, 1), g = Math.floor(e / 280); g < d.M.length && a + 280 <= c;) {
      var k = d.M[g];
      if ("." === k) {
        var m = d.node.id;
        var r = 4;
      } else if (".." === k) {
        m = T(d.path, {parent:!0}).node.id, r = 4;
      } else {
        var t = L(d.node, k);
        m = t.id;
        r = 8192 === (t.mode & 61440) ? 2 : K(t.mode) ? 4 : 40960 === (t.mode & 61440) ? 10 : 8;
      }
      n(m);
      Aa[b + a >> 3] = BigInt(m);
      Aa[b + a + 8 >> 3] = BigInt(280 * (g + 1));
      za[b + a + 16 >> 1] = 280;
      v[b + a + 18] = r;
      oc(k, b + a + 19, 256);
      a += 280;
      g += 1;
    }
    H.u(d, 280 * g, 0);
    return a;
  } catch (y) {
    if ("undefined" == typeof H || "ErrnoError" !== y.name) {
      throw y;
    }
    return -y.l;
  }
}, __syscall_ioctl:function(a, b, c) {
  mc = c;
  try {
    var d = U(a);
    switch(b) {
      case 21509:
        return d.tty ? 0 : -59;
      case 21505:
        if (!d.tty) {
          return -59;
        }
        if (d.tty.I.Na) {
          a = [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,];
          var e = nc();
          w[e >> 2] = 25856;
          w[e + 4 >> 2] = 5;
          w[e + 8 >> 2] = 191;
          w[e + 12 >> 2] = 35387;
          for (var g = 0; 32 > g; g++) {
            v[e + g + 17] = a[g] || 0;
          }
        }
        return 0;
      case 21510:
      case 21511:
      case 21512:
        return d.tty ? 0 : -59;
      case 21506:
      case 21507:
      case 21508:
        if (!d.tty) {
          return -59;
        }
        if (d.tty.I.Oa) {
          for (e = nc(), a = [], g = 0; 32 > g; g++) {
            a.push(v[e + g + 17]);
          }
        }
        return 0;
      case 21519:
        if (!d.tty) {
          return -59;
        }
        e = nc();
        return w[e >> 2] = 0;
      case 21520:
        return d.tty ? -28 : -59;
      case 21531:
        return e = nc(), H.ia(d, b, e);
      case 21523:
        if (!d.tty) {
          return -59;
        }
        d.tty.I.Pa && (g = [24, 80], e = nc(), za[e >> 1] = g[0], za[e + 2 >> 1] = g[1]);
        return 0;
      case 21524:
        return d.tty ? 0 : -59;
      case 21515:
        return d.tty ? 0 : -59;
      default:
        return -28;
    }
  } catch (k) {
    if ("undefined" == typeof H || "ErrnoError" !== k.name) {
      throw k;
    }
    return -k.l;
  }
}, __syscall_lstat64:function(a, b) {
  try {
    return a = F(a), lc(H.lstat, a, b);
  } catch (c) {
    if ("undefined" == typeof H || "ErrnoError" !== c.name) {
      throw c;
    }
    return -c.l;
  }
}, __syscall_newfstatat:function(a, b, c, d) {
  try {
    b = F(b);
    var e = d & 256, g = d & 4096;
    d &= -6401;
    n(!d, `unknown flags in __syscall_newfstatat: ${d}`);
    b = kc(a, b, g);
    return lc(e ? H.lstat : H.stat, b, c);
  } catch (k) {
    if ("undefined" == typeof H || "ErrnoError" !== k.name) {
      throw k;
    }
    return -k.l;
  }
}, __syscall_openat:function(a, b, c, d) {
  mc = d;
  try {
    b = F(b);
    b = kc(a, b);
    var e = d ? nc() : 0;
    return H.open(b, c, e).fd;
  } catch (g) {
    if ("undefined" == typeof H || "ErrnoError" !== g.name) {
      throw g;
    }
    return -g.l;
  }
}, __syscall_renameat:function(a, b, c, d) {
  try {
    return b = F(b), d = F(d), b = kc(a, b), d = kc(c, d), H.rename(b, d), 0;
  } catch (e) {
    if ("undefined" == typeof H || "ErrnoError" !== e.name) {
      throw e;
    }
    return -e.l;
  }
}, __syscall_rmdir:function(a) {
  try {
    return a = F(a), H.rmdir(a), 0;
  } catch (b) {
    if ("undefined" == typeof H || "ErrnoError" !== b.name) {
      throw b;
    }
    return -b.l;
  }
}, __syscall_stat64:function(a, b) {
  try {
    return a = F(a), lc(H.stat, a, b);
  } catch (c) {
    if ("undefined" == typeof H || "ErrnoError" !== c.name) {
      throw c;
    }
    return -c.l;
  }
}, __syscall_unlinkat:function(a, b, c) {
  try {
    return b = F(b), b = kc(a, b), 0 === c ? H.unlink(b) : 512 === c ? H.rmdir(b) : h("Invalid flags passed to unlinkat"), 0;
  } catch (d) {
    if ("undefined" == typeof H || "ErrnoError" !== d.name) {
      throw d;
    }
    return -d.l;
  }
}, _abort_js:() => {
  h("native code called abort()");
}, _emscripten_get_now_is_monotonic:() => 1, _emscripten_throw_longjmp:() => {
  throw new Ua();
}, _gmtime_js:function(a, b) {
  a = -9007199254740992 > a || 9007199254740992 < a ? NaN : Number(a);
  a = new Date(1000 * a);
  w[b >> 2] = a.getUTCSeconds();
  w[b + 4 >> 2] = a.getUTCMinutes();
  w[b + 8 >> 2] = a.getUTCHours();
  w[b + 12 >> 2] = a.getUTCDate();
  w[b + 16 >> 2] = a.getUTCMonth();
  w[b + 20 >> 2] = a.getUTCFullYear() - 1900;
  w[b + 24 >> 2] = a.getUTCDay();
  w[b + 28 >> 2] = (a.getTime() - Date.UTC(a.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864E5 | 0;
}, _localtime_js:function(a, b) {
  a = -9007199254740992 > a || 9007199254740992 < a ? NaN : Number(a);
  a = new Date(1000 * a);
  w[b >> 2] = a.getSeconds();
  w[b + 4 >> 2] = a.getMinutes();
  w[b + 8 >> 2] = a.getHours();
  w[b + 12 >> 2] = a.getDate();
  w[b + 16 >> 2] = a.getMonth();
  w[b + 20 >> 2] = a.getFullYear() - 1900;
  w[b + 24 >> 2] = a.getDay();
  w[b + 28 >> 2] = (pc(a.getFullYear()) ? qc : rc)[a.getMonth()] + a.getDate() - 1 | 0;
  w[b + 36 >> 2] = -(60 * a.getTimezoneOffset());
  var c = (new Date(a.getFullYear(), 6, 1)).getTimezoneOffset(), d = (new Date(a.getFullYear(), 0, 1)).getTimezoneOffset();
  w[b + 32 >> 2] = (c != d && a.getTimezoneOffset() == Math.min(d, c)) | 0;
}, _mktime_js:function(a) {
  var b = new Date(w[a + 20 >> 2] + 1900, w[a + 16 >> 2], w[a + 12 >> 2], w[a + 8 >> 2], w[a + 4 >> 2], w[a >> 2], 0), c = w[a + 32 >> 2], d = b.getTimezoneOffset(), e = (new Date(b.getFullYear(), 6, 1)).getTimezoneOffset(), g = (new Date(b.getFullYear(), 0, 1)).getTimezoneOffset(), k = Math.min(g, e);
  0 > c ? w[a + 32 >> 2] = Number(e != g && k == d) : 0 < c != (k == d) && (e = Math.max(g, e), b.setTime(b.getTime() + 60000 * ((0 < c ? k : e) - d)));
  w[a + 24 >> 2] = b.getDay();
  w[a + 28 >> 2] = (pc(b.getFullYear()) ? qc : rc)[b.getMonth()] + b.getDate() - 1 | 0;
  w[a >> 2] = b.getSeconds();
  w[a + 4 >> 2] = b.getMinutes();
  w[a + 8 >> 2] = b.getHours();
  w[a + 12 >> 2] = b.getDate();
  w[a + 16 >> 2] = b.getMonth();
  w[a + 20 >> 2] = b.getYear();
  a = b.getTime();
  return BigInt(isNaN(a) ? -1 : a / 1000);
}, _tzset_js:(a, b, c, d) => {
  var e = (new Date()).getFullYear(), g = new Date(e, 0, 1), k = new Date(e, 6, 1);
  e = g.getTimezoneOffset();
  var m = k.getTimezoneOffset();
  A[a >> 2] = 60 * Math.max(e, m);
  w[b >> 2] = Number(e != m);
  a = r => r.toLocaleTimeString(void 0, {hour12:!1, timeZoneName:"short"}).split(" ")[1];
  g = a(g);
  k = a(k);
  n(g);
  n(k);
  n(16 >= Bb(g), `timezone name truncated to fit in TZNAME_MAX (${g})`);
  n(16 >= Bb(k), `timezone name truncated to fit in TZNAME_MAX (${k})`);
  m < e ? (oc(g, c, 17), oc(k, d, 17)) : (oc(g, d, 17), oc(k, c, 17));
}, emscripten_date_now:() => Date.now(), emscripten_get_now:() => performance.now(), emscripten_resize_heap:a => {
  var b = ya.length;
  a >>>= 0;
  n(a > b);
  if (2147483648 < a) {
    return p(`Cannot enlarge memory, requested ${a} bytes, but the limit is ${2147483648} bytes!`), !1;
  }
  for (var c = 1; 4 >= c; c *= 2) {
    var d = b * (1 + 0.2 / c);
    d = Math.min(d, a + 100663296);
    var e = Math;
    d = Math.max(a, d);
    e = e.min.call(e, 2147483648, d + (65536 - d % 65536) % 65536);
    a: {
      d = e;
      var g = va.buffer, k = (d - g.byteLength + 65535) / 65536;
      try {
        va.grow(k);
        Ba();
        var m = 1;
        break a;
      } catch (r) {
        p(`growMemory: Attempted to grow heap from ${g.byteLength} bytes to ${d} bytes, but got error: ${r}`);
      }
      m = void 0;
    }
    if (m) {
      return !0;
    }
  }
  p(`Failed to grow the heap from ${b} bytes to ${e} bytes, not enough memory!`);
  return !1;
}, environ_get:(a, b) => {
  var c = 0;
  uc().forEach((d, e) => {
    var g = b + c;
    e = A[a + 4 * e >> 2] = g;
    for (g = 0; g < d.length; ++g) {
      n(d.charCodeAt(g) === (d.charCodeAt(g) & 255)), v[e++] = d.charCodeAt(g);
    }
    v[e] = 0;
    c += d.length + 1;
  });
  return 0;
}, environ_sizes_get:(a, b) => {
  var c = uc();
  A[a >> 2] = c.length;
  var d = 0;
  c.forEach(e => d += e.length + 1);
  A[b >> 2] = d;
  return 0;
}, exit:wc, fd_close:function(a) {
  try {
    var b = U(a);
    H.close(b);
    return 0;
  } catch (c) {
    if ("undefined" == typeof H || "ErrnoError" !== c.name) {
      throw c;
    }
    return c.l;
  }
}, fd_pread:function(a, b, c, d, e) {
  d = -9007199254740992 > d || 9007199254740992 < d ? NaN : Number(d);
  try {
    if (isNaN(d)) {
      return 61;
    }
    var g = U(a), k = xc(g, b, c, d);
    A[e >> 2] = k;
    return 0;
  } catch (m) {
    if ("undefined" == typeof H || "ErrnoError" !== m.name) {
      throw m;
    }
    return m.l;
  }
}, fd_pwrite:function(a, b, c, d, e) {
  d = -9007199254740992 > d || 9007199254740992 < d ? NaN : Number(d);
  try {
    if (isNaN(d)) {
      return 61;
    }
    var g = U(a), k = yc(g, b, c, d);
    A[e >> 2] = k;
    return 0;
  } catch (m) {
    if ("undefined" == typeof H || "ErrnoError" !== m.name) {
      throw m;
    }
    return m.l;
  }
}, fd_read:function(a, b, c, d) {
  try {
    var e = U(a), g = xc(e, b, c);
    A[d >> 2] = g;
    return 0;
  } catch (k) {
    if ("undefined" == typeof H || "ErrnoError" !== k.name) {
      throw k;
    }
    return k.l;
  }
}, fd_seek:function(a, b, c, d) {
  b = -9007199254740992 > b || 9007199254740992 < b ? NaN : Number(b);
  try {
    if (isNaN(b)) {
      return 61;
    }
    var e = U(a);
    H.u(e, b, c);
    Aa[d >> 3] = BigInt(e.position);
    e.M && 0 === b && 0 === c && (e.M = null);
    return 0;
  } catch (g) {
    if ("undefined" == typeof H || "ErrnoError" !== g.name) {
      throw g;
    }
    return g.l;
  }
}, fd_write:function(a, b, c, d) {
  try {
    var e = U(a), g = yc(e, b, c);
    A[d >> 2] = g;
    return 0;
  } catch (k) {
    if ("undefined" == typeof H || "ErrnoError" !== k.name) {
      throw k;
    }
    return k.l;
  }
}, invoke_ii:Hc, invoke_iii:Ic, invoke_iiii:Jc, invoke_iiiii:Kc, invoke_iiiiiii:Lc, invoke_iiiiiiiii:Mc, invoke_iiji:Nc, invoke_v:Oc, invoke_vi:Pc, invoke_vii:Qc, invoke_viii:Rc, invoke_viiii:Sc, invoke_viiiii:Tc, invoke_viiiiii:Uc}, D = function() {
  function a(d) {
    D = d.exports;
    va = D.memory;
    n(va, "memory not found in wasm exports");
    Ba();
    Ac = D.__indirect_function_table;
    n(Ac, "table not found in wasm exports");
    Ia.unshift(D.__wasm_call_ctors);
    Sa("wasm-instantiate");
    return D;
  }
  var b = {env:Vc, wasi_snapshot_preview1:Vc,};
  Ra("wasm-instantiate");
  var c = f;
  if (f.instantiateWasm) {
    try {
      return f.instantiateWasm(b, a);
    } catch (d) {
      p(`Module.instantiateWasm callback failed with error: ${d}`), ba(d);
    }
  }
  Xa ||= f.locateFile ? Ta("gs.wasm") ? "gs.wasm" : f.locateFile ? f.locateFile("gs.wasm", l) : l + "gs.wasm" : (new URL("gs.wasm", import.meta.url)).href;
  ab(b, function(d) {
    n(f === c, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    c = null;
    a(d.instance);
  }).catch(ba);
  return {};
}(), Wc = f._main = C("__main_argc_argv", 2), Fc = C("free", 1), jc = C("fflush", 1), Z = C("setThrew", 2), nb = C("_emscripten_tempret_set", 1), Xc = () => (Xc = D.emscripten_stack_init)(), Da = () => (Da = D.emscripten_stack_get_end)(), W = a => (W = D._emscripten_stack_restore)(a), Dc = a => (Dc = D._emscripten_stack_alloc)(a), V = () => (V = D.emscripten_stack_get_current)(), Bc = C("__cxa_increment_exception_refcount", 1), Cc = C("__cxa_decrement_exception_refcount", 1), Ec = C("__get_exception_message",
3), ob = C("__cxa_can_catch", 3), Gc = C("__cxa_is_pointer_type", 1);
f.dynCall_jiji = C("dynCall_jiji", 4);
var Yc = f.dynCall_iiii = C("dynCall_iiii", 4), Zc = f.dynCall_ii = C("dynCall_ii", 2);
f.dynCall_iidiiii = C("dynCall_iidiiii", 7);
var dynCall_vii = f.dynCall_vii = C("dynCall_vii", 3), dynCall_v = f.dynCall_v = C("dynCall_v", 1), dynCall_vi = f.dynCall_vi = C("dynCall_vi", 2), $c = f.dynCall_viiii = C("dynCall_viiii", 5), ad = f.dynCall_viiiiii = C("dynCall_viiiiii", 7), bd = f.dynCall_viiiii = C("dynCall_viiiii", 6), dynCall_iii = f.dynCall_iii = C("dynCall_iii", 3), cd = f.dynCall_viii = C("dynCall_viii", 4);
f.dynCall_iiiiii = C("dynCall_iiiiii", 6);
f.dynCall_iiiiiiii = C("dynCall_iiiiiiii", 8);
var dd = f.dynCall_iiiii = C("dynCall_iiiii", 5), ed = f.dynCall_iiiiiii = C("dynCall_iiiiiii", 7), fd = f.dynCall_iiiiiiiii = C("dynCall_iiiiiiiii", 9);
f.dynCall_iiiiiiiiiiii = C("dynCall_iiiiiiiiiiii", 12);
f.dynCall_iiiiiiiiiii = C("dynCall_iiiiiiiiiii", 11);
f.dynCall_iiiiiiiiiiiiiiiii = C("dynCall_iiiiiiiiiiiiiiiii", 17);
f.dynCall_iiiiiiiiii = C("dynCall_iiiiiiiiii", 10);
var gd = f.dynCall_iiji = C("dynCall_iiji", 4);
f.dynCall_jii = C("dynCall_jii", 3);
f.dynCall_iiiiiiijjii = C("dynCall_iiiiiiijjii", 11);
f.dynCall_iiiiiiiiiiji = C("dynCall_iiiiiiiiiiji", 12);
f.dynCall_iiiiiiiiiijj = C("dynCall_iiiiiiiiiijj", 12);
f.dynCall_iiiiiij = C("dynCall_iiiiiij", 7);
f.dynCall_iiiiiiiiiiiiii = C("dynCall_iiiiiiiiiiiiii", 14);
f.dynCall_iddii = C("dynCall_iddii", 5);
f.dynCall_fdi = C("dynCall_fdi", 3);
f.dynCall_fdii = C("dynCall_fdii", 4);
f.dynCall_viiiiiiiiijiiii = C("dynCall_viiiiiiiiijiiii", 15);
f.dynCall_iiijiii = C("dynCall_iiijiii", 7);
f.dynCall_iijiii = C("dynCall_iijiii", 6);
f.dynCall_iij = C("dynCall_iij", 3);
f.dynCall_iidiii = C("dynCall_iidiii", 6);
f.dynCall_viiiiiii = C("dynCall_viiiiiii", 8);
f.dynCall_idii = C("dynCall_idii", 4);
f.dynCall_iiiiiiiiiiiiiii = C("dynCall_iiiiiiiiiiiiiii", 15);
f.dynCall_viiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiijiiiiii = C("dynCall_viiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiijiiiiii", 40);
f.dynCall_viiiiiiiiiiiiiijiiiii = C("dynCall_viiiiiiiiiiiiiijiiiii", 21);
f.dynCall_viiiiiiiii = C("dynCall_viiiiiiiii", 10);
f.dynCall_iji = C("dynCall_iji", 3);
f.dynCall_jji = C("dynCall_jji", 3);
f.dynCall_viij = C("dynCall_viij", 4);
f.dynCall_ji = C("dynCall_ji", 2);
f.dynCall_iiiiiiiiiiiii = C("dynCall_iiiiiiiiiiiii", 13);
f.dynCall_id = C("dynCall_id", 2);
f.dynCall_dd = C("dynCall_dd", 2);
f.dynCall_viiiiiiii = C("dynCall_viiiiiiii", 9);
f.dynCall_iijii = C("dynCall_iijii", 5);
f.dynCall_iiiiiiiiiiiiiiii = C("dynCall_iiiiiiiiiiiiiiii", 16);
f.dynCall_fdd = C("dynCall_fdd", 3);
f.dynCall_iidd = C("dynCall_iidd", 4);
f.dynCall_iiiij = C("dynCall_iiiij", 5);
f.dynCall_iid = C("dynCall_iid", 3);
f.dynCall_iiddi = C("dynCall_iiddi", 5);
f.dynCall_iidddddd = C("dynCall_iidddddd", 8);
f.dynCall_iiddddd = C("dynCall_iiddddd", 7);
f.dynCall_iiiijj = C("dynCall_iiiijj", 6);
f.dynCall_iiiiijiiii = C("dynCall_iiiiijiiii", 10);
f.dynCall_iiiiiiiifi = C("dynCall_iiiiiiiifi", 10);
f.dynCall_iiiijii = C("dynCall_iiiijii", 7);
f.dynCall_iiiiijiiiii = C("dynCall_iiiiijiiiii", 11);
f.dynCall_vijii = C("dynCall_vijii", 5);
f.dynCall_diiid = C("dynCall_diiid", 5);
f.dynCall_iidi = C("dynCall_iidi", 4);
f.dynCall_iiiid = C("dynCall_iiiid", 5);
f.dynCall_iiddddi = C("dynCall_iiddddi", 7);
f.dynCall_iiddddddddi = C("dynCall_iiddddddddi", 11);
f.dynCall_ddd = C("dynCall_ddd", 3);
f.dynCall_iijj = C("dynCall_iijj", 4);
f.dynCall_iiiji = C("dynCall_iiiji", 5);
f.dynCall_iijjjjjj = C("dynCall_iijjjjjj", 8);
f.dynCall_iiijii = C("dynCall_iiijii", 6);
f.dynCall_iiiijiiii = C("dynCall_iiiijiiii", 9);
function Hc(a, b) {
  var c = V();
  try {
    return Zc(a, b);
  } catch (d) {
    W(c);
    if (!(d instanceof E)) {
      throw d;
    }
    Z(1, 0);
  }
}
function Oc(a) {
  var b = V();
  try {
    dynCall_v(a);
  } catch (c) {
    W(b);
    if (!(c instanceof E)) {
      throw c;
    }
    Z(1, 0);
  }
}
function Qc(a, b, c) {
  var d = V();
  try {
    dynCall_vii(a, b, c);
  } catch (e) {
    W(d);
    if (!(e instanceof E)) {
      throw e;
    }
    Z(1, 0);
  }
}
function Pc(a, b) {
  var c = V();
  try {
    dynCall_vi(a, b);
  } catch (d) {
    W(c);
    if (!(d instanceof E)) {
      throw d;
    }
    Z(1, 0);
  }
}
function Sc(a, b, c, d, e) {
  var g = V();
  try {
    $c(a, b, c, d, e);
  } catch (k) {
    W(g);
    if (!(k instanceof E)) {
      throw k;
    }
    Z(1, 0);
  }
}
function Ic(a, b, c) {
  var d = V();
  try {
    return dynCall_iii(a, b, c);
  } catch (e) {
    W(d);
    if (!(e instanceof E)) {
      throw e;
    }
    Z(1, 0);
  }
}
function Rc(a, b, c, d) {
  var e = V();
  try {
    cd(a, b, c, d);
  } catch (g) {
    W(e);
    if (!(g instanceof E)) {
      throw g;
    }
    Z(1, 0);
  }
}
function Jc(a, b, c, d) {
  var e = V();
  try {
    return Yc(a, b, c, d);
  } catch (g) {
    W(e);
    if (!(g instanceof E)) {
      throw g;
    }
    Z(1, 0);
  }
}
function Kc(a, b, c, d, e) {
  var g = V();
  try {
    return dd(a, b, c, d, e);
  } catch (k) {
    W(g);
    if (!(k instanceof E)) {
      throw k;
    }
    Z(1, 0);
  }
}
function Lc(a, b, c, d, e, g, k) {
  var m = V();
  try {
    return ed(a, b, c, d, e, g, k);
  } catch (r) {
    W(m);
    if (!(r instanceof E)) {
      throw r;
    }
    Z(1, 0);
  }
}
function Nc(a, b, c, d) {
  var e = V();
  try {
    return gd(a, b, c, d);
  } catch (g) {
    W(e);
    if (!(g instanceof E)) {
      throw g;
    }
    Z(1, 0);
  }
}
function Tc(a, b, c, d, e, g) {
  var k = V();
  try {
    bd(a, b, c, d, e, g);
  } catch (m) {
    W(k);
    if (!(m instanceof E)) {
      throw m;
    }
    Z(1, 0);
  }
}
function Uc(a, b, c, d, e, g, k) {
  var m = V();
  try {
    ad(a, b, c, d, e, g, k);
  } catch (r) {
    W(m);
    if (!(r instanceof E)) {
      throw r;
    }
    Z(1, 0);
  }
}
function Mc(a, b, c, d, e, g, k, m, r) {
  var t = V();
  try {
    return fd(a, b, c, d, e, g, k, m, r);
  } catch (y) {
    W(t);
    if (!(y instanceof E)) {
      throw y;
    }
    Z(1, 0);
  }
}
f.callMain = hd;
f.ENV = sc;
f.FS = H;
f.NODEFS = O;
f.WORKERFS = Q;
"writeI53ToI64 writeI53ToI64Clamped writeI53ToI64Signaling writeI53ToU64Clamped writeI53ToU64Signaling readI53FromI64 readI53FromU64 convertI32PairToI53 convertI32PairToI53Checked convertU32PairToI53 getTempRet0 arraySum addDays inetPton4 inetNtop4 inetPton6 inetNtop6 readSockaddr writeSockaddr emscriptenLog readEmAsmArgs jstoi_q listenOnce autoResumeAudioContext dynCallLegacy getDynCaller dynCall runtimeKeepalivePush runtimeKeepalivePop callUserCallback maybeExit asmjsMangle HandleAllocator getNativeTypeSize STACK_SIZE STACK_ALIGN POINTER_SIZE ASSERTIONS getCFunc ccall cwrap uleb128Encode sigToWasmTypes generateFuncType convertJsFunctionToWasm getEmptyTableSlot updateTableMap getFunctionAddress addFunction removeFunction reallyNegative unSign strLen reSign formatString intArrayToString AsciiToString UTF16ToString stringToUTF16 lengthBytesUTF16 UTF32ToString stringToUTF32 lengthBytesUTF32 stringToNewUTF8 writeArrayToMemory registerKeyEventCallback maybeCStringToJsString findEventTarget getBoundingClientRect fillMouseEventData registerMouseEventCallback registerWheelEventCallback registerUiEventCallback registerFocusEventCallback fillDeviceOrientationEventData registerDeviceOrientationEventCallback fillDeviceMotionEventData registerDeviceMotionEventCallback screenOrientation fillOrientationChangeEventData registerOrientationChangeEventCallback fillFullscreenChangeEventData registerFullscreenChangeEventCallback JSEvents_requestFullscreen JSEvents_resizeCanvasForFullscreen registerRestoreOldStyle hideEverythingExceptGivenElement restoreHiddenElements setLetterbox softFullscreenResizeWebGLRenderTarget doRequestFullscreen fillPointerlockChangeEventData registerPointerlockChangeEventCallback registerPointerlockErrorEventCallback requestPointerLock fillVisibilityChangeEventData registerVisibilityChangeEventCallback registerTouchEventCallback fillGamepadEventData registerGamepadEventCallback registerBeforeUnloadEventCallback fillBatteryEventData battery registerBatteryEventCallback setCanvasElementSize getCanvasElementSize jsStackTrace getCallstack convertPCtoSourceLocation checkWasiClock wasiRightsToMuslOFlags wasiOFlagsToMuslOFlags createDyncallWrapper safeSetTimeout setImmediateWrapped clearImmediateWrapped polyfillSetImmediate getPromise makePromise idsToPromises makePromiseCallback Browser_asyncPrepareDataCounter setMainLoop getSocketFromFD getSocketAddress FS_unlink FS_mkdirTree _setNetworkCallback heapObjectForWebGLType toTypedArrayIndex webgl_enable_ANGLE_instanced_arrays webgl_enable_OES_vertex_array_object webgl_enable_WEBGL_draw_buffers webgl_enable_WEBGL_multi_draw emscriptenWebGLGet computeUnpackAlignedImageSize colorChannelsInGlTextureFormat emscriptenWebGLGetTexPixelData emscriptenWebGLGetUniform webglGetUniformLocation webglPrepareUniformLocationsBeforeFirstUse webglGetLeftBracePos emscriptenWebGLGetVertexAttrib __glGetActiveAttribOrUniform writeGLArray registerWebGlEventCallback runAndAbortIfError ALLOC_NORMAL ALLOC_STACK allocate writeStringToMemory writeAsciiToMemory setErrNo demangle stackTrace".split(" ").forEach(function(a) {
  "undefined" == typeof globalThis || Object.getOwnPropertyDescriptor(globalThis, a) || Object.defineProperty(globalThis, a, {configurable:!0, get() {
    var b = `\`${a}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`, c = a;
    c.startsWith("_") || (c = "$" + a);
    b += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${c}')`;
    bb(a) && (b += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you");
    db(b);
  }});
  eb(a);
});
"run addOnPreRun addOnInit addOnPreMain addOnExit addOnPostRun addRunDependency removeRunDependency out err abort wasmMemory wasmExports writeStackCookie checkStackCookie MAX_INT53 MIN_INT53 bigintToI53Checked stackSave stackRestore stackAlloc setTempRet0 ptrToString zeroMemory exitJS getHeapMax growMemory MONTH_DAYS_REGULAR MONTH_DAYS_LEAP MONTH_DAYS_REGULAR_CUMULATIVE MONTH_DAYS_LEAP_CUMULATIVE isLeapYear ydayFromDate ERRNO_CODES ERRNO_MESSAGES DNS Protocols Sockets initRandomFill randomFill timers warnOnce readEmAsmArgsArray jstoi_s getExecutableName handleException keepRuntimeAlive asyncLoad alignMemory mmapAlloc wasmTable noExitRuntime freeTableIndexes functionsInTableMap setValue getValue PATH PATH_FS UTF8Decoder UTF8ArrayToString UTF8ToString stringToUTF8Array stringToUTF8 lengthBytesUTF8 intArrayFromString stringToAscii UTF16Decoder stringToUTF8OnStack JSEvents specialHTMLTargets findCanvasEventTarget currentFullscreenStrategy restoreOldWindowedStyle UNWIND_CACHE ExitStatus getEnvStrings doReadv doWritev promiseMap uncaughtExceptionCount exceptionLast exceptionCaught ExceptionInfo findMatchingCatch getExceptionMessageCommon incrementExceptionRefcount decrementExceptionRefcount getExceptionMessage Browser getPreloadedImageData__data wget SYSCALLS preloadPlugins FS_createPreloadedFile FS_modeStringToFlags FS_getMode FS_stdin_getChar_buffer FS_stdin_getChar FS_createPath FS_createDevice FS_readFile FS_createDataFile FS_createLazyFile MEMFS TTY PIPEFS SOCKFS tempFixedLengthArray miniTempWebGLFloatBuffers miniTempWebGLIntBuffers GL AL GLUT EGL GLEW IDBStore SDL SDL_gfx allocateUTF8 allocateUTF8OnStack print printErr".split(" ").forEach(eb);
var jd;
Oa = function kd() {
  jd || ld();
  jd || (Oa = kd);
};
function hd(a = []) {
  n(0 == Ma, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  n(0 == Ha.length, "cannot call main when preRun functions remain to be called");
  a.unshift(ka);
  var b = a.length, c = Dc(4 * (b + 1)), d = c;
  a.forEach(g => {
    var k = A, m = d >> 2, r = Bb(g) + 1, t = Dc(r);
    oc(g, t, r);
    k[m] = t;
    d += 4;
  });
  A[d >> 2] = 0;
  try {
    var e = Wc(b, c);
    wc(e, !0);
    return e;
  } catch (g) {
    return zc(g);
  }
}
function ld() {
  var a = ja;
  if (!(0 < Ma)) {
    Xc();
    var b = Da();
    n(0 == (b & 3));
    0 == b && (b += 4);
    A[b >> 2] = 34821223;
    A[b + 4 >> 2] = 2310721022;
    A[0] = 1668509029;
    if (f.preRun) {
      for ("function" == typeof f.preRun && (f.preRun = [f.preRun]); f.preRun.length;) {
        b = f.preRun.shift(), Ha.unshift(b);
      }
    }
    gb(Ha);
    0 < Ma || (jd || (jd = !0, f.calledRun = !0, wa || (n(!La), La = !0, Ca(), f.noFSInit || H.L.Z || H.L(), H.ha = !1, gb(Ia), Ca(), gb(Ja), aa(f), md && hd(a), Ca(), gb(Ka))), Ca());
  }
}
function vc() {
  var a = ta, b = p, c = !1;
  ta = p = () => {
    c = !0;
  };
  try {
    jc(0), ["stdout", "stderr"].forEach(function(d) {
      (d = gc("/dev/" + d)) && Eb[d.object.rdev]?.output?.length && (c = !0);
    });
  } catch (d) {
  }
  ta = a;
  p = b;
  c && db("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
}
var md = !0;
f.noInitialRun && (md = !1);
ld();
Object.assign(H, {init:H.L, mkdir:H.mkdir, mount:H.m, chdir:H.chdir, writeFile:H.writeFile, readFile:H.readFile, createLazyFile:H.Ia, setIgnorePermissions:function(a) {
  H.ha = a;
},});
f.version = "10.03.1";
moduleRtn = ca;
for (const a of Object.keys(f)) {
  a in moduleArg || Object.defineProperty(moduleArg, a, {configurable:!0, get() {
    h(`Access to module property ('${a}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`);
  }});
}
;


  return moduleRtn;
}
);
})();
export default Module;
export const version = "10.03.1";
