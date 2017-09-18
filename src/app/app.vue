<template lang="pug">
    router-view(v-if="!process")
    .page-loader.text-center.fade.in(v-else style="display:none;")
        img(src='/assets/images/loader.gif' style="margin-top: 30vh;")
</template>
<style>

</style>
<script>
    export default{
        computed: {
            process: function () {
                return this.$root.compileProc;
            }
        }
    }
</script>