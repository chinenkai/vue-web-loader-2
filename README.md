# Vue Web Loader 2

## 项目说明

Vue Web Loader 2 可以在不使用前端工具(如npm,webpack等)的情况下，快速构建基于 Vue 的单页面应用，具有以下优点：依赖小、支持vue单页面组件、支持动态加载组件。

## 使用方式

1、在html页面上引入Vue和vue-web-loader-2.js，并加上Vue程序的挂载点
```
<script src="js/vue@2.7.14.min.js"></script>
<script src="js/vue-web-loader-2.js"></script>

<!-- 挂载点 -->
<div id="app"></div>
```

2、使用下面代码加载入口文件
```
<script type="text/javascript">
    VueWebLoader({
        version: Date.now(), // 加载文件时指定的版本号，通过Date.now()来避免浏览器缓存问题
        entry: 'view/vue2.js', // 入口文件
    });
</script>
```

3、入口文件要按Vue的要求去启动
```
// vue2.js
import Vue from 'vue'
import app from './app.vue'

window.vueapp = new Vue({
    el: '#app',
    data: {},
    render: function(h) {
        return h(app);
    }
});
```


```
// vue3.js
import Vue from 'vue'
import app from './app.vue'

window.vueapp = Vue.createApp(app);
window.vueapp.mount('#app');
```

4、特别注意：

- import语句会先判断是否全局变量，如果是全局变量会直接使用，不会去加载后面对应文件；
- import语句如果临时想要取消，必须用多行注释/**/进行注释，单行注释依然会被解析出来；