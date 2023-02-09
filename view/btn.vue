<template>
    <button class="btn" v-on:click="onClick($event)">
        {{ text }}
    </button>
</template>
<script>
export default {
    computed: {},
    data: function() {
        return {
            times: 0,
            text: '这里是btn组件，通过直接加载引入',
        }
    },
    mounted: function() {
        var that = this;
        console.log('btn mounted');
    },
    methods: {
        onClick(event) {
            var that = this;
            that.times = that.times + 1;
            that.text = 'btn内第' + that.times + '次点击';
        },
    }
}
</script>
<style>
.btn {
    width: 100%;
    font-size: 1.5rem;
    margin-top: 30px;
    margin-bottom: 30px;
}
</style>