import Vue from 'vue'

import layout from './layout.vue'
import p404 from './p404.vue'
import table from './table.vue'

/* 简单state */
var state = {
    testData: null,
}

/* 简单funs */
var funs = {
    setTestData: function(data){
        state.testData = data;
    }
}

var router = new VueRouter({
    // mode: 'history',
    routes: [{
            path: '/',
            name: 'layout',
            component: layout,
            children: [
                // 在下面加子菜单
                { path: '/table', component: table, meta: {}, }
            ],
        },
        {
            path: '/404',
            component: p404,
            hidden: true
        },
        { path: '*', redirect: '/404', hidden: true },

    ]
});

// 创建vue实例
window.VueApp = new Vue({
    el: '#app',
    data: {
        state: state,
    },
    router: router,
});

// 将配置和常用函数挂载到Vue上
Vue.prototype.$funs = funs;

// 全局拦截Vue错误
Vue.config.errorHandler = function(err, vm, info) {
    // 计算是哪个vue文件出错
    console.error('Vue file >>>', vm.$vnode.tag.substr(vm.$vnode.tag.lastIndexOf('-') + 1).replace('_', '/') + '.vue');
    console.error('Vue info >>>', info);
    console.error('Vue err >>>', err);
    console.error('Vue vm >>>', vm);
}