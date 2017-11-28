<form id="camo">
    <div class="row">
        <div class="col-lg-9">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <div class="panel-title">
                        Camo Plugin Settings
                    </div>
                </div>
                <div class="panel-body">
                    <div class="alert alert-warning">
                        For assistance setting up this plugin, please view <a href="https://community.nodebb.org/topic/8297/nodebb-plugin-camo-make-embedded-images-look-secure">the guide here</a>.
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="key">
                            Camo Host
                        </label>
                        <input type="text" class="form-control" data-key="host" id="host" placeholder="https://camo.example.tld/"></input>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="key">
                            Camo Key
                        </label>
                        <input type="text" class="form-control" data-key="key" id="key" placeholder=""></input>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="type">
                            URL Type
                        </label>
                        <select class="form-control" data-key="type" id="type">
                            <option value="path" selected="selected">Encoded Path</option>
                            <option value="query">Query String</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <div class="checkbox">
                            <label for="https">
                                <input data-key="https" id="https" type="checkbox">
                                Proxy https images.
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <div class="panel-title">
                        Internal Camo Proxy
                    </div>
                </div>
                <div class="panel-body">
                    <div class="alert alert-warning">
                        This plugin has the Camo Proxy embedded into it. If enabled, it will use the settings above and below. Saving these settings will start the proxy, no restart is required. The proxy will run in a seperate process from NodeBB on the port below.
                    </div>
                    <div class="form-group">
                        <div class="checkbox">
                            <label for="useCamoProxy">
                                <input data-key="useCamoProxy" id="useCamoProxy" type="checkbox">
                                Use internal Camo proxy.
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="port">
                            Camo Port
                        </label>
                        <input type="number" class="form-control" data-key="port" id="port" placeholder="8082"></input>
                    </div>
                </div>
            </div>
            <div class="panel panel-primary">
                <div class="panel-heading">
                    NGINX Server Block Generation
                </div>
                <div class="panel-body">
                    <div class="alert alert-warning">
                        If you are using NGINX, this plugin can copy a correctly formatted server block to your clipboard for you to paste it into your config file.
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="sslCert">
                            SSL Certificate Location
                        </label>
                        <input type="text" class="form-control" data-key="sslCert" id="sslCert" placeholder="/etc/letsencrypt/live/example.com/fullchain.pem"></input>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="sslKey">
                            SSL Certificate Key Location
                        </label>
                        <input type="text" class="form-control" data-key="sslKey" id="sslKey" placeholder="/etc/letsencrypt/live/example.com/privkey.pem"></input>
                    </div>
                    <button type="button" class="btn btn-success nginx">Copy NGINX Server Block</button>
                </div>
            </div>
        </div>
        <div class="col-lg-3">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    Action Panel
                </div>
                <div class="panel-body">
                    <button type="button" class="btn btn-success form-control" accesskey="s" id="save">
                        <i class="fa fa-fw fa-save"></i> Save Settings
                    </button>
                </div>
            </div>
        </div>
    </div>
</form>

<script>
require(['settings', '/plugins/nodebb-plugin-camo/public/vendor/clipboard.min.js'], function(settings, Clipboard) {
  var $key = $('[data-key="key"]');
  var $host = $('[data-key="host"]');

  function validateInputs() {
    if (!$host.val().match(/https?:\/\/.*\//)) $host.val('https://' + $host.val() + '/');
  }

  settings.sync('camo', $('#camo'));

  $('#save').click( function (event) {
    validateInputs();

    settings.persist('camo', $('#camo'), function(){
      socket.emit('admin.settings.syncCamo', {}, function(err, data){
        // If the callback is called, we need to refresh the key.
        $key.val(data.key);
      });
    });
  });

var template = "server {\n\
    listen 443 ssl;\n\
    listen [::]:443 ssl;\n\
    server_name <domain>;\n\
    access_log off;\n\
    error_log /dev/null;\n\
\n\
    ssl_certificate           <path-to-your-certificate>;\n\
    ssl_certificate_key       <path-to-your-key>;\n\
\n\
    location / {\n\
        proxy_redirect                   off;\n\
        proxy_http_version               1.1;\n\
        proxy_pass                       http://localhost:<port>;\n\
    }\n\
}\n\
";

    var clipboard = new Clipboard('.nginx', {
        text: function(trigger) {
            validateInputs();
            var block = template
            .replace('<path-to-your-certificate>', $('[data-key="sslCert"]').val())
            .replace('<path-to-your-key>', $('[data-key="sslKey"]').val())
            .replace('<domain>', $('[data-key="host"]').val().replace(/(?:https?:)?\/\/|\//g, ''))
            .replace('<port>', $('[data-key="port"]').val());
            return block;
        }
    });

    $('.nginx').mouseout(function () {
        $(this).tooltip('destroy');
    });

    clipboard.on('success', function(e) {
        e.clearSelection();
        $(e.trigger).tooltip({title:'Copied!',placement:'bottom'});
        $(e.trigger).tooltip('show');
    });
});
</script>
