/* ===========================================
   Minimal QR Code generator — byte mode, SVG output.
   Self-contained, no dependencies. MIT-style algorithm
   based on the public ISO/IEC 18004 spec; structurally
   inspired by Kazuhiko Arase's qrcode-generator.
   =========================================== */
(function (global) {
  'use strict';

  // -------- Galois field GF(256) for Reed-Solomon --------
  var EXP = new Array(256), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    EXP[255] = EXP[0];
  })();

  function gMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
  }

  function rsGenPoly(degree) {
    var poly = [1];
    for (var i = 0; i < degree; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsRemainder(data, gen) {
    var res = new Array(gen.length - 1).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      for (var j = 0; j < gen.length - 1; j++) {
        res[j] ^= gMul(gen[j + 1], factor);
      }
    }
    return res;
  }

  // -------- Capacity & ECC tables (byte mode) --------
  // Per version, error-correction level: [ec_codewords_per_block, num_blocks_g1, data_per_block_g1, num_blocks_g2, data_per_block_g2]
  // Source: ISO/IEC 18004 Table 9.
  // Levels: L=0, M=1, Q=2, H=3
  var ECC_TABLE = (function () {
    var raw = [
      // v1
      [[7,1,19,0,0],[10,1,16,0,0],[13,1,13,0,0],[17,1,9,0,0]],
      [[10,1,34,0,0],[16,1,28,0,0],[22,1,22,0,0],[28,1,16,0,0]],
      [[15,1,55,0,0],[26,1,44,0,0],[18,2,17,0,0],[22,2,13,0,0]],
      [[20,1,80,0,0],[18,2,32,0,0],[26,2,24,0,0],[16,4,9,0,0]],
      [[26,1,108,0,0],[24,2,43,0,0],[18,2,15,2,16],[22,2,11,2,12]],
      [[18,2,68,0,0],[16,4,27,0,0],[24,4,19,0,0],[28,4,15,0,0]],
      [[20,2,78,0,0],[18,4,31,0,0],[18,2,14,4,15],[26,4,13,1,14]],
      [[24,2,97,0,0],[22,2,38,2,39],[22,4,18,2,19],[26,4,14,2,15]],
      [[30,2,116,0,0],[22,3,36,2,37],[20,4,16,4,17],[24,4,12,4,13]],
      // v10
      [[18,2,68,2,69],[26,4,43,1,44],[24,6,19,2,20],[28,6,15,2,16]],
      [[20,4,81,0,0],[30,1,50,4,51],[28,4,22,4,23],[24,3,12,8,13]],
      [[24,2,92,2,93],[22,6,36,2,37],[26,4,20,6,21],[28,7,14,4,15]],
      [[26,4,107,0,0],[22,8,37,1,38],[24,8,20,4,21],[22,12,11,4,12]],
      [[30,3,115,1,116],[24,4,40,5,41],[20,11,16,5,17],[24,11,12,5,13]],
      [[22,5,87,1,88],[24,5,41,5,42],[30,5,24,7,25],[24,11,12,7,13]],
      [[24,5,98,1,99],[28,7,45,3,46],[24,15,19,2,20],[30,3,15,13,16]],
      [[28,1,107,5,108],[28,10,46,1,47],[28,1,22,15,23],[28,2,14,17,15]],
      [[30,5,120,1,121],[26,9,43,4,44],[28,17,22,1,23],[28,2,14,19,15]],
      [[28,3,113,4,114],[26,3,44,11,45],[26,17,21,4,22],[26,9,13,16,14]],
      // v20
      [[28,3,107,5,108],[26,3,41,13,42],[30,15,24,5,25],[28,15,15,10,16]],
      [[28,4,116,4,117],[26,17,42,0,0],[28,17,22,6,23],[30,19,16,6,17]],
      [[28,2,111,7,112],[28,17,46,0,0],[30,7,24,16,25],[24,34,13,0,0]],
      [[30,4,121,5,122],[28,4,47,14,48],[30,11,24,14,25],[30,16,15,14,16]],
      [[30,6,117,4,118],[28,6,45,14,46],[30,11,24,16,25],[30,30,16,2,17]],
      [[26,8,106,4,107],[28,8,47,13,48],[30,7,24,22,25],[30,22,15,13,16]],
      [[28,10,114,2,115],[28,19,46,4,47],[28,28,22,6,23],[30,33,16,4,17]],
      [[30,8,122,4,123],[28,22,45,3,46],[30,8,23,26,24],[30,12,15,28,16]],
      [[30,3,117,10,118],[28,3,45,23,46],[30,4,24,31,25],[30,11,15,31,16]],
      [[30,7,116,7,117],[28,21,45,7,46],[30,1,23,37,24],[30,19,15,26,16]],
      // v30
      [[30,5,115,10,116],[28,19,47,10,48],[30,15,24,25,25],[30,23,15,25,16]],
      [[30,13,115,3,116],[28,2,46,29,47],[30,42,24,1,25],[30,23,15,28,16]],
      [[30,17,115,0,0],[28,10,46,23,47],[30,10,24,35,25],[30,19,15,35,16]],
      [[30,17,115,1,116],[28,14,46,21,47],[30,29,24,19,25],[30,11,15,46,16]],
      [[30,13,115,6,116],[28,14,46,23,47],[30,44,24,7,25],[30,59,16,1,17]],
      [[30,12,121,7,122],[28,12,47,26,48],[30,39,24,14,25],[30,22,15,41,16]],
      [[30,6,121,14,122],[28,6,47,34,48],[30,46,24,10,25],[30,2,15,64,16]],
      [[30,17,122,4,123],[28,29,46,14,47],[30,49,24,10,25],[30,24,15,46,16]],
      [[30,4,122,18,123],[28,13,46,32,47],[30,48,24,14,25],[30,42,15,32,16]],
      [[30,20,117,4,118],[28,40,47,7,48],[30,43,24,22,25],[30,10,15,67,16]],
      // v40
      [[30,19,118,6,119],[28,18,47,31,48],[30,34,24,34,25],[30,20,15,61,16]]
    ];
    return raw;
  })();

  // Total codewords per version (v1..v40)
  var TOTAL_CW = [
    26,44,70,100,134,172,196,242,292,346,
    404,466,532,581,655,733,815,901,991,1085,
    1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,
    2323,2465,2611,2761,2876,3034,3196,3362,3532,3706
  ];

  // Alignment pattern centers
  var ALIGN_POS = [
    [],[6,18],[6,22],[6,26],[6,30],[6,34],
    [6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],
    [6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],
    [6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],
    [6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],
    [6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],
    [6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],
    [6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],
    [6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],
    [6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],
    [6,26,54,82,110,138,166],[6,30,58,86,114,142,170]
  ];

  var FORMAT_INFO = {
    // ec level (L=01,M=00,Q=11,H=10) + mask 0..7 → 15 bits
    // Pre-computed format strings (L,M,Q,H) × (mask 0..7)
    L: [0x77c4,0x72f3,0x7daa,0x789d,0x662f,0x6318,0x6c41,0x6976],
    M: [0x5412,0x5125,0x5e7c,0x5b4b,0x45f9,0x40ce,0x4f97,0x4aa0],
    Q: [0x355f,0x3068,0x3f31,0x3a06,0x24b4,0x2183,0x2eda,0x2bed],
    H: [0x1689,0x13be,0x1ce7,0x19d0,0x0762,0x0255,0x0d0c,0x083b]
  };

  // Pre-computed version info for v7..v40 (18-bit each)
  var VERSION_INFO = [
    0x07c94,0x085bc,0x09a99,0x0a4d3,0x0bbf6,0x0c762,0x0d847,0x0e60d,0x0f928,
    0x10b78,0x1145d,0x12a17,0x13532,0x149a6,0x15683,0x168c9,0x177ec,0x18ec4,
    0x191e1,0x1afab,0x1b08e,0x1cc1a,0x1d33f,0x1ed75,0x1f250,0x209d5,0x216f0,
    0x228ba,0x2379f,0x24b0b,0x2542e,0x26a64,0x27541,0x28c69
  ];

  // -------- Encoding --------
  function pickVersion(dataLen, ecLevel) {
    for (var v = 1; v <= 40; v++) {
      var ecc = ECC_TABLE[v - 1][ecLevel];
      var dataCw = ecc[1] * ecc[2] + ecc[3] * ecc[4];
      // 4 (mode) + lengthBits + 8*dataLen + 4 (terminator, optional) bits
      var lengthBits = (v < 10) ? 8 : 16;
      var bitsNeeded = 4 + lengthBits + 8 * dataLen;
      if (bitsNeeded <= dataCw * 8) return v;
    }
    throw new Error('Data too long for QR code');
  }

  function encodeData(text, version, ecLevel) {
    var bytes = [];
    // UTF-8 encode
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0 | (c >> 6)); bytes.push(0x80 | (c & 0x3f)); }
      else if (c < 0xd800 || c >= 0xe000) {
        bytes.push(0xe0 | (c >> 12));
        bytes.push(0x80 | ((c >> 6) & 0x3f));
        bytes.push(0x80 | (c & 0x3f));
      } else {
        // surrogate pair
        i++;
        var cp = 0x10000 + (((c & 0x3ff) << 10) | (text.charCodeAt(i) & 0x3ff));
        bytes.push(0xf0 | (cp >> 18));
        bytes.push(0x80 | ((cp >> 12) & 0x3f));
        bytes.push(0x80 | ((cp >> 6) & 0x3f));
        bytes.push(0x80 | (cp & 0x3f));
      }
    }

    var bits = [];
    function pushBits(val, n) {
      for (var k = n - 1; k >= 0; k--) bits.push((val >> k) & 1);
    }

    pushBits(0b0100, 4); // byte mode
    pushBits(bytes.length, version < 10 ? 8 : 16);
    for (var b = 0; b < bytes.length; b++) pushBits(bytes[b], 8);

    var ecc = ECC_TABLE[version - 1][ecLevel];
    var dataCw = ecc[1] * ecc[2] + ecc[3] * ecc[4];
    var totalBits = dataCw * 8;

    // terminator
    var termLen = Math.min(4, totalBits - bits.length);
    for (var t = 0; t < termLen; t++) bits.push(0);
    // pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    var codewords = [];
    for (var k = 0; k < bits.length; k += 8) {
      var v = 0;
      for (var m = 0; m < 8; m++) v = (v << 1) | bits[k + m];
      codewords.push(v);
    }
    // pad bytes
    var pad = [0xec, 0x11];
    var pi = 0;
    while (codewords.length < dataCw) codewords.push(pad[(pi++) % 2]);

    // -------- Reed-Solomon: split into blocks --------
    var ecCwPerBlock = ecc[0];
    var g1Blocks = ecc[1], g1Size = ecc[2];
    var g2Blocks = ecc[3], g2Size = ecc[4];
    var totalBlocks = g1Blocks + g2Blocks;
    var dataBlocks = [], ecBlocks = [];
    var gen = rsGenPoly(ecCwPerBlock);
    var off = 0;
    for (var bi = 0; bi < totalBlocks; bi++) {
      var sz = (bi < g1Blocks) ? g1Size : g2Size;
      var blk = codewords.slice(off, off + sz);
      off += sz;
      dataBlocks.push(blk);
      ecBlocks.push(rsRemainder(blk, gen));
    }

    // Interleave
    var result = [];
    var maxData = Math.max(g1Size, g2Size || 0);
    for (var c = 0; c < maxData; c++) {
      for (var b2 = 0; b2 < totalBlocks; b2++) {
        if (c < dataBlocks[b2].length) result.push(dataBlocks[b2][c]);
      }
    }
    for (var c2 = 0; c2 < ecCwPerBlock; c2++) {
      for (var b3 = 0; b3 < totalBlocks; b3++) {
        result.push(ecBlocks[b3][c2]);
      }
    }
    return result;
  }

  // -------- Matrix construction --------
  function buildMatrix(version, codewords, ecLevel) {
    var size = 17 + 4 * version;
    var mat = [], reserved = [];
    for (var i = 0; i < size; i++) {
      mat.push(new Array(size).fill(null));
      reserved.push(new Array(size).fill(false));
    }

    function setFinder(r, c) {
      for (var dr = -1; dr <= 7; dr++) {
        for (var dc = -1; dc <= 7; dc++) {
          var rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          var on = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
                   (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
                   (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          mat[rr][cc] = on ? 1 : 0;
          reserved[rr][cc] = true;
        }
      }
    }
    setFinder(0, 0);
    setFinder(0, size - 7);
    setFinder(size - 7, 0);

    // Timing patterns
    for (var i2 = 8; i2 < size - 8; i2++) {
      mat[6][i2] = (i2 % 2 === 0) ? 1 : 0;
      mat[i2][6] = (i2 % 2 === 0) ? 1 : 0;
      reserved[6][i2] = true;
      reserved[i2][6] = true;
    }

    // Alignment patterns (skip positions overlapping the three finder patterns)
    var aligns = ALIGN_POS[version - 1];
    var lastAlign = aligns.length - 1;
    for (var ai = 0; ai < aligns.length; ai++) {
      for (var aj = 0; aj < aligns.length; aj++) {
        if ((ai === 0 && aj === 0) ||
            (ai === 0 && aj === lastAlign) ||
            (ai === lastAlign && aj === 0)) continue;
        var r = aligns[ai], c = aligns[aj];
        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            var on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            mat[r + dr][c + dc] = on ? 1 : 0;
            reserved[r + dr][c + dc] = true;
          }
        }
      }
    }

    // Reserve format info
    for (var k = 0; k < 9; k++) {
      reserved[8][k] = true;
      reserved[k][8] = true;
    }
    for (var k2 = 0; k2 < 8; k2++) {
      reserved[8][size - 1 - k2] = true;
      reserved[size - 1 - k2][8] = true;
    }
    mat[size - 8][8] = 1; // dark module
    reserved[size - 8][8] = true;

    // Reserve version info (v >= 7)
    if (version >= 7) {
      for (var v1 = 0; v1 < 6; v1++) {
        for (var v2 = 0; v2 < 3; v2++) {
          reserved[size - 11 + v2][v1] = true;
          reserved[v1][size - 11 + v2] = true;
        }
      }
    }

    // Place data
    var bitIdx = 0;
    var totalBits = codewords.length * 8;
    var col = size - 1;
    var upward = true;
    while (col > 0) {
      if (col === 6) col--;
      for (var rowI = 0; rowI < size; rowI++) {
        var row = upward ? size - 1 - rowI : rowI;
        for (var c2 = 0; c2 < 2; c2++) {
          var cc = col - c2;
          if (!reserved[row][cc]) {
            var bit = 0;
            if (bitIdx < totalBits) {
              bit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            mat[row][cc] = bit;
          }
        }
      }
      col -= 2;
      upward = !upward;
    }

    return { mat: mat, reserved: reserved, size: size };
  }

  function applyMask(mat, reserved, size, mask) {
    var fns = [
      function (r, c) { return (r + c) % 2 === 0; },
      function (r, c) { return r % 2 === 0; },
      function (r, c) { return c % 3 === 0; },
      function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
      function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
      function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
      function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
    ];
    var fn = fns[mask];
    var out = mat.map(function (row) { return row.slice(); });
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (!reserved[r][c] && fn(r, c)) {
          out[r][c] = out[r][c] ^ 1;
        }
      }
    }
    return out;
  }

  function applyFormatAndVersion(mat, size, version, ecLevel, mask) {
    var lvlKey = ['L','M','Q','H'][ecLevel];
    var fmt = FORMAT_INFO[lvlKey][mask];
    // 15 bits
    for (var i = 0; i < 15; i++) {
      var bit = (fmt >> i) & 1;
      // top-left vertical
      var r1, c1;
      if (i < 6) { r1 = i; c1 = 8; }
      else if (i === 6) { r1 = 7; c1 = 8; }
      else if (i === 7) { r1 = 8; c1 = 8; }
      else if (i === 8) { r1 = 8; c1 = 7; }
      else { r1 = 8; c1 = 14 - i; }
      mat[r1][c1] = bit;
      // bottom-left + top-right
      var r2, c2;
      if (i < 8) { r2 = 8; c2 = size - 1 - i; }
      else { r2 = size - 15 + i; c2 = 8; }
      mat[r2][c2] = bit;
    }
    if (version >= 7) {
      var ver = VERSION_INFO[version - 7];
      for (var k = 0; k < 18; k++) {
        var b = (ver >> k) & 1;
        var rr = Math.floor(k / 3);
        var cc = (k % 3) + size - 11;
        mat[rr][cc] = b;
        mat[cc][rr] = b;
      }
    }
  }

  function penalty(mat, size) {
    var p = 0;
    // Rule 1: runs of 5+
    for (var r = 0; r < size; r++) {
      var run = 1;
      for (var c = 1; c < size; c++) {
        if (mat[r][c] === mat[r][c - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
        else run = 1;
      }
    }
    for (var c2 = 0; c2 < size; c2++) {
      var run2 = 1;
      for (var r2 = 1; r2 < size; r2++) {
        if (mat[r2][c2] === mat[r2 - 1][c2]) { run2++; if (run2 === 5) p += 3; else if (run2 > 5) p++; }
        else run2 = 1;
      }
    }
    // Rule 2: 2x2 blocks
    for (var r3 = 0; r3 < size - 1; r3++) {
      for (var c3 = 0; c3 < size - 1; c3++) {
        var v = mat[r3][c3];
        if (v === mat[r3][c3 + 1] && v === mat[r3 + 1][c3] && v === mat[r3 + 1][c3 + 1]) p += 3;
      }
    }
    // Rule 3: 1:1:3:1:1 finder-like
    var pat1 = [1,0,1,1,1,0,1,0,0,0,0];
    var pat2 = [0,0,0,0,1,0,1,1,1,0,1];
    for (var r4 = 0; r4 < size; r4++) {
      for (var c4 = 0; c4 <= size - 11; c4++) {
        var m1 = true, m2 = true;
        for (var k = 0; k < 11; k++) {
          if (mat[r4][c4 + k] !== pat1[k]) m1 = false;
          if (mat[r4][c4 + k] !== pat2[k]) m2 = false;
        }
        if (m1) p += 40;
        if (m2) p += 40;
      }
    }
    for (var c5 = 0; c5 < size; c5++) {
      for (var r5 = 0; r5 <= size - 11; r5++) {
        var m1b = true, m2b = true;
        for (var k2 = 0; k2 < 11; k2++) {
          if (mat[r5 + k2][c5] !== pat1[k2]) m1b = false;
          if (mat[r5 + k2][c5] !== pat2[k2]) m2b = false;
        }
        if (m1b) p += 40;
        if (m2b) p += 40;
      }
    }
    // Rule 4: dark/light balance
    var dark = 0;
    for (var r6 = 0; r6 < size; r6++) for (var c6 = 0; c6 < size; c6++) if (mat[r6][c6] === 1) dark++;
    var pct = (dark * 100) / (size * size);
    var k3 = Math.floor(Math.abs(pct - 50) / 5);
    p += k3 * 10;
    return p;
  }

  // -------- Public API --------
  function generate(text, options) {
    options = options || {};
    var ecMap = { L:0, M:1, Q:2, H:3 };
    var ecLevel = ecMap[(options.ecLevel || 'M').toUpperCase()];
    if (ecLevel == null) ecLevel = 1;

    // Encode UTF-8 to count bytes for version selection
    var byteLen = 0;
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 0x80) byteLen += 1;
      else if (c < 0x800) byteLen += 2;
      else if (c < 0xd800 || c >= 0xe000) byteLen += 3;
      else { i++; byteLen += 4; }
    }

    var version = pickVersion(byteLen, ecLevel);
    var codewords = encodeData(text, version, ecLevel);
    var built = buildMatrix(version, codewords, ecLevel);

    // Choose best mask
    var bestMask = 0, bestScore = Infinity, bestMat = null;
    for (var m = 0; m < 8; m++) {
      var masked = applyMask(built.mat, built.reserved, built.size, m);
      applyFormatAndVersion(masked, built.size, version, ecLevel, m);
      var score = penalty(masked, built.size);
      if (score < bestScore) { bestScore = score; bestMask = m; bestMat = masked; }
    }

    return { matrix: bestMat, size: built.size, version: version };
  }

  function toSVG(text, options) {
    options = options || {};
    var qr = generate(text, options);
    var size = qr.size;
    var quiet = options.quietZone != null ? options.quietZone : 4;
    var total = size + quiet * 2;
    var fg = options.color || '#000';
    var bg = options.background || '#fff';
    var pixels = '';
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (qr.matrix[r][c] === 1) {
          pixels += '<rect x="' + (c + quiet) + '" y="' + (r + quiet) + '" width="1" height="1"/>';
        }
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total +
           '" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">' +
           '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/>' +
           '<g fill="' + fg + '">' + pixels + '</g></svg>';
  }

  global.QRCode = { generate: generate, toSVG: toSVG };
})(typeof window !== 'undefined' ? window : this);
