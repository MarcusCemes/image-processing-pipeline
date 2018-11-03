/**
 * Create an image export result
 *
 * @param {*} name
 */
const Export = function(name, extention, type, path, exports) {
    this.name = name;
    this.extention = extention[0] === '.' ? extention.substring(1) : extention;  // remove the leading dot
    this.type = type;
    path ? this.path = path : null;
    exports ? this.exports = exports : null;
}

module.exports = Export;