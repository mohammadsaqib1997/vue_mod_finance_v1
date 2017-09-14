import header from '../../components/header/header.vue'
import footer from '../../components/footer/footer.vue'
import sidebar from '../../components/sidebar/sidebar.vue'

export default {
    created: function () {
        $.getScript('/assets/js/dashboard.js', function (data, textStatus, jqxhr) {
            Dashboard.init();
        });
        console.log(this.$root.loginUData);
        let self = this;
        self.$watch(function () {
            return self.$root.loginUData;
        }, function (val, oldVal) {
            if(val !== null){
                self.username = val.first_name +" "+ val.last_name;
                if(val.type === "admin"){
                    self.type = "Administrator";
                }else if(val.type === "accountant"){
                    self.type = "Accountant";
                }
            }
        });
    },
    data: function(){
        return {
            username: "",
            type: ""
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