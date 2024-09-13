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

- import语句会先判断是否全局变量，如果是全局变量会直接使用，不会去加载后面对应文件
- import语句如果临时想要取消，必须用多行注释/**/进行注释，单行注释依然会被解析出来
-

5、代码解读：

```

这个代码文件的主要作用是实现一个动态加载和管理Vue组件的工具，名为`VueWebLoader`。它通过异步加载远程的JavaScript和Vue单文件组件（SFC），并将其注册到Vue应用中。以下是代码文件的主要功能和作用：

### 主要功能：

1. **Polyfill 支持**：
   - 为不支持`replaceAll`和`endsWith`方法的旧浏览器提供Polyfill支持。

2. **Vue版本检测**：
   - 检测当前使用的Vue版本（2.x或3.x），并根据版本创建相应的Vue应用实例。

3. **全局变量管理**：
   - 管理全局变量，如请求版本号、基础URL、组件关系表、组件回调表、加载中的组件表等。

4. **动态加载远程文件**：
   - 通过`requestGet`函数异步加载远程文件（如JavaScript和Vue组件），并处理请求版本号和错误处理。

5. **删除注释**：
   - 在加载的JavaScript文件中删除多行和单行注释，以确保代码的干净和可执行性。

6. **解析绝对URL**：
   - 解析相对URL为绝对URL，确保在不同环境下正确加载资源。

7. **解析Import语句**：
   - 解析JavaScript文件中的`import`语句，提取依赖的文件，并将其转换为可执行的代码。

8. **检查父组件的加载进度**：
   - 检查父组件的所有子组件是否已加载完成，并在所有子组件加载完成后执行回调函数。

9. **解析Vue SFC内容**：
   - 解析Vue单文件组件（SFC）的内容，提取`<script>`、`<style>`和`<template>`部分。

10. **注册Vue SFC**：
    - 将解析后的Vue单文件组件注册到Vue应用中，并处理组件的样式和模板。

11. **动态加载Vue组件和JavaScript文件**：
    - 通过`requestVue`和`requestJs`函数动态加载Vue组件和JavaScript文件，并处理依赖关系。

12. **导入组件**：
    - 通过`importComponents`函数导入组件，并管理组件的加载状态和依赖关系。

13. **VueWebLoader构造函数**：
    - 提供一个构造函数`VueWebLoader`，用于初始化加载Vue项目入口文件，并管理整个加载过程。

14. **暴露API**：
    - 将`VueWebLoader`暴露给全局对象`window`，并提供`import`方法用于动态加载组件。

### 代码文件的作用总结：

这个代码文件的主要作用是实现一个动态加载和管理Vue组件的工具，使得开发者可以在运行时动态加载远程的Vue组件和JavaScript文件，并将其注册到Vue应用中。它解决了在大型应用中动态加载和管理组件的需求，同时确保了代码的兼容性和可维护性。

通过这个工具，开发者可以更灵活地组织和管理Vue项目，减少初始加载时间，提高应用的性能和用户体验。

```