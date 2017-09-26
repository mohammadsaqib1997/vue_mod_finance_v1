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
            items: [],
            current: -1,

            // reference
            partyInformationRef: null,
        }
    },
    watch: {
        query: function (val) {
            if(val !== ""){
                this.loadData(val);
            }else{
                this.searchLoad([]);
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
        reset: function reset() {
            this.current = -1;
            this.items = [];
            this.query = '';
        },
        onHit (item) {
            alert(item.text);
        },
        loadData: function (val) {
            let self = this;
            let grabData = [];
            self.$http.get('/api/search_dash?index=party_info&type=id&field=agent_name,id,agent_code&search='+val).then(function (res) {
                let data = res.data;
                if(data.length > 0){
                    data.forEach(function (obj) {
                        let sel_source = obj._source;
                        grabData.push({
                            text: sel_source.id+" | "+sel_source.agent_code+" | "+sel_source.agent_name
                        });
                    });
                }
                self.searchLoad(grabData);
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
            this.items = data;
            // console.log(this.searchData);
        },
        up: function up() {
            if (this.current > 0) {
                this.current--;
            } else if (this.current === -1) {
                this.current = this.items.length - 1;
            } else {
                this.current = -1;
            }
        },
        down: function down() {
            if (this.current < this.items.length - 1) {
                this.current++;
            } else {
                this.current = -1;
            }
        },
        hit: function hit() {
            if (this.current !== -1) {
                this.onHit(this.items[this.current]);
            }
        },
        activeClass: function activeClass(index) {
            return {
                active: this.current === index
            };
        },
        setActive: function setActive(index) {
            this.current = index;
        },
    }
}