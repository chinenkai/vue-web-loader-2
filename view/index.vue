<template>
    <div class="index">
        <div v-on:click="onClick($event)">{{ text }}</div>
    </div>
</template>
<script>
export default {
    computed: {},
    data: function() {
        return {
            times: 0,
            text: '这里是index组件，通过动态加载引入',
        }
    },
    mounted: function() {
        var that = this;
        console.log('index mounted');
    },
    methods: {
        onClick(event) {
            var that = this;
            that.times = that.times + 1;
            that.text = 'index内第' + that.times + '次点击';
        },
    }
}
</script>
<style>
.index {
    width: 100%;
    font-size: 2rem;
    margin-top: 30px;
    margin-bottom: 30px;
}
</style>