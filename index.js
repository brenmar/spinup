var spawn       = require('child_process').spawn;
var parse       = require('shell-quote').parse;
var colorize    = require('colorize-stream');
var list        = require('list-cycler');
var through     = require('through');

module.exports = spinup;
function spinup(commands, opts) {

    opts = opts || {};

    var stdout      = opts.stdout;
    var stderr      = opts.stderr;
    var env         = opts.env || {};
    var useColor    = ('color' in opts) ? (!!opts.color) : stdout.isTTY;
    var colors      = list(['green', 'yellow', 'blue', 'magenta', 'cyan']);
    var prefix      = opts.prefix === false ? '' : (opts.prefix || '[%t:%p]');

    procs = commands.map(function(c, taskIx) {

        var args    = parse(c, env);
        var cmd     = args.shift();
        var color   = colors.next();
        
        var child   = spawn(cmd, args, {
            env         : env,
            stdio       : ['ignore', 'pipe', 'pipe'],
            detached    : true
        });

        function _prefix() {
            
            var now = new Date();

            function pad2(v) { return (v < 10 ? '0' : '') + v; }

            var p = prefix.replace(/%([tpYymdHMs])/g, function(m) {
                switch (m[1]) {
                    case 't': return taskIx;
                    case 'p': return child.pid;
                    case 'Y': return now.getFullYear();
                    case 'y': return now.getYear() % 100;
                    case 'm': return pad2(now.getMonth() + 1);
                    case 'd': return pad2(now.getDate());
                    case 'H': return pad2(now.getHours());
                    case 'M': return pad2(now.getMinutes());
                    case 's': return pad2(now.getSeconds());
                }
            });

            return p.length ? (p + ' ') : p;

        }

        function makePrefixer() {
            return through(function(data) {
                this.queue(_prefix() + data);
            });
        }

        function makeColorizer() {
            return useColor ? colorize(color) : new stream.PassThrough();
        }

        if (stderr) {
            var introducer = makeColorizer()
            introducer.pipe(stderr);
            introducer.write(_prefix() + c + "\n");    
        }
        
        if (stdout) {
            child.stdout.setEncoding('utf8');
            child.stdout
                .pipe(makePrefixer())
                .pipe(makeColorizer())
                .pipe(stdout);    
        }

        if (stderr) {
            child.stderr.setEncoding('utf8');
            child.stderr
                .pipe(makePrefixer())
                .pipe(makeColorizer())
                .pipe(stderr);    
        }

        child.on('exit', function() {
            if (stderr) {
                stderr.write(_prefix() + "terminated\n");
            }
            child.exited = true;
        });

        child.on('error', function(err) {
            if (stderr) {
                stderr.write(err);    
            }
        });

        return child;

    });

    return {
        kill: function(p) {
            procs.forEach(function(p) {
                if (!p.exited) {
                    p.kill();    
                }   
            });
        }
    }

}