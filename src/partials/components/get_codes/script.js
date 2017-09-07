import VueTypeahead from 'vue-typeahead'
import func from '../../../../custom_libs/func'

export default {
    extends: VueTypeahead,

    created: function () {
        let self = this;
    },
    watch: {
        project: function (val) {
            this.src = "/api/get_codes?project="+val;
            this.$emit('name_change', {code: "", sub_name: ""});
            this.selected = "";
            this.reset_items();
        }
    },
    props: ['project'],
    data: function(){
        return {
            src: "/api/get_codes",
            queryParamName: 'input',
            selected: ""
        }
    },
    methods: {
        reset_items: function () {
            this.query = this.selected;
            this.items = [];
        },
        onHit (item) {
            if(item){
                this.$emit('name_change', item);
                this.selected = item.code;
                this.reset_items();
            }
        },
        prepareResponseData (data) {
            let grabData = [];
            if(data !== null){
                let hits = data.hits.hits;
                if(hits.length > 0){
                    let source = hits[0]._source;
                    let codes = Object.keys(source);
                    codes.forEach(function (code) {
                        let item = source[code];
                        item['code'] = code;
                        grabData.push(item);
                    });
                }
            }
            return grabData;
        },
        checkPro: function (e) {
            if(this.project === ""){
                e.preventDefault();
                alert("Please Select Project!");
            }
        }
    }
}