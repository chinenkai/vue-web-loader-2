<template>
    <div class="">
        <h1> layout</h1>
        <div>
            <router-link to="/">layout</router-link>
            <router-link to="/table">table</router-link>
            <router-link to="/xxx">xxx -> 404</router-link>
        </div>
        <router-view :key="routerViewKey"></router-view>
    </div>
</template>
<script>
export default {
    components: {},
    computed: {
        routerViewKey: function() {
            // 解决不同路由使用相同组件钩子函数不执行问题
            // https://www.cnblogs.com/XF-eng/p/14722578.html
            if (this.$route.name !== undefined) {
                return this.$route.name + +new Date();
            } else {
                return this.$route + +new Date();
            }
        },
    },
    watch: {},
    data: function() {
        return {}
    },
    mounted: function() {},
    methods: {}
}
</script>
<style>
</style>