/**
 * Generate reponse for completion of program
 *
 */
function Response(code=null, msg=null, complete=null, fatal=null, errors=null) {
    this.title = "RIB Completion Summary";
    this.code = code;
    this.message = msg;
    this.complete = complete;
    this.fatal = fatal;
    this.errors = errors;
}

module.exports = Response;
