import firebase from 'firebase'

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
        logout: function () {
            firebase.auth().signOut().then(function () {
                $("#app").removeAttr("class");
            },function (err) {
                if(err){
                    console.log(err);
                }
            });
        }
    }
}