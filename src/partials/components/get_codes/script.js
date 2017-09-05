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
            console.log(item);
            if(item){
                this.selected = item;
                this.reset_items();
            }
        },
        prepareResponseData (data) {
            console.log(data);
            /*let search_val = this.query;
            let pred_data = data.predictions;
            let keys = Object.keys(pred_data);
            let match = ["locality", "political", "geocode"];
            let grabData = [];
            keys.forEach(function (key) {
                let item = pred_data[key];
                let val = item.terms[0].value;
                if(func.compareArr(match, item.types) && val.toLowerCase().indexOf(search_val.toLowerCase()) > -1){
                    grabData.push(item);
                }
            });*/
            return ['1','2','3'];
        },
        checkPro: function (e) {
            if(this.project === ""){
                e.preventDefault();
                alert("Please Select Project!");
            }
        }
    }
}