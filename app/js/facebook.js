// based on github.com/MrPing/Botinder (MIT)

jQuery(function () {


    var prm = jQuery.ajax({
        url: 'https://www.facebook.com/v2.0/dialog/oauth/confirm',
        type: 'POST',
        data: {
            fb_dtsg:       $('input[name="fb_dtsg"]').val(),
            from_post:     1,
            app_id:        '464891386855067',
            redirect_uri:  'fbconnect://success',
            display:       'popup',
            sheet_name:    'initial',
            gdp_version:   4,
            return_format: 'access_token',
            ref:           'Default',
            __CONFIRM__:   'OK'
        }
    });
    prm.done(function (html) {
        var found = html.match(/access_token=([\w_]+)&/i);
        chrome.runtime.sendMessage({type: 'facebookAuth', token: found ? found[1] : null});
    });
});

