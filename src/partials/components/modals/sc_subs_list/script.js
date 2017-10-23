import firebase from 'firebase'
import func from '../../../../../custom_libs/func'

export default {
    props: ['pro_key'],
    created: function () {
        let self = this;

        const db = firebase.database();
        self.regSubsidiaryRef = db.ref('/reg_subsidiary');
        self.subsidiaryRef = db.ref('/subsidiary');

    },
    watch: {
        search_txt: function (val) {
            this.search_values(this, val);
        },
        pro_key: function (val) {
            this.loadList(val);
        }
    },
    data: function(){
        return {
            load1: true,
            search_txt: '',

            regSubsidiaryRef: null,
            subsidiaryRef: null,

            loadData: {},
            orgData: {}
        }
    },
    methods: {
        loadList: function (val) {
            let self = this;
            if(val !== ""){
                self.load1 = true;
                self.regSubsidiaryRef.child(val).once('value', function(snap){
                    let data = snap.val();
                    if(data !== null){
                        let process_item = 0;
                        self.loadData = {};
                        snap.forEach(function (regSubSnap) {
                            let row = regSubSnap.val();
                            self.subsidiaryRef.child(row.key).once('value', function (subsSnap) {
                                row['name'] = subsSnap.val().name;
                                row['key'] = regSubSnap.key;
                                self.loadData[regSubSnap.key] = row;

                                process_item++;
                                if(snap.numChildren() === process_item){
                                    self.orgData = self.loadData;
                                    self.load1 = false;
                                }
                            });
                        });
                    }else{
                        self.loadData = {};
                        self.load1 = false;
                    }
                });
            }else{
                self.loadData = {};
                self.load1 = false;
            }
        },
        selSub: function (key) {
            let self = this;
            $("#proSubsList").modal("hide");
            self.$emit("get_subs_item", {code: key, sub_name: self.loadData[key].name});
        },
        search_values: function (self, val) {
            if(val !== ""){
                let saveData = self.orgData;
                let gen_search_data = {};
                let searchKeys = Object.keys(saveData);
                for(let i=0; i < searchKeys.length; i++){
                    let sKey = searchKeys[i];
                    let sItem = saveData[sKey];

                    val = val.toLowerCase();

                    if(sItem.key.toLowerCase().indexOf(val) > -1){
                        gen_search_data[sKey] = sItem;
                        continue;
                    }
                    if(sItem.name.toLowerCase().indexOf(val) > -1){
                        gen_search_data[sKey] = sItem;
                    }
                }
                self.loadData = gen_search_data;
            }else{
                self.loadData = func.sortObj(self.orgData);
            }
        },
    }
}
