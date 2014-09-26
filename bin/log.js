var colors = require("colors");

var head = {
    create: '[create]'.bold.green,      // [create] new
    record: '[record]'.bold.green,      // [record] [name]
    update: '[update]'.bold.yellow,     // [update] update
    remove: '[remove]'.bold.magenta,    // [remove] remove
    get:    '   [get]'.bold.blue,       //    [get]
    done:   '   done '.bold,            //    done  finish
    error:  ' [error]'.bold.red,        //  [error] error
};

function addSpace(txt, len) {
    var str = "";
    var spaces = 10 - (len || txt.length);

    for (var i = 0; i < spaces; i++) str += " ";

    return str += txt + " ";
}

function report(task, text, replace) {
    task = head[task];
    task = addSpace(task, 8);

    if (replace) text = text.replace(/%s/g, replace);

    return console.log(task + text);
}

function error(err) {
    return report('error', (err.message || err));
}

module.exports = {
    report: report,
    error: error,
    promise: function(task) {
        return function(text) { return report(task, text); };
    }
};
