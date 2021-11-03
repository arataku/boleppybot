function process(text) {

    const result = text

    .replaceAll(/<:([a-zA-Z0-9_]+):[0-9]+>/g, "$1")

    .replaceAll(/https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+/g, "おりんく")

    .replaceAll(/_/g, "");

    return result;
}

module.exports = {
    process: process
}