function VNC () {
    var vnc = this;

    this.init = function(options) {
        vnc.name   = options.name;
        vnc.width  = options.width;
        vnc.height = options.height;

        vnc.container = $('#container');

        vnc.container.html('');

        vnc.container.append('<div><span id="vnc-name">' + vnc.name + '</span>:<span id="vnc-width">' + vnc.width + '</span>x<span id="vnc-height">' + vnc.height + '</span></div>');
        vnc.container.append('<canvas width="' + vnc.width + '" height="' + vnc.height + '"></canvas>');
        vnc.container.canvas = $('canvas');
        vnc.context = vnc.container.canvas[0].getContext('2d');
        if (!vnc.context) {
            alert('Error: failed to getContext!');
            return;
        }
        vnc.context.fillRect(0, 0, vnc.width, vnc.height);

        vnc.send($.toJSON({"type":"fuq","x":0,"y":0,"width":vnc.width,"height":vnc.height}));

        vnc.bind_mouse_events();
        vnc.bind_keyboard_events();
    };

    this.cleanup = function() {
        vnc.unbind_mouse_events();
        vnc.unbind_keyboard_events();
    };

    this.requestUpdate = function() {
        vnc.send($.toJSON({"type":"fuq","x":0,"y":0,"width":vnc.width,"height":vnc.height, "incremental":1}));
    };

    this.startTimer = function() {
        console.log('Start timer');
        vnc.timer = setInterval(function () {
            vnc.requestUpdate();
        }, 300);
    };

    this.stopTimer = function() {
        console.log('Stop timer');
        if (vnc.timer) {
            clearInterval(vnc.timer);
        }
    };

    this.bind_keyboard_events = function() {
        $(document).bind('keyup', function(e) {
            var key = e.keyCode || e.which;
            vnc.send($.toJSON({"type":"ke","is_down":0,"key":key}));
        });
        $(document).bind('keypress', function(e) {
            var key = e.keyCode || e.which;
            vnc.send($.toJSON({"type":"ke","is_down":1,"key":key}));
            return false;
        });
        $(document).keydown(function (e) {
            var code = (e.keyCode ? e.keyCode : e.which);

            // Enter and tab
            if (code == 8 || code == 9) {
                vnc.send({"type":"ke","down":1,"key":code});

                return false;
            }
        });
    };

    this.unbind_keyboard_events = function() {
        $(document).unbind('keyup');
        $(document).unbind('keypress');
        $(document).unbind('keydown');
    };

    this.currentMouseCoords = function(e) {
        var pos = vnc.container.canvas.offset();

        var x = Math.floor(e.pageX - pos.left);
        var y = Math.floor(e.pageY - pos.top);

        return {"x":x,"y":y};
    };

    this.bind_mouse_events = function() {
        console.log('Binding mouse events');

        vnc.container.bind('mousedown', function(e) {
            var coords = vnc.currentMouseCoords(e);
            vnc.send($.toJSON({"type":"pe","x":coords.x,"y":coords.y,"event":"mousedown"}));
            vnc.requestUpdate();
            vnc.mousedown = true;
        });

        $(document).bind('mouseup', function(e) {
            vnc.mousedown = false;
        });

        vnc.container.bind('mouseup', function(e) {
            vnc.mousedown = false;
            var coords = vnc.currentMouseCoords(e);
            vnc.send($.toJSON({"type":"pe","x":coords.x,"y":coords.y,"event":"mouseup"}));
            vnc.requestUpdate();
        });

        vnc.container.bind('mousemove', function(e) {
            var coords = vnc.currentMouseCoords(e);
            var action = 'mousemove';
            if (vnc.mousedown) {
                action += '+mousedown';
            }
            vnc.send($.toJSON({"type":"pe","x":coords.x,"y":coords.y,"event":action}));
            vnc.requestUpdate();
        });
    };

    this.unbind_mouse_events = function() {
        console.log('UnBinding mouse events');

        vnc.container.unbind('mousedown');

        $(document).unbind('mouseup');

        vnc.container.unbind('mouseup');

        vnc.container.unbind('mousemove');
    };

    this.send = function(message) {
        vnc.onsend(message);
    };

    this.update = function(message) {
        vnc.unbind_mouse_events();

        vnc.stopTimer();

        var x         = message.rectangle.x;
        var y         = message.rectangle.y;
        var width     = message.rectangle.width;
        var height    = message.rectangle.height;
        var encoding  = message.rectangle.encoding;
        var data      = message.rectangle.data;

        console.log("x,y=" + x + ',' + y);

        if (encoding == 'Raw') {
            //var img = vnc.context.createImageData(width, height);
            var img = vnc.context.getImageData(0, 0, width, height);

            for (var j = 0; j < data.length; j++) {
                img.data[j] = data[j];
            }

            vnc.context.putImageData(img, x, y);
        }
        else if (encoding == 'CopyRect') {
            var img = vnc.context.getImageData(data[0], data[1], width, height);
            vnc.context.putImageData(img, x, y);
        }

        vnc.startTimer();

        vnc.bind_mouse_events();
    };
}
