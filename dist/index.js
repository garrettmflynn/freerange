(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name2 in all)
      __defProp(target, name2, { get: all[name2], enumerable: true });
  };
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // example/config.js
  var config_default = {
    port: 3e3,
    origin: "http://localhost"
  };

  // src/core/utils/info.ts
  var zipped = (suffix2, mimeType, codecs2) => mimeType && mimeType === codecs2.getType("gz") || suffix2.includes("gz");
  var fullSuffix = (fileName = "") => fileName.split(".").slice(1);
  var suffix = (fileName = "") => {
    const suffix2 = fullSuffix(fileName);
    const isZip = zipped(suffix2);
    if (isZip)
      suffix2.pop();
    return suffix2.join(".");
  };
  var name = (path) => path ? path.split("/").slice(-1)[0] : void 0;
  var directory = (path) => path ? path.split("/").slice(0, -1).join("/") : void 0;
  var esm = (suffix2) => suffix2 === "js" || suffix2 === "mjs";
  var get = (type8, name2, codecs2) => {
    let mimeType = type8;
    const isZipped = zipped(fullSuffix(name2), mimeType, codecs2);
    const sfx = suffix(name2);
    if (isZipped || !mimeType)
      mimeType = codecs2.getType(sfx);
    if (esm(sfx))
      mimeType = codecs2.getType("js");
    return { mimeType, zipped: isZipped, suffix: sfx };
  };

  // src/core/codecs/library/gzip.ts
  var gzip_exports = {};
  __export(gzip_exports, {
    decode: () => decode,
    encode: () => encode,
    suffixes: () => suffixes,
    type: () => type
  });

  // node_modules/pako/dist/pako.esm.mjs
  var Z_FIXED$1 = 4;
  var Z_BINARY = 0;
  var Z_TEXT = 1;
  var Z_UNKNOWN$1 = 2;
  function zero$1(buf) {
    let len = buf.length;
    while (--len >= 0) {
      buf[len] = 0;
    }
  }
  var STORED_BLOCK = 0;
  var STATIC_TREES = 1;
  var DYN_TREES = 2;
  var MIN_MATCH$1 = 3;
  var MAX_MATCH$1 = 258;
  var LENGTH_CODES$1 = 29;
  var LITERALS$1 = 256;
  var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
  var D_CODES$1 = 30;
  var BL_CODES$1 = 19;
  var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
  var MAX_BITS$1 = 15;
  var Buf_size = 16;
  var MAX_BL_BITS = 7;
  var END_BLOCK = 256;
  var REP_3_6 = 16;
  var REPZ_3_10 = 17;
  var REPZ_11_138 = 18;
  var extra_lbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]);
  var extra_dbits = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
  var extra_blbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]);
  var bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var DIST_CODE_LEN = 512;
  var static_ltree = new Array((L_CODES$1 + 2) * 2);
  zero$1(static_ltree);
  var static_dtree = new Array(D_CODES$1 * 2);
  zero$1(static_dtree);
  var _dist_code = new Array(DIST_CODE_LEN);
  zero$1(_dist_code);
  var _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
  zero$1(_length_code);
  var base_length = new Array(LENGTH_CODES$1);
  zero$1(base_length);
  var base_dist = new Array(D_CODES$1);
  zero$1(base_dist);
  function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
    this.static_tree = static_tree;
    this.extra_bits = extra_bits;
    this.extra_base = extra_base;
    this.elems = elems;
    this.max_length = max_length;
    this.has_stree = static_tree && static_tree.length;
  }
  var static_l_desc;
  var static_d_desc;
  var static_bl_desc;
  function TreeDesc(dyn_tree, stat_desc) {
    this.dyn_tree = dyn_tree;
    this.max_code = 0;
    this.stat_desc = stat_desc;
  }
  var d_code = (dist) => {
    return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
  };
  var put_short = (s, w) => {
    s.pending_buf[s.pending++] = w & 255;
    s.pending_buf[s.pending++] = w >>> 8 & 255;
  };
  var send_bits = (s, value, length) => {
    if (s.bi_valid > Buf_size - length) {
      s.bi_buf |= value << s.bi_valid & 65535;
      put_short(s, s.bi_buf);
      s.bi_buf = value >> Buf_size - s.bi_valid;
      s.bi_valid += length - Buf_size;
    } else {
      s.bi_buf |= value << s.bi_valid & 65535;
      s.bi_valid += length;
    }
  };
  var send_code = (s, c, tree) => {
    send_bits(s, tree[c * 2], tree[c * 2 + 1]);
  };
  var bi_reverse = (code, len) => {
    let res = 0;
    do {
      res |= code & 1;
      code >>>= 1;
      res <<= 1;
    } while (--len > 0);
    return res >>> 1;
  };
  var bi_flush = (s) => {
    if (s.bi_valid === 16) {
      put_short(s, s.bi_buf);
      s.bi_buf = 0;
      s.bi_valid = 0;
    } else if (s.bi_valid >= 8) {
      s.pending_buf[s.pending++] = s.bi_buf & 255;
      s.bi_buf >>= 8;
      s.bi_valid -= 8;
    }
  };
  var gen_bitlen = (s, desc) => {
    const tree = desc.dyn_tree;
    const max_code = desc.max_code;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const extra = desc.stat_desc.extra_bits;
    const base = desc.stat_desc.extra_base;
    const max_length = desc.stat_desc.max_length;
    let h;
    let n, m;
    let bits;
    let xbits;
    let f;
    let overflow = 0;
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      s.bl_count[bits] = 0;
    }
    tree[s.heap[s.heap_max] * 2 + 1] = 0;
    for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
      n = s.heap[h];
      bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
      if (bits > max_length) {
        bits = max_length;
        overflow++;
      }
      tree[n * 2 + 1] = bits;
      if (n > max_code) {
        continue;
      }
      s.bl_count[bits]++;
      xbits = 0;
      if (n >= base) {
        xbits = extra[n - base];
      }
      f = tree[n * 2];
      s.opt_len += f * (bits + xbits);
      if (has_stree) {
        s.static_len += f * (stree[n * 2 + 1] + xbits);
      }
    }
    if (overflow === 0) {
      return;
    }
    do {
      bits = max_length - 1;
      while (s.bl_count[bits] === 0) {
        bits--;
      }
      s.bl_count[bits]--;
      s.bl_count[bits + 1] += 2;
      s.bl_count[max_length]--;
      overflow -= 2;
    } while (overflow > 0);
    for (bits = max_length; bits !== 0; bits--) {
      n = s.bl_count[bits];
      while (n !== 0) {
        m = s.heap[--h];
        if (m > max_code) {
          continue;
        }
        if (tree[m * 2 + 1] !== bits) {
          s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
          tree[m * 2 + 1] = bits;
        }
        n--;
      }
    }
  };
  var gen_codes = (tree, max_code, bl_count) => {
    const next_code = new Array(MAX_BITS$1 + 1);
    let code = 0;
    let bits;
    let n;
    for (bits = 1; bits <= MAX_BITS$1; bits++) {
      next_code[bits] = code = code + bl_count[bits - 1] << 1;
    }
    for (n = 0; n <= max_code; n++) {
      let len = tree[n * 2 + 1];
      if (len === 0) {
        continue;
      }
      tree[n * 2] = bi_reverse(next_code[len]++, len);
    }
  };
  var tr_static_init = () => {
    let n;
    let bits;
    let length;
    let code;
    let dist;
    const bl_count = new Array(MAX_BITS$1 + 1);
    length = 0;
    for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
      base_length[code] = length;
      for (n = 0; n < 1 << extra_lbits[code]; n++) {
        _length_code[length++] = code;
      }
    }
    _length_code[length - 1] = code;
    dist = 0;
    for (code = 0; code < 16; code++) {
      base_dist[code] = dist;
      for (n = 0; n < 1 << extra_dbits[code]; n++) {
        _dist_code[dist++] = code;
      }
    }
    dist >>= 7;
    for (; code < D_CODES$1; code++) {
      base_dist[code] = dist << 7;
      for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
        _dist_code[256 + dist++] = code;
      }
    }
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      bl_count[bits] = 0;
    }
    n = 0;
    while (n <= 143) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    while (n <= 255) {
      static_ltree[n * 2 + 1] = 9;
      n++;
      bl_count[9]++;
    }
    while (n <= 279) {
      static_ltree[n * 2 + 1] = 7;
      n++;
      bl_count[7]++;
    }
    while (n <= 287) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
    for (n = 0; n < D_CODES$1; n++) {
      static_dtree[n * 2 + 1] = 5;
      static_dtree[n * 2] = bi_reverse(n, 5);
    }
    static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
    static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
    static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
  };
  var init_block = (s) => {
    let n;
    for (n = 0; n < L_CODES$1; n++) {
      s.dyn_ltree[n * 2] = 0;
    }
    for (n = 0; n < D_CODES$1; n++) {
      s.dyn_dtree[n * 2] = 0;
    }
    for (n = 0; n < BL_CODES$1; n++) {
      s.bl_tree[n * 2] = 0;
    }
    s.dyn_ltree[END_BLOCK * 2] = 1;
    s.opt_len = s.static_len = 0;
    s.last_lit = s.matches = 0;
  };
  var bi_windup = (s) => {
    if (s.bi_valid > 8) {
      put_short(s, s.bi_buf);
    } else if (s.bi_valid > 0) {
      s.pending_buf[s.pending++] = s.bi_buf;
    }
    s.bi_buf = 0;
    s.bi_valid = 0;
  };
  var copy_block = (s, buf, len, header) => {
    bi_windup(s);
    if (header) {
      put_short(s, len);
      put_short(s, ~len);
    }
    s.pending_buf.set(s.window.subarray(buf, buf + len), s.pending);
    s.pending += len;
  };
  var smaller = (tree, n, m, depth) => {
    const _n2 = n * 2;
    const _m2 = m * 2;
    return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
  };
  var pqdownheap = (s, tree, k) => {
    const v = s.heap[k];
    let j = k << 1;
    while (j <= s.heap_len) {
      if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
        j++;
      }
      if (smaller(tree, v, s.heap[j], s.depth)) {
        break;
      }
      s.heap[k] = s.heap[j];
      k = j;
      j <<= 1;
    }
    s.heap[k] = v;
  };
  var compress_block = (s, ltree, dtree) => {
    let dist;
    let lc;
    let lx = 0;
    let code;
    let extra;
    if (s.last_lit !== 0) {
      do {
        dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
        lc = s.pending_buf[s.l_buf + lx];
        lx++;
        if (dist === 0) {
          send_code(s, lc, ltree);
        } else {
          code = _length_code[lc];
          send_code(s, code + LITERALS$1 + 1, ltree);
          extra = extra_lbits[code];
          if (extra !== 0) {
            lc -= base_length[code];
            send_bits(s, lc, extra);
          }
          dist--;
          code = d_code(dist);
          send_code(s, code, dtree);
          extra = extra_dbits[code];
          if (extra !== 0) {
            dist -= base_dist[code];
            send_bits(s, dist, extra);
          }
        }
      } while (lx < s.last_lit);
    }
    send_code(s, END_BLOCK, ltree);
  };
  var build_tree = (s, desc) => {
    const tree = desc.dyn_tree;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const elems = desc.stat_desc.elems;
    let n, m;
    let max_code = -1;
    let node;
    s.heap_len = 0;
    s.heap_max = HEAP_SIZE$1;
    for (n = 0; n < elems; n++) {
      if (tree[n * 2] !== 0) {
        s.heap[++s.heap_len] = max_code = n;
        s.depth[n] = 0;
      } else {
        tree[n * 2 + 1] = 0;
      }
    }
    while (s.heap_len < 2) {
      node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
      tree[node * 2] = 1;
      s.depth[node] = 0;
      s.opt_len--;
      if (has_stree) {
        s.static_len -= stree[node * 2 + 1];
      }
    }
    desc.max_code = max_code;
    for (n = s.heap_len >> 1; n >= 1; n--) {
      pqdownheap(s, tree, n);
    }
    node = elems;
    do {
      n = s.heap[1];
      s.heap[1] = s.heap[s.heap_len--];
      pqdownheap(s, tree, 1);
      m = s.heap[1];
      s.heap[--s.heap_max] = n;
      s.heap[--s.heap_max] = m;
      tree[node * 2] = tree[n * 2] + tree[m * 2];
      s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
      tree[n * 2 + 1] = tree[m * 2 + 1] = node;
      s.heap[1] = node++;
      pqdownheap(s, tree, 1);
    } while (s.heap_len >= 2);
    s.heap[--s.heap_max] = s.heap[1];
    gen_bitlen(s, desc);
    gen_codes(tree, max_code, s.bl_count);
  };
  var scan_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    tree[(max_code + 1) * 2 + 1] = 65535;
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        s.bl_tree[curlen * 2] += count;
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          s.bl_tree[curlen * 2]++;
        }
        s.bl_tree[REP_3_6 * 2]++;
      } else if (count <= 10) {
        s.bl_tree[REPZ_3_10 * 2]++;
      } else {
        s.bl_tree[REPZ_11_138 * 2]++;
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  var send_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        do {
          send_code(s, curlen, s.bl_tree);
        } while (--count !== 0);
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          send_code(s, curlen, s.bl_tree);
          count--;
        }
        send_code(s, REP_3_6, s.bl_tree);
        send_bits(s, count - 3, 2);
      } else if (count <= 10) {
        send_code(s, REPZ_3_10, s.bl_tree);
        send_bits(s, count - 3, 3);
      } else {
        send_code(s, REPZ_11_138, s.bl_tree);
        send_bits(s, count - 11, 7);
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  var build_bl_tree = (s) => {
    let max_blindex;
    scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
    scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
    build_tree(s, s.bl_desc);
    for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
      if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
        break;
      }
    }
    s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
    return max_blindex;
  };
  var send_all_trees = (s, lcodes, dcodes, blcodes) => {
    let rank2;
    send_bits(s, lcodes - 257, 5);
    send_bits(s, dcodes - 1, 5);
    send_bits(s, blcodes - 4, 4);
    for (rank2 = 0; rank2 < blcodes; rank2++) {
      send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
    }
    send_tree(s, s.dyn_ltree, lcodes - 1);
    send_tree(s, s.dyn_dtree, dcodes - 1);
  };
  var detect_data_type = (s) => {
    let black_mask = 4093624447;
    let n;
    for (n = 0; n <= 31; n++, black_mask >>>= 1) {
      if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
        return Z_BINARY;
      }
    }
    if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
      return Z_TEXT;
    }
    for (n = 32; n < LITERALS$1; n++) {
      if (s.dyn_ltree[n * 2] !== 0) {
        return Z_TEXT;
      }
    }
    return Z_BINARY;
  };
  var static_init_done = false;
  var _tr_init$1 = (s) => {
    if (!static_init_done) {
      tr_static_init();
      static_init_done = true;
    }
    s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
    s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
    s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
    s.bi_buf = 0;
    s.bi_valid = 0;
    init_block(s);
  };
  var _tr_stored_block$1 = (s, buf, stored_len, last) => {
    send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
    copy_block(s, buf, stored_len, true);
  };
  var _tr_align$1 = (s) => {
    send_bits(s, STATIC_TREES << 1, 3);
    send_code(s, END_BLOCK, static_ltree);
    bi_flush(s);
  };
  var _tr_flush_block$1 = (s, buf, stored_len, last) => {
    let opt_lenb, static_lenb;
    let max_blindex = 0;
    if (s.level > 0) {
      if (s.strm.data_type === Z_UNKNOWN$1) {
        s.strm.data_type = detect_data_type(s);
      }
      build_tree(s, s.l_desc);
      build_tree(s, s.d_desc);
      max_blindex = build_bl_tree(s);
      opt_lenb = s.opt_len + 3 + 7 >>> 3;
      static_lenb = s.static_len + 3 + 7 >>> 3;
      if (static_lenb <= opt_lenb) {
        opt_lenb = static_lenb;
      }
    } else {
      opt_lenb = static_lenb = stored_len + 5;
    }
    if (stored_len + 4 <= opt_lenb && buf !== -1) {
      _tr_stored_block$1(s, buf, stored_len, last);
    } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
      send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
      compress_block(s, static_ltree, static_dtree);
    } else {
      send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
      send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
      compress_block(s, s.dyn_ltree, s.dyn_dtree);
    }
    init_block(s);
    if (last) {
      bi_windup(s);
    }
  };
  var _tr_tally$1 = (s, dist, lc) => {
    s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
    s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
    s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
    s.last_lit++;
    if (dist === 0) {
      s.dyn_ltree[lc * 2]++;
    } else {
      s.matches++;
      dist--;
      s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
      s.dyn_dtree[d_code(dist) * 2]++;
    }
    return s.last_lit === s.lit_bufsize - 1;
  };
  var _tr_init_1 = _tr_init$1;
  var _tr_stored_block_1 = _tr_stored_block$1;
  var _tr_flush_block_1 = _tr_flush_block$1;
  var _tr_tally_1 = _tr_tally$1;
  var _tr_align_1 = _tr_align$1;
  var trees = {
    _tr_init: _tr_init_1,
    _tr_stored_block: _tr_stored_block_1,
    _tr_flush_block: _tr_flush_block_1,
    _tr_tally: _tr_tally_1,
    _tr_align: _tr_align_1
  };
  var adler32 = (adler, buf, len, pos) => {
    let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
    while (len !== 0) {
      n = len > 2e3 ? 2e3 : len;
      len -= n;
      do {
        s1 = s1 + buf[pos++] | 0;
        s2 = s2 + s1 | 0;
      } while (--n);
      s1 %= 65521;
      s2 %= 65521;
    }
    return s1 | s2 << 16 | 0;
  };
  var adler32_1 = adler32;
  var makeTable = () => {
    let c, table = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  };
  var crcTable = new Uint32Array(makeTable());
  var crc32 = (crc, buf, len, pos) => {
    const t = crcTable;
    const end = pos + len;
    crc ^= -1;
    for (let i = pos; i < end; i++) {
      crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
    }
    return crc ^ -1;
  };
  var crc32_1 = crc32;
  var messages = {
    2: "need dictionary",
    1: "stream end",
    0: "",
    "-1": "file error",
    "-2": "stream error",
    "-3": "data error",
    "-4": "insufficient memory",
    "-5": "buffer error",
    "-6": "incompatible version"
  };
  var constants$2 = {
    Z_NO_FLUSH: 0,
    Z_PARTIAL_FLUSH: 1,
    Z_SYNC_FLUSH: 2,
    Z_FULL_FLUSH: 3,
    Z_FINISH: 4,
    Z_BLOCK: 5,
    Z_TREES: 6,
    Z_OK: 0,
    Z_STREAM_END: 1,
    Z_NEED_DICT: 2,
    Z_ERRNO: -1,
    Z_STREAM_ERROR: -2,
    Z_DATA_ERROR: -3,
    Z_MEM_ERROR: -4,
    Z_BUF_ERROR: -5,
    Z_NO_COMPRESSION: 0,
    Z_BEST_SPEED: 1,
    Z_BEST_COMPRESSION: 9,
    Z_DEFAULT_COMPRESSION: -1,
    Z_FILTERED: 1,
    Z_HUFFMAN_ONLY: 2,
    Z_RLE: 3,
    Z_FIXED: 4,
    Z_DEFAULT_STRATEGY: 0,
    Z_BINARY: 0,
    Z_TEXT: 1,
    Z_UNKNOWN: 2,
    Z_DEFLATED: 8
  };
  var { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
  var {
    Z_NO_FLUSH: Z_NO_FLUSH$2,
    Z_PARTIAL_FLUSH,
    Z_FULL_FLUSH: Z_FULL_FLUSH$1,
    Z_FINISH: Z_FINISH$3,
    Z_BLOCK: Z_BLOCK$1,
    Z_OK: Z_OK$3,
    Z_STREAM_END: Z_STREAM_END$3,
    Z_STREAM_ERROR: Z_STREAM_ERROR$2,
    Z_DATA_ERROR: Z_DATA_ERROR$2,
    Z_BUF_ERROR: Z_BUF_ERROR$1,
    Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
    Z_FILTERED,
    Z_HUFFMAN_ONLY,
    Z_RLE,
    Z_FIXED,
    Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
    Z_UNKNOWN,
    Z_DEFLATED: Z_DEFLATED$2
  } = constants$2;
  var MAX_MEM_LEVEL = 9;
  var MAX_WBITS$1 = 15;
  var DEF_MEM_LEVEL = 8;
  var LENGTH_CODES = 29;
  var LITERALS = 256;
  var L_CODES = LITERALS + 1 + LENGTH_CODES;
  var D_CODES = 30;
  var BL_CODES = 19;
  var HEAP_SIZE = 2 * L_CODES + 1;
  var MAX_BITS = 15;
  var MIN_MATCH = 3;
  var MAX_MATCH = 258;
  var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
  var PRESET_DICT = 32;
  var INIT_STATE = 42;
  var EXTRA_STATE = 69;
  var NAME_STATE = 73;
  var COMMENT_STATE = 91;
  var HCRC_STATE = 103;
  var BUSY_STATE = 113;
  var FINISH_STATE = 666;
  var BS_NEED_MORE = 1;
  var BS_BLOCK_DONE = 2;
  var BS_FINISH_STARTED = 3;
  var BS_FINISH_DONE = 4;
  var OS_CODE = 3;
  var err = (strm, errorCode) => {
    strm.msg = messages[errorCode];
    return errorCode;
  };
  var rank = (f) => {
    return (f << 1) - (f > 4 ? 9 : 0);
  };
  var zero = (buf) => {
    let len = buf.length;
    while (--len >= 0) {
      buf[len] = 0;
    }
  };
  var HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
  var HASH = HASH_ZLIB;
  var flush_pending = (strm) => {
    const s = strm.state;
    let len = s.pending;
    if (len > strm.avail_out) {
      len = strm.avail_out;
    }
    if (len === 0) {
      return;
    }
    strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
    strm.next_out += len;
    s.pending_out += len;
    strm.total_out += len;
    strm.avail_out -= len;
    s.pending -= len;
    if (s.pending === 0) {
      s.pending_out = 0;
    }
  };
  var flush_block_only = (s, last) => {
    _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
    s.block_start = s.strstart;
    flush_pending(s.strm);
  };
  var put_byte = (s, b) => {
    s.pending_buf[s.pending++] = b;
  };
  var putShortMSB = (s, b) => {
    s.pending_buf[s.pending++] = b >>> 8 & 255;
    s.pending_buf[s.pending++] = b & 255;
  };
  var read_buf = (strm, buf, start, size) => {
    let len = strm.avail_in;
    if (len > size) {
      len = size;
    }
    if (len === 0) {
      return 0;
    }
    strm.avail_in -= len;
    buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
    if (strm.state.wrap === 1) {
      strm.adler = adler32_1(strm.adler, buf, len, start);
    } else if (strm.state.wrap === 2) {
      strm.adler = crc32_1(strm.adler, buf, len, start);
    }
    strm.next_in += len;
    strm.total_in += len;
    return len;
  };
  var longest_match = (s, cur_match) => {
    let chain_length = s.max_chain_length;
    let scan = s.strstart;
    let match;
    let len;
    let best_len = s.prev_length;
    let nice_match = s.nice_match;
    const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
    const _win = s.window;
    const wmask = s.w_mask;
    const prev = s.prev;
    const strend = s.strstart + MAX_MATCH;
    let scan_end1 = _win[scan + best_len - 1];
    let scan_end = _win[scan + best_len];
    if (s.prev_length >= s.good_match) {
      chain_length >>= 2;
    }
    if (nice_match > s.lookahead) {
      nice_match = s.lookahead;
    }
    do {
      match = cur_match;
      if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
        continue;
      }
      scan += 2;
      match++;
      do {
      } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
      len = MAX_MATCH - (strend - scan);
      scan = strend - MAX_MATCH;
      if (len > best_len) {
        s.match_start = cur_match;
        best_len = len;
        if (len >= nice_match) {
          break;
        }
        scan_end1 = _win[scan + best_len - 1];
        scan_end = _win[scan + best_len];
      }
    } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
    if (best_len <= s.lookahead) {
      return best_len;
    }
    return s.lookahead;
  };
  var fill_window = (s) => {
    const _w_size = s.w_size;
    let p, n, m, more, str;
    do {
      more = s.window_size - s.lookahead - s.strstart;
      if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
        s.window.set(s.window.subarray(_w_size, _w_size + _w_size), 0);
        s.match_start -= _w_size;
        s.strstart -= _w_size;
        s.block_start -= _w_size;
        n = s.hash_size;
        p = n;
        do {
          m = s.head[--p];
          s.head[p] = m >= _w_size ? m - _w_size : 0;
        } while (--n);
        n = _w_size;
        p = n;
        do {
          m = s.prev[--p];
          s.prev[p] = m >= _w_size ? m - _w_size : 0;
        } while (--n);
        more += _w_size;
      }
      if (s.strm.avail_in === 0) {
        break;
      }
      n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
      s.lookahead += n;
      if (s.lookahead + s.insert >= MIN_MATCH) {
        str = s.strstart - s.insert;
        s.ins_h = s.window[str];
        s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
        while (s.insert) {
          s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
          s.prev[str & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str;
          str++;
          s.insert--;
          if (s.lookahead + s.insert < MIN_MATCH) {
            break;
          }
        }
      }
    } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
  };
  var deflate_stored = (s, flush) => {
    let max_block_size = 65535;
    if (max_block_size > s.pending_buf_size - 5) {
      max_block_size = s.pending_buf_size - 5;
    }
    for (; ; ) {
      if (s.lookahead <= 1) {
        fill_window(s);
        if (s.lookahead === 0 && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      s.strstart += s.lookahead;
      s.lookahead = 0;
      const max_start = s.block_start + max_block_size;
      if (s.strstart === 0 || s.strstart >= max_start) {
        s.lookahead = s.strstart - max_start;
        s.strstart = max_start;
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.strstart > s.block_start) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_NEED_MORE;
  };
  var deflate_fast = (s, flush) => {
    let hash_head;
    let bflush;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
      }
      if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
          s.match_length--;
          do {
            s.strstart++;
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          } while (--s.match_length !== 0);
          s.strstart++;
        } else {
          s.strstart += s.match_length;
          s.match_length = 0;
          s.ins_h = s.window[s.strstart];
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
        }
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.last_lit) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_slow = (s, flush) => {
    let hash_head;
    let bflush;
    let max_insert;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
      }
      s.prev_length = s.match_length;
      s.prev_match = s.match_start;
      s.match_length = MIN_MATCH - 1;
      if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
        if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
          s.match_length = MIN_MATCH - 1;
        }
      }
      if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
        max_insert = s.strstart + s.lookahead - MIN_MATCH;
        bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
        s.lookahead -= s.prev_length - 1;
        s.prev_length -= 2;
        do {
          if (++s.strstart <= max_insert) {
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
        } while (--s.prev_length !== 0);
        s.match_available = 0;
        s.match_length = MIN_MATCH - 1;
        s.strstart++;
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      } else if (s.match_available) {
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        if (bflush) {
          flush_block_only(s, false);
        }
        s.strstart++;
        s.lookahead--;
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      } else {
        s.match_available = 1;
        s.strstart++;
        s.lookahead--;
      }
    }
    if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      s.match_available = 0;
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.last_lit) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_rle = (s, flush) => {
    let bflush;
    let prev;
    let scan, strend;
    const _win = s.window;
    for (; ; ) {
      if (s.lookahead <= MAX_MATCH) {
        fill_window(s);
        if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      s.match_length = 0;
      if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
        scan = s.strstart - 1;
        prev = _win[scan];
        if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
          strend = s.strstart + MAX_MATCH;
          do {
          } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
          s.match_length = MAX_MATCH - (strend - scan);
          if (s.match_length > s.lookahead) {
            s.match_length = s.lookahead;
          }
        }
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        s.strstart += s.match_length;
        s.match_length = 0;
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.last_lit) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_huff = (s, flush) => {
    let bflush;
    for (; ; ) {
      if (s.lookahead === 0) {
        fill_window(s);
        if (s.lookahead === 0) {
          if (flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }
          break;
        }
      }
      s.match_length = 0;
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.last_lit) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  function Config(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }
  var configuration_table = [
    new Config(0, 0, 0, 0, deflate_stored),
    new Config(4, 4, 8, 4, deflate_fast),
    new Config(4, 5, 16, 8, deflate_fast),
    new Config(4, 6, 32, 32, deflate_fast),
    new Config(4, 4, 16, 16, deflate_slow),
    new Config(8, 16, 32, 32, deflate_slow),
    new Config(8, 16, 128, 128, deflate_slow),
    new Config(8, 32, 128, 256, deflate_slow),
    new Config(32, 128, 258, 1024, deflate_slow),
    new Config(32, 258, 258, 4096, deflate_slow)
  ];
  var lm_init = (s) => {
    s.window_size = 2 * s.w_size;
    zero(s.head);
    s.max_lazy_match = configuration_table[s.level].max_lazy;
    s.good_match = configuration_table[s.level].good_length;
    s.nice_match = configuration_table[s.level].nice_length;
    s.max_chain_length = configuration_table[s.level].max_chain;
    s.strstart = 0;
    s.block_start = 0;
    s.lookahead = 0;
    s.insert = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    s.ins_h = 0;
  };
  function DeflateState() {
    this.strm = null;
    this.status = 0;
    this.pending_buf = null;
    this.pending_buf_size = 0;
    this.pending_out = 0;
    this.pending = 0;
    this.wrap = 0;
    this.gzhead = null;
    this.gzindex = 0;
    this.method = Z_DEFLATED$2;
    this.last_flush = -1;
    this.w_size = 0;
    this.w_bits = 0;
    this.w_mask = 0;
    this.window = null;
    this.window_size = 0;
    this.prev = null;
    this.head = null;
    this.ins_h = 0;
    this.hash_size = 0;
    this.hash_bits = 0;
    this.hash_mask = 0;
    this.hash_shift = 0;
    this.block_start = 0;
    this.match_length = 0;
    this.prev_match = 0;
    this.match_available = 0;
    this.strstart = 0;
    this.match_start = 0;
    this.lookahead = 0;
    this.prev_length = 0;
    this.max_chain_length = 0;
    this.max_lazy_match = 0;
    this.level = 0;
    this.strategy = 0;
    this.good_match = 0;
    this.nice_match = 0;
    this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
    this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
    this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
    zero(this.dyn_ltree);
    zero(this.dyn_dtree);
    zero(this.bl_tree);
    this.l_desc = null;
    this.d_desc = null;
    this.bl_desc = null;
    this.bl_count = new Uint16Array(MAX_BITS + 1);
    this.heap = new Uint16Array(2 * L_CODES + 1);
    zero(this.heap);
    this.heap_len = 0;
    this.heap_max = 0;
    this.depth = new Uint16Array(2 * L_CODES + 1);
    zero(this.depth);
    this.l_buf = 0;
    this.lit_bufsize = 0;
    this.last_lit = 0;
    this.d_buf = 0;
    this.opt_len = 0;
    this.static_len = 0;
    this.matches = 0;
    this.insert = 0;
    this.bi_buf = 0;
    this.bi_valid = 0;
  }
  var deflateResetKeep = (strm) => {
    if (!strm || !strm.state) {
      return err(strm, Z_STREAM_ERROR$2);
    }
    strm.total_in = strm.total_out = 0;
    strm.data_type = Z_UNKNOWN;
    const s = strm.state;
    s.pending = 0;
    s.pending_out = 0;
    if (s.wrap < 0) {
      s.wrap = -s.wrap;
    }
    s.status = s.wrap ? INIT_STATE : BUSY_STATE;
    strm.adler = s.wrap === 2 ? 0 : 1;
    s.last_flush = Z_NO_FLUSH$2;
    _tr_init(s);
    return Z_OK$3;
  };
  var deflateReset = (strm) => {
    const ret = deflateResetKeep(strm);
    if (ret === Z_OK$3) {
      lm_init(strm.state);
    }
    return ret;
  };
  var deflateSetHeader = (strm, head) => {
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$2;
    }
    if (strm.state.wrap !== 2) {
      return Z_STREAM_ERROR$2;
    }
    strm.state.gzhead = head;
    return Z_OK$3;
  };
  var deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
    if (!strm) {
      return Z_STREAM_ERROR$2;
    }
    let wrap = 1;
    if (level === Z_DEFAULT_COMPRESSION$1) {
      level = 6;
    }
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else if (windowBits > 15) {
      wrap = 2;
      windowBits -= 16;
    }
    if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
      return err(strm, Z_STREAM_ERROR$2);
    }
    if (windowBits === 8) {
      windowBits = 9;
    }
    const s = new DeflateState();
    strm.state = s;
    s.strm = strm;
    s.wrap = wrap;
    s.gzhead = null;
    s.w_bits = windowBits;
    s.w_size = 1 << s.w_bits;
    s.w_mask = s.w_size - 1;
    s.hash_bits = memLevel + 7;
    s.hash_size = 1 << s.hash_bits;
    s.hash_mask = s.hash_size - 1;
    s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
    s.window = new Uint8Array(s.w_size * 2);
    s.head = new Uint16Array(s.hash_size);
    s.prev = new Uint16Array(s.w_size);
    s.lit_bufsize = 1 << memLevel + 6;
    s.pending_buf_size = s.lit_bufsize * 4;
    s.pending_buf = new Uint8Array(s.pending_buf_size);
    s.d_buf = 1 * s.lit_bufsize;
    s.l_buf = (1 + 2) * s.lit_bufsize;
    s.level = level;
    s.strategy = strategy;
    s.method = method;
    return deflateReset(strm);
  };
  var deflateInit = (strm, level) => {
    return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
  };
  var deflate$2 = (strm, flush) => {
    let beg, val;
    if (!strm || !strm.state || flush > Z_BLOCK$1 || flush < 0) {
      return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
      return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
    }
    s.strm = strm;
    const old_flush = s.last_flush;
    s.last_flush = flush;
    if (s.status === INIT_STATE) {
      if (s.wrap === 2) {
        strm.adler = 0;
        put_byte(s, 31);
        put_byte(s, 139);
        put_byte(s, 8);
        if (!s.gzhead) {
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, OS_CODE);
          s.status = BUSY_STATE;
        } else {
          put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
          put_byte(s, s.gzhead.time & 255);
          put_byte(s, s.gzhead.time >> 8 & 255);
          put_byte(s, s.gzhead.time >> 16 & 255);
          put_byte(s, s.gzhead.time >> 24 & 255);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, s.gzhead.os & 255);
          if (s.gzhead.extra && s.gzhead.extra.length) {
            put_byte(s, s.gzhead.extra.length & 255);
            put_byte(s, s.gzhead.extra.length >> 8 & 255);
          }
          if (s.gzhead.hcrc) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
          }
          s.gzindex = 0;
          s.status = EXTRA_STATE;
        }
      } else {
        let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
        let level_flags = -1;
        if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
          level_flags = 0;
        } else if (s.level < 6) {
          level_flags = 1;
        } else if (s.level === 6) {
          level_flags = 2;
        } else {
          level_flags = 3;
        }
        header |= level_flags << 6;
        if (s.strstart !== 0) {
          header |= PRESET_DICT;
        }
        header += 31 - header % 31;
        s.status = BUSY_STATE;
        putShortMSB(s, header);
        if (s.strstart !== 0) {
          putShortMSB(s, strm.adler >>> 16);
          putShortMSB(s, strm.adler & 65535);
        }
        strm.adler = 1;
      }
    }
    if (s.status === EXTRA_STATE) {
      if (s.gzhead.extra) {
        beg = s.pending;
        while (s.gzindex < (s.gzhead.extra.length & 65535)) {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            beg = s.pending;
            if (s.pending === s.pending_buf_size) {
              break;
            }
          }
          put_byte(s, s.gzhead.extra[s.gzindex] & 255);
          s.gzindex++;
        }
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        if (s.gzindex === s.gzhead.extra.length) {
          s.gzindex = 0;
          s.status = NAME_STATE;
        }
      } else {
        s.status = NAME_STATE;
      }
    }
    if (s.status === NAME_STATE) {
      if (s.gzhead.name) {
        beg = s.pending;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            beg = s.pending;
            if (s.pending === s.pending_buf_size) {
              val = 1;
              break;
            }
          }
          if (s.gzindex < s.gzhead.name.length) {
            val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        if (val === 0) {
          s.gzindex = 0;
          s.status = COMMENT_STATE;
        }
      } else {
        s.status = COMMENT_STATE;
      }
    }
    if (s.status === COMMENT_STATE) {
      if (s.gzhead.comment) {
        beg = s.pending;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            beg = s.pending;
            if (s.pending === s.pending_buf_size) {
              val = 1;
              break;
            }
          }
          if (s.gzindex < s.gzhead.comment.length) {
            val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        if (val === 0) {
          s.status = HCRC_STATE;
        }
      } else {
        s.status = HCRC_STATE;
      }
    }
    if (s.status === HCRC_STATE) {
      if (s.gzhead.hcrc) {
        if (s.pending + 2 > s.pending_buf_size) {
          flush_pending(strm);
        }
        if (s.pending + 2 <= s.pending_buf_size) {
          put_byte(s, strm.adler & 255);
          put_byte(s, strm.adler >> 8 & 255);
          strm.adler = 0;
          s.status = BUSY_STATE;
        }
      } else {
        s.status = BUSY_STATE;
      }
    }
    if (s.pending !== 0) {
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
      return err(strm, Z_BUF_ERROR$1);
    }
    if (s.status === FINISH_STATE && strm.avail_in !== 0) {
      return err(strm, Z_BUF_ERROR$1);
    }
    if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
      let bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
      if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
        s.status = FINISH_STATE;
      }
      if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
        if (strm.avail_out === 0) {
          s.last_flush = -1;
        }
        return Z_OK$3;
      }
      if (bstate === BS_BLOCK_DONE) {
        if (flush === Z_PARTIAL_FLUSH) {
          _tr_align(s);
        } else if (flush !== Z_BLOCK$1) {
          _tr_stored_block(s, 0, 0, false);
          if (flush === Z_FULL_FLUSH$1) {
            zero(s.head);
            if (s.lookahead === 0) {
              s.strstart = 0;
              s.block_start = 0;
              s.insert = 0;
            }
          }
        }
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
    }
    if (flush !== Z_FINISH$3) {
      return Z_OK$3;
    }
    if (s.wrap <= 0) {
      return Z_STREAM_END$3;
    }
    if (s.wrap === 2) {
      put_byte(s, strm.adler & 255);
      put_byte(s, strm.adler >> 8 & 255);
      put_byte(s, strm.adler >> 16 & 255);
      put_byte(s, strm.adler >> 24 & 255);
      put_byte(s, strm.total_in & 255);
      put_byte(s, strm.total_in >> 8 & 255);
      put_byte(s, strm.total_in >> 16 & 255);
      put_byte(s, strm.total_in >> 24 & 255);
    } else {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 65535);
    }
    flush_pending(strm);
    if (s.wrap > 0) {
      s.wrap = -s.wrap;
    }
    return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
  };
  var deflateEnd = (strm) => {
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$2;
    }
    const status = strm.state.status;
    if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
      return err(strm, Z_STREAM_ERROR$2);
    }
    strm.state = null;
    return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
  };
  var deflateSetDictionary = (strm, dictionary) => {
    let dictLength = dictionary.length;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    const wrap = s.wrap;
    if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
      return Z_STREAM_ERROR$2;
    }
    if (wrap === 1) {
      strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
    }
    s.wrap = 0;
    if (dictLength >= s.w_size) {
      if (wrap === 0) {
        zero(s.head);
        s.strstart = 0;
        s.block_start = 0;
        s.insert = 0;
      }
      let tmpDict = new Uint8Array(s.w_size);
      tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
      dictionary = tmpDict;
      dictLength = s.w_size;
    }
    const avail = strm.avail_in;
    const next = strm.next_in;
    const input = strm.input;
    strm.avail_in = dictLength;
    strm.next_in = 0;
    strm.input = dictionary;
    fill_window(s);
    while (s.lookahead >= MIN_MATCH) {
      let str = s.strstart;
      let n = s.lookahead - (MIN_MATCH - 1);
      do {
        s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
      } while (--n);
      s.strstart = str;
      s.lookahead = MIN_MATCH - 1;
      fill_window(s);
    }
    s.strstart += s.lookahead;
    s.block_start = s.strstart;
    s.insert = s.lookahead;
    s.lookahead = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    strm.next_in = next;
    strm.input = input;
    strm.avail_in = avail;
    s.wrap = wrap;
    return Z_OK$3;
  };
  var deflateInit_1 = deflateInit;
  var deflateInit2_1 = deflateInit2;
  var deflateReset_1 = deflateReset;
  var deflateResetKeep_1 = deflateResetKeep;
  var deflateSetHeader_1 = deflateSetHeader;
  var deflate_2$1 = deflate$2;
  var deflateEnd_1 = deflateEnd;
  var deflateSetDictionary_1 = deflateSetDictionary;
  var deflateInfo = "pako deflate (from Nodeca project)";
  var deflate_1$2 = {
    deflateInit: deflateInit_1,
    deflateInit2: deflateInit2_1,
    deflateReset: deflateReset_1,
    deflateResetKeep: deflateResetKeep_1,
    deflateSetHeader: deflateSetHeader_1,
    deflate: deflate_2$1,
    deflateEnd: deflateEnd_1,
    deflateSetDictionary: deflateSetDictionary_1,
    deflateInfo
  };
  var _has = (obj, key) => {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };
  var assign = function(obj) {
    const sources = Array.prototype.slice.call(arguments, 1);
    while (sources.length) {
      const source = sources.shift();
      if (!source) {
        continue;
      }
      if (typeof source !== "object") {
        throw new TypeError(source + "must be non-object");
      }
      for (const p in source) {
        if (_has(source, p)) {
          obj[p] = source[p];
        }
      }
    }
    return obj;
  };
  var flattenChunks = (chunks) => {
    let len = 0;
    for (let i = 0, l = chunks.length; i < l; i++) {
      len += chunks[i].length;
    }
    const result = new Uint8Array(len);
    for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
      let chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }
    return result;
  };
  var common = {
    assign,
    flattenChunks
  };
  var STR_APPLY_UIA_OK = true;
  try {
    String.fromCharCode.apply(null, new Uint8Array(1));
  } catch (__) {
    STR_APPLY_UIA_OK = false;
  }
  var _utf8len = new Uint8Array(256);
  for (let q = 0; q < 256; q++) {
    _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
  }
  _utf8len[254] = _utf8len[254] = 1;
  var string2buf = (str) => {
    if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
      return new TextEncoder().encode(str);
    }
    let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
    for (m_pos = 0; m_pos < str_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
    }
    buf = new Uint8Array(buf_len);
    for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      if (c < 128) {
        buf[i++] = c;
      } else if (c < 2048) {
        buf[i++] = 192 | c >>> 6;
        buf[i++] = 128 | c & 63;
      } else if (c < 65536) {
        buf[i++] = 224 | c >>> 12;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      } else {
        buf[i++] = 240 | c >>> 18;
        buf[i++] = 128 | c >>> 12 & 63;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      }
    }
    return buf;
  };
  var buf2binstring = (buf, len) => {
    if (len < 65534) {
      if (buf.subarray && STR_APPLY_UIA_OK) {
        return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
      }
    }
    let result = "";
    for (let i = 0; i < len; i++) {
      result += String.fromCharCode(buf[i]);
    }
    return result;
  };
  var buf2string = (buf, max) => {
    const len = max || buf.length;
    if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
      return new TextDecoder().decode(buf.subarray(0, max));
    }
    let i, out;
    const utf16buf = new Array(len * 2);
    for (out = 0, i = 0; i < len; ) {
      let c = buf[i++];
      if (c < 128) {
        utf16buf[out++] = c;
        continue;
      }
      let c_len = _utf8len[c];
      if (c_len > 4) {
        utf16buf[out++] = 65533;
        i += c_len - 1;
        continue;
      }
      c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
      while (c_len > 1 && i < len) {
        c = c << 6 | buf[i++] & 63;
        c_len--;
      }
      if (c_len > 1) {
        utf16buf[out++] = 65533;
        continue;
      }
      if (c < 65536) {
        utf16buf[out++] = c;
      } else {
        c -= 65536;
        utf16buf[out++] = 55296 | c >> 10 & 1023;
        utf16buf[out++] = 56320 | c & 1023;
      }
    }
    return buf2binstring(utf16buf, out);
  };
  var utf8border = (buf, max) => {
    max = max || buf.length;
    if (max > buf.length) {
      max = buf.length;
    }
    let pos = max - 1;
    while (pos >= 0 && (buf[pos] & 192) === 128) {
      pos--;
    }
    if (pos < 0) {
      return max;
    }
    if (pos === 0) {
      return max;
    }
    return pos + _utf8len[buf[pos]] > max ? pos : max;
  };
  var strings = {
    string2buf,
    buf2string,
    utf8border
  };
  function ZStream() {
    this.input = null;
    this.next_in = 0;
    this.avail_in = 0;
    this.total_in = 0;
    this.output = null;
    this.next_out = 0;
    this.avail_out = 0;
    this.total_out = 0;
    this.msg = "";
    this.state = null;
    this.data_type = 2;
    this.adler = 0;
  }
  var zstream = ZStream;
  var toString$1 = Object.prototype.toString;
  var {
    Z_NO_FLUSH: Z_NO_FLUSH$1,
    Z_SYNC_FLUSH,
    Z_FULL_FLUSH,
    Z_FINISH: Z_FINISH$2,
    Z_OK: Z_OK$2,
    Z_STREAM_END: Z_STREAM_END$2,
    Z_DEFAULT_COMPRESSION,
    Z_DEFAULT_STRATEGY,
    Z_DEFLATED: Z_DEFLATED$1
  } = constants$2;
  function Deflate$1(options2) {
    this.options = common.assign({
      level: Z_DEFAULT_COMPRESSION,
      method: Z_DEFLATED$1,
      chunkSize: 16384,
      windowBits: 15,
      memLevel: 8,
      strategy: Z_DEFAULT_STRATEGY
    }, options2 || {});
    let opt = this.options;
    if (opt.raw && opt.windowBits > 0) {
      opt.windowBits = -opt.windowBits;
    } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
      opt.windowBits += 16;
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = deflate_1$2.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    if (opt.header) {
      deflate_1$2.deflateSetHeader(this.strm, opt.header);
    }
    if (opt.dictionary) {
      let dict;
      if (typeof opt.dictionary === "string") {
        dict = strings.string2buf(opt.dictionary);
      } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
        dict = new Uint8Array(opt.dictionary);
      } else {
        dict = opt.dictionary;
      }
      status = deflate_1$2.deflateSetDictionary(this.strm, dict);
      if (status !== Z_OK$2) {
        throw new Error(messages[status]);
      }
      this._dict_set = true;
    }
  }
  Deflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    let status, _flush_mode;
    if (this.ended) {
      return false;
    }
    if (flush_mode === ~~flush_mode)
      _flush_mode = flush_mode;
    else
      _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
    if (typeof data === "string") {
      strm.input = strings.string2buf(data);
    } else if (toString$1.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      status = deflate_1$2.deflate(strm, _flush_mode);
      if (status === Z_STREAM_END$2) {
        if (strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
        }
        status = deflate_1$2.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK$2;
      }
      if (strm.avail_out === 0) {
        this.onData(strm.output);
        continue;
      }
      if (_flush_mode > 0 && strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      if (strm.avail_in === 0)
        break;
    }
    return true;
  };
  Deflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Deflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK$2) {
      this.result = common.flattenChunks(this.chunks);
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function deflate$1(input, options2) {
    const deflator = new Deflate$1(options2);
    deflator.push(input, true);
    if (deflator.err) {
      throw deflator.msg || messages[deflator.err];
    }
    return deflator.result;
  }
  function deflateRaw$1(input, options2) {
    options2 = options2 || {};
    options2.raw = true;
    return deflate$1(input, options2);
  }
  function gzip$1(input, options2) {
    options2 = options2 || {};
    options2.gzip = true;
    return deflate$1(input, options2);
  }
  var Deflate_1$1 = Deflate$1;
  var deflate_2 = deflate$1;
  var deflateRaw_1$1 = deflateRaw$1;
  var gzip_1$1 = gzip$1;
  var constants$1 = constants$2;
  var deflate_1$1 = {
    Deflate: Deflate_1$1,
    deflate: deflate_2,
    deflateRaw: deflateRaw_1$1,
    gzip: gzip_1$1,
    constants: constants$1
  };
  var BAD$1 = 30;
  var TYPE$1 = 12;
  var inffast = function inflate_fast(strm, start) {
    let _in;
    let last;
    let _out;
    let beg;
    let end;
    let dmax;
    let wsize;
    let whave;
    let wnext;
    let s_window;
    let hold;
    let bits;
    let lcode;
    let dcode;
    let lmask;
    let dmask;
    let here;
    let op;
    let len;
    let dist;
    let from;
    let from_source;
    let input, output;
    const state = strm.state;
    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257);
    dmax = state.dmax;
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    top:
      do {
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = lcode[hold & lmask];
        dolen:
          for (; ; ) {
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op === 0) {
              output[_out++] = here & 65535;
            } else if (op & 16) {
              len = here & 65535;
              op &= 15;
              if (op) {
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                len += hold & (1 << op) - 1;
                hold >>>= op;
                bits -= op;
              }
              if (bits < 15) {
                hold += input[_in++] << bits;
                bits += 8;
                hold += input[_in++] << bits;
                bits += 8;
              }
              here = dcode[hold & dmask];
              dodist:
                for (; ; ) {
                  op = here >>> 24;
                  hold >>>= op;
                  bits -= op;
                  op = here >>> 16 & 255;
                  if (op & 16) {
                    dist = here & 65535;
                    op &= 15;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                      }
                    }
                    dist += hold & (1 << op) - 1;
                    if (dist > dmax) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD$1;
                      break top;
                    }
                    hold >>>= op;
                    bits -= op;
                    op = _out - beg;
                    if (dist > op) {
                      op = dist - op;
                      if (op > whave) {
                        if (state.sane) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD$1;
                          break top;
                        }
                      }
                      from = 0;
                      from_source = s_window;
                      if (wnext === 0) {
                        from += wsize - op;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      } else if (wnext < op) {
                        from += wsize + wnext - op;
                        op -= wnext;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = 0;
                          if (wnext < len) {
                            op = wnext;
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        }
                      } else {
                        from += wnext - op;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      }
                      while (len > 2) {
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        len -= 3;
                      }
                      if (len) {
                        output[_out++] = from_source[from++];
                        if (len > 1) {
                          output[_out++] = from_source[from++];
                        }
                      }
                    } else {
                      from = _out - dist;
                      do {
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        len -= 3;
                      } while (len > 2);
                      if (len) {
                        output[_out++] = output[from++];
                        if (len > 1) {
                          output[_out++] = output[from++];
                        }
                      }
                    }
                  } else if ((op & 64) === 0) {
                    here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                    continue dodist;
                  } else {
                    strm.msg = "invalid distance code";
                    state.mode = BAD$1;
                    break top;
                  }
                  break;
                }
            } else if ((op & 64) === 0) {
              here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
              continue dolen;
            } else if (op & 32) {
              state.mode = TYPE$1;
              break top;
            } else {
              strm.msg = "invalid literal/length code";
              state.mode = BAD$1;
              break top;
            }
            break;
          }
      } while (_in < last && _out < end);
    len = bits >> 3;
    _in -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;
    strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
  };
  var MAXBITS = 15;
  var ENOUGH_LENS$1 = 852;
  var ENOUGH_DISTS$1 = 592;
  var CODES$1 = 0;
  var LENS$1 = 1;
  var DISTS$1 = 2;
  var lbase = new Uint16Array([
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258,
    0,
    0
  ]);
  var lext = new Uint8Array([
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    16,
    72,
    78
  ]);
  var dbase = new Uint16Array([
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577,
    0,
    0
  ]);
  var dext = new Uint8Array([
    16,
    16,
    16,
    16,
    17,
    17,
    18,
    18,
    19,
    19,
    20,
    20,
    21,
    21,
    22,
    22,
    23,
    23,
    24,
    24,
    25,
    25,
    26,
    26,
    27,
    27,
    28,
    28,
    29,
    29,
    64,
    64
  ]);
  var inflate_table = (type8, lens, lens_index, codes, table, table_index, work, opts) => {
    const bits = opts.bits;
    let len = 0;
    let sym = 0;
    let min = 0, max = 0;
    let root = 0;
    let curr = 0;
    let drop = 0;
    let left = 0;
    let used = 0;
    let huff = 0;
    let incr;
    let fill;
    let low;
    let mask;
    let next;
    let base = null;
    let base_index = 0;
    let end;
    const count = new Uint16Array(MAXBITS + 1);
    const offs = new Uint16Array(MAXBITS + 1);
    let extra = null;
    let extra_index = 0;
    let here_bits, here_op, here_val;
    for (len = 0; len <= MAXBITS; len++) {
      count[len] = 0;
    }
    for (sym = 0; sym < codes; sym++) {
      count[lens[lens_index + sym]]++;
    }
    root = bits;
    for (max = MAXBITS; max >= 1; max--) {
      if (count[max] !== 0) {
        break;
      }
    }
    if (root > max) {
      root = max;
    }
    if (max === 0) {
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      opts.bits = 1;
      return 0;
    }
    for (min = 1; min < max; min++) {
      if (count[min] !== 0) {
        break;
      }
    }
    if (root < min) {
      root = min;
    }
    left = 1;
    for (len = 1; len <= MAXBITS; len++) {
      left <<= 1;
      left -= count[len];
      if (left < 0) {
        return -1;
      }
    }
    if (left > 0 && (type8 === CODES$1 || max !== 1)) {
      return -1;
    }
    offs[1] = 0;
    for (len = 1; len < MAXBITS; len++) {
      offs[len + 1] = offs[len] + count[len];
    }
    for (sym = 0; sym < codes; sym++) {
      if (lens[lens_index + sym] !== 0) {
        work[offs[lens[lens_index + sym]]++] = sym;
      }
    }
    if (type8 === CODES$1) {
      base = extra = work;
      end = 19;
    } else if (type8 === LENS$1) {
      base = lbase;
      base_index -= 257;
      extra = lext;
      extra_index -= 257;
      end = 256;
    } else {
      base = dbase;
      extra = dext;
      end = -1;
    }
    huff = 0;
    sym = 0;
    len = min;
    next = table_index;
    curr = root;
    drop = 0;
    low = -1;
    used = 1 << root;
    mask = used - 1;
    if (type8 === LENS$1 && used > ENOUGH_LENS$1 || type8 === DISTS$1 && used > ENOUGH_DISTS$1) {
      return 1;
    }
    for (; ; ) {
      here_bits = len - drop;
      if (work[sym] < end) {
        here_op = 0;
        here_val = work[sym];
      } else if (work[sym] > end) {
        here_op = extra[extra_index + work[sym]];
        here_val = base[base_index + work[sym]];
      } else {
        here_op = 32 + 64;
        here_val = 0;
      }
      incr = 1 << len - drop;
      fill = 1 << curr;
      min = fill;
      do {
        fill -= incr;
        table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
      } while (fill !== 0);
      incr = 1 << len - 1;
      while (huff & incr) {
        incr >>= 1;
      }
      if (incr !== 0) {
        huff &= incr - 1;
        huff += incr;
      } else {
        huff = 0;
      }
      sym++;
      if (--count[len] === 0) {
        if (len === max) {
          break;
        }
        len = lens[lens_index + work[sym]];
      }
      if (len > root && (huff & mask) !== low) {
        if (drop === 0) {
          drop = root;
        }
        next += min;
        curr = len - drop;
        left = 1 << curr;
        while (curr + drop < max) {
          left -= count[curr + drop];
          if (left <= 0) {
            break;
          }
          curr++;
          left <<= 1;
        }
        used += 1 << curr;
        if (type8 === LENS$1 && used > ENOUGH_LENS$1 || type8 === DISTS$1 && used > ENOUGH_DISTS$1) {
          return 1;
        }
        low = huff & mask;
        table[low] = root << 24 | curr << 16 | next - table_index | 0;
      }
    }
    if (huff !== 0) {
      table[next + huff] = len - drop << 24 | 64 << 16 | 0;
    }
    opts.bits = root;
    return 0;
  };
  var inftrees = inflate_table;
  var CODES = 0;
  var LENS = 1;
  var DISTS = 2;
  var {
    Z_FINISH: Z_FINISH$1,
    Z_BLOCK,
    Z_TREES,
    Z_OK: Z_OK$1,
    Z_STREAM_END: Z_STREAM_END$1,
    Z_NEED_DICT: Z_NEED_DICT$1,
    Z_STREAM_ERROR: Z_STREAM_ERROR$1,
    Z_DATA_ERROR: Z_DATA_ERROR$1,
    Z_MEM_ERROR: Z_MEM_ERROR$1,
    Z_BUF_ERROR,
    Z_DEFLATED
  } = constants$2;
  var HEAD = 1;
  var FLAGS = 2;
  var TIME = 3;
  var OS = 4;
  var EXLEN = 5;
  var EXTRA = 6;
  var NAME = 7;
  var COMMENT = 8;
  var HCRC = 9;
  var DICTID = 10;
  var DICT = 11;
  var TYPE = 12;
  var TYPEDO = 13;
  var STORED = 14;
  var COPY_ = 15;
  var COPY = 16;
  var TABLE = 17;
  var LENLENS = 18;
  var CODELENS = 19;
  var LEN_ = 20;
  var LEN = 21;
  var LENEXT = 22;
  var DIST = 23;
  var DISTEXT = 24;
  var MATCH = 25;
  var LIT = 26;
  var CHECK = 27;
  var LENGTH = 28;
  var DONE = 29;
  var BAD = 30;
  var MEM = 31;
  var SYNC = 32;
  var ENOUGH_LENS = 852;
  var ENOUGH_DISTS = 592;
  var MAX_WBITS = 15;
  var DEF_WBITS = MAX_WBITS;
  var zswap32 = (q) => {
    return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
  };
  function InflateState() {
    this.mode = 0;
    this.last = false;
    this.wrap = 0;
    this.havedict = false;
    this.flags = 0;
    this.dmax = 0;
    this.check = 0;
    this.total = 0;
    this.head = null;
    this.wbits = 0;
    this.wsize = 0;
    this.whave = 0;
    this.wnext = 0;
    this.window = null;
    this.hold = 0;
    this.bits = 0;
    this.length = 0;
    this.offset = 0;
    this.extra = 0;
    this.lencode = null;
    this.distcode = null;
    this.lenbits = 0;
    this.distbits = 0;
    this.ncode = 0;
    this.nlen = 0;
    this.ndist = 0;
    this.have = 0;
    this.next = null;
    this.lens = new Uint16Array(320);
    this.work = new Uint16Array(288);
    this.lendyn = null;
    this.distdyn = null;
    this.sane = 0;
    this.back = 0;
    this.was = 0;
  }
  var inflateResetKeep = (strm) => {
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = "";
    if (state.wrap) {
      strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.dmax = 32768;
    state.head = null;
    state.hold = 0;
    state.bits = 0;
    state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
    state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
    state.sane = 1;
    state.back = -1;
    return Z_OK$1;
  };
  var inflateReset = (strm) => {
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
  };
  var inflateReset2 = (strm, windowBits) => {
    let wrap;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else {
      wrap = (windowBits >> 4) + 1;
      if (windowBits < 48) {
        windowBits &= 15;
      }
    }
    if (windowBits && (windowBits < 8 || windowBits > 15)) {
      return Z_STREAM_ERROR$1;
    }
    if (state.window !== null && state.wbits !== windowBits) {
      state.window = null;
    }
    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
  };
  var inflateInit2 = (strm, windowBits) => {
    if (!strm) {
      return Z_STREAM_ERROR$1;
    }
    const state = new InflateState();
    strm.state = state;
    state.window = null;
    const ret = inflateReset2(strm, windowBits);
    if (ret !== Z_OK$1) {
      strm.state = null;
    }
    return ret;
  };
  var inflateInit = (strm) => {
    return inflateInit2(strm, DEF_WBITS);
  };
  var virgin = true;
  var lenfix;
  var distfix;
  var fixedtables = (state) => {
    if (virgin) {
      lenfix = new Int32Array(512);
      distfix = new Int32Array(32);
      let sym = 0;
      while (sym < 144) {
        state.lens[sym++] = 8;
      }
      while (sym < 256) {
        state.lens[sym++] = 9;
      }
      while (sym < 280) {
        state.lens[sym++] = 7;
      }
      while (sym < 288) {
        state.lens[sym++] = 8;
      }
      inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
      sym = 0;
      while (sym < 32) {
        state.lens[sym++] = 5;
      }
      inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
      virgin = false;
    }
    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
  };
  var updatewindow = (strm, src, end, copy) => {
    let dist;
    const state = strm.state;
    if (state.window === null) {
      state.wsize = 1 << state.wbits;
      state.wnext = 0;
      state.whave = 0;
      state.window = new Uint8Array(state.wsize);
    }
    if (copy >= state.wsize) {
      state.window.set(src.subarray(end - state.wsize, end), 0);
      state.wnext = 0;
      state.whave = state.wsize;
    } else {
      dist = state.wsize - state.wnext;
      if (dist > copy) {
        dist = copy;
      }
      state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
      copy -= dist;
      if (copy) {
        state.window.set(src.subarray(end - copy, end), 0);
        state.wnext = copy;
        state.whave = state.wsize;
      } else {
        state.wnext += dist;
        if (state.wnext === state.wsize) {
          state.wnext = 0;
        }
        if (state.whave < state.wsize) {
          state.whave += dist;
        }
      }
    }
    return 0;
  };
  var inflate$2 = (strm, flush) => {
    let state;
    let input, output;
    let next;
    let put;
    let have, left;
    let hold;
    let bits;
    let _in, _out;
    let copy;
    let from;
    let from_source;
    let here = 0;
    let here_bits, here_op, here_val;
    let last_bits, last_op, last_val;
    let len;
    let ret;
    const hbuf = new Uint8Array(4);
    let opts;
    let n;
    const order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.mode === TYPE) {
      state.mode = TYPEDO;
    }
    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    _in = have;
    _out = left;
    ret = Z_OK$1;
    inf_leave:
      for (; ; ) {
        switch (state.mode) {
          case HEAD:
            if (state.wrap === 0) {
              state.mode = TYPEDO;
              break;
            }
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 2 && hold === 35615) {
              state.check = 0;
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
              hold = 0;
              bits = 0;
              state.mode = FLAGS;
              break;
            }
            state.flags = 0;
            if (state.head) {
              state.head.done = false;
            }
            if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
              strm.msg = "incorrect header check";
              state.mode = BAD;
              break;
            }
            if ((hold & 15) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            hold >>>= 4;
            bits -= 4;
            len = (hold & 15) + 8;
            if (state.wbits === 0) {
              state.wbits = len;
            } else if (len > state.wbits) {
              strm.msg = "invalid window size";
              state.mode = BAD;
              break;
            }
            state.dmax = 1 << state.wbits;
            strm.adler = state.check = 1;
            state.mode = hold & 512 ? DICTID : TYPE;
            hold = 0;
            bits = 0;
            break;
          case FLAGS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.flags = hold;
            if ((state.flags & 255) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            if (state.flags & 57344) {
              strm.msg = "unknown header flags set";
              state.mode = BAD;
              break;
            }
            if (state.head) {
              state.head.text = hold >> 8 & 1;
            }
            if (state.flags & 512) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = TIME;
          case TIME:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.time = hold;
            }
            if (state.flags & 512) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              hbuf[2] = hold >>> 16 & 255;
              hbuf[3] = hold >>> 24 & 255;
              state.check = crc32_1(state.check, hbuf, 4, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = OS;
          case OS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.xflags = hold & 255;
              state.head.os = hold >> 8;
            }
            if (state.flags & 512) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = EXLEN;
          case EXLEN:
            if (state.flags & 1024) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.length = hold;
              if (state.head) {
                state.head.extra_len = hold;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32_1(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
            } else if (state.head) {
              state.head.extra = null;
            }
            state.mode = EXTRA;
          case EXTRA:
            if (state.flags & 1024) {
              copy = state.length;
              if (copy > have) {
                copy = have;
              }
              if (copy) {
                if (state.head) {
                  len = state.head.extra_len - state.length;
                  if (!state.head.extra) {
                    state.head.extra = new Uint8Array(state.head.extra_len);
                  }
                  state.head.extra.set(input.subarray(next, next + copy), len);
                }
                if (state.flags & 512) {
                  state.check = crc32_1(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                state.length -= copy;
              }
              if (state.length) {
                break inf_leave;
              }
            }
            state.length = 0;
            state.mode = NAME;
          case NAME:
            if (state.flags & 2048) {
              if (have === 0) {
                break inf_leave;
              }
              copy = 0;
              do {
                len = input[next + copy++];
                if (state.head && len && state.length < 65536) {
                  state.head.name += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 512) {
                state.check = crc32_1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.name = null;
            }
            state.length = 0;
            state.mode = COMMENT;
          case COMMENT:
            if (state.flags & 4096) {
              if (have === 0) {
                break inf_leave;
              }
              copy = 0;
              do {
                len = input[next + copy++];
                if (state.head && len && state.length < 65536) {
                  state.head.comment += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 512) {
                state.check = crc32_1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.comment = null;
            }
            state.mode = HCRC;
          case HCRC:
            if (state.flags & 512) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (hold !== (state.check & 65535)) {
                strm.msg = "header crc mismatch";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            if (state.head) {
              state.head.hcrc = state.flags >> 9 & 1;
              state.head.done = true;
            }
            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;
          case DICTID:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            strm.adler = state.check = zswap32(hold);
            hold = 0;
            bits = 0;
            state.mode = DICT;
          case DICT:
            if (state.havedict === 0) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              return Z_NEED_DICT$1;
            }
            strm.adler = state.check = 1;
            state.mode = TYPE;
          case TYPE:
            if (flush === Z_BLOCK || flush === Z_TREES) {
              break inf_leave;
            }
          case TYPEDO:
            if (state.last) {
              hold >>>= bits & 7;
              bits -= bits & 7;
              state.mode = CHECK;
              break;
            }
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.last = hold & 1;
            hold >>>= 1;
            bits -= 1;
            switch (hold & 3) {
              case 0:
                state.mode = STORED;
                break;
              case 1:
                fixedtables(state);
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  hold >>>= 2;
                  bits -= 2;
                  break inf_leave;
                }
                break;
              case 2:
                state.mode = TABLE;
                break;
              case 3:
                strm.msg = "invalid block type";
                state.mode = BAD;
            }
            hold >>>= 2;
            bits -= 2;
            break;
          case STORED:
            hold >>>= bits & 7;
            bits -= bits & 7;
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
              strm.msg = "invalid stored block lengths";
              state.mode = BAD;
              break;
            }
            state.length = hold & 65535;
            hold = 0;
            bits = 0;
            state.mode = COPY_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          case COPY_:
            state.mode = COPY;
          case COPY:
            copy = state.length;
            if (copy) {
              if (copy > have) {
                copy = have;
              }
              if (copy > left) {
                copy = left;
              }
              if (copy === 0) {
                break inf_leave;
              }
              output.set(input.subarray(next, next + copy), put);
              have -= copy;
              next += copy;
              left -= copy;
              put += copy;
              state.length -= copy;
              break;
            }
            state.mode = TYPE;
            break;
          case TABLE:
            while (bits < 14) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.nlen = (hold & 31) + 257;
            hold >>>= 5;
            bits -= 5;
            state.ndist = (hold & 31) + 1;
            hold >>>= 5;
            bits -= 5;
            state.ncode = (hold & 15) + 4;
            hold >>>= 4;
            bits -= 4;
            if (state.nlen > 286 || state.ndist > 30) {
              strm.msg = "too many length or distance symbols";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = LENLENS;
          case LENLENS:
            while (state.have < state.ncode) {
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.lens[order[state.have++]] = hold & 7;
              hold >>>= 3;
              bits -= 3;
            }
            while (state.have < 19) {
              state.lens[order[state.have++]] = 0;
            }
            state.lencode = state.lendyn;
            state.lenbits = 7;
            opts = { bits: state.lenbits };
            ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid code lengths set";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = CODELENS;
          case CODELENS:
            while (state.have < state.nlen + state.ndist) {
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (here_val < 16) {
                hold >>>= here_bits;
                bits -= here_bits;
                state.lens[state.have++] = here_val;
              } else {
                if (here_val === 16) {
                  n = here_bits + 2;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  if (state.have === 0) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  len = state.lens[state.have - 1];
                  copy = 3 + (hold & 3);
                  hold >>>= 2;
                  bits -= 2;
                } else if (here_val === 17) {
                  n = here_bits + 3;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len = 0;
                  copy = 3 + (hold & 7);
                  hold >>>= 3;
                  bits -= 3;
                } else {
                  n = here_bits + 7;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len = 0;
                  copy = 11 + (hold & 127);
                  hold >>>= 7;
                  bits -= 7;
                }
                if (state.have + copy > state.nlen + state.ndist) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                while (copy--) {
                  state.lens[state.have++] = len;
                }
              }
            }
            if (state.mode === BAD) {
              break;
            }
            if (state.lens[256] === 0) {
              strm.msg = "invalid code -- missing end-of-block";
              state.mode = BAD;
              break;
            }
            state.lenbits = 9;
            opts = { bits: state.lenbits };
            ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid literal/lengths set";
              state.mode = BAD;
              break;
            }
            state.distbits = 6;
            state.distcode = state.distdyn;
            opts = { bits: state.distbits };
            ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
            state.distbits = opts.bits;
            if (ret) {
              strm.msg = "invalid distances set";
              state.mode = BAD;
              break;
            }
            state.mode = LEN_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          case LEN_:
            state.mode = LEN;
          case LEN:
            if (have >= 6 && left >= 258) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              inffast(strm, _out);
              put = strm.next_out;
              output = strm.output;
              left = strm.avail_out;
              next = strm.next_in;
              input = strm.input;
              have = strm.avail_in;
              hold = state.hold;
              bits = state.bits;
              if (state.mode === TYPE) {
                state.back = -1;
              }
              break;
            }
            state.back = 0;
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_op && (here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            state.length = here_val;
            if (here_op === 0) {
              state.mode = LIT;
              break;
            }
            if (here_op & 32) {
              state.back = -1;
              state.mode = TYPE;
              break;
            }
            if (here_op & 64) {
              strm.msg = "invalid literal/length code";
              state.mode = BAD;
              break;
            }
            state.extra = here_op & 15;
            state.mode = LENEXT;
          case LENEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.length += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            state.was = state.length;
            state.mode = DIST;
          case DIST:
            for (; ; ) {
              here = state.distcode[hold & (1 << state.distbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if ((here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            if (here_op & 64) {
              strm.msg = "invalid distance code";
              state.mode = BAD;
              break;
            }
            state.offset = here_val;
            state.extra = here_op & 15;
            state.mode = DISTEXT;
          case DISTEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.offset += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            if (state.offset > state.dmax) {
              strm.msg = "invalid distance too far back";
              state.mode = BAD;
              break;
            }
            state.mode = MATCH;
          case MATCH:
            if (left === 0) {
              break inf_leave;
            }
            copy = _out - left;
            if (state.offset > copy) {
              copy = state.offset - copy;
              if (copy > state.whave) {
                if (state.sane) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
              }
              if (copy > state.wnext) {
                copy -= state.wnext;
                from = state.wsize - copy;
              } else {
                from = state.wnext - copy;
              }
              if (copy > state.length) {
                copy = state.length;
              }
              from_source = state.window;
            } else {
              from_source = output;
              from = put - state.offset;
              copy = state.length;
            }
            if (copy > left) {
              copy = left;
            }
            left -= copy;
            state.length -= copy;
            do {
              output[put++] = from_source[from++];
            } while (--copy);
            if (state.length === 0) {
              state.mode = LEN;
            }
            break;
          case LIT:
            if (left === 0) {
              break inf_leave;
            }
            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;
          case CHECK:
            if (state.wrap) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold |= input[next++] << bits;
                bits += 8;
              }
              _out -= left;
              strm.total_out += _out;
              state.total += _out;
              if (_out) {
                strm.adler = state.check = state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
              }
              _out = left;
              if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                strm.msg = "incorrect data check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = LENGTH;
          case LENGTH:
            if (state.wrap && state.flags) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (hold !== (state.total & 4294967295)) {
                strm.msg = "incorrect length check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = DONE;
          case DONE:
            ret = Z_STREAM_END$1;
            break inf_leave;
          case BAD:
            ret = Z_DATA_ERROR$1;
            break inf_leave;
          case MEM:
            return Z_MEM_ERROR$1;
          case SYNC:
          default:
            return Z_STREAM_ERROR$1;
        }
      }
    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
      if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out))
        ;
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap && _out) {
      strm.adler = state.check = state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
    if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
      ret = Z_BUF_ERROR;
    }
    return ret;
  };
  var inflateEnd = (strm) => {
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }
    let state = strm.state;
    if (state.window) {
      state.window = null;
    }
    strm.state = null;
    return Z_OK$1;
  };
  var inflateGetHeader = (strm, head) => {
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if ((state.wrap & 2) === 0) {
      return Z_STREAM_ERROR$1;
    }
    state.head = head;
    head.done = false;
    return Z_OK$1;
  };
  var inflateSetDictionary = (strm, dictionary) => {
    const dictLength = dictionary.length;
    let state;
    let dictid;
    let ret;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.wrap !== 0 && state.mode !== DICT) {
      return Z_STREAM_ERROR$1;
    }
    if (state.mode === DICT) {
      dictid = 1;
      dictid = adler32_1(dictid, dictionary, dictLength, 0);
      if (dictid !== state.check) {
        return Z_DATA_ERROR$1;
      }
    }
    ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret) {
      state.mode = MEM;
      return Z_MEM_ERROR$1;
    }
    state.havedict = 1;
    return Z_OK$1;
  };
  var inflateReset_1 = inflateReset;
  var inflateReset2_1 = inflateReset2;
  var inflateResetKeep_1 = inflateResetKeep;
  var inflateInit_1 = inflateInit;
  var inflateInit2_1 = inflateInit2;
  var inflate_2$1 = inflate$2;
  var inflateEnd_1 = inflateEnd;
  var inflateGetHeader_1 = inflateGetHeader;
  var inflateSetDictionary_1 = inflateSetDictionary;
  var inflateInfo = "pako inflate (from Nodeca project)";
  var inflate_1$2 = {
    inflateReset: inflateReset_1,
    inflateReset2: inflateReset2_1,
    inflateResetKeep: inflateResetKeep_1,
    inflateInit: inflateInit_1,
    inflateInit2: inflateInit2_1,
    inflate: inflate_2$1,
    inflateEnd: inflateEnd_1,
    inflateGetHeader: inflateGetHeader_1,
    inflateSetDictionary: inflateSetDictionary_1,
    inflateInfo
  };
  function GZheader() {
    this.text = 0;
    this.time = 0;
    this.xflags = 0;
    this.os = 0;
    this.extra = null;
    this.extra_len = 0;
    this.name = "";
    this.comment = "";
    this.hcrc = 0;
    this.done = false;
  }
  var gzheader = GZheader;
  var toString = Object.prototype.toString;
  var {
    Z_NO_FLUSH,
    Z_FINISH,
    Z_OK,
    Z_STREAM_END,
    Z_NEED_DICT,
    Z_STREAM_ERROR,
    Z_DATA_ERROR,
    Z_MEM_ERROR
  } = constants$2;
  function Inflate$1(options2) {
    this.options = common.assign({
      chunkSize: 1024 * 64,
      windowBits: 15,
      to: ""
    }, options2 || {});
    const opt = this.options;
    if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
      opt.windowBits = -opt.windowBits;
      if (opt.windowBits === 0) {
        opt.windowBits = -15;
      }
    }
    if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options2 && options2.windowBits)) {
      opt.windowBits += 32;
    }
    if (opt.windowBits > 15 && opt.windowBits < 48) {
      if ((opt.windowBits & 15) === 0) {
        opt.windowBits |= 15;
      }
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = inflate_1$2.inflateInit2(this.strm, opt.windowBits);
    if (status !== Z_OK) {
      throw new Error(messages[status]);
    }
    this.header = new gzheader();
    inflate_1$2.inflateGetHeader(this.strm, this.header);
    if (opt.dictionary) {
      if (typeof opt.dictionary === "string") {
        opt.dictionary = strings.string2buf(opt.dictionary);
      } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
        opt.dictionary = new Uint8Array(opt.dictionary);
      }
      if (opt.raw) {
        status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
        if (status !== Z_OK) {
          throw new Error(messages[status]);
        }
      }
    }
  }
  Inflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    const dictionary = this.options.dictionary;
    let status, _flush_mode, last_avail_out;
    if (this.ended)
      return false;
    if (flush_mode === ~~flush_mode)
      _flush_mode = flush_mode;
    else
      _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
    if (toString.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      status = inflate_1$2.inflate(strm, _flush_mode);
      if (status === Z_NEED_DICT && dictionary) {
        status = inflate_1$2.inflateSetDictionary(strm, dictionary);
        if (status === Z_OK) {
          status = inflate_1$2.inflate(strm, _flush_mode);
        } else if (status === Z_DATA_ERROR) {
          status = Z_NEED_DICT;
        }
      }
      while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
        inflate_1$2.inflateReset(strm);
        status = inflate_1$2.inflate(strm, _flush_mode);
      }
      switch (status) {
        case Z_STREAM_ERROR:
        case Z_DATA_ERROR:
        case Z_NEED_DICT:
        case Z_MEM_ERROR:
          this.onEnd(status);
          this.ended = true;
          return false;
      }
      last_avail_out = strm.avail_out;
      if (strm.next_out) {
        if (strm.avail_out === 0 || status === Z_STREAM_END) {
          if (this.options.to === "string") {
            let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
            let tail = strm.next_out - next_out_utf8;
            let utf8str = strings.buf2string(strm.output, next_out_utf8);
            strm.next_out = tail;
            strm.avail_out = chunkSize - tail;
            if (tail)
              strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
            this.onData(utf8str);
          } else {
            this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
          }
        }
      }
      if (status === Z_OK && last_avail_out === 0)
        continue;
      if (status === Z_STREAM_END) {
        status = inflate_1$2.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return true;
      }
      if (strm.avail_in === 0)
        break;
    }
    return true;
  };
  Inflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Inflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK) {
      if (this.options.to === "string") {
        this.result = this.chunks.join("");
      } else {
        this.result = common.flattenChunks(this.chunks);
      }
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function inflate$1(input, options2) {
    const inflator = new Inflate$1(options2);
    inflator.push(input);
    if (inflator.err)
      throw inflator.msg || messages[inflator.err];
    return inflator.result;
  }
  function inflateRaw$1(input, options2) {
    options2 = options2 || {};
    options2.raw = true;
    return inflate$1(input, options2);
  }
  var Inflate_1$1 = Inflate$1;
  var inflate_2 = inflate$1;
  var inflateRaw_1$1 = inflateRaw$1;
  var ungzip$1 = inflate$1;
  var constants = constants$2;
  var inflate_1$1 = {
    Inflate: Inflate_1$1,
    inflate: inflate_2,
    inflateRaw: inflateRaw_1$1,
    ungzip: ungzip$1,
    constants
  };
  var { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
  var { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
  var Deflate_1 = Deflate;
  var deflate_1 = deflate;
  var deflateRaw_1 = deflateRaw;
  var gzip_1 = gzip;
  var Inflate_1 = Inflate;
  var inflate_1 = inflate;
  var inflateRaw_1 = inflateRaw;
  var ungzip_1 = ungzip;
  var constants_1 = constants$2;
  var pako = {
    Deflate: Deflate_1,
    deflate: deflate_1,
    deflateRaw: deflateRaw_1,
    gzip: gzip_1,
    Inflate: Inflate_1,
    inflate: inflate_1,
    inflateRaw: inflateRaw_1,
    ungzip: ungzip_1,
    constants: constants_1
  };

  // src/core/codecs/library/gzip.ts
  var decode = (o) => {
    return new Promise((resolve, reject) => {
      try {
        o.buffer = pako.inflate(o.buffer).buffer;
        resolve(o);
      } catch (e) {
        console.error(e);
        return reject(false);
      }
    });
  };
  var encode = (o) => pako.deflate(o);
  var type = "application/x-gzip";
  var suffixes = "gz";

  // src/core/codecs/library/text.ts
  var text_exports = {};
  __export(text_exports, {
    decode: () => decode2,
    encode: () => encode2,
    suffixes: () => suffixes2,
    type: () => type2
  });
  var type2 = "text/plain";
  var suffixes2 = "txt";
  var encode2 = (o) => new TextEncoder().encode(o ? o.toString() : "");
  var decode2 = (o) => new TextDecoder().decode(o.buffer);

  // src/core/codecs/decode.ts
  var decode3 = async (o, type8, name2, config2, defaultCodec = text_exports, codecs2) => {
    const { mimeType, zipped: zipped2 } = get(type8, name2, codecs2);
    if (zipped2)
      o = await decode(o);
    if (mimeType && (mimeType.includes("image/") || mimeType.includes("video/")))
      return o.dataurl;
    const codec = codecs2 ? codecs2.get(mimeType) : null;
    if (codec && codec.decode instanceof Function)
      return codec.decode(o, config2);
    else {
      console.warn(`No decoder for ${mimeType}. Defaulting to ${defaultCodec.type}...`);
      return defaultCodec.decode(o, config2);
    }
  };
  var decode_default = decode3;

  // src/core/codecs/library/datauri.ts
  var encode3 = (o) => {
    var byteString = atob(o.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    var iab = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      iab[i] = byteString.charCodeAt(i);
    }
    return iab;
  };

  // src/core/codecs/encode.ts
  var encode4 = async (o, type8, name2, config2, defaultCodec = text_exports, codecs2) => {
    let buffer = new ArrayBuffer(0);
    const { mimeType, zipped: zipped2 } = get(type8, name2, codecs2);
    if (mimeType && (mimeType.includes("image/") || mimeType.includes("video/")))
      return encode3(o);
    const codec = codecs2 ? codecs2.get(mimeType) : null;
    if (codec && codec.encode instanceof Function)
      buffer = codec.encode(o, config2);
    else {
      console.warn(`No encoder for ${mimeType}. Defaulting to ${defaultCodec.type}...`);
      buffer = defaultCodec.encode(o, config2);
    }
    if (zipped2)
      buffer = await encode(buffer);
    return buffer;
  };
  var encode_default = encode4;

  // src/core/system/core/transfer.ts
  var transferEach = async (f, system3) => {
    const path = f.path;
    if (!f.storage.buffer)
      f.storage = await f.getFileData();
    const blob = new Blob([f.storage.buffer]);
    blob.name = f.name;
    let newFile = await system3.open(path, true);
    if (!f.fileSystemHandle) {
      f.fileSystemHandle = newFile.fileSystemHandle;
      f.method = "transferred";
    }
  };
  var transfer = async (previousSystem, targetSystem, transferList) => {
    if (!transferList)
      transferList = Array.from(previousSystem.files.list.values());
    const notTransferred = transferList.filter((f) => f.method != "transferred");
    if (notTransferred.length > 0) {
      if (!targetSystem) {
        const SystemConstructor = previousSystem.constructor;
        targetSystem = new SystemConstructor(void 0, {
          native: previousSystem.native,
          debug: previousSystem.debug,
          ignore: previousSystem.ignore,
          writable: true,
          progress: previousSystem.progress,
          codecs: previousSystem.codecs
        });
        await targetSystem.init();
      }
      console.warn(`Starting transfer of ${notTransferred.length} files from ${previousSystem.name} to ${targetSystem.name}`, transferList);
      const tic = performance.now();
      await Promise.all(notTransferred.map(async (f) => transferEach(f, targetSystem)));
      const toc = performance.now();
      console.warn(`Time to transfer files to ${targetSystem.name}: ${toc - tic}ms`);
      await Promise.all(notTransferred.map(async (f) => f.save(true)));
    }
  };
  var transfer_default = transfer;

  // src/core/utils/classes.js
  function isClass(obj = {}) {
    const isCtorClass = obj.constructor && obj.constructor.toString().substring(0, 5) === "class";
    if (obj.prototype === void 0) {
      return isCtorClass;
    }
    const isPrototypeCtorClass = obj.prototype.constructor && obj.prototype.constructor.toString && obj.prototype.constructor.toString().substring(0, 5) === "class";
    return isCtorClass || isPrototypeCtorClass;
  }

  // src/core/utils/path.js
  var get2 = (path, rel = "") => {
    if (rel[rel.length - 1] === "/")
      rel = rel.slice(0, -1);
    let dirTokens = rel.split("/");
    if (dirTokens.length === 1 && dirTokens[0] === "")
      dirTokens = [];
    const potentialFile = dirTokens.pop();
    if (potentialFile) {
      const splitPath = potentialFile.split(".");
      console.log("Split Path", splitPath);
      if (splitPath.length == 1 || splitPath.length > 1 && splitPath.includes(""))
        dirTokens.push(potentialFile);
    }
    const extensionTokens = path.split("/").filter((str) => {
      if (str === "..") {
        if (dirTokens.length == 0)
          console.error("Derived path is going out of the valid filesystem!");
        dirTokens.pop();
        return false;
      } else if (str === ".")
        return false;
      else
        return true;
    });
    const newPath = [...dirTokens, ...extensionTokens].join("/");
    return newPath;
  };

  // src/core/system/remote/request.ts
  var networkErrorMessages = ["Failed to fetch", "NetworkError when attempting to fetch resource.", "Network request failed"];
  var isNetworkErrorMessage = (msg) => networkErrorMessages.includes(msg);
  var isNetworkError = (error) => error.name === "TypeError" && isNetworkErrorMessage(error.message);
  var getURL = (path) => {
    let url;
    try {
      url = new URL(path).href;
    } catch {
      url = get2(path, window.location.href);
    }
    return url;
  };
  var handleFetch = async (path, options2 = {}, progressCallback2) => {
    if (!options2.mode)
      options2.mode = "cors";
    const url = getURL(path);
    const response = await fetchRemote(url, options2, progressCallback2);
    if (!response)
      throw new Error("No response received.");
    const type8 = response.type.split(";")[0];
    return {
      url,
      type: type8,
      buffer: response.buffer
    };
  };
  var fetchRemote = async (url, options2 = {}, progressCallback2) => {
    options2.timeout = 3e3;
    const response = await fetchWithTimeout(url, options2);
    return new Promise(async (resolve) => {
      if (response) {
        const type8 = response.headers.get("Content-Type");
        if (globalThis.FREERANGE_NODE) {
          const buffer = await response.arrayBuffer();
          resolve({ buffer, type: type8 });
        } else {
          const reader = response.body.getReader();
          const bytes = parseInt(response.headers.get("Content-Length"), 10);
          let bytesReceived = 0;
          let buffer = [];
          const processBuffer = async ({ done, value }) => {
            if (done) {
              const config2 = {};
              if (typeof type8 === "string")
                config2.type = type8;
              const blob = new Blob(buffer, config2);
              const ab = await blob.arrayBuffer();
              resolve({ buffer: new Uint8Array(ab), type: type8 });
              return;
            }
            bytesReceived += value.length;
            const chunk = value;
            buffer.push(chunk);
            if (progressCallback2 instanceof Function)
              progressCallback2(response.headers.get("Range"), bytesReceived / bytes, bytes);
            return reader.read().then(processBuffer);
          };
          reader.read().then(processBuffer);
        }
      } else {
        console.warn("Response not received!", options2.headers);
        resolve(void 0);
      }
    });
  };
  async function fetchWithTimeout(resource, options2 = {}) {
    const { timeout = 8e3 } = options2;
    const controller = new AbortController();
    const id = setTimeout(() => {
      console.warn(`Request to ${resource} took longer than ${(timeout / 1e3).toFixed(2)}s`);
      controller.abort();
      throw new Error(`Request timeout`);
    }, timeout);
    const response = await globalThis.fetch(resource, {
      ...options2,
      signal: controller.signal
    }).catch((e) => {
      clearTimeout(id);
      const networkError = isNetworkError(e);
      if (networkError) {
        throw new Error("No internet.");
      } else
        throw e;
    });
    clearTimeout(id);
    if (!response.ok) {
      if (response.status === 404)
        throw new Error(`Resource not found.`);
      else
        throw response;
    }
    return response;
  }

  // src/core/utils/iterate.ts
  var iterAsync = async (iterable, asyncCallback) => {
    const promises = [];
    let i = 0;
    for await (const entry of iterable) {
      promises.push(asyncCallback(entry, i));
      i++;
    }
    const arr = await Promise.all(promises);
    return arr;
  };
  var iterate_default = iterAsync;

  // src/core/RangeFile.ts
  var useRawArrayBuffer = ["nii", "nwb"];
  var RangeFile = class {
    constructor(file3, options2) {
      this.rangeConfig = null;
      this.rangeSupported = false;
      this.createFile = async (buffer, oldFile = this.file, create = false) => {
        let newFile = new Blob([buffer], oldFile);
        newFile.lastModified = oldFile.lastModified;
        newFile.name = oldFile.name;
        newFile.webkitRelativePath = oldFile.webkitRelativePath || get2(this.path || this.name, this.system.root);
        console.log("Getting new file", newFile, create, this.fileSystemHandle);
        if (create && !this.fileSystemHandle) {
          console.warn(`Native file handle for ${this.path} does not exist. Choosing a filesystem to mount...`);
          await transfer_default(this.system);
          return;
        }
        return newFile;
      };
      this.loadFileInfo = (file3 = this.file) => {
        if (file3) {
          this.name = file3.name;
          this.type = file3.type;
          const { mimeType, zipped: zipped2, suffix: suffix2 } = get(file3.type, file3.name, this.system.codecs);
          this.mimeType = mimeType;
          this.zipped = zipped2;
          this.suffix = suffix2;
        } else
          console.warn("Valid file object not provided...");
      };
      this.init = async () => {
        if (!this.file && this.fileSystemHandle) {
          this.file = await this.fileSystemHandle.getFile();
          this.loadFileInfo(this.file);
        }
        const loader2 = this.system.codecs.get(this.mimeType);
        const rangeConfig = loader2?.config;
        if (rangeConfig)
          this.rangeConfig = rangeConfig;
        else {
          if (!loader2)
            console.warn(`Cannot find a configuration file for ${this.path}. Please provide the correct codec.`);
        }
        this.rangeSupported = !!this.rangeConfig;
        let converted = false;
        if (this.method === "native") {
          this.storage = await this.getFileData().catch(this.onError);
          if (!converted) {
            if (this.storage?.buffer)
              this.file = await this.createFile(this.storage.buffer);
            else if (this.debug)
              console.warn(`No buffer created for ${this.path}...`);
          }
        }
        await this.setupByteGetters();
      };
      this.setOriginal = async (reference = "body") => {
        if (this.rangeSupported) {
          this[`#original${reference}`] = null;
          if (this.debug)
            console.warn("Will not stringify bodies that support range requests.");
        } else if (isClass(this[`#${reference}`])) {
          this[`#original${reference}`] = null;
          if (this.debug)
            console.warn("Will not deep clone file bodies that are class instances");
        } else {
          try {
            const tic = performance.now();
            const value = await this[`#${reference}`];
            if (typeof this[`#${reference}`] === "object")
              this[`#original${reference}`] = JSON.parse(JSON.stringify(value));
            else
              this[`#original${reference}`] = value;
            const toc = performance.now();
            if (this.debug)
              console.warn(`Time to Deep Clone (${this.path}): ${toc - tic}ms`);
          } catch (e) {
            this[`#original${reference}`] = null;
            if (this.debug)
              console.warn("Could not deep clone", e);
          }
        }
      };
      this.get = async (ref = "body", codec) => {
        try {
          if (!this[`#${ref}`]) {
            const ticDecode = performance.now();
            const storageExists = this.storage.buffer;
            if (!storageExists && !this.rangeSupported)
              this.storage = await this.getFileData();
            this[`#${ref}`] = codec ? await codec.decode(this.storage, this.config) : await this.system.codecs.decode(this.storage, this.mimeType, this.file.name, this.config).catch(this.onError);
            const tocDecode = performance.now();
            if (this.debug)
              console.warn(`Time to Decode (${this.path}): ${tocDecode - ticDecode}ms`);
          }
          if (this[`#original${ref}`] === void 0)
            await this.setOriginal(ref);
          return this[`#${ref}`];
        } catch (e) {
          const msg = `Decoder failed for ${this.path} - ${this.mimeType || "No file type recognized"}`;
          if (this.debug)
            console.warn(msg, e);
          return {};
        }
      };
      this.set = (val, ref = "body") => this[`#${ref}`] = val;
      this.reencode = async (ref = "body", codec) => {
        try {
          const value = await this[`${ref}`];
          const modifiedString = JSON.stringify(value);
          const ogString = JSON.stringify(this[`#original${ref}`]);
          const different = modifiedString !== ogString;
          if (different) {
            if (this.debug)
              console.warn(`Synching file contents with buffer (${this.path})`, different ? `${ogString} > ${modifiedString}` : modifiedString);
            const toEncode = value ?? "";
            try {
              const ticEncode = performance.now();
              const buffer = codec ? await codec.encode(toEncode, this.config) : await this.system.codecs.encode(toEncode, this.mimeType, this.file.name, this.config);
              const tocEncode = performance.now();
              if (this.debug)
                console.warn(`Time to Encode (${this.path}): ${tocEncode - ticEncode}ms`);
              return buffer;
            } catch (e) {
              console.error("Could not encode as a buffer", toEncode, this.mimeType, this.zipped, codec);
              this.onError(e);
            }
          }
        } catch (e) {
          console.warn(e, this[`#${ref}`], this[`#original${ref}`]);
        }
      };
      this.sync = async (force = !(this.file instanceof Blob), create = void 0) => {
        if (this.rangeSupported) {
          if (this.debug)
            console.warn(`Write access is disabled for RangeFile with range-gettable properties (${this.path})`);
          return true;
        } else {
          const bodyEncoded = await this.reencode();
          const textEncoded = await this.reencode("text", text_exports);
          const toSave = bodyEncoded ?? textEncoded;
          if (force || toSave) {
            if (toSave)
              this.storage.buffer = toSave;
            const newFile = await this.createFile(this.storage.buffer, this.file, create);
            if (newFile)
              this.file = newFile;
            else {
              if (this.debug)
                console.warn(`New file not created for ${this.path}`);
              return;
            }
            if (toSave) {
              if (textEncoded)
                this["#body"] = null;
              if (bodyEncoded)
                this["#text"] = null;
            } else {
              await this.setOriginal();
              await this.setOriginal("text");
            }
            return this.file;
          } else
            return true;
        }
      };
      this.save = async (force = !!this.remote) => {
        console.warn("Syncing", this.path, force);
        const file3 = await this.sync(force, true);
        console.warn("Synced", this.path, file3, force);
        if (file3 instanceof Blob) {
          const writable = await this.fileSystemHandle.createWritable();
          const stream = file3.stream();
          const tic = performance.now();
          await stream.pipeTo(writable);
          const toc = performance.now();
          if (this.debug)
            console.warn(`Time to stream into file (${this.path}): ${toc - tic}ms`);
        }
        const dependents = this.system.dependents[this.path];
        if (dependents)
          await iterate_default(dependents.values(), async (f) => f["#body"] = null);
      };
      this.onError = (e) => {
        console.error(e);
      };
      this.getFromBytes = async (key, property = this.rangeConfig.properties[key], parent, i) => {
        if (property) {
          let start = await this.getProperty(property.start, parent, i);
          const length = await this.getProperty(property.length, parent, i);
          let bytes = new ArrayBuffer(0);
          if (this.method === "remote") {
            bytes = await this.getRemote({ start, length });
          } else {
            let tempBytes = [];
            if (!Array.isArray(start))
              start = [start];
            start.forEach((i2) => tempBytes.push(this.storage.buffer.slice(i2, i2 + length)));
            const totalLen = tempBytes.reduce((a, b) => a + b.length, 0);
            const tic2 = performance.now();
            let offset = 0;
            let uBytes = new Uint8Array(totalLen);
            tempBytes.forEach((arr) => {
              uBytes.set(arr, offset);
              offset += arr.length;
            });
            bytes = uBytes;
            const toc2 = performance.now();
            if (this.debug && start.length > 1)
              console.warn(`Time to merge arrays (${this.path}): ${toc2 - tic2}ms`);
          }
          const tic = performance.now();
          let output = property.ignoreGlobalPostprocess ? bytes : this.rangeConfig.preprocess(bytes);
          if (property.postprocess instanceof Function)
            output = await property.postprocess(output, this["#body"], i);
          const toc = performance.now();
          if (this.debug)
            console.warn(`Time to postprocess bytes (${this.path}, ${key}, ${start}-${start + length}): ${toc - tic}ms`);
          return output;
        } else {
          if (this.debug)
            console.warn(`No getter for ${key}`);
        }
      };
      this.getProperty = async (property, parent, i = void 0) => {
        if (property instanceof Function) {
          try {
            return property(this["#body"], parent, i).catch((e) => console.error(e));
          } catch {
            return property(this["#body"], parent, i);
          }
        } else
          return property;
      };
      this.defineProperty = async (key, property, parent, i = void 0) => {
        if ("start" in property && property.length) {
          Object.defineProperties(parent, {
            [key]: {
              enumerable: true,
              get: () => {
                if (!parent[`#${key}`])
                  parent[`#${key}`] = this.getFromBytes(key, property, parent, i);
                return parent[`#${key}`];
              }
            },
            [`#${key}`]: {
              writable: true,
              enumerable: false
            }
          });
        } else if (property.n && property.properties) {
          this["#body"][key] = [];
          const n = await this.getProperty(property.n, property);
          for (let i2 = 0; i2 < n; i2++) {
            const value = {};
            Object.defineProperty(value, "n", { get: () => n });
            for (let prop in property.properties) {
              await this.defineProperty(prop, property.properties[prop], value, i2);
            }
            this["#body"][key].push(value);
          }
        }
      };
      this.setupByteGetters = async () => {
        Object.defineProperties(this, {
          ["body"]: {
            enumerable: true,
            get: async () => this.get(),
            set: (val) => this.set(val)
          },
          [`#body`]: {
            writable: true,
            enumerable: false
          }
        });
        Object.defineProperties(this, {
          ["text"]: {
            enumerable: true,
            get: async () => this.get("text", text_exports),
            set: (val) => this.set(val, "text")
          },
          [`#text`]: {
            writable: true,
            enumerable: false
          }
        });
        if (this.rangeSupported) {
          this[`#body`] = {};
          for (let key in this.rangeConfig.properties)
            await this.defineProperty(key, this.rangeConfig.properties[key], this["#body"]);
          if (this.rangeConfig.metadata instanceof Function)
            await this.rangeConfig.metadata(this["#body"], this.rangeConfig);
        }
      };
      this.getRemote = async (property = {}) => {
        let { start, length } = property;
        const options2 = Object.assign({}, this.remoteOptions);
        if (!Array.isArray(start))
          start = [start];
        if (start.length < 1)
          return new Uint8Array();
        else {
          const isDefined = start[0] != void 0;
          if (isDefined) {
            let Range = `bytes=${start.map((val) => `${length ? `${val}-${val + length - 1}` : val}`).join(", ")}`;
            const maxHeaderLength = 15e3;
            if (Range.length > maxHeaderLength) {
              const splitRange = Range.slice(0, maxHeaderLength).split(", ");
              console.warn(`Only sending ${splitRange.length - 1} from ${start.length} range requests to remain under the --max-http-header-size=${1600} limit`);
              Range = splitRange.slice(0, splitRange.length - 1).join(", ");
            }
            options2.headers = Object.assign({ Range }, options2.headers);
          }
          const o = await fetchRemote(get2(this.remote.path, this.remote.origin), options2);
          return o.buffer;
        }
      };
      this.getFileData = () => {
        return new Promise(async (resolve, reject) => {
          if (this.method === "remote") {
            const buffer = await this.getRemote();
            this.file = await this.createFile(buffer);
            resolve({ file: this.file, buffer });
          } else {
            let method = "buffer";
            if (this.file.type && (this.file.type.includes("image/") || this.file.type.includes("video/")))
              method = "dataurl";
            if (globalThis.FREERANGE_NODE) {
              const methods = {
                "dataurl": "dataURL",
                "buffer": "arrayBuffer"
              };
              const data = await this.file[methods[method]]();
              resolve({ file: this.file, [method]: this.handleData(data) });
            } else {
              const methods = {
                "dataurl": "readAsDataURL",
                "buffer": "readAsArrayBuffer"
              };
              const reader = new FileReader();
              reader.onloadend = (e) => {
                if (e.target.readyState == FileReader.DONE) {
                  if (!e.target.result)
                    return reject(`No result returned using the ${method} method on ${this.file.name}`);
                  let data = e.target.result;
                  resolve({ file: this.file, [method]: this.handleData(data) });
                } else if (e.target.readyState == FileReader.EMPTY) {
                  if (this.debug)
                    console.warn(`${this.file.name} is empty`);
                  resolve({ file: this.file, [method]: new Uint8Array() });
                }
              };
              reader[methods[method]](this.file);
            }
          }
        });
      };
      this.handleData = (data) => {
        if ((data["byteLength"] ?? data["length"]) === 0) {
          if (this.debug)
            console.warn(`${this.file.name} appears to be empty`);
          return new Uint8Array();
        } else if (data instanceof ArrayBuffer && !useRawArrayBuffer.includes(this.suffix))
          return new Uint8Array(data);
        else
          return data;
      };
      console.log("Creating a file", file3);
      if (file3.constructor.name === "FileSystemFileHandle") {
        this.fileSystemHandle = file3;
      } else
        this.file = file3;
      this.config = options2;
      this.debug = options2.debug;
      this.system = options2.system;
      this.path = options2.path;
      this.method = file3.origin != void 0 && file3.path != void 0 ? "remote" : "native";
      if (this.method === "remote") {
        this.remote = file3;
        const split = file3.path.split("/");
        file3.name = split[split.length - 1];
        this.remoteOptions = file3.options;
        this.type = null;
      }
      if (this.file)
        this.loadFileInfo(this.file);
      this.storage = {};
      this.rangeSupported = false;
      this[`#originalbody`] = void 0;
      this[`#originaltext`] = void 0;
    }
  };
  `#body`, `#originalbody`, `#text`, `#originaltext`;

  // src/core/codecs/index.ts
  var codecs_exports = {};
  __export(codecs_exports, {
    csv: () => csv_exports,
    gzip: () => gzip_exports,
    js: () => js_exports,
    json: () => json_exports,
    text: () => text_exports,
    tsv: () => tsv_exports
  });

  // src/core/codecs/library/json.ts
  var json_exports = {};
  __export(json_exports, {
    decode: () => decode4,
    encode: () => encode5,
    suffixes: () => suffixes3,
    type: () => type3
  });
  var type3 = "application/json";
  var suffixes3 = "json";
  var encode5 = (o) => encode2(JSON.stringify(o));
  var decode4 = (o) => {
    const textContent = !o.text ? decode2(o) : o.text;
    return JSON.parse(textContent || `{}`);
  };

  // src/core/codecs/library/tsv.ts
  var tsv_exports = {};
  __export(tsv_exports, {
    decode: () => decode6,
    encode: () => encode7,
    suffixes: () => suffixes5,
    type: () => type5
  });

  // src/core/codecs/library/csv.ts
  var csv_exports = {};
  __export(csv_exports, {
    decode: () => decode5,
    encode: () => encode6,
    suffixes: () => suffixes4,
    type: () => type4
  });
  var stripBOM = (str) => str.replace(/^\uFEFF/, "");
  var normalizeEOL = (str) => str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  var isContentfulRow = (row) => row && !/^\s*$/.test(row);
  var addBOM = (str) => `\uFEFF${str}`;
  var suffixes4 = "csv";
  var type4 = "text/csv";
  var encode6 = (arr, separator) => {
    const rows = arr.length ? [Object.keys(arr[0]), ...arr.map((o) => Object.values(o))] : [];
    let content = rows.map((row) => row.join(separator)).join("\n");
    content = addBOM(content);
    return new TextEncoder().encode(content);
  };
  var decode5 = (o, separator = ",") => {
    if (!o.text)
      o.text = new TextDecoder().decode(o.buffer);
    let contents = o.text;
    const collection = [];
    contents = stripBOM(contents);
    const rows = normalizeEOL(contents).split("\n").filter(isContentfulRow).map((str) => str.split(separator));
    const headers = rows.length ? rows.splice(0, 1)[0] : [];
    rows.forEach((arr, i) => {
      let strObject = `{`;
      strObject += arr.map((val, j) => {
        try {
          const parsed = JSON.parse(val);
          return `"${headers[j]}":${parsed}`;
        } catch {
          return `"${headers[j]}":"${val}"`;
        }
      }).join(",");
      strObject += "}";
      collection.push(strObject);
    });
    return collection.map((v) => JSON.parse(v));
  };

  // src/core/codecs/library/tsv.ts
  var type5 = "text/tab-separated-values";
  var suffixes5 = "tsv";
  var encode7 = (arr) => encode6(arr, "	");
  var decode6 = (arr) => decode5(arr, "	");

  // src/core/codecs/library/js/index.ts
  var js_exports = {};
  __export(js_exports, {
    decode: () => decode7,
    encode: () => encode8,
    suffixes: () => suffixes6,
    type: () => type6
  });

  // src/core/utils/parse.utils.js
  var objToString = (obj) => {
    let ret = "{";
    for (let k in obj) {
      let v = obj[k];
      if (typeof v === "function") {
        v = v.toString();
      } else if (v instanceof Array) {
        v = JSON.stringify(v);
      } else if (typeof v === "object" && !!v) {
        v = objToString(v);
      } else if (typeof v === "string") {
        v = `"${v}"`;
      } else {
        v = `${v}`;
      }
      ret += `
  ${k}: ${v},`;
    }
    ret += "\n}";
    return ret;
  };

  // src/core/codecs/library/js/import.ts
  var esmImport = async (text) => {
    const moduleDataURI = "data:text/javascript;base64," + btoa(text);
    let imported = await import(moduleDataURI);
    if (imported.default && Object.keys(imported).length === 1)
      imported = imported.default;
    return imported;
  };
  var safeESMImport = async (text, config2 = {}, onBlob) => {
    try {
      return await esmImport(text);
    } catch (e) {
      console.warn(`${config2.path} contains ES6 imports. Manually importing these modules...`);
      const base = get2("", config2.path);
      let childBase = config2.system.root ? get2(base, config2.system.root) : base;
      const importInfo = {};
      var re = /import([ \n\t]*(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])/g;
      let m;
      do {
        m = re.exec(text);
        if (m == null)
          m = re.exec(text);
        if (m) {
          text = text.replace(m[0], ``);
          const variables = m[1].trim().split(",");
          importInfo[m[3]] = variables;
        }
      } while (m);
      for (let path in importInfo) {
        let correctPath = get2(path, childBase);
        const variables = importInfo[path];
        const existingFile = config2.system.files.list.get(get2(path));
        let blob = existingFile?.file;
        if (!blob) {
          const info = await handleFetch(correctPath);
          blob = new Blob([info.buffer], { type: info.type });
          await config2.system.load(blob, correctPath, config2.path);
        }
        let thisText = await blob.text();
        const imported = await safeESMImport(thisText, {
          path: correctPath,
          system: config2.system
        }, onBlob);
        if (variables.length > 1) {
          variables.forEach((str) => {
            text = `const ${str} = ${objToString(imported[str])}
${text}`;
          });
        } else {
          text = `const ${variables[0]} = ${objToString(imported)}
${text}`;
        }
      }
      const tryImport = await esmImport(text);
      return tryImport;
    }
  };
  var import_default = safeESMImport;

  // src/core/codecs/library/js/index.ts
  var type6 = "application/javascript";
  var suffixes6 = "js";
  var encode8 = () => void 0;
  var decode7 = async (o, config2) => {
    const textContent = !o.text ? await decode2(o) : o.text;
    const imported = await import_default(textContent, config2);
    if (imported)
      return imported;
    else
      return textContent;
  };

  // src/core/codecs/Codecs.ts
  var Codecs = class {
    constructor(codecsInput) {
      this.suffixToType = {};
      this.collection = /* @__PURE__ */ new Map();
      this.add = (codec) => {
        this.collection.set(codec.type, codec);
        let suffixes8 = codec.suffixes ? codec.suffixes : codec.type.split("-").splice(-1)[0];
        if (!Array.isArray(suffixes8))
          suffixes8 = [suffixes8];
        suffixes8.forEach((suffix2) => this.suffixToType[suffix2] = codec.type);
      };
      this.get = (mimeType) => this.collection.get(mimeType);
      this.getType = (suffix2) => this.suffixToType[suffix2];
      this.decode = (o, type8, name2, config2) => decode_default(o, type8, name2, config2, void 0, this);
      this.encode = (o, type8, name2, config2) => encode_default(o, type8, name2, config2, void 0, this);
      this.hasDependencies = (file3) => {
        return file3.mimeType === "application/javascript";
      };
      if (!Array.isArray(codecsInput))
        codecsInput = [codecsInput];
      codecsInput.forEach((codecs2) => {
        if (codecs2 instanceof Codecs)
          codecs2.collection.forEach(this.add);
        else
          for (let key in codecs2)
            this.add(codecs2[key]);
      });
    }
  };

  // src/core/utils/clone.ts
  var deepClone = (o = {}) => {
    return JSON.parse(JSON.stringify(o));
  };
  var clone_default = deepClone;

  // src/core/system/core/open.ts
  var open = async (path, config2) => {
    config2 = Object.assign({}, config2);
    const useNative = !!config2.system?.native;
    let file3 = config2.system.files.list.get(path);
    if (file3)
      return file3;
    else {
      if (useNative && config2.system.openNative instanceof Function)
        file3 = await config2.system.openNative(path, config2);
      else
        file3 = await config2.system.openRemote(path, config2);
      if (file3)
        return file3;
    }
  };
  var open_default = open;

  // src/core/system/remote/index.ts
  var createFile = (file3 = {}, path, system3) => {
    return Object.assign(file3, {
      origin: system3.root,
      path,
      options: {
        mode: "cors"
      }
    });
  };

  // src/core/system/core/load.ts
  var load = async (file3, config2) => {
    let { path, system: system3, codecs: codecs2, debug } = config2;
    if (!path)
      path = file3.webkitRelativePath ?? file3.relativePath ?? file3.path ?? "";
    config2.path = path;
    let fileConfig = config2;
    if (!(file3 instanceof RangeFile)) {
      if (system3.native) {
        if (file3.constructor.name !== "FileSystemFileHandle") {
          const openInfo = await open_default(path, {
            path,
            system: system3,
            create: config2.create,
            codecs: codecs2,
            debug
          });
          if (openInfo && openInfo.constructor.name === "FileSystemDirectoryHandle") {
            file3 = openInfo;
          }
        }
      } else {
        if (fileConfig.system.root) {
          const directoryPath = new URL(fileConfig.system.root).pathname.split("/");
          const url = new URL(fileConfig.path);
          path = file3.path = fileConfig.path = url.pathname.split("/").filter((str, i) => directoryPath?.[i] != str).join("/");
        } else
          path = file3.path = fileConfig.path;
      }
      file3 = new RangeFile(file3, fileConfig);
      await file3.init();
    }
    system3.add(file3);
    return file3;
  };
  var createFile2 = (file3 = {}, path, system3) => {
    if (system3.native)
      return file3;
    else
      return createFile(file3, path, system3);
  };

  // src/core/system/core/save.ts
  var saveEach = async (rangeFile, config2, counter, length) => {
    await rangeFile.save(config2.force);
    counter = counter + 1;
    if (config2.progressCallback instanceof Function)
      config2.progressCallback(config2.name, counter / length, length);
  };
  var save = (name2, files, force, progressCallback2) => {
    let length = files;
    return new Promise(async (resolve, reject) => {
      let i = 0;
      const firstFile = files.shift();
      await saveEach(firstFile, { progressCallback: progressCallback2, name: name2, force }, i, length);
      await iterate_default(files, (f) => saveEach(f, { progressCallback: progressCallback2, name: name2, force }, i, length));
      resolve();
    });
  };
  var save_default = save;

  // src/core/system/remote/open.ts
  var openRemote = async (path, config2) => {
    let {
      system: system3
    } = config2;
    return await handleFetch(path).then(async (info) => {
      const splitURL = info.url.split("/");
      const fileName = splitURL.pop();
      let blob = new Blob([info.buffer], { type: info.type });
      blob.name = fileName;
      const file3 = createFile(blob, info.url, system3);
      const rangeFile = await system3.load(file3, info.url);
      return rangeFile;
    });
  };
  var open_default2 = openRemote;

  // src/core/system/remote/mount.ts
  var mountRemote = async (url, config2) => {
    let filePath;
    await handleFetch(url, void 0, config2.progress).then(async (response) => {
      if (response.type === "application/json") {
        config2.system.name = config2.system.root = filePath = response.url;
        const datasets = JSON.parse(new TextDecoder().decode(response.buffer));
        let files = [];
        const drill = (o) => {
          for (let key in o) {
            const target = o[key];
            if (typeof target === "string") {
              const path = `${response.url}/${target}`;
              const file3 = createFile(void 0, path, config2.system);
              files.push({ file: file3, path });
            } else
              drill(target);
          }
        };
        drill(datasets);
        let filesIterable = files.entries();
        await iterate_default(filesIterable, async ([i, { file: file3, path }]) => await config2.system.load(file3, path));
      } else
        throw "Endpoint is not a freerange filesystem!";
    }).catch((e) => {
      throw "Unable to connect to freerange filesystem!";
    });
    return filePath;
  };
  var mount_default = mountRemote;

  // src/core/utils/url.ts
  var isURL = (path) => {
    try {
      const url = new URL(path);
      return true;
    } catch {
      return false;
    }
  };

  // src/core/system/System.ts
  var System = class {
    constructor(name2, systemInfo = {}) {
      this.dependencies = {};
      this.dependents = {};
      this.changelog = [];
      this.files = {};
      this.groups = {};
      this.groupConditions = /* @__PURE__ */ new Set();
      this.init = async () => {
        let mountConfig = {
          system: this,
          progress: this.progress
        };
        if (this.isNative(this.name)) {
          const native = await this.mountNative(this.name, mountConfig);
          if (!native)
            console.error("Unable to mount native filesystem!");
          else {
            if (this.oninit instanceof Function)
              this.oninit(native);
          }
        } else {
          const path = this.name;
          const isURL2 = isURL(path);
          const fileName = name(path);
          const suffix2 = suffix(path);
          if (isURL2) {
            if (fileName && suffix2) {
              const path2 = this.name;
              this.root = directory(path2);
              const file3 = await this.open(fileName);
              await file3.body;
            } else {
              await this.mountRemote(this.name, mountConfig).catch((e) => console.warn("System initialization failed.", e));
            }
          } else if (this.name)
            this.root = "";
          if (this.oninit instanceof Function)
            this.oninit(this.name);
        }
      };
      this.addGroup = (name2, initial, condition) => {
        this.files[name2] = initial;
        this.groups[name2] = this.cloneGroup({ initial, condition });
        this.groupConditions.add(condition);
      };
      this.cloneGroup = (o) => {
        let newO = { condition: o.condition };
        if (o.initial instanceof Map)
          newO.initial = new Map(o.initial);
        else
          newO.initial = clone_default(o.initial);
        return newO;
      };
      this.subsystem = async (path) => {
        const split = path.split("/");
        const name2 = split[split.length - 1];
        const subDir = split.shift();
        path = split.join("/");
        let target = this.files.system[subDir];
        split.forEach((str) => target = target[str]);
        const systemConstructor = this.constructor;
        const system3 = new systemConstructor(name2, {
          native: this.native,
          debug: this.debug,
          ignore: this.ignore,
          writable: this.writable,
          progress: this.progress,
          codecs: this.codecs
        });
        await system3.init();
        let drill = async (target2, base) => {
          for (let key in target2) {
            const newBase = get2(key, base);
            const file3 = target2[key];
            if (file3 instanceof RangeFile)
              await system3.load(file3, get2(key, base));
            else
              await drill(file3, newBase);
          }
        };
        await drill(target, path);
        return system3;
      };
      this.reset = () => {
        this.changelog = [];
        this.files = this.createFileSystemInfo();
      };
      this.createFileSystemInfo = () => {
        const files = {};
        for (let name2 in this.groups) {
          let group = this.groups[name2];
          const groupInfo = this.cloneGroup(group);
          files[name2] = groupInfo.initial;
        }
        return files;
      };
      this.checkToLoad = (name2) => {
        return this.ignore.reduce((a, b) => a * (name2?.includes(b) ? 0 : 1), 1);
      };
      this.load = async (file3, path, dependent) => {
        const existingFile = this.files.list.get(path);
        if (existingFile)
          return existingFile;
        else {
          if (!file3.name)
            file3.name = name(path);
          if (!this.native)
            file3 = createFile(file3, path, this);
          const toLoad = this.checkToLoad(file3.name ?? file3.path ?? path);
          if (toLoad) {
            const rangeFile = await load(file3, {
              path,
              system: this,
              debug: this.debug,
              codecs: this.codecs,
              create: this.writable
            });
            if (dependent) {
              if (!this.dependencies[dependent])
                this.dependencies[dependent] = /* @__PURE__ */ new Map();
              this.dependencies[dependent].set(rangeFile.path, rangeFile);
              if (!this.dependents[rangeFile.path])
                this.dependents[rangeFile.path] = /* @__PURE__ */ new Map();
              const file4 = this.files.list.get(dependent);
              this.dependents[rangeFile.path].set(file4.path, file4);
            }
            return rangeFile;
          } else
            console.warn(`Ignoring ${file3.name}`);
        }
      };
      this.add = (file3) => {
        if (!this.files.list.has(file3.path)) {
          this.groupConditions.forEach((func) => func(file3, file3.path, this.files));
        } else
          console.warn(`${this.name}/${file3.path} already exists!`);
      };
      this.isNative = () => false;
      this.openRemote = open_default2;
      this.mountRemote = mount_default;
      this.open = async (path, create) => {
        if (!this.native)
          path = get2(path, this.root);
        const rangeFile = await open_default(path, {
          path,
          debug: this.debug,
          system: this,
          create: create ?? this.writable,
          codecs: this.codecs
        });
        return rangeFile;
      };
      this.save = async (force, progress = this.progress) => await save_default(this.name, Array.from(this.files.list.values()), force, progress);
      this.sync = async () => await iterate_default(this.files.list.values(), async (entry) => await entry.sync());
      this.transfer = async (target) => await transfer_default(this, target);
      this.name = name2;
      this.native = systemInfo.native;
      this.debug = systemInfo.debug;
      this.ignore = systemInfo.ignore ?? [];
      this.writable = systemInfo.writable;
      this.progress = systemInfo.progress;
      this.codecs = new Codecs([codecs_exports, systemInfo.codecs]);
      this.addGroup("system", {}, (file3, path, files) => {
        let target = files.system;
        let split = path.split("/");
        split = split.slice(0, split.length - 1);
        if (path)
          split.forEach((k, i) => {
            if (!target[k])
              target[k] = {};
            target = target[k];
          });
        target[file3.name] = file3;
      });
      this.addGroup("types", {}, (file3, _, files) => {
        const suffix2 = file3.suffix ?? file3.name;
        if (suffix2) {
          if (!files.types[suffix2])
            files.types[suffix2] = [];
          files.types[suffix2].push(file3);
        }
      });
      this.addGroup("n", 0, (_, __, files) => files.n++);
      this.addGroup("list", /* @__PURE__ */ new Map(), (file3, _, files) => files.list.set(file3.path, file3));
    }
  };

  // src/frontend/src/native/open.ts
  var openNative = async (path, config2) => {
    let nativeHandle = config2.system.native;
    let fileSystem = config2.system?.files?.["system"];
    let { system: system3, create } = config2;
    let pathTokens = path.split("/");
    let fileName = config2.type === "directory" ? null : pathTokens.pop();
    pathTokens = pathTokens.filter((f) => !!f);
    if (pathTokens.length > 0) {
      for (const token of pathTokens) {
        const handle = await nativeHandle.getDirectoryHandle(token, { create }).catch((e) => {
          if (create)
            console.warn(`${token} is an invalid file system handle`, e);
          else
            console.warn(`Directory ${token} does not already exist.`);
        });
        if (handle) {
          nativeHandle = handle;
          if (!fileSystem[token])
            fileSystem[token] = {};
          if (!(fileSystem[token] instanceof RangeFile))
            fileSystem = fileSystem[token];
        }
      }
    }
    if (fileName) {
      let existingFile = fileSystem[fileName];
      if (!(existingFile instanceof RangeFile)) {
        const fileHandle = await nativeHandle.getFileHandle(fileName, { create }).catch((e) => {
          if (config2.create)
            console.warn(`Could not create ${fileName}. There may be a directory of the same name...`, e);
          else
            console.warn(`No file found at ${path}.`);
        });
        if (!fileHandle)
          return;
        const file3 = createFile2(fileHandle, path, system3);
        existingFile = await system3.load(file3, path);
      }
      return existingFile;
    } else
      return nativeHandle;
  };
  var open_default3 = openNative;

  // src/frontend/src/native/verify.ts
  var verifyPermission = async (fileHandle, withWrite = false) => {
    const opts = {};
    if (withWrite)
      opts.mode = "readwrite";
    const state = await fileHandle.queryPermission(opts);
    if (await state === "granted")
      return true;
    const requestState = await fileHandle.requestPermission(opts);
    if (requestState === "granted")
      return true;
    return false;
  };
  var verify_default = verifyPermission;

  // src/frontend/src/native/mount.ts
  var onhandle = async (handle, base = "", system3, progressCallback2 = void 0) => {
    await verify_default(handle, true);
    if (handle.name != system3.name)
      base = base ? get2(handle.name, base) : handle.name;
    const files = [];
    if (handle.kind === "file") {
      console.log(handle.name, base);
      if (progressCallback2 instanceof Function)
        files.push({ handle, base });
      else
        await system3.load(handle, base);
    } else if (handle.kind === "directory") {
      const arr = await iterate_default(handle.values(), (entry) => {
        return onhandle(entry, base, system3, progressCallback2);
      });
      files.push(...arr.flat());
    }
    if (!base) {
      let count = 0;
      await iterate_default(files, async (o) => {
        await system3.load(o.handle, o.base);
        count++;
        progressCallback2(system3.name, count / files.length, files.length);
      });
    }
    return files;
  };
  var mountNative = async (handle, config2) => {
    if (!handle)
      handle = await window.showDirectoryPicker();
    if (config2?.system) {
      config2.system.name = config2.system.root = handle.name;
      config2.system.native = handle;
    }
    await onhandle(handle, null, config2?.system, config2?.progress);
    return handle;
  };
  var mount_default2 = mountNative;

  // src/frontend/node_modules/safari-14-idb-fix/dist/index.js
  function idbReady() {
    var isSafari = !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent);
    if (!isSafari || !indexedDB.databases)
      return Promise.resolve();
    var intervalId;
    return new Promise(function(resolve) {
      var tryIdb = function() {
        return indexedDB.databases().finally(resolve);
      };
      intervalId = setInterval(tryIdb, 100);
      tryIdb();
    }).finally(function() {
      return clearInterval(intervalId);
    });
  }
  var dist_default = idbReady;

  // src/frontend/node_modules/idb-keyval/dist/index.js
  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      request.onabort = request.onerror = () => reject(request.error);
    });
  }
  function createStore(dbName, storeName) {
    const dbp = dist_default().then(() => {
      const request = indexedDB.open(dbName);
      request.onupgradeneeded = () => request.result.createObjectStore(storeName);
      return promisifyRequest(request);
    });
    return (txMode, callback) => dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
  }
  var defaultGetStoreFunc;
  function defaultGetStore() {
    if (!defaultGetStoreFunc) {
      defaultGetStoreFunc = createStore("keyval-store", "keyval");
    }
    return defaultGetStoreFunc;
  }
  function get3(key, customStore = defaultGetStore()) {
    return customStore("readonly", (store) => promisifyRequest(store.get(key)));
  }
  function set(key, value, customStore = defaultGetStore()) {
    return customStore("readwrite", (store) => {
      store.put(value, key);
      return promisifyRequest(store.transaction);
    });
  }

  // src/frontend/src/cache.ts
  var cacheName = `freerange-history`;
  var maxHistory = 10;
  var setCache = async (info) => {
    console.log("Init", info);
    let history = await get3(cacheName);
    if (!history)
      history = [info];
    else if (!history.includes(info)) {
      history.push(info);
      if (history.length > maxHistory)
        history.shift();
    }
    console.log(cacheName, history);
    set(cacheName, history);
  };

  // src/frontend/src/LocalSystem.ts
  var LocalSystem = class extends System {
    constructor(name2, info) {
      super(name2, info);
      this.isNative = (info) => !info || info instanceof FileSystemDirectoryHandle;
      this.openNative = open_default3;
      this.mountNative = mount_default2;
      this.oninit = setCache;
    }
  };

  // codecs/edf/index.js
  var edf_exports = {};
  __export(edf_exports, {
    config: () => config_default2,
    decode: () => decode_default2,
    encode: () => encode_default2,
    suffixes: () => suffixes7,
    type: () => type7
  });

  // codecs/edf/encode.js
  var encode_default2 = async (o) => {
    return o.bytes;
  };

  // codecs/edf/edf-io/src/EDF.js
  var flipBits = (n) => parseInt(n.toString(2).split("").map((bit) => 1 - bit).join(""), 2);
  function arrayToAscii(array, start, length) {
    return array.slice(start, start + length).reduce((a, b) => {
      return a + String.fromCharCode(b);
    }, "").trim();
  }
  var globalBytes = [];
  var EDF = class {
    constructor(uint8array) {
      __publicField(this, "getChannelData", (i = 0) => {
        let realChannelCount = this.has_annotations ? this.channelCount - 1 : this.channelCount;
        let pos = this.headerOffset + i * this.perChannelOffset;
        var koef = this.channels[i].k;
        const data = [];
        for (var j = 0; j < this.data_records; j++) {
          for (var k = 0; k < this.samples_in_one_data_record; k++) {
            let val;
            if (this.bytes_per_sample == 2) {
              var b1 = globalBytes[pos];
              pos++;
              var b2 = globalBytes[pos];
              pos++;
              val = (b2 << 8) + b1;
              if (b2 >> 7 == 1)
                val = -flipBits(val) - 1;
            } else if (this.bytes_per_sample == 3) {
              var b1 = globalBytes[pos];
              pos++;
              var b2 = globalBytes[pos];
              pos++;
              var b3 = globalBytes[pos];
              pos++;
              val = (b3 << 16) + (b2 << 8) + b1;
              if (b3 >> 7 == 1)
                val = -flipBits(val) - 1;
            }
            data.push(val * koef);
          }
          pos += this.annotation_bytes + this.perChannelOffset * realChannelCount;
        }
        return data;
      });
      this.channelsOffset = 256;
      globalBytes = uint8array;
      this.duration = this.data_record_duration * this.data_records;
      this.bytes_per_sample = this.header == "0" ? 2 : 3;
      this.has_annotations = false;
      const n = this.channelCount;
      this.annotation_bytes = 0;
      if (n > 0) {
        this.sampling_rate = this.channels[0].num_samples * this.data_record_duration;
        this.sample_size = 0;
      }
      if (this.has_annotations)
        this.sample_size = (n - 1) * 2 * this.sampling_rate + 60 * 2;
      else
        this.sample_size = n * 2 * this.sampling_rate;
      this.samples_in_one_data_record = this.sampling_rate * this.data_record_duration;
    }
    get bytes() {
      return globalBytes;
    }
    get headerOffset() {
      if (!this._headerOffset)
        this._headerOffset = this.channelCount * (16 + 2 * 80 + 6 * 8 + 1 * 32);
      return this._headerOffset;
    }
    get header() {
      if (!this._header)
        this._header = arrayToAscii(globalBytes, 0, 8);
      return this._header;
    }
    get patient() {
      if (!this._patient)
        this._patient = arrayToAscii(globalBytes, 8, 80);
      return this._patient;
    }
    get info() {
      if (!this._info)
        this._info = arrayToAscii(globalBytes, 88, 80);
      return this._info;
    }
    get date() {
      if (!this._date)
        this._date = arrayToAscii(globalBytes, 88, 80);
      return this._date;
    }
    get time() {
      if (!this._time)
        this._time = arrayToAscii(globalBytes, 176, 8);
      return this._time;
    }
    get header_bytes() {
      if (!this._header_bytes)
        this._header_bytes = arrayToAscii(globalBytes, 184, 8);
      return this._header_bytes;
    }
    get data_format() {
      if (!this._data_format)
        this._data_format = arrayToAscii(globalBytes, 192, 44);
      return this._data_format;
    }
    get data_records() {
      if (!this._data_records)
        this._data_records = parseInt(arrayToAscii(globalBytes, 236, 8));
      return this._data_records;
    }
    get data_record_duration() {
      if (!this._data_record_duration)
        this._data_record_duration = parseFloat(arrayToAscii(globalBytes, 244, 8));
      return this._data_record_duration;
    }
    get channelCount() {
      if (!this._channelCount)
        this._channelCount = parseInt(arrayToAscii(globalBytes, 252, 4));
      return this._channelCount;
    }
    get perChannelOffset() {
      return this.samples_in_one_data_record * this.bytes_per_sample;
    }
    get channels() {
      let pos = this.channelsOffset;
      if (!this._channels) {
        this._channels = [];
        const n = this.channelCount;
        for (var i = 0; i < n; i++) {
          var channel = new Object();
          channel.label = arrayToAscii(globalBytes, pos, 16);
          pos += 16;
          if (channel.label.indexOf("DF Annotations") > 0)
            this.has_annotations = true;
          this._channels.push(channel);
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].transducer = arrayToAscii(globalBytes, pos, 80);
          pos += 80;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].dimensions = arrayToAscii(globalBytes, pos, 8);
          pos += 8;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].phys_min = parseInt(arrayToAscii(globalBytes, pos, 8));
          pos += 8;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].phys_max = parseInt(arrayToAscii(globalBytes, pos, 8));
          pos += 8;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].digital_min = parseInt(arrayToAscii(globalBytes, pos, 8));
          pos += 8;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].digital_max = parseInt(arrayToAscii(globalBytes, pos, 8));
          pos += 8;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].prefilters = arrayToAscii(globalBytes, pos, 80);
          pos += 80;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].num_samples = parseInt(arrayToAscii(globalBytes, pos, 8));
          pos += 8;
          if (this.has_annotations && i == this.channelCount - 1)
            this.annotation_bytes = this._channels[i].num_samples * 2;
        }
        for (var i = 0; i < n; i++) {
          this._channels[i].k = (this._channels[i].phys_max - this._channels[i].phys_min) / (this._channels[i].digital_max - this._channels[i].digital_min);
          pos += 32;
        }
        for (var i = 0; i < n; i++) {
          const o = { i, data: null };
          Object.defineProperty(this._channels[i], "data", {
            enumerable: true,
            get: () => {
              if (!o.data)
                o.data = this.getChannelData(o.i);
              return o.data;
            },
            set: (data) => {
              o.data = data;
            }
          });
        }
      }
      return this._channels;
    }
    get annotations() {
      if (!this._annotations) {
        this._annotations = "";
        let offset = this.headerOffset;
        let realChannelCount = this.has_annotations ? this.channelCount - 1 : this.channelCount;
        for (var j = 0; j < this.data_records; j++) {
          offset += realChannelCount * this.perChannelOffset;
          this._annotations += arrayToAscii(globalBytes, offset, this.annotation_bytes);
          offset += this.annotation_bytes;
        }
      } else
        return this._annotations;
    }
  };

  // codecs/edf/decode.js
  var decode_default2 = async (o) => {
    const edf = new EDF(o.buffer);
    return edf;
  };

  // codecs/edf/config.ts
  var flipBits2 = (n) => parseInt(n.toString(2).split("").map((bit) => 1 - bit).join(""), 2);
  var config = {
    properties: {
      header: {
        start: 0,
        length: 8
      },
      patient: {
        start: 8,
        length: 80
      },
      info: {
        start: 88,
        length: 80
      },
      date: {
        start: 168,
        length: 8
      },
      time: {
        start: 176,
        length: 8
      },
      headerBytes: {
        start: 184,
        length: 8,
        postprocess: (v) => parseInt(v)
      },
      dataFormat: {
        start: 192,
        length: 44
      },
      dataRecords: {
        start: 236,
        length: 8,
        postprocess: (v) => parseInt(v)
      },
      dataRecordDuration: {
        start: 244,
        length: 8,
        postprocess: (v) => parseFloat(v)
      },
      channelCount: {
        start: 252,
        length: 4,
        postprocess: (v) => parseInt(v)
      },
      channels: {
        n: (o) => o.channelCount,
        properties: {
          label: {
            length: 16,
            start: (o, _, i) => o.headerOffset + 16 * i,
            postprocess: (value, o) => {
              if (value.indexOf("DF Annotations") > 0)
                o.hasAnnotations = true;
              return value;
            }
          },
          transducer: {
            length: 80,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * i
          },
          dimensions: {
            length: 8,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * i
          },
          physMin: {
            length: 8,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * i,
            postprocess: (v) => parseInt(v)
          },
          physMax: {
            length: 8,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * i,
            postprocess: (v) => parseInt(v)
          },
          digitalMin: {
            length: 8,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * i,
            postprocess: (v) => parseInt(v)
          },
          digitalMax: {
            length: 8,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * i,
            postprocess: (v) => parseInt(v)
          },
          prefilters: {
            length: 80,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 80 * i
          },
          numSamples: {
            length: 8,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 80 * info.n + 8 * i,
            postprocess: async (value, o, i) => {
              const n = await o.channelCount;
              if (o.hasAnnotations && i == n - 1)
                o.annotationBytes = value * 2;
              return value;
            }
          },
          k: {
            length: 32,
            start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 80 * info.n + 8 * info.n + 32 * i,
            postprocess: async (value, o, i) => {
              const pMax = await o.channels[i].physMax;
              const pMin = await o.channels[i].physMin;
              const dMax = await o.channels[i].digitalMax;
              const dMin = await o.channels[i].digitalMin;
              return (pMax - pMin) / (dMax - dMin);
            }
          },
          data: {
            length: async (o) => {
              const samples = await o.samplesInOneDataRecord;
              const bps = await o.bytesPerSample;
              return samples * bps;
            },
            start: async (o, info, i) => {
              const start = [];
              try {
                const hasAnnotations = await o.hasAnnotations;
                const perChannelOffset = await o.perChannelOffset;
                const records = await o.dataRecords;
                const annotationBytes = await o.annotationBytes;
                const headerBytes = await o.headerBytes;
                let realChannelCount = hasAnnotations ? info.n - 1 : info.n;
                let pos = headerBytes + i * perChannelOffset;
                for (var j = 0; j < records; j++) {
                  start.push(pos);
                  pos += annotationBytes + perChannelOffset * realChannelCount;
                }
              } catch (e) {
                console.error(e);
              }
              return start;
            },
            ignoreGlobalPostprocess: true,
            postprocess: async (arr, o, i) => {
              try {
                const bps = await o.bytesPerSample;
                const kcoef = await o.channels[i].k;
                const buffer = [];
                for (let i2 = 0; i2 < arr.length; i2 += bps) {
                  let val;
                  if (bps == 2) {
                    const [b1, b2] = arr.slice(i2, i2 + 2);
                    val = (b2 << 8) + b1;
                    if (b2 >> 7 == 1)
                      val = -flipBits2(val) - 1;
                  } else if (bps == 3) {
                    const [b1, b2, b3] = arr.slice(i2, i2 + 3);
                    val = (b3 << 16) + (b2 << 8) + b1;
                    if (b3 >> 7 == 1)
                      val = -flipBits2(val) - 1;
                  }
                  buffer.push(val * kcoef);
                }
                return buffer;
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
      },
      annotations: {
        length: (o) => o.annotationBytes,
        start: async (o) => {
          try {
            const start = [];
            const annotationBytes = await o.annotationBytes;
            const hasAnnotations = await o.hasAnnotations;
            if (hasAnnotations && annotationBytes) {
              let offset = await o.headerBytes;
              const records = await o.dataRecords;
              const perChannelOffset = await o.perChannelOffset;
              const channelCount = await o.channelCount;
              let realChannelCount = hasAnnotations ? channelCount - 1 : channelCount;
              for (var j = 0; j < records; j++) {
                offset += realChannelCount * perChannelOffset;
                start.push(offset);
                offset += annotationBytes;
              }
              return start;
            } else
              return [];
          } catch (e) {
            console.error(e);
          }
        }
      }
    },
    metadata: async (o, config2) => {
      const n = await o.channelCount;
      o.headerOffset = 256;
      o.duration = await o.dataRecordDuration * await o.dataRecords;
      const header = await o.header;
      o.bytesPerSample = header == "0" ? 2 : 3;
      o.hasAnnotations = false;
      o.annotationBytes = 0;
      if (n > 0) {
        o.samplingRate = await o.channels[0]?.numSamples * await o.dataRecordDuration;
        o.sampleSize = 0;
      }
      if (o.hasAnnotations)
        o.sampleSize = (n - 1) * 2 * await o.samplingRate + 60 * 2;
      else
        o.sampleSize = n * 2 * await o.samplingRate;
      o.samplesInOneDataRecord = await o.samplingRate * await o.dataRecordDuration;
      o.perChannelOffset = await o.samplesInOneDataRecord * await o.bytesPerSample;
    },
    preprocess: (bytes) => {
      return bytes.reduce((a, b) => {
        return a + String.fromCharCode(b);
      }, "").trim();
    }
  };
  var config_default2 = config;

  // codecs/edf/index.js
  var type7 = "application/x-edf";
  var suffixes7 = "edf";

  // example/tests/utils/print.js
  var system = async (system3) => {
    console.log("Remote System", system3.name);
    const files = Array.from(system3.files.list.values());
    await Promise.all(files.map(async (imported) => {
      if (imported) {
        const importedContents = await imported.body;
        console.log(`${imported.path}`, importedContents);
      } else
        console.error("No Import");
    }));
  };
  var file = async (file3) => {
    const contents = await file3.body;
    console.log(`Existing ${file3.name}`, contents);
  };

  // example/tests/browser/native.js
  var nativeTests = async (config2) => {
    console.log("------------------ NATIVE TESTS ------------------");
    const localSystem = new config2.System();
    await localSystem.init();
    console.log("Filesystem Started!", localSystem);
    for (let key in config2.native) {
      console.log(`------------------ system.open (${key}) ------------------`);
      const info = config2.native[key];
      const file3 = await localSystem.open(info.name, {
        create: true
      });
      await file(file3);
      await info.update(file3);
    }
    await localSystem.save();
  };
  var native_default = nativeTests;

  // example/tests/remote/arbitrary.js
  var remoteCollectionTest = async (config2) => {
    console.log("------------------ system.open (arbitrary collection) ------------------");
    const otherBareRemote = new config2.System("test", { writable: true });
    await otherBareRemote.init();
    await otherBareRemote.open(config2.remote.root.base);
    await otherBareRemote.open(config2.remote.esm);
    await otherBareRemote.open(config2.remote.arbitrary);
    await system(otherBareRemote);
    otherBareRemote.save();
  };
  var arbitrary_default = remoteCollectionTest;

  // example/tests/remote/root.js
  var remoteRootTest = async (config2) => {
    console.log("------------------ system (readme at root with known structure) ------------------");
    const otherRemote = new config2.System(config2.remote.root.base, { writable: true });
    await otherRemote.init();
    await system(otherRemote);
    console.log("Getting HTML File in Known System", config2.remote.root.html);
    const html = await otherRemote.open(config2.remote.root.html);
    await file(html);
    console.log("Getting App ESM File in Known System", config2.remote.root.js);
    const app = await otherRemote.open(config2.remote.root.js);
    await file(app);
    otherRemote.save();
  };
  var root_default = remoteRootTest;

  // example/tests/config.js
  var csvUpdate = async (f) => {
    const contents = await f.body;
    contents.push({ row: contents.length });
  };
  var config_default3 = {
    native: {
      txt: {
        name: "test.txt",
        update: (f) => f.body = "Hello world!"
      },
      csv: {
        name: "test.csv",
        update: csvUpdate
      },
      json: {
        name: "test.json",
        update: (f) => f.body = { key: "value", number: 1 }
      },
      js: {
        name: "test.js",
        update: (f) => f.body = `export default { ['test']: 'This is a test' }`
      },
      tsv: {
        name: "test.tsv",
        update: csvUpdate
      }
    },
    remote: {
      esm: "https://raw.githubusercontent.com/brainsatplay/brainsatplay-starter-kit/main/app/index.js",
      root: {
        base: "https://raw.githubusercontent.com/brainsatplay/brainsatplay-starter-kit/main/README.md",
        html: "index.html",
        js: "app/index.js"
      },
      arbitrary: "https://raw.githubusercontent.com/brainsatplay/freerange/main/README.md"
    }
  };

  // example/tests/remote/esm.js
  var remoteESMTest = async (config2) => {
    console.log("------------------ system (remote esm) ------------------");
    const esmRemote = new config2.System(config2.remote.esm, { writable: true });
    await esmRemote.init();
    await system(esmRemote);
    esmRemote.save();
  };
  var esm_default = remoteESMTest;

  // example/frontend/buttons.js
  config_default3.System = LocalSystem;
  document.querySelector("#native").onClick = async () => await native_default(config_default3);
  document.querySelector("#remote_esm").onClick = async () => await esm_default(config_default3);
  document.querySelector("#remote_root").onClick = async () => await root_default(config_default3);
  document.querySelector("#remote_arbitrary").onClick = async () => await arbitrary_default(config_default3);

  // example/frontend/index.js
  var file2;
  var system2;
  var options = {
    debug: true,
    ignore: ["DS_Store"],
    codecs: { edf: edf_exports }
  };
  var codecs = new Codecs();
  codecs.encode("Hi there").then(async (ab) => {
    const text = await codecs.decode(ab);
    console.log("text", text);
  });
  var jsonPlugin = codecs_exports.json;
  codecs.add(jsonPlugin);
  codecs.encode({ key: "value" }, jsonPlugin.type).then(async (ab) => {
    const json = await codecs.decode(ab, jsonPlugin.type);
    console.log("JSON", json);
  });
  var localMount = document.querySelector("#local");
  var remoteMount = document.querySelector("#remote");
  var loader = document.querySelector("visualscript-loader");
  var editor = document.querySelector("visualscript-object-editor");
  var texteditor = document.querySelector("textarea");
  texteditor.oninput = () => {
    if (file2)
      file2.body = texteditor.value;
  };
  document.onkeydown = async (e) => {
    if (e.metaKey && e.code == "KeyS") {
      e.preventDefault();
      system2.save();
    }
  };
  var maxArrLen = 50;
  editor.preprocess = async (val) => {
    let resolved;
    if (typeof val === "object" && !Array.isArray(val)) {
      val = Object.assign({}, val);
    }
    for (let key in val) {
      if (val[key] instanceof RangeFile && !val[key].rangeSupported) {
        val[key] = await val[key].body;
      }
    }
    if (val instanceof RangeFile) {
      resolved = val.body;
    } else
      resolved = await val;
    if (resolved.length > maxArrLen) {
      console.warn(`Only showing the first ${maxArrLen} items in the array for demonstration.`);
      resolved = resolved.slice(0, maxArrLen);
    }
    return resolved;
  };
  var iterativeDiv = document.querySelector("#iterative");
  var controlsDiv = document.querySelector("#controls");
  var globalProgressCallback = (id, ratio) => progressCallback(id, ratio, loader);
  localMount.onClick = async () => {
    system2 = new LocalSystem(void 0, options);
    system2.progress = globalProgressCallback;
    await system2.init();
    onMount(system2.files);
  };
  var visualLoaders = {};
  var progressCallback = (id, ratio, loader2) => {
    if (!loader2) {
      if (!visualLoaders[id]) {
        visualLoaders[id] = new visualscript.Loader();
        visualLoaders[id].type = "linear";
        visualLoaders[id].text = id;
        iterativeDiv.insertAdjacentElement("afterbegin", visualLoaders[id]);
      }
      loader2 = visualLoaders[id];
    } else
      loader2.text = id;
    loader2.progress = ratio;
  };
  var onMount = async (files) => {
    console.log("File System", system2, files.system);
    const allDirs = Object.keys(files.system).reduce((a, b) => a * b.split(".").length === 1, true);
    if (allDirs)
      for (let name2 in files.system)
        addDataset(name2);
    else {
      editor.set(files.system);
    }
    if (system2.native) {
      file2 = await system2.open("freerange/test.txt", true);
      console.log("freerange/test.txt", file2);
      if (file2) {
        const value = await file2.body;
        texteditor.value = value;
      }
    }
  };
  var addDataset = (key) => {
    const button = document.createElement("visualscript-button");
    button.size = "small";
    button.innerHTML = key;
    button.onClick = async () => {
      iterativeDiv.innerHTML = "";
      console.log("Getting subsystem");
      const dir = await system2.getSubsystem(key);
      console.log(key, dir);
      editor.set(dir.system);
    };
    controlsDiv.appendChild(button);
  };
  remoteMount.onClick = async () => {
    const filesystemURL = `${config_default.origin}:${config_default.port}/filesystem`;
    loader.text = filesystemURL;
    system2 = new LocalSystem(filesystemURL, options);
    await system2.init();
    system2.progress = globalProgressCallback;
    onMount(system2.files);
  };
})();
/*! pako 2.0.4 https://github.com/nodeca/pako @license (MIT AND Zlib) */
