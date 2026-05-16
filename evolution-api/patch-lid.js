const fs = require("fs");

const FILE = "/evolution/dist/main.js";
let src = fs.readFileSync(FILE, "utf8");

// Pattern for variable "n" — sendMessageWithTyping (1 occurrence)
const nOld = '!n.exists&&!(0,P.isJidGroup)(n.jid)&&!n.jid.includes("@broadcast")';
const nNew = '!n.exists&&!(0,P.isJidGroup)(n.jid)&&!n.jid.includes("@broadcast")&&!n.jid.endsWith("@lid")';
const nCount = src.split(nOld).length - 1;
src = src.replaceAll(nOld, nNew);
console.log(`[patch-lid] n-pattern replaced: ${nCount}`);

// Pattern for variable "s" — sendPresence and blockUser (2 occurrences)
const sOld = '!s.exists&&!(0,P.isJidGroup)(s.jid)&&!s.jid.includes("@broadcast")';
const sNew = '!s.exists&&!(0,P.isJidGroup)(s.jid)&&!s.jid.includes("@broadcast")&&!s.jid.endsWith("@lid")';
const sCount = src.split(sOld).length - 1;
src = src.replaceAll(sOld, sNew);
console.log(`[patch-lid] s-pattern replaced: ${sCount}`);

fs.writeFileSync(FILE, src, "utf8");
console.log("[patch-lid] done");
