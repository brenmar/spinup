# spinup

`spinup` is a dead simple runner for long-running processes (such as servers and file-watchers) designed for use during development. Simply create a `spin.up` file containing one shell command per line and launch them all by running `spinup`.

Let's take a look at a simple `spin.up` file:

    # webserver
    python -m SimpleHTTPServer 9000

    # compile javascript
    watchify -o bundle.js main.js

    # just to demonstrate that arguments are parsed correctly
    # (courtesy of substack/shell-quote)
    echo "let's test" "the argument" parser

    # environment variables can be used too:
    echo "your home directory is:" $HOME

And when we run `spinup`:

![spinup screenshot](https://raw.githubusercontent.com/jaz303/spinup/master/screenshot.png)

`spinup` will run until all child processes have exited. Hit `Ctrl-C` to send `SIGINT` to any that are still running.

## Installation

    npm install -g spinup

## Usage

```shell
spinup [config]
```

`config`: optional path to configuration file, defaults to `./spin.up`.

## Directives

Leading lines of the `spin.up` file can include _directives_. Directives begin with a `!`, followed by the name of the directive and then its arguments.

### `!noprefix`

Do not add a prefix onto each line of output.

See also: `!prefix`.

### `!ports`

The `!ports` directive can be used to automatically create any number of environment variables with sequential integer values, starting from a given base. This is useful for generating port numbers for your processes to listen on, connect to etc. Because the values are written to environment variables its possible to refer to the same value multiple times, i.e. in instances where one process needs to communicate with another. Let's take a look at how it works.

This first example generates three port numbers, `$A`, `$B` and `$C`, starting from 5000. So `$A` is 5000, `$B` is 5001 etc:

```
!ports 5000 $A $B $C
```

It's also possible to specify an optional override variable. If this environment variable is present its value will be used instead of the base port number:

```
!ports $BASE:9000 $WEB_SERVER $TILE_SERVER
```

In the above example, `$WEB_SERVER` and `$TILE_SERVER` will default to 9000 &amp; 9001, but this can be overridden by defining the environment variable `$BASE` to some other port number before invoking `spinup`.

Port numbers generated by the `!ports` directive are used in the same way as any other environment variable. Here's an example that spawns two mutually communicating processes:

```
!ports $BASE:8000 $P1 $P2

process1 --listen $P1 --connect $P2
process2 --listen $P2 --connect $P1
```

### `!prefix`

Sets the prefix to prepend to each line of output.

Supported substitutions:

  * `%t`: task number (i.e. the `t`th task listed in `spin.up`, starting from zero)
  * `%p`: process ID
  * '%Y': year (4 digits)
  * '%y': year (2 digits)
  * '%m': month
  * '%d': day
  * '%H': hour
  * '%M': minutes
  * '%S': seconds

The default prefix is `[%t:%p]`.

## Copyright &amp; License

&copy; 2014 Jason Frame [ [@jaz303](http://twitter.com/jaz303) / [jason@onehackoranother.com](mailto:jason@onehackoranother.com) ]

Released under the ISC license.