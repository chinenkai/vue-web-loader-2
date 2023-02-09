<template>
    <div class="test">
        <div v-on:click="onClick($event)">{{ text }}</div>
        <!-- 直接加载的按钮组件 -->
        <x-btn></x-btn>
        <!-- 动态加载组件 -->
        <component v-bind:is="indexView"></component>
    </div>
</template>
<script>
import test from './test.js'
import btn from './btn.vue'
var xt = 0;
export default {
    components: {
        'x-btn': btn,
    },
    computed: {},
    data: function() {
        return {
            times: 0,
            text: '这里是App页面',
            indexView: '',
        }
    },
    mounted: function() {
        var that = this;
        console.log('App mounted');
        // 动态加载其他组件
        VueWebLoader.import('view/index.vue', function(component) {
            that.indexView = component;
        })
    },
    methods: {
        onClick(event) {
            var that = this;
            console.log({ xt });
            console.log({ test });
            that.times = that.times + 1;
            that.text = 'APP内第' + that.times + '次点击';
        },
    }
}
</script>
<style>
.test {
    width: 100%;
    font-size: 1rem;
}
</style>