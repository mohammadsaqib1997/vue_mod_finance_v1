export default {
    beforeMount: function () {
        if(this.$route.path === "/sheet" || this.$route.path === "/sheet/"){
            this.$router.push('/');
        }
    },
}