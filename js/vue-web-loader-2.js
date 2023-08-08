(function(window, document, Vue) {

    // 部分浏览器不支持replaceAll函数
    if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function(str, newStr) {

            // 如果是正则表达式
            if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
                return this.replace(str, newStr);
            }

            // 如果是字符串
            return this.replace(new RegExp(str, 'g'), newStr);
        };
    }

    // vue大版本号
    var vue_version = parseInt(Vue.version.split('.')[0]);
    var vue_app = vue_version == 3 ? Vue.createApp() : null;
    // 应用版本号
    var request_version = '';
    // 所有请求的base地址
    var base_url = '';
    // 全局组件关系表
    var components_relation = {};
    // 全局组件回调表
    var components_callback = {};
    // 全局加载中组件表
    var requesting_component = {};

    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(search, this_len) {
            if (this_len === undefined || this_len > this.length) {
                this_len = this.length;
            }
            return this.substring(this_len - search.length, this_len) === search;
        };
    }

    function evalJs(url, script) {

        // 'console.log("this is ' + url + '");\n\n' + 

        script = script + '\n\n' + '//# sourceURL=' + url;

        return eval(script);
    }

    // 加载远程文件
    function requestGet(url, callback) {

        // 判断是否要加版本号
        if (request_version != '') {

            // 判断地址中是否已经有其他参数
            str = url.indexOf('?') > 0 ? '&v=' : '?v=';

            url = url + str + request_version;
        }

        // 请求文件
        var full_url = '';

        return fetch(url).then(function(response) {
            var url_obj = new URL(response.url);
            full_url = url_obj.href.replace(url_obj.search, '');
            return response.text();
        }).then(function(text) {
            // 处理请求数据
            callback(full_url, text);
        }).catch(function(value) {
            // 加载文件失败
            throw value;
        });
    }

    function removeComments(script) {
        // 匹配所有多行注释
        var regexp = new RegExp(/\/\*[\s\S]*?\*\//);
        // 将多行注释删除
        while ((match = regexp.exec(script)) != null) {
            script = script.replace(match[0], '');
        }

        // // 匹配单行注释，仅匹配以//开头的行
        // var regexp = new RegExp(/[^\\]\/\/.*/);
        // // 将单行注释删除
        // while ((match = regexp.exec(script)) != null) {
        //     script = script.replace(match[0], '');
        // }

        return script;
    }

    function parseAbsoluteUrl(url, parent_url) {
        var url_obj = new URL(url, parent_url)
        return url_obj.href;
    }

    function parseImport(parent_url, script) {

        var list = [];

        script = removeComments(script);

        if (!script) {
            return { script: script, list: list };
        }

        // 深度复制字符串
        var script_copy = (' ' + script).slice(1);

        var regexp = RegExp(/import([\s\S].+)from([\s\S].+["'])/, 'g');

        while ((match = regexp.exec(script)) !== null) {

            // 匹配到的import代码
            var m_content = match[0];
            // 取变量名称
            var v_name = match[1].trim();
            // 取文件名称
            var f_name = match[2].replaceAll(/["'\s]/ig, '');
            // 前置代码
            var prev_code = '\n/*\n' + m_content + '\n*/\nvar ' + v_name + ' = window.';

            // 判断是否以.js或.vue结尾
            if (f_name.endsWith('.js') || f_name.endsWith('.vue')) {
                // 获取引用文件的绝对地址
                var absolute_url = parseAbsoluteUrl(f_name, parent_url);
                // 替换代码
                script_copy = script_copy.replace(m_content, prev_code + 'VueWebLoader.registered_component["' + absolute_url + '"];\n');
                // 将地址添加到请求列表里
                list.push(absolute_url);
                continue;
            }

            // 不是以.js或.vue结尾时，直接替换成windows对象的引用
            script_copy = script_copy.replace(m_content, prev_code + v_name + ';\n');
        }

        return { script: script_copy, list: list };
    }

    function checkParentImportProgress(url) {

        for (var parent in components_relation) {
            // 用以标记当前父组件是否需要再遍历检查一次
            var parent_list = components_relation[parent];

            var reloop = false;

            for (var child in parent_list) {

                if (child == url) {
                    reloop = true;
                    parent_list[url] = true;
                    components_relation[parent][url] = true;
                }
            }

            if (reloop == true) {
                var is_finish = true;
                for (var child in parent_list) {
                    if (parent_list[child] == false) {
                        is_finish = false;
                    }
                }

                if (is_finish == true) {
                    // 该组件的所有子组件已加载完成
                    var finish_callback = components_callback[parent];

                    if (finish_callback) {
                        finish_callback();
                    }

                    // 从关系表和回调表中，删除该组件
                    delete components_relation[parent];
                    delete components_callback[parent];
                }
            }
        }
    }

    function parseVueSFC(content) {

        var regexp = new RegExp(/<script[\s\S]*?>([\s\S]*)<\/script>/, 'g');

        var match = regexp.exec(content);

        var script = match ? match[1] : '';

        var style = '';

        var template = '';

        // 创建一个div节点
        var element = document.createElement('div');

        // 将vue组件的内容添加到节点上
        element.innerHTML = content;

        for (var i = 0; i < element.children.length; i++) {

            var child = element.children[i];

            if (child.tagName == 'TEMPLATE') {
                template = child.innerHTML;
                template = template.replace('inside-script', 'script');
            } else if (child.tagName == 'STYLE') {
                style = child.innerHTML.trim();
            }
            // else if (child.tagName == 'SCRIPT') {
            //     script = child.innerHTML;
            // }
        }

        return {
            style: style,
            script: script,
            template: template,
        }
    }

    function parseUrlToName(url) {
        // 去掉最后的文件名，再去掉base_url，再替换/为_，最后加上name
        return url.substring(0, url.lastIndexOf('.')).replace(base_url, '').replace(/\//g, '_');
    }

    function appendStyle(name, style) {

        var el = document.createElement('style');

        el.id = name;
        el.type = 'text/css';
        el.innerHTML = style;

        var head = document.querySelector('head');
        head.appendChild(el);
    }

    function registerVueSFC(url, template, script, style) {

        var name = parseUrlToName(url);

        // 添加css到页面中
        if (style) {
            appendStyle(name, style);
        }

        // 将模版保存到全局变量中
        VueWebLoader.component_template[name] = template;

        // 分析script
        var regexp = new RegExp(/([\S\s]*)export\s+default\s+{([\S\s]*})/, 'g');

        var match = regexp.exec(script);

        var js = (match[1] ? match[1] : '') + '\n (function(){ return {\n    template: VueWebLoader.component_template["' + name + '"],' + match[2] + '})();';

        // 执行script
        var setting = evalJs(url, js);

        var component = null;

        if (vue_version == '3') {
            vue_app.component(name, setting);
            component = vue_app.component(name);
        } else {
            component = Vue.component(name, setting);
        }

        delete VueWebLoader.component_template[name];

        return component;
    }

    function requestVue(vue_url, callback) {

        // 检查加载状态
        if (requesting_component[vue_url] == true) {
            return true;
        }

        // 设置加载状态
        requesting_component[vue_url] = true;

        // 通过异步请求该文件
        requestGet(vue_url, function(url, content) {

            // 分析vue模版内容
            var result = parseVueSFC(content);

            var style = result.style;
            var script = result.script;
            var template = result.template;

            var result2 = parseImport(url, script);
            var script = result2.script;
            var list = result2.list;

            importComponents(url, list, function() {

                // 注册vue组件
                VueWebLoader.registered_component[url] = registerVueSFC(url, template, script, style);

                // 检查所属父组件的全部子组件是否已加载完成
                checkParentImportProgress(url);

                // 如果提提供了回调函数
                if (callback) {
                    // 则将执行js代码后的结果返回给回调函数
                    callback(VueWebLoader.registered_component[url]);
                }

            });

        });
    }

    function requestJs(js_url, callback) {

        // 检查加载状态
        if (requesting_component[js_url] == true) {
            return true;
        }

        // 设置加载状态
        requesting_component[js_url] = true;

        // 通过异步请求该文件
        requestGet(js_url, function(url, content) {

            // 分析脚本中是否包含import语句
            var result = parseImport(url, content);
            var script = result.script;
            var list = result.list;

            importComponents(url, list, function() {

                script = '\n window.VueWebLoader.registered_component["' + url + '"] = (function(){\n' +
                    script.replace('export default ', 'return ') + '\n})();';

                // 执行JS文件
                evalJs(url, script);

                // 检查所属父组件的全部子组件是否已加载完成
                checkParentImportProgress(url);

                // 如果提提供了回调函数
                if (callback) {
                    // 则将执行js代码后的结果返回给回调函数
                    callback(VueWebLoader.registered_component[url]);
                }

            });
        });
    }


    function importComponents(parent_url, list, callback) {
        if (!components_relation[parent_url]) {
            components_relation[parent_url] = {};
            components_callback[parent_url] = callback;
        }

        // 判断是否存在下级组件
        if (list.length <= 0) {
            // 当不存在下级组件时，直接执行回调函数
            return callback();
        }

        var is_finish = true;
        var child_url = '';

        var len = list.length;

        for (var i = 0; i < len; i++) {
            var url = list[i];

            // 判断该组件是否已加载
            if (VueWebLoader.registered_component[url]) {

                // 修改组件状态
                components_relation[parent_url][url] = true;

                // 记录组件地址，方便下面使用
                child_url = url;
            } else {

                is_finish = false;
                // 修改组件状态
                components_relation[parent_url][url] = false;

                // 判断该组件是否正在加载
                if (requesting_component[url]) {
                    // 正在加载的话，直接跳过
                    continue;
                }

                // 如果是vue组件
                if (url.endsWith('.vue')) {
                    requestVue(url);
                    continue;
                }

                // 如果是js文件
                if (url.endsWith('.js')) {
                    requestJs(url);
                    continue;
                }
            }
        }

        if (is_finish == true) {
            checkParentImportProgress(child_url)
        }
    }

    var VueWebLoader = function(setting) {

        if (setting.version) {
            request_version = setting.version;
        }

        var start_time = Date.now();

        var entry = setting.entry;

        console.log('开始加载Vue项目入口JS文件：' + entry);

        requestGet(entry, function(url, content) {

            // 计算base_url
            base_url = url.substr(0, url.indexOf(entry));

            var result = parseImport(url, content);

            var script = result.script;
            var list = result.list;

            // 分析加载组件
            importComponents(url, list, function() {

                // 执行入口文件
                evalJs(url, script);
                // 输出执行耗时信息
                console.log('加载Vue项目入口JS文件完成，耗时:' + (Date.now() - start_time) / 1000 + ' 秒');

            });
        });
    }

    // 填充对象
    window.VueWebLoader = Object.assign(VueWebLoader, {
        component_template: {},
        registered_component: {},
        import: function(url, callback) {
            url = parseAbsoluteUrl(url, base_url);
            // 如果是vue组件
            if (url.endsWith('.vue')) {
                requestVue(url, callback);
            }

            // 如果是js文件
            if (url.endsWith('.js')) {
                requestJs(url, callback);
            }
        }
    });

})(window, document, Vue);