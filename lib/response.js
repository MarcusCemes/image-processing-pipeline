/**
 * A class for the response upon successful execution
 * of the program.
 *
 * @class RIBResponse
 */
function RIBResponse(code=null, msg=null, complete=null, fatal=null, errors=null) {
    this.$schema = "https://raw.githubusercontent.com/MarcusCemes/responsive-image-builder/master/%24schema/response.json";
    this.title = "RIB Completion Summary";
    this.code = code;
    this.message = msg;
    this.complete = complete;
    this.fatal = fatal;
    this.errors = errors;
}

module.exports = RIBResponse;
