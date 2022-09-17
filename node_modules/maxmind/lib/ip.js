"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const parseIPv4 = (input) => {
    const ip = input.split('.', 4);
    const o0 = parseInt(ip[0]);
    const o1 = parseInt(ip[1]);
    const o2 = parseInt(ip[2]);
    const o3 = parseInt(ip[3]);
    return [o0, o1, o2, o3];
};
const hex = (v) => {
    v = parseInt(v, 10).toString(16);
    return v.length === 2 ? v : '0' + v;
};
const parseIPv6 = (ip) => {
    const addr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i;
    let parsed;
    let chunk;
    if (ip.indexOf('.') > -1) {
        ip = ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, (match, a, b, c, d) => {
            return hex(a) + hex(b) + ':' + hex(c) + hex(d);
        });
    }
    const [left, right] = ip.split('::', 2);
    if (left) {
        parsed = left.split(':');
        for (i = 0; i < parsed.length; i++) {
            chunk = parseInt(parsed[i], 16);
            addr[i * 2] = chunk >> 8;
            addr[i * 2 + 1] = chunk & 0xff;
        }
    }
    if (right) {
        parsed = right.split(':');
        const offset = 16 - parsed.length * 2;
        for (i = 0; i < parsed.length; i++) {
            chunk = parseInt(parsed[i], 16);
            addr[offset + i * 2] = chunk >> 8;
            addr[offset + (i * 2 + 1)] = chunk & 0xff;
        }
    }
    return addr;
};
const parse = (ip) => {
    return ip.indexOf(':') === -1 ? parseIPv4(ip) : parseIPv6(ip);
};
const bitAt = (rawAddress, idx) => {
    const bufIdx = idx >> 3;
    const bitIdx = 7 ^ (idx & 7);
    return (rawAddress[bufIdx] >>> bitIdx) & 1;
};
const validate = (ip) => {
    const version = net_1.default.isIP(ip);
    return version === 4 || version === 6;
};
exports.default = {
    bitAt,
    parse,
    validate,
};
//# sourceMappingURL=ip.js.map