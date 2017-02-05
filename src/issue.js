function Issue(type, cause, location, message, severity) {
    if (!(this instanceof Issue)) {
        return new Issue(type, cause, location, message, severity);
    }

    this.type = type;
    this.message = message;
    this.cause = cause;
    this.location = location;
    this.severity = severity || 'error';
}

module.exports = Issue;
