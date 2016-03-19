<form id="camo">
    <div class="row">
        <div class="col-lg-9">
            <div class="panel acp-panel-primary">
                <div class="panel-heading">
                    <div class="panel-title">
                        Camo Plugin Settings
                    </div>
                </div>
                <div class="panel-body">
                    <div class="form-group">
                        <label class="control-label" for="key">
                            Camo Host
                        </label>
                        <input type="text" class="form-control" data-key="host" id="host" placeholder="camo.example.tld"></input>
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
            <div class="panel acp-panel-primary">
                <div class="panel-heading">
                    <div class="panel-title">
                        Internal Camo Proxy
                    </div>
                </div>
                <div class="panel-body">
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
                    <br><br>
                    <h5>NGINX Server Block Generation</h5>
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
            <div class="panel acp-panel-primary">
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
require(['settings', 'https://cdn.jsdelivr.net/clipboard.js/1.5.9/clipboard.min.js'], function(settings, Clipboard) {
    settings.sync('camo', $('#camo'), function () {
        if ($('[data-key="useCamoProxy"]').is(':checked')) {
            $('[data-key="key"]').attr('disabled', '');
            $('[data-key="key"]').data('val', $('[data-key="key"]').val());
            $('[data-key="key"]').val('internal');
        }
    });

    $('#save').click( function (event) {
        if ($('[data-key="key"]').val() === 'internal') $('[data-key="key"]').val($('[data-key="key"]').data('val'));
        settings.persist('camo', $('#camo'), function(){
            socket.emit('admin.settings.syncCamo');
        });
    });

    $('[data-key="useCamoProxy"]').change(function() {
        if($(this).is(":checked")) {
            $('[data-key="key"]').attr('disabled', '');
            $('[data-key="key"]').data('val', $('[data-key="key"]').val());
            $('[data-key="key"]').val('internal');
        }else{
            $('[data-key="key"]').removeAttr('disabled');
            $('[data-key="key"]').val($('[data-key="key"]').data('val'));
        }
    });

var template = "server {\n\
    listen 443 ssl;\n\
    listen [::]:443 ssl;\n\
    server_name <domain>;\n\
    access_log off;\n\
    error_log /dev/null;\n\
\n\
    ssl_session_cache         shared:SSL:10m;\n\
    ssl_session_timeout       10m;\n\
    ssl_session_tickets       off;\n\
    ssl_prefer_server_ciphers on;\n\
    ssl_ciphers               'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';\n\
    ssl_ecdh_curve            secp384r1;\n\
    ssl_buffer_size           1400;\n\
    ssl_protocols             TLSv1 TLSv1.1 TLSv1.2;\n\
\n\
    ssl_certificate           <path-to-your-certificate>;\n\
    ssl_certificate_key       <path-to-your-key>;\n\
\n\
    charset utf-8;\n\
\n\
    location / {\n\
        proxy_set_header X-Real-IP       $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header Host            $http_host;\n\
        proxy_set_header X-NginX-Proxy   true;\n\
        proxy_redirect                   off;\n\
        proxy_http_version               1.1;\n\
        proxy_pass                       http://localhost:<port>;\n\
    }\n\
}\n\
";

    var clipboard = new Clipboard('.nginx', {
        text: function(trigger) {
            var block = template
            .replace('<path-to-your-certificate>', $('[data-key="sslCert"]').val())
            .replace('<path-to-your-key>', $('[data-key="sslKey"]').val())
            .replace('<domain>', $('[data-key="host"]').val().replace(/(?:https?:)?\/\/|\//, ''))
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
