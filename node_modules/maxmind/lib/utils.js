"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const concat2 = (a, b) => {
    return (a << 8) | b;
};
const concat3 = (a, b, c) => {
    return (a << 16) | (b << 8) | c;
};
const concat4 = (a, b, c, d) => {
    return (a << 24) | (b << 16) | (c << 8) | d;
};
const legacyErrorMessage = `Maxmind v2 module has changed API.\n\
Upgrade instructions can be found here: \
https://github.com/runk/node-maxmind/wiki/Migration-guide\n\
If you want to use legacy libary then explicitly install maxmind@1`;
exports.default = {
    concat2,
    concat3,
    concat4,
    legacyErrorMessage,
};
//# sourceMappingURL=utils.js.map