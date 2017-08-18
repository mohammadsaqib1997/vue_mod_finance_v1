export default {
    created: function(){
        jQuery(function(){
            setTimeout(function () {
                jQuery.getScript( "/assets/js/main.js", function( data, textStatus, jqxhr ) {});
            }, 100);
        });
    },
    data: function(){
        return {

        }
    },
    methods: {

    }
}