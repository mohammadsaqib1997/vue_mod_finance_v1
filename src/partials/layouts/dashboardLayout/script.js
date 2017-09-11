import header from '../../components/header/header.vue'
import footer from '../../components/footer/footer.vue'
import sidebar from '../../components/sidebar/sidebar.vue'

export default {
    created: function () {
        $.getScript('/assets/js/dashboard.js', function (data, textStatus, jqxhr) {
            Dashboard.init();
        });
    },
    data: function(){
        return {

        }
    },
    methods: {

    },
    components: {
        header_com: header,
        footer_com: footer,
        sidebar
    }
}