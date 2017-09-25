import func from '../../../../custom_libs/func'

export default {
    created: function () {
        let self = this;
    },
    data: function(){
        return {
            query: "",
            src: "/gapi",
            queryParamName: 'input',
            searchData: [],

            // reference
            partyInformationRef: null,
        }
    },
    watch: {
        query: function (val) {
            if(val !== ""){
                this.loadData(val);
            }
        }
    },
    methods: {
        validate: function(callback) {
            return this.$validate()
                .then(function(success) {
                    callback(success);
                });
        },
        reset_items: function () {
            this.items = [];
        },
        onHit (item) {
            if(item){
                this.query = item.terms[0].value;
                this.items = [];
            }
        },
        prepareResponseData (data) {
            let search_val = this.query;
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
            });
            return grabData;
        },
        loadData: function (val) {
            let self = this;
            let grabData = [];
            self.$http.get('/api/search_dash?index=party_info&type=id&field=agent_name&search='+val).then(function (res) {
                let data = res.data;
                if(data.length > 0){
                    data.forEach(function (obj) {
                        let sel_source = obj._source;
                        grabData.push({
                            text: sel_source.id+" | "+sel_source.agent_code+" | "+sel_source.agent_name
                        });
                    });
                }
                self.searchLoad();
            });
            self.$http.get('/api/search_dash?index=master_detail&type=id&field=allotee_name&search='+val).then(function (res) {
                let data = res.data;
                if(data.length > 0){
                    data.forEach(function (obj) {
                        let sel_source = obj._source;
                        grabData.push({
                            text: sel_source.id+" | "+sel_source.allotee_code+" | "+sel_source.allotee_name
                        });
                    });
                }
                self.searchLoad(grabData);
            });
        },
        searchLoad: function (data) {
            this.searchData = data;
            // console.log(this.searchData);
        }
    }
}