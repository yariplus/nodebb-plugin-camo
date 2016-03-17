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
require(['settings'], function(settings) {
    settings.sync('camo', $('#camo'));

    $('#save').click( function (event) {
        settings.persist('camo', $('#camo'), function(){
            socket.emit('admin.settings.syncCamo');
        });
    });
});
</script>
