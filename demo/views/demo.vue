<template>
    <div class="">
    </div>
</template>
<script>
export default {
    components: {},
    computed: {
        testData: function() {
            return this.$root.$data.state.testData;
        },
    },
    watch: {
        'testData': function(data) {
            if (data) {
                this.onXXX();
            } else {
                this.onYYY();
            }
        }
    },
    data: function() {
        return {}
    },
    mounted: function() {
        this.$funs.setTestData('xxx');
    },
    methods: {
        onXXX: function() {

        },
        onYYY: function() {

        },
    }
}
</script>
<style>
</style>