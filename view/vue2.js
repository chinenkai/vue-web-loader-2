import Vue from 'vue'
import test from './test.js'
import app from './app.vue'

window.vueapp = new Vue({
    el: '#app',
    data: {},
    render: function(h) {
        return h(app);
    }
});

// 全局拦截Vue错误
Vue.config.errorHandler = function(err, vm, info) {
    // 计算是哪个vue文件出错
    console.error('Vue file >>>', vm.$vnode.tag.substr(vm.$vnode.tag.lastIndexOf('-')+1).replace('_','/')+'.vue');
    console.error('Vue info >>>', info);
    console.error('Vue err >>>', err);
    console.error('Vue vm >>>', vm);
}
